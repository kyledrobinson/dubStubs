<?php
// ============================================================
// DubStubs — AI Background generator (Replicate proxy)
// Robust error handling: ALWAYS returns JSON, even on PHP fatals.
// ============================================================

// Don't print HTML errors into our JSON response — capture them instead.
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Cache-Control: no-store');

// Convert warnings/notices to exceptions so they don't sneak past us
set_error_handler(function($severity, $message, $file, $line) {
  if (!(error_reporting() & $severity)) return false;
  throw new ErrorException($message, 0, $severity, $file, $line);
});

set_exception_handler(function($e) {
  if (!headers_sent()) {
    http_response_code(500);
    header('Content-Type: application/json');
  }
  echo json_encode([
    'error' => $e->getMessage(),
    'where' => basename($e->getFile()) . ':' . $e->getLine()
  ]);
  exit;
});

// Catch fatal errors (parse, memory, etc.) that bypass set_error_handler
register_shutdown_function(function() {
  $err = error_get_last();
  if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR])) {
    if (!headers_sent()) {
      http_response_code(500);
      header('Content-Type: application/json');
    }
    echo json_encode([
      'error' => 'PHP fatal: ' . $err['message'],
      'where' => basename($err['file']) . ':' . $err['line']
    ]);
  }
});

// ── Method check ──────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'POST only']);
  exit;
}

// ── Extension checks ──────────────────────────────────────
if (!extension_loaded('curl')) {
  http_response_code(500);
  echo json_encode(['error' => 'PHP cURL extension is not enabled. cPanel → Select PHP Version → Extensions → check "curl".']);
  exit;
}

// ── Find the API token ────────────────────────────────────
// Try a few likely locations for Namecheap's cPanel layout.
$candidates = array_filter([
  dirname(__DIR__, 2) . '/private/replicate.env',         // /home/USER/private/replicate.env (recommended)
  getenv('HOME') ? getenv('HOME') . '/private/replicate.env' : null,
  dirname(__DIR__) . '/private/replicate.env',            // /home/USER/public_html/private/replicate.env (works but less safe)
  __DIR__ . '/replicate.env',                             // /home/USER/public_html/api/replicate.env (LAST RESORT — public!)
]);

