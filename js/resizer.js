class PanelResizer {
    constructor() {
        this.chatPanel = document.getElementById('chat-panel');
        this.editorPanel = document.getElementById('editor-panel');
        this.previewPanel = document.getElementById('preview-panel');
        this.resizerLeft = document.getElementById('resizer-left');
        this.resizerRight = document.getElementById('resizer-right');

        this.isResizing = false;
        this.currentResizer = null;
        this.startX = 0;
        this.startWidths = {};

        this.init();
    }

    init() {
        // Left resizer (between chat and editor)
        this.resizerLeft.addEventListener('mousedown', (e) => this.startResize(e, 'left'));

        // Right resizer (between editor and preview)
        this.resizerRight.addEventListener('mousedown', (e) => this.startResize(e, 'right'));

        // Global mouse events
        document.addEventListener('mousemove', (e) => this.resize(e));
        document.addEventListener('mouseup', () => this.stopResize());

        // Touch support
        this.resizerLeft.addEventListener('touchstart', (e) => this.startResize(e, 'left'), { passive: false });
        this.resizerRight.addEventListener('touchstart', (e) => this.startResize(e, 'right'), { passive: false });
        document.addEventListener('touchmove', (e) => this.resize(e), { passive: false });
        document.addEventListener('touchend', () => this.stopResize());

        // Load saved sizes from localStorage
        this.loadSavedSizes();
    }

    startResize(e, side) {
        e.preventDefault();
        this.isResizing = true;
        this.currentResizer = side;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        this.startX = clientX;

        // Store starting widths
        this.startWidths = {
            chat: this.chatPanel.offsetWidth,
            editor: this.editorPanel.offsetWidth,
            preview: this.previewPanel.offsetWidth
        };

        // Add visual feedback
        document.body.classList.add('resizing');
        if (side === 'left') {
            this.resizerLeft.classList.add('active');
        } else {
            this.resizerRight.classList.add('active');
        }
    }

    resize(e) {
        if (!this.isResizing) return;
        e.preventDefault();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const deltaX = clientX - this.startX;

        if (this.currentResizer === 'left') {
            // Resizing chat panel (min 200px, no max limit)
            const newChatWidth = Math.max(200, this.startWidths.chat + deltaX);
            this.chatPanel.style.width = `${newChatWidth}px`;
        } else if (this.currentResizer === 'right') {
            // Resizing between editor and preview
            const newEditorWidth = this.startWidths.editor + deltaX;
            const newPreviewWidth = this.startWidths.preview - deltaX;

            // Ensure minimum widths
            if (newEditorWidth >= 250 && newPreviewWidth >= 250) {
                this.editorPanel.style.width = `${newEditorWidth}px`;
                this.editorPanel.style.flex = 'none';
                this.previewPanel.style.width = `${newPreviewWidth}px`;
                this.previewPanel.style.flex = 'none';
            }
        }

        // Trigger CodeMirror refresh if available
        if (window.editor && window.editor.cm) {
            window.editor.cm.refresh();
        }
    }

    stopResize() {
        if (!this.isResizing) return;

        this.isResizing = false;
        this.currentResizer = null;
        document.body.classList.remove('resizing');
        this.resizerLeft.classList.remove('active');
        this.resizerRight.classList.remove('active');

        // Save sizes to localStorage
        this.saveSizes();

        // Final CodeMirror refresh
        if (window.editor && window.editor.cm) {
            window.editor.cm.refresh();
        }
    }

    saveSizes() {
        const sizes = {
            chat: this.chatPanel.offsetWidth,
            editor: this.editorPanel.offsetWidth,
            preview: this.previewPanel.offsetWidth
        };
        localStorage.setItem('panelSizes', JSON.stringify(sizes));
    }

    loadSavedSizes() {
        try {
            const saved = localStorage.getItem('panelSizes');
            if (saved) {
                const sizes = JSON.parse(saved);
                if (sizes.chat) {
                    this.chatPanel.style.width = `${sizes.chat}px`;
                }
                if (sizes.editor && sizes.preview) {
                    this.editorPanel.style.width = `${sizes.editor}px`;
                    this.editorPanel.style.flex = 'none';
                    this.previewPanel.style.width = `${sizes.preview}px`;
                    this.previewPanel.style.flex = 'none';
                }
            }
        } catch (e) {
            console.warn('Failed to load saved panel sizes:', e);
        }
    }

    // Reset to default sizes
    resetSizes() {
        this.chatPanel.style.width = '320px';
        this.editorPanel.style.width = '';
        this.editorPanel.style.flex = '1';
        this.previewPanel.style.width = '';
        this.previewPanel.style.flex = '1';
        localStorage.removeItem('panelSizes');

        if (window.editor && window.editor.cm) {
            window.editor.cm.refresh();
        }
    }
}

