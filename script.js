 // script.js
// JavaScript for ticket interactivity.
// Excludes styling and server code.
const ticket = document.getElementById('ticket');
const ticketContent = document.getElementById('ticketContent');
const backgroundUpload = document.getElementById('backgroundUpload');
const generateAIBackgroundBtn = document.getElementById('generateAIBackground');
const imageWidth = document.getElementById('imageWidth');
const imageHeight = document.getElementById('imageHeight');
const imageOpacity = document.getElementById('imageOpacity');
const fontSelect = document.getElementById('fontSelect');
const fontSize = document.getElementById('fontSize');
const fontColor = document.getElementById('fontColor');
const addTextBlockBtn = document.getElementById('addTextBlock');
const toggleModeBtn = document.getElementById('toggleMode');
const exportImageBtn = document.getElementById('exportImage');
const ticketHeightInput = document.getElementById('ticketHeight');
const clearAllTextBtn = document.getElementById('clearAllText');

// Pre-defined text blocks
const predefinedText = [
    "First name:", 
    "Last name:", 
    "Email:", 
    "mh1114",
    "ga2",
    "sec./sec",
    "ga9",
    "row/rangee",
    "12",
    "seat/siege",
    "adult",
    "price type/prix type",
    "emh1114",
    "f= 1.50",
    "ga-flr",
    "standing",
    "38.00",
    "15:52"
];

// Available fonts
const fonts = [
    'Arial, sans-serif',
    'Georgia, serif',
    '"Courier New", monospace',
    '"Times New Roman", serif',
    'Verdana, sans-serif',
    '"Comic Sans MS", cursive',
    'Impact, fantasy',
    '"Arial Black", sans-serif',
    'Tahoma, sans-serif',
    '"Trebuchet MS", sans-serif',
    'Palatino, serif',
    'Garamond, serif',
    'Bookman, serif',
    'Helvetica, sans-serif',
    'Gill Sans, sans-serif'
];

// Initialize the font dropdown
function initFontSelect() {
    fonts.forEach((font, index) => {
        const option = document.createElement('option');
        option.value = font;
        option.textContent = font.split(',')[0].replace(/"/g, '');
        fontSelect.appendChild(option);
    });
}

// Add a new text block to the ticket
function addTextBlock(text = '') {
    const textBlock = document.createElement('div');
    textBlock.className = 'text-block';
    textBlock.draggable = true;
    
    const textArea = document.createElement('textarea');
    textArea.className = 'text-block-content';
    textArea.value = text || 'Double click to edit';
    textArea.rows = 1;
    textArea.style.fontSize = `${fontSize.value}px`;
    textArea.style.color = fontColor.value;
    textArea.style.fontFamily = fontSelect.value;
    
    // Make text area auto-resize
    textArea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
    
    // Initialize height
    textArea.style.height = 'auto';
    textArea.style.height = (textArea.scrollHeight) + 'px';
    
    // Add controls
    const controls = document.createElement('div');
    controls.className = 'text-block-controls';
    controls.innerHTML = `
        <div class="text-controls-row">
            <div class="align-buttons">
                <button class="align-left" title="Align Left">L</button>
                <button class="align-center" title="Center">C</button>
                <button class="align-right" title="Align Right">R</button>
            </div>
        </div>
        <div class="text-controls-row">
            <div class="text-style-buttons">
                <button class="uppercase-text" title="Uppercase">A</button>
                <button class="lowercase-text" title="Lowercase">a</button>
                <button class="toggle-bold" title="Bold"><b>B</b></button>
                <button class="toggle-vertical" title="Vertical Text">↕️</button>
                <button class="lock-position" title="Lock Position">🔒</button>
            </div>
        </div>
        <div class="text-controls-row">
            <label>Size:</label>
            <input type="number" class="font-size-input" value="${fontSize.value}" min="8" max="72">
            <label>Color:</label>
            <input type="color" class="color-picker" value="${fontColor.value}">
        </div>
        <div class="text-controls-row">
            <label>Rotate:</label>
            <input type="range" class="rotate-input" min="0" max="360" value="0">
            <span class="rotate-value">0°</span>
        </div>
        <div class="text-controls-row">
            <button class="delete-text-block" style="width: 100%;">Delete</button>
        </div>
    `;
    
    textBlock.appendChild(textArea);
    textBlock.appendChild(controls);
    ticketContent.appendChild(textBlock);
    
    // Make draggable
    makeDraggable(textBlock);
    
    // Add event listeners for controls
    setupTextBlockControls(textBlock);
    
    return textBlock;
}

// Make an element draggable
function makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    
    element.onmousedown = dragMouseDown;
    
    function dragMouseDown(e) {
        // Don't drag if clicking on a button or input
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        e = e || window.event;
        e.preventDefault();
        
        // Get the mouse cursor position at startup
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        // Get the element's position
        const rect = element.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        startLeft = rect.left - ticketContent.getBoundingClientRect().left;
        startTop = rect.top - ticketContent.getBoundingClientRect().top;
        
        isDragging = true;
        
        // Call a function whenever the cursor moves
        document.onmousemove = elementDrag;
        document.onmouseup = closeDragElement;
    }
    
    function elementDrag(e) {
        if (!isDragging) return;
        
        e = e || window.event;
        e.preventDefault();
        
        // Calculate the new cursor position
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        // Set the element's new position
        const newLeft = element.offsetLeft - pos1;
        const newTop = element.offsetTop - pos2;
        
        // Constrain to ticket boundaries
        const maxLeft = ticketContent.offsetWidth - element.offsetWidth;
        const maxTop = ticketContent.offsetHeight - element.offsetHeight;
        
        element.style.left = `${Math.max(0, Math.min(maxLeft, newLeft))}px`;
        element.style.top = `${Math.max(0, Math.min(maxTop, newTop))}px`;
    }
    
    function closeDragElement() {
        // Stop moving when mouse button is released
        document.onmouseup = null;
        document.onmousemove = null;
        isDragging = false;
    }
}

