document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const ticketContent = document.getElementById('ticketContent');
    const backgroundUpload = document.getElementById('backgroundUpload');
    const imageOpacity = document.getElementById('imageOpacity');
    const opacityValue = document.getElementById('opacityValue');
    const toggleModeBtn = document.getElementById('toggleMode');
    const exportImageBtn = document.getElementById('exportImage');
    const selectedText = document.getElementById('selectedText');
    const fontSelect = document.getElementById('fontSelect');
    const fontSize = document.getElementById('fontSize');
    const textColor = document.getElementById('textColor');
    
    // Alignment buttons
    const alignLeft = document.getElementById('alignLeft');
    const alignCenter = document.getElementById('alignCenter');
    const alignRight = document.getElementById('alignRight');
    
    // Style buttons
    const toggleBold = document.getElementById('toggleBold');
    const toggleUppercase = document.getElementById('toggleUppercase');
    const toggleVertical = document.getElementById('toggleVertical');
    const lockPosition = document.getElementById('lockPosition');
    const deleteBlock = document.getElementById('deleteBlock');
    
    // State
    let selectedBlock = null;
    
    // Initialize
    init();
    
    function init() {
        // Set up event listeners
        setupEventListeners();
        
        // Add initial text block
        addTextBlock('Double click to edit', 100, 100);
    }
    
    function setupEventListeners() {
        // Background image upload
        backgroundUpload.addEventListener('change', handleImageUpload);
        
        // Opacity control
        imageOpacity.addEventListener('input', function() {
            const opacity = this.value / 100;
            document.querySelector('.ticket-background').style.opacity = opacity;
            opacityValue.textContent = `${this.value}%`;
        });
        
        // Dark/light mode toggle
        toggleModeBtn.addEventListener('click', toggleDarkMode);
        
        // Export image
        exportImageBtn.addEventListener('click', exportAsImage);
        
        // Text controls
        selectedText.addEventListener('input', updateSelectedText);
        fontSelect.addEventListener('change', updateTextStyle);
        fontSize.addEventListener('input', updateTextStyle);
        textColor.addEventListener('input', updateTextStyle);
        
        // Alignment buttons
        alignLeft.addEventListener('click', () => setTextAlign('left'));
        alignCenter.addEventListener('click', () => setTextAlign('center'));
        alignRight.addEventListener('click', () => setTextAlign('right'));
        
        // Style buttons
        toggleBold.addEventListener('click', toggleStyle('bold'));
        toggleUppercase.addEventListener('click', toggleStyle('uppercase'));
        toggleVertical.addEventListener('click', toggleStyle('vertical'));
        lockPosition.addEventListener('click', toggleLockPosition);
        deleteBlock.addEventListener('click', deleteSelectedBlock);
    }
    
    function addTextBlock(text, x, y) {
        const textBlock = document.createElement('div');
        textBlock.className = 'text-block';
        textBlock.style.left = `${x}px`;
        textBlock.style.top = `${y}px`;
        
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.placeholder = 'Double click to edit';
        
        textBlock.appendChild(textarea);
        ticketContent.appendChild(textBlock);
        
        // Make draggable
        makeDraggable(textBlock);
        
        // Select this block when clicked
        textBlock.addEventListener('mousedown', function(e) {
            selectBlock(textBlock);
            e.stopPropagation();
        });
        
        // Update controls when text changes
        textarea.addEventListener('input', function() {
            adjustTextBlockSize(textBlock);
        });
        
        // Select this block
        selectBlock(textBlock);
        
        return textBlock;
    }
    
    function makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const header = element;
        
        header.onmousedown = dragMouseDown;
        
        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            // Get the mouse cursor position at startup
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            // Call a function whenever the cursor moves
            document.onmousemove = elementDrag;
        }
        
        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            // Calculate the new cursor position
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // Set the element's new position
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }
        
        function closeDragElement() {
            // Stop moving when mouse button is released
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }
    
    function selectBlock(block) {
        // Deselect all blocks
        document.querySelectorAll('.text-block').forEach(b => {
            b.classList.remove('selected');
        });
        
        // Select the clicked block
        block.classList.add('selected');
        selectedBlock = block;
        
        // Update controls
        updateControls(block);
    }
    
    function updateControls(block) {
        if (!block) return;
        
        const textarea = block.querySelector('textarea');
        if (!textarea) return;
        
        // Update text input
        selectedText.value = textarea.value;
        
        // Update font family
        fontSelect.value = textarea.style.fontFamily || 'Arial, sans-serif';
        
        // Update font size
        const size = textarea.style.fontSize || '16px';
        fontSize.value = parseInt(size);
        
        // Update text color
        textColor.value = textarea.style.color || '#000000';
        
        // Update alignment
        const textAlign = textarea.style.textAlign || 'left';
        [alignLeft, alignCenter, alignRight].forEach(btn => btn.classList.remove('active'));
        document.getElementById(`align${textAlign.charAt(0).toUpperCase() + textAlign.slice(1)}`).classList.add('active');
        
        // Update style toggles
        toggleBold.classList.toggle('active', textarea.style.fontWeight === 'bold');
        toggleUppercase.classList.toggle('active', textarea.style.textTransform === 'uppercase');
        toggleVertical.classList.toggle('active', textarea.style.writingMode === 'vertical-rl');
        lockPosition.classList.toggle('active', block.classList.contains('locked'));
    }
    
    function updateSelectedText() {
        if (!selectedBlock) return;
        const textarea = selectedBlock.querySelector('textarea');
        if (textarea) {
            textarea.value = this.value;
            adjustTextBlockSize(selectedBlock);
        }
    }
    
    function updateTextStyle() {
        if (!selectedBlock) return;
        const textarea = selectedBlock.querySelector('textarea');
        if (!textarea) return;
        
        if (this === fontSelect) {
            textarea.style.fontFamily = this.value;
        } else if (this === fontSize) {
            textarea.style.fontSize = `${this.value}px`;
        } else if (this === textColor) {
            textarea.style.color = this.value;
        }
        
        adjustTextBlockSize(selectedBlock);
    }
    
    function setTextAlign(align) {
        if (!selectedBlock) return;
        const textarea = selectedBlock.querySelector('textarea');
        if (textarea) {
            textarea.style.textAlign = align;
            [alignLeft, alignCenter, alignRight].forEach(btn => btn.classList.remove('active'));
            document.getElementById(`align${align.charAt(0).toUpperCase() + align.slice(1)}`).classList.add('active');
        }
    }
    
    function toggleStyle(style) {
        return function() {
            if (!selectedBlock) return;
            const textarea = selectedBlock.querySelector('textarea');
            if (!textarea) return;
            
            switch (style) {
                case 'bold':
                    textarea.style.fontWeight = textarea.style.fontWeight === 'bold' ? 'normal' : 'bold';
                    this.classList.toggle('active');
                    break;
                case 'uppercase':
                    textarea.style.textTransform = textarea.style.textTransform === 'uppercase' ? 'none' : 'uppercase';
                    this.classList.toggle('active');
                    break;
                case 'vertical':
                    textarea.style.writingMode = textarea.style.writingMode === 'vertical-rl' ? 'horizontal-tb' : 'vertical-rl';
                    this.classList.toggle('active');
                    break;
            }
            
            adjustTextBlockSize(selectedBlock);
        };
    }
    
    function toggleLockPosition() {
        if (!selectedBlock) return;
        selectedBlock.classList.toggle('locked');
        this.classList.toggle('active');
        
        const isLocked = selectedBlock.classList.contains('locked');
        const textarea = selectedBlock.querySelector('textarea');
        if (textarea) {
            textarea.readOnly = isLocked;
            textarea.style.cursor = isLocked ? 'default' : 'text';
        }
    }
    
    function deleteSelectedBlock() {
        if (selectedBlock && confirm('Are you sure you want to delete this text block?')) {
            selectedBlock.remove();
            selectedBlock = null;
        }
    }
    
    function adjustTextBlockSize(block) {
        const textarea = block.querySelector('textarea');
        if (!textarea) return;
        
        // Reset height to auto to get the scroll height
        textarea.style.height = 'auto';
        textarea.style.width = 'auto';
        
        // Set the height to scrollHeight to fit content
        textarea.style.height = textarea.scrollHeight + 'px';
        textarea.style.width = textarea.scrollWidth + 'px';
        
        // Update block size to match textarea
        block.style.width = textarea.scrollWidth + 'px';
        block.style.height = textarea.scrollHeight + 'px';
    }
    
    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const bg = document.querySelector('.ticket-background');
            if (!bg) {
                const newBg = document.createElement('div');
                newBg.className = 'ticket-background';
                newBg.style.backgroundImage = `url(${event.target.result})`;
                newBg.style.opacity = imageOpacity.value / 100;
                ticketContent.insertBefore(newBg, ticketContent.firstChild);
            } else {
                bg.style.backgroundImage = `url(${event.target.result})`;
            }
        };
        reader.readAsDataURL(file);
    }
    
    function toggleDarkMode() {
        document.body.classList.toggle('night-mode');
        toggleModeBtn.textContent = document.body.classList.contains('night-mode') 
            ? '☀️ Light Mode' 
            : '🌙 Dark Mode';
    }
    
    function exportAsImage() {
        // This is a placeholder - actual implementation would use html2canvas or similar library
        alert('Export functionality would be implemented here');
    }
    
    // Clicking on ticket content (but not on a text block) deselects all blocks
    ticketContent.addEventListener('mousedown', function(e) {
        if (e.target === ticketContent) {
            document.querySelectorAll('.text-block').forEach(b => {
                b.classList.remove('selected');
            });
            selectedBlock = null;
        }
    });
});
