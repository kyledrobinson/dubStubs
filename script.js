 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a//dev/null b/script.js
index 0000000000000000000000000000000000000000..9e89abf5987e8c0e2d1cda9526607cbdbb80d09f 100644
--- a//dev/null
+++ b/script.js
@@ -0,0 +1,379 @@
+<!-- script.js -->
+<!-- JavaScript for ticket interactivity. -->
+<!-- Excludes styling and server code. -->
+        const ticket = document.getElementById('ticket');
+        const ticketContent = document.getElementById('ticketContent');
+        const backgroundUpload = document.getElementById('backgroundUpload');
+        const generateAIBackgroundBtn = document.getElementById('generateAIBackground');
+        const imageWidth = document.getElementById('imageWidth');
+        const imageHeight = document.getElementById('imageHeight');
+        const imageOpacity = document.getElementById('imageOpacity');
+        const fontSelect = document.getElementById('fontSelect');
+        const fontSize = document.getElementById('fontSize');
+        const fontColor = document.getElementById('fontColor');
+        const addTextBlockBtn = document.getElementById('addTextBlock');
+        const toggleModeBtn = document.getElementById('toggleMode');
+        const exportImageBtn = document.getElementById('exportImage');
+        const ticketHeightInput = document.getElementById('ticketHeight');
+        const clearAllTextBtn = document.getElementById('clearAllText');
+
+        // Pre-defined text blocks
+        const predefinedText = [
+            "First name:", 
+            "Last name:", 
+            "Email:", 
+            "mh1114",
+            "ga2",
+            "sec./sec",
+            "ga9",
+            "row/rangee",
+            "12",
+            "seat/siege",
+            "adult",
+            "price type/prix type",
+            "emh1114",
+            "f= 1.50",
+            "ga-flr",
+            "standing",
+            "38.00",
+            "15:52"
+        ];
+
+        // Add pre-defined text blocks
+        predefinedText.forEach((text, index) => {
+            addTextBlock(text, 10 + (index * 20), 10 + (index * 20));
+        });
+
+        // Background upload and control
+        backgroundUpload.addEventListener('change', function(e) {
+            const file = e.target.files[0];
+            const reader = new FileReader();
+
+            reader.onload = function(event) {
+                const img = new Image();
+                img.onload = function() {
+                    const aspectRatio = img.width / img.height;
+                    const ticketWidth = ticket.offsetWidth;
+                    const ticketHeight = ticketWidth / aspectRatio;
+                    
+                    document.getElementById('ticketBackground').src = event.target.result;
+                    document.getElementById('ticketBackground').style.width = '100%';
+                    document.getElementById('ticketBackground').style.height = 'auto';
+                    
+                    ticket.style.height = `${Math.max(280, ticketHeight)}px`;
+                    ticketHeightInput.value = Math.max(280, Math.round(ticketHeight));
+                }
+                img.src = event.target.result;
+            }
+
+            reader.readAsDataURL(file);
+        });
+
+        // Generate AI Background
+        generateAIBackgroundBtn.addEventListener('click', function() {
+            const aiGeneratedImageUrl = `https://picsum.photos/800/400?random=${Date.now()}`;
+            const img = new Image();
+            img.onload = function() {
+                document.getElementById('ticketBackground').src = this.src;
+                document.getElementById('ticketBackground').style.opacity = '0.2';
+            }
+            img.src = aiGeneratedImageUrl;
+        });
+
+        imageWidth.addEventListener('input', updateBackgroundSize);
+        imageHeight.addEventListener('input', updateBackgroundSize);
+        imageOpacity.addEventListener('input', updateBackgroundOpacity);
+
+        function updateBackgroundSize() {
+            const width = imageWidth.value;
+            const height = imageHeight.value;
+            const background = document.getElementById('ticketBackground');
+            background.style.width = `${width}%`;
+            background.style.height = `${height}%`;
+        }
+
+        function updateBackgroundOpacity() {
+            const opacity = imageOpacity.value;
+            document.getElementById('ticketBackground').style.opacity = opacity / 100;
+        }
+
+        // Font selection
+        fontSelect.addEventListener('change', function(e) {
+            ticketContent.style.fontFamily = e.target.value;
+        });
+
+        // Add text block
+        addTextBlockBtn.addEventListener('click', () => addTextBlock("NEW TEXT", 10, 10));
+
+        function addTextBlock(text, left, top) {
+            const textBlock = document.createElement('div');
+            textBlock.className = 'text-block';
+            textBlock.style.left = `${left}px`;
+            textBlock.style.top = `${top}px`;
+            textBlock.style.zIndex = 2;
+
+            const textContent = document.createElement('textarea');
+            textContent.className = 'text-block-content';
+            textContent.value = text.toUpperCase();
+            textContent.style.fontSize = `${fontSize.value}px`;
+            textContent.style.color = fontColor.value;
+
+            const controls = document.createElement('div');
+            controls.className = 'text-block-controls';
+            controls.innerHTML = `
+                <label for="text-font-size">Font Size:</label>
+                <input type="number" class="text-font-size" value="${fontSize.value}" min="8" max="72" step="1">
+                <div class="text-style-buttons">
+                    <label for="text-font-color">Color:</label>
+                    <input type="color" class="text-font-color" value="${fontColor.value}">
+                    <button class="uppercase-text" title="Uppercase">AA</button>
+                    <button class="lowercase-text" title="Lowercase">aa</button>
+                    <button class="toggle-bold" title="Bold">B</button>
+                    <button class="lock-position" title="Lock Position">🔒</button>
+                    <button class="toggle-vertical" title="Vertical Text">⟂</button>
+                </div>
+                <div class="align-buttons">
+                    <button class="align-left" title="Align Left">L</button>
+                    <button class="align-center" title="Align Center">C</button>
+                    <button class="align-right" title="Align Right">R</button>
+                </div>
+                <label for="kerning">Kerning:</label>
+                <input type="range" class="kerning" min="-2" max="2" step="0.1" value="0">
+                <label for="tracking">Tracking:</label>
+                <input type="range" class="tracking" min="-2" max="2" step="0.1" value="0">
+                <div class="rotate-control">
+                    <button class="rotate-button" data-rotate="0">0°</button>
+                    <button class="rotate-button" data-rotate="90">90°</button>
+                    <button class="rotate-button" data-rotate="180">180°</button>
+                    <button class="rotate-button" data-rotate="270">270°</button>
+                </div>
+                <label for="z-index">Z-Index:</label>
+                <input type="number" class="z-index" value="2" min="1" step="1">
+                <button class="delete-text-block">Delete</button>
+            `;
+
+            textBlock.appendChild(textContent);
+            textBlock.appendChild(controls);
+            ticketContent.appendChild(textBlock);
+
+            makeDraggable(textBlock);
+            setupTextBlockControls(textBlock);
+            adjustTextBlockSize(textBlock);
+        }
+
+        // Make elements draggable
+        function makeDraggable(element) {
+            let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
+            element.onmousedown = dragMouseDown;
+
+            function dragMouseDown(e) {
+                e = e || window.event;
+                if (e.target !== element || element.classList.contains('locked')) return;
+                e.preventDefault();
+                pos3 = e.clientX;
+                pos4 = e.clientY;
+                document.onmouseup = closeDragElement;
+                document.onmousemove = elementDrag;
+            }
+
+            function elementDrag(e) {
+                e = e || window.event;
+                e.preventDefault();
+                pos1 = pos3 - e.clientX;
+                pos2 = pos4 - e.clientY;
+                pos3 = e.clientX;
+                pos4 = e.clientY;
+                element.style.top = (element.offsetTop - pos2) + "px";
+                element.style.left = (element.offsetLeft - pos1) + "px";
+            }
+
+            function closeDragElement() {
+                document.onmouseup = null;
+                document.onmousemove = null;
+            }
+        }
+
+        // Setup text block controls
+        function setupTextBlockControls(textBlock) {
+            const textContent = textBlock.querySelector('.text-block-content');
+            const fontSizeInput = textBlock.querySelector('.text-font-size');
+            const fontColorInput = textBlock.querySelector('.text-font-color');
+            const uppercaseBtn = textBlock.querySelector('.uppercase-text');
+            const lowercaseBtn = textBlock.querySelector('.lowercase-text');
+            const alignLeftBtn = textBlock.querySelector('.align-left');
+            const alignCenterBtn = textBlock.querySelector('.align-center');
+            const alignRightBtn = textBlock.querySelector('.align-right');
+            const toggleBoldBtn = textBlock.querySelector('.toggle-bold');
+            const lockPositionBtn = textBlock.querySelector('.lock-position');
+            const toggleVerticalBtn = textBlock.querySelector('.toggle-vertical');
+            const kerningInput = textBlock.querySelector('.kerning');
+            const trackingInput = textBlock.querySelector('.tracking');
+            const rotateButtons = textBlock.querySelectorAll('.rotate-button');
+            const zIndexInput = textBlock.querySelector('.z-index');
+            const deleteBtn = textBlock.querySelector('.delete-text-block');
+
+            fontSizeInput.addEventListener('input', () => {
+                textContent.style.fontSize = `${fontSizeInput.value}px`;
+                adjustTextBlockSize(textBlock);
+            });
+
+            fontColorInput.addEventListener('input', () => {
+                textContent.style.color = fontColorInput.value;
+            });
+
+            textContent.addEventListener('input', () => {
+                textContent.value = textContent.value.toUpperCase();
+                adjustTextBlockSize(textBlock);
+            });
+
+            uppercaseBtn.addEventListener('click', () => {
+                textContent.value = textContent.value.toUpperCase();
+                adjustTextBlockSize(textBlock);
+            });
+
+            lowercaseBtn.addEventListener('click', () => {
+                textContent.value = textContent.value.toLowerCase();
+                adjustTextBlockSize(textBlock);
+            });
+
+            alignLeftBtn.addEventListener('click', () => {
+                textContent.style.textAlign = 'left';
+            });
+
+            alignCenterBtn.addEventListener('click', () => {
+                textContent.style.textAlign = 'center';
+            });
+
+            alignRightBtn.addEventListener('click', () => {
+                textContent.style.textAlign = 'right';
+            });
+
+            toggleBoldBtn.addEventListener('click', () => {
+                textContent.style.fontWeight = textContent.style.fontWeight === 'bold' ? 'normal' : 'bold';
+            });
+
+            lockPositionBtn.addEventListener('click', () => {
+                textBlock.classList.toggle('locked');
+                lockPositionBtn.textContent = textBlock.classList.contains('locked') ? '🔓' : '🔒';
+            });
+
+            toggleVerticalBtn.addEventListener('click', () => {
+                textBlock.classList.toggle('vertical');
+                if (textBlock.classList.contains('vertical')) {
+                    textContent.style.writingMode = 'vertical-rl';
+                    textContent.style.textOrientation = 'upright';
+                } else {
+                    textContent.style.writingMode = 'horizontal-tb';
+                    textContent.style.textOrientation = 'mixed';
+                }
+                adjustTextBlockSize(textBlock);
+            });
+
+            kerningInput.addEventListener('input', () => {
+                textContent.style.letterSpacing = `${kerningInput.value}px`;
+                adjustTextBlockSize(textBlock);
+            });
+
+            trackingInput.addEventListener('input', () => {
+                textContent.style.wordSpacing = `${trackingInput.value}px`;
+                adjustTextBlockSize(textBlock);
+            });
+
+            rotateButtons.forEach(button => {
+                button.addEventListener('click', () => {
+                    const rotation = button.dataset.rotate;
+                    textBlock.style.transform = `rotate(${rotation}deg)`;
+                });
+            });
+
+            zIndexInput.addEventListener('input', () => {
+                textBlock.style.zIndex = zIndexInput.value;
+            });
+
+            deleteBtn.addEventListener('click', () => {
+                textBlock.remove();
+            });
+
+            textBlock.addEventListener('click', () => {
+                document.querySelectorAll('.text-block').forEach(block => block.classList.remove('active'));
+                textBlock.classList.add('active');
+            });
+
+            document.addEventListener('click', (e) => {
+                if (!textBlock.contains(e.target)) {
+                    textBlock.classList.remove('active');
+                }
+            });
+        }
+
+        // Adjust text block size to fit content
+        function adjustTextBlockSize(textBlock) {
+            const textContent = textBlock.querySelector('.text-block-content');
+            textContent.style.height = 'auto';
+            textContent.style.height = textContent.scrollHeight + 'px';
+            textContent.style.width = 'auto';
+            textContent.style.width = textContent.scrollWidth + 'px';
+            textBlock.style.width = textContent.style.width;
+            textBlock.style.height = textContent.style.height;
+        }
+
+        // Toggle day/night mode
+        toggleModeBtn.addEventListener('click', function() {
+            document.body.classList.toggle('night-mode');
+        });
+
+        // Export as image
+        exportImageBtn.addEventListener('click', function() {
+            html2canvas(document.querySelector(".ticket")).then(canvas => {
+                const link = document.createElement('a');
+                link.download = 'my-ticket.png';
+                link.href = canvas.toDataURL();
+                link.click();
+            });
+        });
+
+        // Adjust ticket height
+        ticketHeightInput.addEventListener('input', function() {
+            ticket.style.height = `${Math.max(280, this.value)}px`;
+        });
+
+        // Clear all text
+        clearAllTextBtn.addEventListener('click', function() {
+            const textBlocks = document.querySelectorAll('.text-block');
+            textBlocks.forEach(block => {
+                block.remove();
+            });
+        });
+
+        // Maintain widescreen view
+        function maintainWidescreenView() {
+            const ticketWidth = ticket.offsetWidth;
+            if (ticketWidth < 400) {
+                const scale = ticketWidth / 400;
+                ticket.style.transform = `scale(${scale})`;
+                ticket.style.transformOrigin = 'top left';
+            } else {
+                ticket.style.transform = 'scale(1)';
+            }
+        }
+
+        window.addEventListener('resize', maintainWidescreenView);
+        maintainWidescreenView();
+
+        // Prevent background flashing and ticket preview blinking
+        const ticketBackground = document.getElementById('ticketBackground');
+        ticketBackground.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
+        
+        // Smooth loading transition
+        ticketBackground.addEventListener('load', function() {
+            this.style.opacity = '0.2';
+            this.style.transform = 'scale(1)';
+        });
+
+        ticketBackground.addEventListener('error', function() {
+            console.error('Failed to load background image');
+        });
+
+        // Prevent ticket preview window from blinking
+        const ticketPreview = document.querySelector('.ticket-preview');
+        ticketPreview.style.transition = 'none';
 
EOF
)
