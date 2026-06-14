<?php
// _codexV1/api/generate.php
// Server-side Replicate proxy for AI background generation.
// This file reads secrets from private server config only; it does not store user files.
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
header('X-Content-Type-Options: nosniff');

const DUBSTUBS_MAX_BODY_BYTES = 4096;
const DUBSTUBS_MAX_PROMPT_CHARS = 1000;
const DUBSTUBS_RATE_LIMIT_WINDOW_SECONDS = 3600;
const DUBSTUBS_RATE_LIMIT_MAX_REQUESTS = 12;
const DUBSTUBS_MAX_GENERATED_IMAGE_BYTES = 8388608;

function dubstubs_json_error($status, $message, $extra = []) {
  http_response_code($status);
  echo json_encode(array_merge(['error' => $message], $extra));
  exit;
}

function dubstubs_request_id() {
  if (function_exists('random_bytes')) {
    return bin2hex(random_bytes(8));
  }
  return bin2hex(openssl_random_pseudo_bytes(8));
}

function dubstubs_private_dir($name) {
  $roots = array_filter([
    dirname(__DIR__, 2) . '/private',
    getenv('HOME') ? getenv('HOME') . '/private' : null,
  ]);

  foreach ($roots as $root) {
    if (!is_dir($root) && !@mkdir($root, 0750, true)) continue;
    $dir = $root . '/' . $name;
    if (!is_dir($dir) && !@mkdir($dir, 0750, true)) continue;
    return $dir;
  }

  return null;
}

function dubstubs_client_ip() {
  // Prefer Cloudflare's real client IP when the site is actually behind Cloudflare.
  $candidates = [
    $_SERVER['HTTP_CF_CONNECTING_IP'] ?? '',
    $_SERVER['REMOTE_ADDR'] ?? '',
  ];

  foreach ($candidates as $candidate) {
    $candidate = trim($candidate);
    if (filter_var($candidate, FILTER_VALIDATE_IP)) return $candidate;
  }

  return 'unknown';
}

function dubstubs_client_hash() {
  return hash('sha256', dubstubs_client_ip());
}

function dubstubs_track_event($event, $fields = []) {
  $dir = dubstubs_private_dir('dubstubs-logs');
  if (!$dir) {
    error_log('DubStubs could not open private log directory.');
    return;
  }

  $entry = array_merge([
    'ts' => gmdate('c'),
    'event' => $event,
  ], $fields);

  @file_put_contents(
    $dir . '/generate-events.jsonl',
    json_encode($entry, JSON_UNESCAPED_SLASHES) . PHP_EOL,
    FILE_APPEND | LOCK_EX
  );
}

function dubstubs_enforce_rate_limit($requestId, $clientHash) {
  $dir = dubstubs_private_dir('dubstubs-rate-limit');
  if (!$dir) {
    error_log('DubStubs could not open private rate-limit directory.');
    dubstubs_json_error(500, 'Server rate limit storage is not configured.', ['requestId' => $requestId]);
  }

  $file = $dir . '/' . $clientHash . '.json';
  $now = time();
  $windowStart = $now - DUBSTUBS_RATE_LIMIT_WINDOW_SECONDS;
  $fh = @fopen($file, 'c+');
  if (!$fh) {
    error_log('DubStubs could not open rate-limit file.');
    dubstubs_json_error(500, 'Server rate limit storage is not writable.', ['requestId' => $requestId]);
  }

  if (!flock($fh, LOCK_EX)) {
    fclose($fh);
    error_log('DubStubs could not lock rate-limit file.');
    dubstubs_json_error(500, 'Server rate limit storage is busy.', ['requestId' => $requestId]);
  }

  $raw = stream_get_contents($fh);
  $events = json_decode($raw ?: '[]', true);
  if (!is_array($events)) $events = [];
  $events = array_values(array_filter($events, function($ts) use ($windowStart) {
    return is_numeric($ts) && (int)$ts >= $windowStart;
  }));

  if (count($events) >= DUBSTUBS_RATE_LIMIT_MAX_REQUESTS) {
    $oldest = min($events);
    $retryAfter = max(1, ($oldest + DUBSTUBS_RATE_LIMIT_WINDOW_SECONDS) - $now);
    flock($fh, LOCK_UN);
    fclose($fh);
    header('Retry-After: ' . $retryAfter);
    dubstubs_track_event('rate_limited', [
      'request_id' => $requestId,
      'ip_hash' => $clientHash,
      'retry_after_seconds' => $retryAfter,
    ]);
    dubstubs_json_error(429, 'Too many generation requests. Please try again later.', [
      'requestId' => $requestId,
      'retryAfterSeconds' => $retryAfter,
    ]);
  }

  $events[] = $now;
  ftruncate($fh, 0);
  rewind($fh);
  fwrite($fh, json_encode($events));
  fflush($fh);
  flock($fh, LOCK_UN);
  fclose($fh);
}