// Set up controls for a text block
function setupTextBlockControls(textBlock) {
    const textArea = textBlock.querySelector('.text-block-content');
    const controls = textBlock.querySelector('.text-block-controls');
    const deleteBtn = textBlock.querySelector('.delete-text-block');
    const alignLeft = textBlock.querySelector('.align-left');
    const alignCenter = textBlock.querySelector('.align-center');
    const alignRight = textBlock.querySelector('.align-right');
    const uppercaseBtn = textBlock.querySelector('.uppercase-text');
    const lowercaseBtn = textBlock.querySelector('.lowercase-text');
    const boldBtn = textBlock.querySelector('.toggle-bold');
    const verticalBtn = textBlock.querySelector('.toggle-vertical');
    const lockBtn = textBlock.querySelector('.lock-position');
    const fontSizeInput = textBlock.querySelector('.font-size-input');
    const colorPicker = textBlock.querySelector('.color-picker');
    const rotateInput = textBlock.querySelector('.rotate-input');
    const rotateValue = textBlock.querySelector('.rotate-value');
    
    // Toggle controls visibility
    textBlock.addEventListener('dblclick', () => {
        textBlock.classList.toggle('active');
    });
    
    // Delete button
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        textBlock.remove();
    });
    
    // Text alignment
    alignLeft.addEventListener('click', () => {
        textArea.style.textAlign = 'left';
    });
    
    alignCenter.addEventListener('click', () => {
        textArea.style.textAlign = 'center';
    });
    
    alignRight.addEventListener('click', () => {
        textArea.style.textAlign = 'right';
    });
    
    // Text transform
    uppercaseBtn.addEventListener('click', () => {
        textArea.style.textTransform = 'uppercase';
    });
    
    lowercaseBtn.addEventListener('click', () => {
        textArea.style.textTransform = 'lowercase';
    });
    
    // Bold toggle
    boldBtn.addEventListener('click', () => {
        textArea.style.fontWeight = textArea.style.fontWeight === 'bold' ? 'normal' : 'bold';
    });
    
    // Vertical text toggle
    verticalBtn.addEventListener('click', () => {
        textArea.classList.toggle('vertical-text');
    });
    
    // Lock position toggle
    lockBtn.addEventListener('click', () => {
        textBlock.draggable = !textBlock.draggable;
        lockBtn.textContent = textBlock.draggable ? '🔒' : '🔓';
        lockBtn.title = textBlock.draggable ? 'Lock Position' : 'Unlock Position';
    });
    
    // Font size
    fontSizeInput.addEventListener('input', (e) => {
        textArea.style.fontSize = `${e.target.value}px`;
        // Resize textarea
        textArea.style.height = 'auto';
        textArea.style.height = (textArea.scrollHeight) + 'px';
    });
    
    // Text color
    colorPicker.addEventListener('input', (e) => {
        textArea.style.color = e.target.value;
    });
    
    // Rotation
    rotateInput.addEventListener('input', (e) => {
        const rotation = e.target.value;
        textArea.style.transform = `rotate(${rotation}deg)`;
        rotateValue.textContent = `${rotation}°`;
    });
    
    // Prevent controls from triggering drag
    controls.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });
}

