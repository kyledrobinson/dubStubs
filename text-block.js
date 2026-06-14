class TextBlock {
    constructor(text = 'Double-click to edit', x = 50, y = 50, options = {}) {
        this.element = document.createElement('div');
        this.element.className = 'text-block';
        this.element.style.position = 'absolute';
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        this.element.style.transform = 'translate(-50%, -50%)';
        this.element.style.zIndex = '10';
        this.element.style.backgroundColor = 'transparent';
        this.element.style.pointerEvents = 'auto';
        
        // Create textarea for editing
        this.textarea = document.createElement('textarea');
        this.textarea.className = 'text-block-content';
        this.textarea.value = text;
        this.textarea.rows = 1;
        this.textarea.style.width = 'auto';
        this.textarea.style.minWidth = '50px';
        this.textarea.style.fontSize = options.fontSize || '16px';
        this.textarea.style.fontWeight = options.fontWeight || 'normal';
        this.textarea.style.color = options.color || '#000000';
        this.textarea.style.backgroundColor = 'transparent';
        this.textarea.style.border = 'none';
        this.textarea.style.resize = 'none';
        this.textarea.style.overflow = 'hidden';
        this.textarea.style.padding = '2px 4px';
        this.textarea.style.margin = '0';
        this.textarea.style.lineHeight = options.lineHeight || '1.2';
        this.textarea.style.whiteSpace = options.whiteSpace || 'nowrap';
        this.textarea.style.fontFamily = options.fontFamily || 'Arial, sans-serif';
        this.textarea.style.textAlign = options.textAlign || 'left';
        this.textarea.style.outline = 'none';
        
        // Apply additional options
        if (options.writingMode) {
            this.textarea.style.writingMode = options.writingMode;
        }
        
        if (options.letterSpacing) {
            this.textarea.style.letterSpacing = options.letterSpacing;
        }
        
        // Set width if specified
        if (options.width && options.width !== 'auto') {
            this.textarea.style.width = typeof options.width === 'number' ? `${options.width}px` : options.width;
        }
        
        this.element.appendChild(this.textarea);
        
        // Initialize properties
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.startLeft = 0;
        this.startTop = 0;
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Auto-resize textarea
        this.autoResize();
    }
    
    setupEventListeners() {
        // Click to select
        this.element.addEventListener('mousedown', (e) => {
            if (e.target === this.textarea) {
                this.element.classList.add('selected');
                if (window.ticketControls) {
                    window.ticketControls.setSelectedBlock(this);
                }
                e.stopPropagation();
            }
        });
        
        // Double-click to edit
        this.textarea.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.textarea.select();
        });
        
        // Auto-resize when content changes
        this.textarea.addEventListener('input', () => this.autoResize());
        
        // Prevent text selection when dragging
        this.textarea.addEventListener('selectstart', (e) => {
            if (this.isDragging) {
                e.preventDefault();
            }
        });
    }
    
    autoResize() {
        // Reset height to auto to get the correct scrollHeight
        this.textarea.style.height = 'auto';
        
        // Set the height to scrollHeight with a minimum height
        const scrollHeight = this.textarea.scrollHeight;
        this.textarea.style.height = `${Math.max(scrollHeight, 20)}px`;
        
        // Update the element's height to match
        this.element.style.height = this.textarea.style.height;
    }
    
    updatePosition(x, y) {
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
    }
    
    updateStyle(style) {
        Object.assign(this.textarea.style, style);
        this.autoResize();
    }
}

// Make TextBlock available globally
window.TextBlock = TextBlock;
