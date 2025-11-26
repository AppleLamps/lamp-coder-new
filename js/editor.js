class Editor {
    constructor(textareaId) {
        this.textarea = document.getElementById(textareaId);
        this.cm = CodeMirror.fromTextArea(this.textarea, {
            lineNumbers: true,
            theme: 'default',
            mode: 'htmlmixed',
            indentUnit: 4,
            tabSize: 4,
            lineWrapping: true,
            autoCloseTags: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            extraKeys: {
                "Ctrl-Space": "autocomplete",
                "Ctrl-Z": "undo",
                "Ctrl-Y": "redo"
            }
        });

        this.currentMode = 'html';
        this.storageKey = 'ai-web-studio-buffers';

        // Load buffers from localStorage or use empty defaults
        this.buffers = this.loadFromStorage() || {
            html: '',
            three: '',
            python: ''
        };

        // Restore the HTML buffer content on initial load
        if (this.buffers.html) {
            this.cm.setValue(this.buffers.html);
        }

        // Save content on change with debounce
        this.saveTimeout = null;

        // Callback for code changes (used by UI for auto-run)
        this.onCodeChange = null;

        // Undo history for AI changes
        this.undoStack = [];
        this.maxUndoSize = 10;

        this.cm.on('change', () => {
            this.buffers[this.currentMode] = this.cm.getValue();
            this.debouncedSave();

            // Trigger generic event for UI to handle auto-run
            if (this.onCodeChange) this.onCodeChange();
        });
    }

    // Save current state before AI overwrites (for undo functionality)
    saveForUndo() {
        const currentContent = this.cm.getValue();
        if (currentContent.trim()) {
            this.undoStack.push({
                mode: this.currentMode,
                content: currentContent
            });
            // Keep only the last N entries
            if (this.undoStack.length > this.maxUndoSize) {
                this.undoStack.shift();
            }
        }
    }

    // Undo last AI change
    undoAIChange() {
        if (this.undoStack.length === 0) return false;

        const lastState = this.undoStack.pop();
        if (lastState.mode === this.currentMode) {
            this.cm.setValue(lastState.content);
            this.buffers[this.currentMode] = lastState.content;
            return true;
        } else {
            // If mode is different, restore and switch mode
            this.buffers[lastState.mode] = lastState.content;
            return { mode: lastState.mode };
        }
    }

    canUndo() {
        return this.undoStack.length > 0;
    }

    // Load buffers from localStorage
    loadFromStorage() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (err) {
            console.warn('Failed to load from localStorage:', err);
        }
        return null;
    }

    // Save buffers to localStorage
    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.buffers));
        } catch (err) {
            console.warn('Failed to save to localStorage:', err);
        }
    }

    // Debounced save to avoid excessive writes
    debouncedSave() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        this.saveTimeout = setTimeout(() => {
            this.saveToStorage();
        }, 500);
    }

    getValue() {
        return this.cm.getValue();
    }

    setValue(content) {
        this.cm.setValue(content);
        this.buffers[this.currentMode] = content;
    }

    setMode(mode) {
        // Save current buffer before switching
        this.buffers[this.currentMode] = this.cm.getValue();

        this.currentMode = mode;
        let cmMode = 'htmlmixed';

        if (mode === 'three') {
            cmMode = 'javascript';
        } else if (mode === 'python') {
            cmMode = 'python';
        }

        this.cm.setOption('mode', cmMode);

        // Restore buffer for new mode
        const newContent = this.buffers[mode] || '';
        this.cm.setValue(newContent);

        // Update title
        const titleEl = document.getElementById('editor-title');
        if (mode === 'html') titleEl.textContent = 'index.html';
        if (mode === 'three') titleEl.textContent = 'scene.js';
        if (mode === 'python') titleEl.textContent = 'script.py';
    }

    refresh() {
        this.cm.refresh();
    }
}
