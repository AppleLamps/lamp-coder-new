class Editor {
    constructor(textareaId) {
        this.textarea = document.getElementById(textareaId);
        this.editorContainer = this.textarea.parentElement;

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
            scrollbarStyle: 'native',
            viewportMargin: Infinity,
            // Code folding
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
            extraKeys: {
                "Ctrl-Space": "autocomplete",
                "Ctrl-Z": "undo",
                "Ctrl-Y": "redo"
            }
        });

        // Setup autocomplete triggers
        this.setupAutocomplete();

        this.currentMode = 'html';
        this.storageKey = 'ai-web-studio-buffers';

        // Diff view state
        this.mergeView = null;
        this.isDiffMode = false;

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

    // Setup autocomplete triggers for different modes
    setupAutocomplete() {
        this.cm.on('inputRead', (cm, change) => {
            if (change.origin !== '+input') return;

            const cursor = cm.getCursor();
            const token = cm.getTokenAt(cursor);
            const mode = cm.getMode().name;
            const char = change.text[0];

            // Auto-trigger conditions
            let shouldTrigger = false;

            if (mode === 'xml' || mode === 'htmlmixed') {
                // Trigger on < for HTML tags
                if (char === '<') shouldTrigger = true;
                // Trigger on space inside a tag for attributes
                if (char === ' ' && token.state && token.state.htmlState &&
                    token.state.htmlState.tagName) shouldTrigger = true;
            }

            if (mode === 'javascript' || (mode === 'htmlmixed' && token.state && token.state.localMode && token.state.localMode.name === 'javascript')) {
                // Trigger on . for property access
                if (char === '.') shouldTrigger = true;
            }

            if (mode === 'css' || (mode === 'htmlmixed' && token.state && token.state.localMode && token.state.localMode.name === 'css')) {
                // Trigger on : for CSS values
                if (char === ':') shouldTrigger = true;
            }

            if (shouldTrigger) {
                setTimeout(() => {
                    if (!cm.state.completionActive) {
                        cm.showHint({ completeSingle: false });
                    }
                }, 100);
            }
        });
    }

    // Format code using Prettier
    async formatCode() {
        const code = this.cm.getValue();
        if (!code.trim()) return;

        // Check if prettier is available
        if (typeof prettier === 'undefined') {
            console.error('Prettier is not loaded');
            return;
        }

        try {
            let parser;
            let plugins = [];

            // Determine parser based on current mode
            switch (this.currentMode) {
                case 'html':
                    parser = 'html';
                    plugins = [prettierPlugins.html];
                    break;
                case 'three':
                    parser = 'babel';
                    plugins = [prettierPlugins.babel, prettierPlugins.estree];
                    break;
                case 'python':
                    // Prettier doesn't support Python
                    console.warn('Prettier does not support Python formatting');
                    return;
                default:
                    parser = 'html';
                    plugins = [prettierPlugins.html];
            }

            const formatted = await prettier.format(code, {
                parser: parser,
                plugins: plugins,
                tabWidth: 4,
                useTabs: false,
                printWidth: 100,
                singleQuote: true
            });

            this.cm.setValue(formatted);
            return true;
        } catch (error) {
            console.error('Formatting error:', error);
            throw error;
        }
    }

    // Show diff view comparing original code with new code
    showDiff(originalCode, newCode) {
        // Hide the standard editor
        this.cm.getWrapperElement().style.display = 'none';
        this.isDiffMode = true;

        // Create container for merge view if it doesn't exist
        let mergeContainer = document.getElementById('merge-view-container');
        if (!mergeContainer) {
            mergeContainer = document.createElement('div');
            mergeContainer.id = 'merge-view-container';
            mergeContainer.style.height = '100%';
            mergeContainer.style.width = '100%';
            this.editorContainer.appendChild(mergeContainer);
        }
        mergeContainer.innerHTML = '';
        mergeContainer.style.display = 'block';

        // Determine CodeMirror mode based on current mode
        let cmMode = 'htmlmixed';
        if (this.currentMode === 'three') cmMode = 'javascript';
        else if (this.currentMode === 'python') cmMode = 'python';

        // Create merge view
        this.mergeView = CodeMirror.MergeView(mergeContainer, {
            value: newCode,
            orig: originalCode,
            lineNumbers: true,
            mode: cmMode,
            highlightDifferences: true,
            connect: 'align',
            collapseIdentical: false,
            theme: 'default',
            readOnly: false,
            revertButtons: true
        });

        // Store the new code for accept action
        this.pendingNewCode = newCode;
        this.pendingOriginalCode = originalCode;

        return this.mergeView;
    }

    // Hide diff view and restore standard editor
    hideDiff(applyChanges = false) {
        if (!this.isDiffMode) return;

        // Get the final code from merge view if applying changes
        let finalCode;
        if (applyChanges && this.mergeView) {
            finalCode = this.mergeView.editor().getValue();
        } else {
            finalCode = this.pendingOriginalCode;
        }

        // Remove merge view container
        const mergeContainer = document.getElementById('merge-view-container');
        if (mergeContainer) {
            mergeContainer.innerHTML = '';
            mergeContainer.style.display = 'none';
        }

        // Show the standard editor
        this.cm.getWrapperElement().style.display = '';
        this.isDiffMode = false;
        this.mergeView = null;

        // Set the final code
        if (finalCode !== undefined) {
            this.cm.setValue(finalCode);
            this.buffers[this.currentMode] = finalCode;
        }

        this.cm.refresh();

        return finalCode;
    }

    // Check if currently in diff mode
    isInDiffMode() {
        return this.isDiffMode;
    }
}
