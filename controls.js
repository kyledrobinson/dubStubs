class Controls {
    constructor() {
        this.selectedBlock = null;
        this.controls = {
            selectedText: document.getElementById('selectedText'),
            selectedFont: document.getElementById('selectedFont'),
            selectedFontSize: document.getElementById('selectedFontSize'),
            selectedColor: document.getElementById('selectedColor'),
            posX: document.getElementById('posX'),
            posY: document.getElementById('posY'),
            selectedRotation: document.getElementById('selectedRotation'),
            rotationValue: document.getElementById('rotationValue'),
            alignLeftBtn: document.getElementById('alignLeft'),
            alignCenterBtn: document.getElementById('alignCenter'),
            alignRightBtn: document.getElementById('alignRight'),
            toggleBoldBtn: document.getElementById('toggleBold'),
            toggleUppercaseBtn: document.getElementById('toggleUppercase'),
            toggleVerticalBtn: document.getElementById('toggleVertical'),
            lockPositionBtn: document.getElementById('lockPosition'),
            addTextBlockBtn: document.getElementById('addTextBlock'),
            deleteTextBlockBtn: document.getElementById('deleteTextBlock')
        };
        
        this.setupEventListeners();
        this.populateFonts();
    }
    
    setSelectedBlock(block) {
        this.selectedBlock = block;
        this.updateControls();
    }
    
    updateControls() {
        if (!this.selectedBlock) {
            this.disableControls();
            return;
        }
        
        this.enableControls();
        
        // Update text
        this.controls.selectedText.value = this.selectedBlock.textarea.value;
        
        // Update font
        const fontFamily = this.selectedBlock.getComputedStyle('fontFamily');
        this.controls.selectedFont.value = fontFamily.replace(/"/g, '');
        
        // Update font size
        const fontSize = this.selectedBlock.getComputedStyle('fontSize');
        this.controls.selectedFontSize.value = parseInt(fontSize) || 16;
        
        // Update color
        const color = this.selectedBlock.getComputedStyle('color');
        this.controls.selectedColor.value = this.rgbToHex(color) || '#000000';
        
        // Update position
        const pos = this.selectedBlock.getPosition();
        this.controls.posX.value = pos.x;
        this.controls.posY.value = pos.y;
        
        // Update rotation
        const transform = this.selectedBlock.getComputedStyle('transform');
        let rotation = 0;
        if (transform && transform !== 'none') {
            const values = transform.split('(')[1].split(')')[0].split(',');
            const a = values[0];
            const b = values[1];
            rotation = Math.round(Math.atan2(b, a) * (180/Math.PI));
        }
        this.controls.selectedRotation.value = rotation;
        this.controls.rotationValue.textContent = `${rotation}°`;
        
        // Update alignment buttons
        const textAlign = this.selectedBlock.getComputedStyle('textAlign') || 'left';
        this.updateAlignmentButtons(textAlign);
        
        // Update style buttons
        this.controls.toggleBoldBtn.classList.toggle(
            'active', 
            this.selectedBlock.getComputedStyle('fontWeight') === 'bold'
        );
        
        this.controls.toggleUppercaseBtn.classList.toggle(
            'active',
            this.selectedBlock.getComputedStyle('textTransform') === 'uppercase'
        );
        
        this.controls.toggleVerticalBtn.classList.toggle(
            'active',
            this.selectedBlock.getComputedStyle('writingMode') === 'vertical-rl'
        );
        
        this.controls.lockPositionBtn.classList.toggle(
            'active',
            this.selectedBlock.element.classList.contains('locked')
        );
    }
    
    updatePositionInputs(x, y) {
        this.controls.posX.value = x;
        this.controls.posY.value = y;
    }
    
    setupEventListeners() {
        // Text input
        this.controls.selectedText.addEventListener('input', () => {
            if (this.selectedBlock) {
                this.selectedBlock.textarea.value = this.controls.selectedText.value;
                this.selectedBlock.adjustHeight();
            }
        });
        
        // Font controls
        this.controls.selectedFont.addEventListener('change', () => {
            if (this.selectedBlock) {
                this.selectedBlock.updateStyle('fontFamily', this.controls.selectedFont.value);
            }
        });
        
        this.controls.selectedFontSize.addEventListener('input', () => {
            if (this.selectedBlock) {
                this.selectedBlock.updateStyle('fontSize', `${this.controls.selectedFontSize.value}px`);
            }
        });
        
        this.controls.selectedColor.addEventListener('input', () => {
            if (this.selectedBlock) {
                this.selectedBlock.updateStyle('color', this.controls.selectedColor.value);
            }
        });
        
        // Position controls
        this.controls.posX.addEventListener('input', () => {
            if (this.selectedBlock) {
                const y = parseInt(this.controls.posY.value) || 0;
                this.selectedBlock.updateStyle('position', {
                    x: parseInt(this.controls.posX.value) || 0,
                    y: y
                });
            }
        });
        
        this.controls.posY.addEventListener('input', () => {
            if (this.selectedBlock) {
                const x = parseInt(this.controls.posX.value) || 0;
                this.selectedBlock.updateStyle('position', {
                    x: x,
                    y: parseInt(this.controls.posY.value) || 0
                });
            }
        });
        
        // Rotation control
        this.controls.selectedRotation.addEventListener('input', () => {
            if (this.selectedBlock) {
                const rotation = this.controls.selectedRotation.value;
                this.selectedBlock.updateStyle('transform', `rotate(${rotation}deg)`);
                this.controls.rotationValue.textContent = `${rotation}°`;
            }
        });
        
        // Alignment buttons
        this.controls.alignLeftBtn.addEventListener('click', () => {
            this.setAlignment('left');
        });
        
        this.controls.alignCenterBtn.addEventListener('click', () => {
            this.setAlignment('center');
        });
        
        this.controls.alignRightBtn.addEventListener('click', () => {
            this.setAlignment('right');
        });
        
        // Style buttons
        this.controls.toggleBoldBtn.addEventListener('click', () => {
            if (this.selectedBlock) {
                const isBold = this.controls.toggleBoldBtn.classList.contains('active');
                this.selectedBlock.updateStyle('fontWeight', isBold ? 'normal' : 'bold');
                this.controls.toggleBoldBtn.classList.toggle('active');
            }
        });
        
        this.controls.toggleUppercaseBtn.addEventListener('click', () => {
            if (this.selectedBlock) {
                const isUppercase = this.controls.toggleUppercaseBtn.classList.contains('active');
                this.selectedBlock.updateStyle('textTransform', isUppercase ? 'none' : 'uppercase');
                this.controls.toggleUppercaseBtn.classList.toggle('active');
            }
        });
        
        this.controls.toggleVerticalBtn.addEventListener('click', () => {
            if (this.selectedBlock) {
                const isVertical = this.controls.toggleVerticalBtn.classList.contains('active');
                this.selectedBlock.updateStyle('writingMode', isVertical ? 'horizontal-tb' : 'vertical-rl');
                this.controls.toggleVerticalBtn.classList.toggle('active');
                this.selectedBlock.adjustHeight();
            }
        });
        
        this.controls.lockPositionBtn.addEventListener('click', () => {
            if (this.selectedBlock) {
                const isLocked = this.controls.lockPositionBtn.classList.contains('active');
                this.selectedBlock.updateStyle('lock', !isLocked);
                this.controls.lockPositionBtn.classList.toggle('active');
                this.controls.lockPositionBtn.textContent = isLocked ? '🔒' : '🔓';
            }
        });
        
        // Add/delete buttons
        this.controls.addTextBlockBtn.addEventListener('click', () => {
            const container = document.getElementById('ticketContent');
            const block = new TextBlock('New Text', 50, 50);
            container.appendChild(block.element);
            this.setSelectedBlock(block);
        });
        
        this.controls.deleteTextBlockBtn.addEventListener('click', () => {
            if (this.selectedBlock && confirm('Are you sure you want to delete this text block?')) {
                this.selectedBlock.element.remove();
                this.selectedBlock = null;
                this.disableControls();
            }
        });
    }
    
    setAlignment(alignment) {
        if (this.selectedBlock) {
            this.selectedBlock.updateStyle('textAlign', alignment);
            this.updateAlignmentButtons(alignment);
        }
    }
    
    updateAlignmentButtons(alignment) {
        this.controls.alignLeftBtn.classList.toggle('active', alignment === 'left');
        this.controls.alignCenterBtn.classList.toggle('active', alignment === 'center');
        this.controls.alignRightBtn.classList.toggle('active', alignment === 'right');
    }
    
    populateFonts() {
        const fonts = [
            'Arial', 'Verdana', 'Helvetica', 'Times New Roman',
            'Courier New', 'Georgia', 'Palatino', 'Garamond',
            'Impact', 'Comic Sans MS', 'Tahoma', 'Trebuchet MS'
        ];
        
        fonts.forEach(font => {
            const option = document.createElement('option');
            option.value = font;
            option.textContent = font;
            this.controls.selectedFont.appendChild(option);
        });
    }
    
    enableControls() {
        Object.values(this.controls).forEach(control => {
            if (control && control.disabled !== undefined) {
                control.disabled = false;
            }
        });
    }
    
    disableControls() {
        Object.values(this.controls).forEach(control => {
            if (control && control.disabled !== undefined && 
                control !== this.controls.addTextBlockBtn) {
                control.disabled = true;
            }
        });
    }
    
    rgbToHex(rgb) {
        if (!rgb) return '#000000';
        
        // If already in hex format, return as is
        if (rgb.startsWith('#')) return rgb;
        
        // Convert rgb/rgba to hex
        const rgbValues = rgb.match(/\d+/g);
        if (!rgbValues || rgbValues.length < 3) return '#000000';
        
        const r = parseInt(rgbValues[0]).toString(16).padStart(2, '0');
        const g = parseInt(rgbValues[1]).toString(16).padStart(2, '0');
        const b = parseInt(rgbValues[2]).toString(16).padStart(2, '0');
        
        return `#${r}${g}${b}`.toUpperCase();
    }
}

// Make Controls available globally
window.Controls = Controls;