function dubstubs_allowed_image_host($host) {
  $host = strtolower(trim((string)$host));
  $allowed = ['replicate.delivery'];
  $extra = getenv('DUBSTUBS_ALLOWED_IMAGE_HOSTS');
  if ($extra) {
    foreach (explode(',', $extra) as $candidate) {
      $candidate = strtolower(trim($candidate));
      if ($candidate !== '') $allowed[] = $candidate;
    }
  }

  foreach ($allowed as $allowedHost) {
    if ($host === $allowedHost) return true;
    $suffix = '.' . $allowedHost;
    if (substr($host, -strlen($suffix)) === $suffix) return true;
  }

  return false;
}

function dubstubs_validated_image_host($url) {
  if (!is_string($url) || !filter_var($url, FILTER_VALIDATE_URL)) return false;
  $parts = parse_url($url);
  $scheme = strtolower($parts['scheme'] ?? '');
  $host = strtolower($parts['host'] ?? '');
  if ($scheme !== 'https' || !$host) return false;
  return dubstubs_allowed_image_host($host) ? $host : false;
}

function dubstubs_image_content_type($contentType) {
  $type = strtolower(trim(explode(';', (string)$contentType)[0]));
  $allowed = ['image/png', 'image/jpeg', 'image/webp'];
  return in_array($type, $allowed, true) ? $type : null;
}

// Convert warnings/notices to exceptions so they don't sneak past us
set_error_handler(function($severity, $message, $file, $line) {
  if (!(error_reporting() & $severity)) return false;
  throw new ErrorException($message, 0, $severity, $file, $line);
});

set_exception_handler(function($e) {
  error_log('DubStubs generate.php exception: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
  if (!headers_sent()) {
    http_response_code(500);
    header('Content-Type: application/json');
  }
  echo json_encode(['error' => 'Server error while generating image.']);
  exit;
});

// Catch fatal errors (parse, memory, etc.) that bypass set_error_handler
register_shutdown_function(function() {
  $err = error_get_last();
  if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR])) {
    error_log('DubStubs generate.php fatal: ' . $err['message'] . ' in ' . $err['file'] . ':' . $err['line']);
    if (!headers_sent()) {
      http_response_code(500);
      header('Content-Type: application/json');
    }
    echo json_encode(['error' => 'Server error while generating image.']);
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
$requestId = dubstubs_request_id();
$clientHash = dubstubs_client_hash();
dubstubs_enforce_rate_limit($requestId, $clientHash);

// Try private locations for Namecheap's cPanel layout.
$candidates = array_filter([
  dirname(__DIR__, 2) . '/private/replicate.env',         // /home/USER/private/replicate.env (recommended)
  getenv('HOME') ? getenv('HOME') . '/private/replicate.env' : null,
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
    'error' => 'Replicate API token is not configured.',
    'hint' => 'Set REPLICATE_API_TOKEN as a server environment variable or in /home/YOUR_CPANEL_USER/private/replicate.env.',
    'requestId' => $requestId
  ]);
  exit;
}

if (!preg_match('/^r8_[A-Za-z0-9]{20,}$/', $token)) {
  http_response_code(500);
  echo json_encode(['error' => 'Replicate API token configuration is invalid.', 'requestId' => $requestId]);
  exit;
}

// ── Read & validate prompt ────────────────────────────────
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if ($contentType && stripos($contentType, 'application/json') === false) {
  http_response_code(415);
  echo json_encode(['error' => 'Content-Type must be application/json.', 'requestId' => $requestId]);
  exit;
}

$rawBody = file_get_contents('php://input', false, null, 0, DUBSTUBS_MAX_BODY_BYTES + 1);
if (strlen($rawBody) > DUBSTUBS_MAX_BODY_BYTES) {
  http_response_code(413);
  echo json_encode(['error' => 'Request body too large.', 'requestId' => $requestId]);
  exit;
}

$body = json_decode($rawBody ?: '{}', true);
if (!is_array($body)) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid JSON request body.', 'requestId' => $requestId]);
  exit;
}

$prompt = isset($body['prompt']) ? trim((string)$body['prompt']) : '';
if (!$prompt) {
  http_response_code(400);
  echo json_encode(['error' => 'Missing prompt in request body.', 'requestId' => $requestId]);
  exit;
}
if (strlen($prompt) > DUBSTUBS_MAX_PROMPT_CHARS) {
  http_response_code(400);
  echo json_encode(['error' => 'Prompt too long.', 'requestId' => $requestId]);
  exit;
}

dubstubs_track_event('request_received', [
  'request_id' => $requestId,
  'ip_hash' => $clientHash,
  'prompt_chars' => strlen($prompt),
  'prompt_hash' => hash('sha256', $prompt),
]);

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
  error_log('DubStubs Replicate cURL failed: [' . $curlErrNo . '] ' . $curlErr);
  dubstubs_track_event('replicate_request_failed', [
    'request_id' => $requestId,
    'ip_hash' => $clientHash,
    'curl_errno' => $curlErrNo,
  ]);
  http_response_code(502);
  echo json_encode(['error' => 'Image generation provider request failed.', 'requestId' => $requestId]);
  exit;
}