// Initialize the application
function init() {
    // Initialize font select
    initFontSelect();
    
    // Add predefined text blocks
    predefinedText.forEach(text => {
        addTextBlock(text);
    });
    
    // Background image upload
    backgroundUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    // Adjust ticket size to match image aspect ratio
                    const aspectRatio = img.width / img.height;
                    const ticketWidth = ticket.offsetWidth;
                    const newHeight = ticketWidth / aspectRatio;
                    
                    // Set ticket height to match image aspect ratio
                    ticket.style.height = `${newHeight}px`;
                    ticketHeightInput.value = Math.round(newHeight);
                    
                    // Set background image
                    ticket.style.backgroundImage = `url(${event.target.result})`;
                    ticket.style.backgroundSize = 'contain';
                    ticket.style.backgroundRepeat = 'no-repeat';
                    ticket.style.backgroundPosition = 'center';
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Generate AI background (placeholder)
    generateAIBackgroundBtn.addEventListener('click', () => {
        // This would be replaced with actual AI background generation
        alert('AI background generation would be implemented here');
    });
    
    // Image controls
    imageWidth.addEventListener('input', updateImageSize);
    imageHeight.addEventListener('input', updateImageSize);
    imageOpacity.addEventListener('input', updateImageOpacity);
    
    // Font controls
    fontSelect.addEventListener('change', (e) => {
        document.querySelectorAll('.text-block-content').forEach(el => {
            el.style.fontFamily = e.target.value;
        });
    });
    
    fontSize.addEventListener('input', (e) => {
        document.querySelectorAll('.text-block-content').forEach(el => {
            el.style.fontSize = `${e.target.value}px`;
            // Resize textarea
            el.style.height = 'auto';
            el.style.height = (el.scrollHeight) + 'px';
        });
    });
    
    fontColor.addEventListener('input', (e) => {
        document.querySelectorAll('.text-block-content').forEach(el => {
            el.style.color = e.target.value;
        });
    });
    
    // Add text block button
    addTextBlockBtn.addEventListener('click', () => {
        addTextBlock();
    });
    
    // Toggle night mode
    toggleModeBtn.addEventListener('click', () => {
        document.body.classList.toggle('night-mode');
    });
    
    // Export image
    exportImageBtn.addEventListener('click', exportImage);
    
    // Ticket height
    ticketHeightInput.addEventListener('input', (e) => {
        ticket.style.height = `${e.target.value}px`;
    });
    
    // Clear all text
    clearAllTextBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all text blocks?')) {
            document.querySelectorAll('.text-block').forEach(el => el.remove());
        }
    });
}

// Update image size
function updateImageSize() {
    const width = imageWidth.value;
    const height = imageHeight.value;
    
    // This would update the background image size
    // In a real implementation, you might use a canvas or other method to resize the image
    ticket.style.backgroundSize = `${width}% ${height}%`;
}

// Update image opacity
function updateImageOpacity() {
    const opacity = imageOpacity.value / 100;
    // This would update the background image opacity
    // In a real implementation, you might need to use a different approach
    const bgImage = ticket.style.backgroundImage;
    if (bgImage) {
        ticket.style.backgroundImage = bgImage.replace(/opacity\([^)]*\)/, `opacity(${opacity})`);
    }
}

// Export ticket as image
function exportImage() {
    // This is a simplified version - in a real app, you'd use html2canvas or similar
    alert('Export functionality would be implemented here');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