$token = '';
$tokenSource = null;
foreach ($candidates as $p) {
  if (file_exists($p) && is_readable($p)) {
    $tokenSource = $p;
    foreach (file($p, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
      $line = trim($line);
      if ($line === '' || $line[0] === '#') continue;
      if (stripos($line, 'REPLICATE_API_TOKEN=') === 0) {
        $token = trim(substr($line, strlen('REPLICATE_API_TOKEN=')));
        $token = trim($token, "\"' \t\r\n");
        break 2;
      }
    }
  }
}

// Also accept an Apache/cPanel environment variable
if (!$token && getenv('REPLICATE_API_TOKEN')) {
  $token = trim(getenv('REPLICATE_API_TOKEN'));
  $tokenSource = 'env var';
}

if (!$token) {
  http_response_code(500);
  echo json_encode([
    'error' => 'Replicate API token not found.',
    'hint' => 'Create /home/YOUR_CPANEL_USER/private/replicate.env containing one line: REPLICATE_API_TOKEN=r8_xxxxxxxxxxxx',
    'tried_paths' => array_values($candidates),
    'home' => getenv('HOME')
  ]);
  exit;
}

if (!preg_match('/^r8_[A-Za-z0-9]{20,}$/', $token)) {
  http_response_code(500);
  echo json_encode([
    'error' => 'Token format looks wrong. Replicate tokens start with r8_ and are 30+ chars.',
    'source' => $tokenSource ? basename($tokenSource) : 'unknown',
    'token_length' => strlen($token)
  ]);
  exit;
}

// ── Read & validate prompt ────────────────────────────────
$rawBody = file_get_contents('php://input');
$body = json_decode($rawBody ?: '', true);
$prompt = isset($body['prompt']) ? trim((string)$body['prompt']) : '';
if (!$prompt) {
  http_response_code(400);
  echo json_encode(['error' => 'Missing prompt in request body', 'got' => substr($rawBody, 0, 200)]);
  exit;
}
if (strlen($prompt) > 1000) {
  http_response_code(400);
  echo json_encode(['error' => 'Prompt too long (max 1000 chars)']);
  exit;
}

// ── Call Replicate (Flux Schnell — Apache 2.0 weights, fast) ─
// Use the model-specific endpoint so we can pass the slug directly
// (the bare /v1/predictions endpoint requires a SHA256 version hash).
$payload = json_encode([
  'input' => [
    'prompt'              => $prompt,
    'aspect_ratio'        => '21:9',
    'output_format'       => 'png',
    'num_outputs'         => 1,
    'num_inference_steps' => 4,
  ],
]);

$ch = curl_init('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions');
curl_setopt_array($ch, [
  CURLOPT_POST           => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT        => 90,
  CURLOPT_CONNECTTIMEOUT => 15,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_SSL_VERIFYPEER => true,
  CURLOPT_SSL_VERIFYHOST => 2,
  CURLOPT_USERAGENT      => 'DubStubs/1.0',
  CURLOPT_HTTPHEADER     => [
    'Authorization: Token ' . $token,
    'Content-Type: application/json',
    'Prefer: wait=55',     // synchronous; wait up to 55s before falling back to async
  ],
  CURLOPT_POSTFIELDS     => $payload,
]);
$response  = curl_exec($ch);
$httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr   = curl_error($ch);
$curlErrNo = curl_errno($ch);
curl_close($ch);

if ($response === false || $curlErrNo !== 0) {
  http_response_code(502);
  echo json_encode([
    'error' => 'cURL request to Replicate failed',
    'curl_error' => $curlErr,
    'curl_errno' => $curlErrNo
  ]);
  exit;
}

$data = json_decode($response, true);
if (!is_array($data)) {
  http_response_code(502);
  echo json_encode([
    'error' => 'Replicate returned non-JSON',
    'http_code' => $httpCode,
    'snippet' => substr($response, 0, 300)
  ]);
  exit;
}

// Any non-2xx HTTP status from Replicate is an error.
// Common ones:
//  401/403 → bad token
//  402     → billing required / suspended account
//  422     → invalid input
//  429     → rate limited
//  5xx     → Replicate-side outage
if ($httpCode < 200 || $httpCode >= 300) {
  $msg = $data['detail'] ?? $data['error'] ?? $data['title'] ?? $data['message'] ?? 'No detail';
  if (!is_string($msg)) $msg = json_encode($msg);

  $hint = null;
  if ($httpCode === 401 || $httpCode === 403) $hint = 'Token rejected — check /home/USER/private/replicate.env.';
  if ($httpCode === 402) $hint = 'Billing required. Add a card and credits at replicate.com/account/billing.';
  if ($httpCode === 422) $hint = 'Replicate rejected the input — check the payload.';
  if ($httpCode === 429) $hint = 'Rate limited — wait a moment and retry.';

  http_response_code(502);
  echo json_encode([
    'error' => 'Replicate HTTP ' . $httpCode . ': ' . $msg,
    'hint'  => $hint,
    'http_code' => $httpCode,
    'replicate_response' => $data
  ]);
  exit;
}

// Even on 2xx, check for error/detail fields in the body
if (!empty($data['error']) || !empty($data['detail'])) {
  $msg = $data['detail'] ?? $data['error'];
  if (!is_string($msg)) $msg = json_encode($msg);
  http_response_code(502);
  echo json_encode([
    'error' => 'Replicate: ' . $msg,
    'http_code' => $httpCode,
    'replicate_response' => $data
  ]);
  exit;
}

// Pull image URL out
$imageUrl = null;
if (isset($data['output'])) {
  if (is_array($data['output']))      $imageUrl = $data['output'][0] ?? null;
  elseif (is_string($data['output'])) $imageUrl = $data['output'];
}

if (!$imageUrl) {
  $status = $data['status'] ?? 'unknown';
  if (in_array($status, ['starting', 'processing'])) {
    http_response_code(504);
    echo json_encode([
      'error' => 'Generation did not finish in 55s. Try again — Replicate cold starts can be slow.',
      'status' => $status
    ]);
    exit;
  }
  http_response_code(502);
  echo json_encode([
    'error' => 'No image URL in Replicate response',
    'status' => $status,
    'data' => $data
  ]);
  exit;
}

// ── Server-side fetch the image and inline as data URL ────
// Sidesteps any CORS issue when the browser tries Replicate's CDN directly.
$ch = curl_init($imageUrl);
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT        => 30,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_SSL_VERIFYPEER => true,
]);
$imgBytes = curl_exec($ch);
$imgErr   = curl_error($ch);
curl_close($ch);

if ($imgBytes === false) {
  // Fallback: return the URL and let the client try directly
  echo json_encode([
    'imageUrl' => $imageUrl,
    'note' => 'Server-side image fetch failed: ' . $imgErr
  ]);
  exit;
}

$dataUrl = 'data:image/png;base64,' . base64_encode($imgBytes);
echo json_encode(['imageUrl' => $dataUrl]);