$data = json_decode($response, true);
if (!is_array($data)) {
  http_response_code(502);
  echo json_encode(['error' => 'Image generation provider returned an invalid response.', 'requestId' => $requestId]);
  exit;
}

dubstubs_track_event('replicate_response', [
  'request_id' => $requestId,
  'ip_hash' => $clientHash,
  'http_code' => $httpCode,
  'prediction_id' => $data['id'] ?? null,
  'provider_status' => $data['status'] ?? null,
]);

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
    'error' => 'Image generation provider rejected the request.',
    'hint'  => $hint,
    'http_code' => $httpCode,
    'requestId' => $requestId
  ]);
  exit;
}

// Even on 2xx, check for error/detail fields in the body
if (!empty($data['error']) || !empty($data['detail'])) {
  $msg = $data['detail'] ?? $data['error'];
  if (!is_string($msg)) $msg = json_encode($msg);
  http_response_code(502);
  echo json_encode([
    'error' => 'Image generation provider returned an error.',
    'http_code' => $httpCode,
    'requestId' => $requestId
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
      'status' => $status,
      'requestId' => $requestId
    ]);
    exit;
  }
  http_response_code(502);
  echo json_encode([
    'error' => 'No image URL in Replicate response',
    'status' => $status,
    'requestId' => $requestId
  ]);
  exit;
}

// ── Server-side fetch the image and inline as data URL ────
// Sidesteps any CORS issue when the browser tries Replicate's CDN directly.
$imageHost = dubstubs_validated_image_host($imageUrl);
if (!$imageHost) {
  dubstubs_track_event('generated_image_url_rejected', [
    'request_id' => $requestId,
    'ip_hash' => $clientHash,
  ]);
  http_response_code(502);
  echo json_encode(['error' => 'Generated image URL was not from an allowed provider host.', 'requestId' => $requestId]);
  exit;
}

$imgBytes = '';
$imgTooLarge = false;
$ch = curl_init($imageUrl);
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => false,
  CURLOPT_TIMEOUT        => 30,
  CURLOPT_CONNECTTIMEOUT => 10,
  CURLOPT_FOLLOWLOCATION => false,
  CURLOPT_SSL_VERIFYPEER => true,
  CURLOPT_SSL_VERIFYHOST => 2,
  CURLOPT_WRITEFUNCTION  => function($ch, $chunk) use (&$imgBytes, &$imgTooLarge) {
    if (strlen($imgBytes) + strlen($chunk) > DUBSTUBS_MAX_GENERATED_IMAGE_BYTES) {
      $imgTooLarge = true;
      return 0;
    }
    $imgBytes .= $chunk;
    return strlen($chunk);
  },
]);
$imgOk       = curl_exec($ch);
$imgHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$imgType     = dubstubs_image_content_type(curl_getinfo($ch, CURLINFO_CONTENT_TYPE));
$imgErr      = curl_error($ch);
$imgErrNo    = curl_errno($ch);
curl_close($ch);

if ($imgTooLarge) {
  dubstubs_track_event('generated_image_too_large', [
    'request_id' => $requestId,
    'ip_hash' => $clientHash,
    'image_host' => $imageHost,
    'max_bytes' => DUBSTUBS_MAX_GENERATED_IMAGE_BYTES,
  ]);
  http_response_code(502);
  echo json_encode(['error' => 'Generated image was too large.', 'requestId' => $requestId]);
  exit;
}

if ($imgOk === false || $imgErrNo !== 0 || $imgHttpCode < 200 || $imgHttpCode >= 300) {
  error_log('DubStubs generated image fetch failed: [' . $imgErrNo . '] ' . $imgErr . ' HTTP ' . $imgHttpCode);
  dubstubs_track_event('generated_image_fetch_failed', [
    'request_id' => $requestId,
    'ip_hash' => $clientHash,
    'image_host' => $imageHost,
    'image_http_code' => $imgHttpCode,
    'curl_errno' => $imgErrNo,
  ]);
  http_response_code(502);
  echo json_encode(['error' => 'Generated image could not be downloaded safely.', 'requestId' => $requestId]);
  exit;
}

if (!$imgType) {
  dubstubs_track_event('generated_image_type_rejected', [
    'request_id' => $requestId,
    'ip_hash' => $clientHash,
    'image_host' => $imageHost,
    'image_http_code' => $imgHttpCode,
  ]);
  http_response_code(502);
  echo json_encode(['error' => 'Generated image returned an unsupported content type.', 'requestId' => $requestId]);
  exit;
}

dubstubs_track_event('generated_image_fetched', [
  'request_id' => $requestId,
  'ip_hash' => $clientHash,
  'image_host' => $imageHost,
  'image_content_type' => $imgType,
  'image_bytes' => strlen($imgBytes),
]);

$dataUrl = 'data:' . $imgType . ';base64,' . base64_encode($imgBytes);
echo json_encode(['imageUrl' => $dataUrl, 'requestId' => $requestId]);
