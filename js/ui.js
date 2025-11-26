class UI {
    constructor(ai, editor, sandbox) {
        this.ai = ai;
        this.editor = editor;
        this.sandbox = sandbox;
        this.currentMode = 'html';

        // Library CDN definitions
        this.libraries = {
            bootstrap: {
                name: 'Bootstrap 5',
                code: '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">\n<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>'
            },
            tailwind: {
                name: 'Tailwind CSS',
                code: '<script src="https://cdn.tailwindcss.com"></script>'
            },
            jquery: {
                name: 'jQuery',
                code: '<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>'
            },
            vue: {
                name: 'Vue.js 3',
                code: '<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>'
            },
            react: {
                name: 'React + ReactDOM',
                code: '<script src="https://unpkg.com/react@18/umd/react.development.js"></script>\n<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>'
            },
            p5: {
                name: 'p5.js',
                code: '<script src="https://cdn.jsdelivr.net/npm/p5@1.9.0/lib/p5.min.js"></script>'
            },
            anime: {
                name: 'Anime.js',
                code: '<script src="https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.min.js"></script>'
            },
            gsap: {
                name: 'GSAP',
                code: '<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.4/dist/gsap.min.js"></script>'
            },
            chartjs: {
                name: 'Chart.js',
                code: '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>'
            },
            aframe: {
                name: 'A-Frame',
                code: '<script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script>'
            }
        };

        // Auto-run settings
        this.autoRunEnabled = false;
        this.autoRunTimeout = null;

        // Suggestion chips for empty chat
        this.suggestionChips = [
            { label: 'Login Page', prompt: 'Create a beautiful login page with form validation', mode: 'html' },
            { label: 'Snake Game', prompt: 'Create a playable snake game', mode: 'html' },
            { label: 'Data Chart', prompt: 'Create a bar chart showing monthly sales data', mode: 'html' },
            { label: '3D Cube', prompt: 'Create a rotating 3D cube', mode: 'three' },
            { label: 'Particle System', prompt: 'Create a colorful particle system', mode: 'three' },
            { label: 'Data Plot', prompt: 'Create a sine wave plot with matplotlib', mode: 'python' }
        ];

        // Image attachment state
        this.pendingImageDataUrl = null;

        this.initEventListeners();
        this.renderTemplates();
        this.renderWelcomeScreen();
        this.renderModelList();
        this.updateModelDisplay();

        // Check for API key
        if (!this.ai.getApiKey()) {
            document.getElementById('settings-modal').classList.remove('hidden');
        }
    }

    initEventListeners() {
        // Chat
        document.getElementById('send-btn').addEventListener('click', () => this.handleChatSubmit());
        document.getElementById('chat-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleChatSubmit();
            }
        });

        // Voice Input
        this.initVoiceRecognition();
        document.getElementById('voice-btn').addEventListener('click', () => this.toggleVoiceRecognition());

        // Model Selector
        document.getElementById('model-selector-btn').addEventListener('click', () => {
            document.getElementById('model-modal').classList.remove('hidden');
        });
        document.getElementById('close-model-btn').addEventListener('click', () => {
            document.getElementById('model-modal').classList.add('hidden');
        });
        document.getElementById('model-modal').addEventListener('click', (e) => {
            if (e.target.id === 'model-modal') {
                document.getElementById('model-modal').classList.add('hidden');
            }
        });

        // Image Upload
        document.getElementById('image-upload').addEventListener('change', (e) => this.handleImageUpload(e));
        document.getElementById('remove-image-btn').addEventListener('click', () => this.removeImage());

        // Mode Switching
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setMode(e.target.dataset.mode);
            });
        });

        // Editor
        document.getElementById('run-btn').addEventListener('click', () => {
            this.sandbox.updatePreview(this.editor.getValue(), this.currentMode);
        });
        document.getElementById('copy-btn').addEventListener('click', () => {
            const btn = document.getElementById('copy-btn');
            navigator.clipboard.writeText(this.editor.getValue()).then(() => {
                const originalHTML = btn.innerHTML;
                btn.innerHTML = '<i class="fa-solid fa-check"></i>';
                btn.classList.add('text-green-400');
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    btn.classList.remove('text-green-400');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy:', err);
                alert('Failed to copy code to clipboard');
            });
        });

        // Download
        document.getElementById('download-btn').addEventListener('click', () => {
            this.downloadCode();
        });

        // Clear All
        document.getElementById('clear-all-btn').addEventListener('click', () => {
            this.clearAll();
        });

        // Auto-run toggle
        document.getElementById('autorun-toggle').addEventListener('change', (e) => {
            this.autoRunEnabled = e.target.checked;
            if (this.autoRunEnabled) {
                this.showNotification('Auto-run enabled', 'info');
            }
        });

        // Link editor change to preview update (for auto-run)
        this.editor.onCodeChange = () => {
            if (this.autoRunEnabled && (this.currentMode === 'html' || this.currentMode === 'three')) {
                if (this.autoRunTimeout) clearTimeout(this.autoRunTimeout);
                this.autoRunTimeout = setTimeout(() => {
                    this.sandbox.updatePreview(this.editor.getValue(), this.currentMode);
                }, 1000); // 1 second delay
            }
        };

        // Undo AI Change
        document.getElementById('undo-ai-btn').addEventListener('click', () => {
            this.undoAIChange();
        });

        // Settings
        document.getElementById('settings-btn').addEventListener('click', () => {
            document.getElementById('settings-modal').classList.remove('hidden');
            document.getElementById('api-key-input').value = this.ai.getApiKey();
        });
        document.getElementById('close-settings-btn').addEventListener('click', () => {
            document.getElementById('settings-modal').classList.add('hidden');
        });
        document.getElementById('save-settings-btn').addEventListener('click', () => {
            const key = document.getElementById('api-key-input').value.trim();
            if (key) {
                this.ai.setApiKey(key);
                document.getElementById('settings-modal').classList.add('hidden');
            }
        });

        // Templates
        document.getElementById('templates-btn').addEventListener('click', () => {
            document.getElementById('templates-modal').classList.remove('hidden');
        });
        document.getElementById('close-templates-btn').addEventListener('click', () => {
            document.getElementById('templates-modal').classList.add('hidden');
        });

        // Packages
        document.getElementById('packages-btn').addEventListener('click', () => {
            document.getElementById('packages-modal').classList.remove('hidden');
            this.updatePackagesList();
        });
        document.getElementById('close-packages-btn').addEventListener('click', () => {
            document.getElementById('packages-modal').classList.add('hidden');
        });
        document.getElementById('install-package-btn').addEventListener('click', () => {
            this.installPackage();
        });
        document.getElementById('package-name-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.installPackage();
            }
        });

        // Library Picker
        const libraryBtn = document.getElementById('library-picker-btn');
        const libraryDropdown = document.getElementById('library-picker-dropdown');

        libraryBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            libraryDropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#library-picker-container')) {
                libraryDropdown.classList.add('hidden');
            }
        });

        // Handle library item clicks
        document.querySelectorAll('.library-item').forEach(item => {
            item.addEventListener('click', () => {
                const libKey = item.dataset.library;
                this.insertLibrary(libKey);
                libraryDropdown.classList.add('hidden');
            });
        });

        // Preview Controls
        document.getElementById('refresh-preview-btn').addEventListener('click', () => {
            this.sandbox.updatePreview(this.editor.getValue(), this.currentMode);
        });
        document.getElementById('fullscreen-btn').addEventListener('click', () => {
            const elem = document.querySelector('section:last-child'); // Right panel
            if (!document.fullscreenElement) {
                if (elem.requestFullscreen) {
                    elem.requestFullscreen().catch(err => {
                        console.error('Fullscreen error:', err);
                        this.showNotification('Fullscreen not available or permission denied', 'error');
                    });
                } else {
                    this.showNotification('Fullscreen API not supported in this browser', 'error');
                }
            } else {
                document.exitFullscreen().catch(err => {
                    console.error('Exit fullscreen error:', err);
                });
            }
        });

        // Device Size Buttons (Responsive Preview)
        document.querySelectorAll('.device-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const width = e.currentTarget.dataset.width;
                const iframe = document.getElementById('preview-frame');
                const container = iframe.parentElement;

                // Update active state
                document.querySelectorAll('.device-btn').forEach(b => {
                    b.classList.remove('active', 'text-gray-700', 'bg-gray-100');
                    b.classList.add('text-gray-400');
                });
                e.currentTarget.classList.add('active', 'text-gray-700', 'bg-gray-100');
                e.currentTarget.classList.remove('text-gray-400');

                // Animate width change
                iframe.style.transition = 'width 0.3s ease, margin 0.3s ease';
                iframe.style.width = width;

                // Center the mobile/tablet view with device frame styling
                if (width !== '100%') {
                    iframe.style.margin = '16px auto';
                    iframe.style.border = '1px solid #e5e7eb';
                    iframe.style.borderRadius = '8px';
                    iframe.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)';
                    iframe.style.height = 'calc(100% - 32px)';
                } else {
                    iframe.style.margin = '0';
                    iframe.style.border = 'none';
                    iframe.style.borderRadius = '0';
                    iframe.style.boxShadow = 'none';
                    iframe.style.height = '100%';
                }
            });
        });

        // Pop-out Preview Button
        document.getElementById('popout-btn').addEventListener('click', () => {
            this.popoutPreview();
        });

        // Python Output Controls
        document.getElementById('clear-python-btn').addEventListener('click', () => {
            this.sandbox.clearPythonOutput();
        });
        document.getElementById('download-plot-btn').addEventListener('click', () => {
            this.sandbox.downloadLastPlot();
        });
    }

    setMode(mode) {
        this.currentMode = mode;

        // Update UI buttons - Light theme colors with black accents
        document.querySelectorAll('.mode-btn').forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active', 'bg-gray-900', 'text-white');
                btn.classList.remove('bg-gray-100', 'text-gray-600', 'border', 'border-gray-200');
            } else {
                btn.classList.remove('active', 'bg-gray-900', 'text-white');
                btn.classList.add('bg-gray-100', 'text-gray-600', 'border', 'border-gray-200');
            }
        });

        this.editor.setMode(mode);

        // Clear editor or set default/previous content? 
        // For now, let's just clear or keep it. 
        // Ideally we might want to store state per mode, but for simplicity we won't right now.
        // Actually, let's load a default template for that mode if empty
        if (!this.editor.getValue()) {
            const defaultTemplate = TEMPLATES[mode][0];
            if (defaultTemplate) {
                this.editor.setValue(defaultTemplate.code);
                this.sandbox.updatePreview(defaultTemplate.code, mode);
            }
        }
    }

    async handleChatSubmit() {
        const input = document.getElementById('chat-input');
        const prompt = input.value.trim();
        if (!prompt) return;

        // Remove welcome chips if present
        const welcomeChips = document.getElementById('welcome-chips');
        if (welcomeChips) welcomeChips.remove();

        input.value = '';

        // Check if there's an attached image
        const hasImage = this.ai.hasImage();
        this.appendMessage('user', prompt + (hasImage ? ' <span class="text-xs text-gray-400 ml-1"><i class="fa-solid fa-image"></i> image attached</span>' : ''));

        // Clear image preview after sending
        if (hasImage) {
            document.getElementById('image-preview-container').classList.add('hidden');
            document.getElementById('image-upload').value = '';
            this.pendingImageDataUrl = null;
        }

        this.setLoading(true, 'Thinking...');

        try {
            // Save current state for undo before AI overwrites
            this.editor.saveForUndo();

            let isFirstChunk = true;
            let lastPreviewUpdate = 0;
            const previewThrottle = 500; // Update preview every 500ms during streaming

            // Streaming callback - updates editor live as code comes in
            const onChunk = (chunk, fullContent) => {
                if (isFirstChunk) {
                    this.setLoading(true, 'Generating code...');
                    isFirstChunk = false;
                }

                // Try to extract code from partial JSON for live preview
                const partialCode = this.extractPartialCode(fullContent);
                if (partialCode) {
                    this.editor.setValue(partialCode);

                    // Throttle preview updates during streaming
                    const now = Date.now();
                    if (now - lastPreviewUpdate > previewThrottle) {
                        this.sandbox.updatePreview(partialCode, this.currentMode);
                        lastPreviewUpdate = now;
                    }
                }
            };

            const code = await this.ai.generateCode(prompt, this.currentMode, onChunk);
            this.appendMessage('assistant', "I've generated the code for you. Check the editor!");

            this.editor.setValue(code);
            this.sandbox.updatePreview(code, this.currentMode);

            // Update undo button state
            this.updateUndoButton();
        } catch (error) {
            this.appendMessage('assistant', `Error: ${error.message}`);
        } finally {
            this.setLoading(false);
        }
    }

    // Extract code from partial/streaming JSON response
    extractPartialCode(content) {
        // Try to find code in the partial JSON
        // The format is: {"thinking":"...","code":"...","changes_made":...}

        // Look for "code":" and extract everything after it
        const codeMatch = content.match(/"code"\s*:\s*"/);
        if (!codeMatch) return null;

        const codeStart = codeMatch.index + codeMatch[0].length;
        let code = content.slice(codeStart);

        // Find where the code string ends (look for unescaped quote followed by comma or closing brace)
        // This is tricky because the code itself might contain quotes
        let depth = 0;
        let inString = true;
        let endIndex = -1;

        for (let i = 0; i < code.length; i++) {
            const char = code[i];
            const prevChar = i > 0 ? code[i - 1] : '';

            if (char === '\\') {
                i++; // Skip escaped character
                continue;
            }

            if (char === '"' && prevChar !== '\\') {
                if (inString) {
                    // Check if this might be the end of the code string
                    const remaining = code.slice(i + 1).trim();
                    if (remaining.startsWith(',') || remaining.startsWith('}')) {
                        endIndex = i;
                        break;
                    }
                }
            }
        }

        if (endIndex > 0) {
            code = code.slice(0, endIndex);
        }

        // Unescape the JSON string
        try {
            code = JSON.parse('"' + code + '"');
        } catch (e) {
            // If parsing fails, try basic unescaping
            code = code
                .replace(/\\n/g, '\n')
                .replace(/\\t/g, '\t')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');
        }

        return code || null;
    }

    appendMessage(role, content) {
        const history = document.getElementById('chat-history');
        const div = document.createElement('div');
        div.className = 'flex gap-3 message-enter';

        const icon = role === 'user' ? 'fa-user' : 'fa-robot';
        const bg = role === 'user' ? 'bg-gray-600' : 'bg-gray-800';

        div.innerHTML = `
            <div class="w-8 h-8 rounded-full ${bg} flex items-center justify-center shrink-0 shadow-sm">
                <i class="fa-solid ${icon} text-xs text-white"></i>
            </div>
            <div class="bg-white border border-gray-200 rounded-lg ${role === 'user' ? 'rounded-tr-none' : 'rounded-tl-none'} p-3 text-sm text-gray-700 prose max-w-none shadow-sm">
                ${content}
            </div>
        `;

        history.appendChild(div);
        history.scrollTop = history.scrollHeight;
    }

    setLoading(loading, statusMessage = null) {
        const btn = document.getElementById('send-btn');
        const statusEl = document.getElementById('streaming-status');

        if (loading) {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            btn.disabled = true;

            // Show status message if provided
            if (statusEl) {
                if (statusMessage) {
                    statusEl.querySelector('span').textContent = statusMessage;
                    statusEl.classList.remove('hidden');
                }
            }
        } else {
            btn.innerHTML = '<i class="fa-solid fa-paper-plane text-xs"></i>';
            btn.disabled = false;

            // Hide status message
            if (statusEl) {
                statusEl.classList.add('hidden');
            }
        }
    }

    showNotification(message, type = 'info') {
        const colors = {
            'error': 'bg-red-500',
            'success': 'bg-green-600',
            'info': 'bg-gray-800'
        };

        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-4 py-3 rounded shadow-lg z-50 transition-opacity`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    downloadCode() {
        const code = this.editor.getValue();
        if (!code.trim()) {
            this.showNotification('Nothing to download', 'error');
            return;
        }

        const fileInfo = {
            html: { ext: 'html', mime: 'text/html', name: 'index' },
            three: { ext: 'js', mime: 'text/javascript', name: 'scene' },
            python: { ext: 'py', mime: 'text/x-python', name: 'script' }
        };

        const info = fileInfo[this.currentMode];
        const blob = new Blob([code], { type: info.mime });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${info.name}.${info.ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification(`Downloaded ${info.name}.${info.ext}`, 'success');
    }

    async installPackage() {
        const input = document.getElementById('package-name-input');
        const btn = document.getElementById('install-package-btn');
        const status = document.getElementById('package-install-status');
        const packageName = input.value.trim();

        if (!packageName) {
            this.showNotification('Please enter a package name', 'error');
            return;
        }

        // Show loading state
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Installing...';
        btn.disabled = true;
        status.classList.remove('hidden');
        status.className = 'text-sm text-gray-600';
        status.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Installing ${packageName}...`;

        const result = await this.sandbox.installPackage(packageName);

        // Update status
        if (result.success) {
            status.className = 'text-sm text-green-400';
            status.innerHTML = `<i class="fa-solid fa-check"></i> ${result.message}`;
            input.value = '';
            this.updatePackagesList();
        } else {
            status.className = 'text-sm text-red-400';
            status.innerHTML = `<i class="fa-solid fa-xmark"></i> ${result.message}`;
        }

        // Restore button
        btn.innerHTML = originalHTML;
        btn.disabled = false;

        // Hide status after a few seconds
        setTimeout(() => {
            status.classList.add('hidden');
        }, 5000);
    }

    updatePackagesList() {
        const container = document.getElementById('installed-packages');
        const packages = this.sandbox.getInstalledPackages();

        container.innerHTML = packages.map(pkg =>
            `<span class="inline-block bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs mr-1 mb-1">${pkg}</span>`
        ).join('');
    }

    insertLibrary(libKey) {
        if (this.currentMode !== 'html') {
            this.showNotification('Libraries can only be inserted in HTML mode', 'error');
            return;
        }

        const lib = this.libraries[libKey];
        if (!lib) return;

        const currentCode = this.editor.getValue();

        // Try to insert after <head> or before </head>
        let newCode;
        if (currentCode.includes('</head>')) {
            newCode = currentCode.replace('</head>', `    ${lib.code}\n</head>`);
        } else if (currentCode.includes('<head>')) {
            newCode = currentCode.replace('<head>', `<head>\n    ${lib.code}`);
        } else if (currentCode.includes('<html>')) {
            newCode = currentCode.replace('<html>', `<html>\n<head>\n    ${lib.code}\n</head>`);
        } else {
            // Just prepend if no head/html structure
            newCode = lib.code + '\n' + currentCode;
        }

        this.editor.setValue(newCode);
        this.showNotification(`Inserted ${lib.name}`, 'success');
    }

    initVoiceRecognition() {
        this.isRecording = false;
        this.recognition = null;

        // Check for browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported');
            document.getElementById('voice-btn').style.display = 'none';
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            const input = document.getElementById('chat-input');
            let transcript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }

            // Update the input with interim or final results
            if (event.results[event.results.length - 1].isFinal) {
                input.value = input.value + transcript + ' ';
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                this.showNotification('Microphone access denied. Please allow microphone access.', 'error');
            } else if (event.error !== 'aborted') {
                this.showNotification(`Voice recognition error: ${event.error}`, 'error');
            }
            this.stopVoiceRecognition();
        };

        this.recognition.onend = () => {
            if (this.isRecording) {
                // Restart if still recording (continuous mode)
                try {
                    this.recognition.start();
                } catch (e) {
                    this.stopVoiceRecognition();
                }
            }
        };
    }

    toggleVoiceRecognition() {
        if (this.isRecording) {
            this.stopVoiceRecognition();
        } else {
            this.startVoiceRecognition();
        }
    }

    startVoiceRecognition() {
        if (!this.recognition) {
            this.showNotification('Voice recognition not supported in this browser', 'error');
            return;
        }

        try {
            this.recognition.start();
            this.isRecording = true;

            const btn = document.getElementById('voice-btn');
            btn.classList.remove('bg-gray-100', 'text-gray-500', 'border-gray-200');
            btn.classList.add('bg-red-500', 'text-white', 'animate-pulse', 'border-red-500');
            btn.title = 'Click to stop recording';

            this.showNotification('Listening... Speak your prompt', 'info');
        } catch (err) {
            console.error('Failed to start voice recognition:', err);
            this.showNotification('Failed to start voice recognition', 'error');
        }
    }

    stopVoiceRecognition() {
        if (this.recognition) {
            this.recognition.stop();
        }
        this.isRecording = false;

        const btn = document.getElementById('voice-btn');
        btn.classList.remove('bg-red-500', 'text-white', 'animate-pulse', 'border-red-500');
        btn.classList.add('bg-gray-100', 'text-gray-500', 'border-gray-200');
        btn.title = 'Voice input (click to speak)';
    }

    renderTemplates() {
        const grid = document.getElementById('templates-grid');
        grid.innerHTML = '';

        Object.entries(TEMPLATES).forEach(([type, templates]) => {
            templates.forEach(template => {
                const card = document.createElement('div');
                card.className = 'bg-gray-50 p-4 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors border border-gray-200 shadow-sm';
                card.innerHTML = `
                    <div class="flex items-center gap-3 mb-2">
                        <div class="w-8 h-8 rounded bg-white flex items-center justify-center text-gray-700 border border-gray-200 shadow-sm">
                            <i class="${template.icon}"></i>
                        </div>
                        <h3 class="font-bold text-gray-800">${template.name}</h3>
                    </div>
                    <p class="text-xs text-gray-500 mb-2">${template.description}</p>
                    <span class="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600 uppercase font-medium">${type}</span>
                `;

                card.addEventListener('click', () => {
                    this.setMode(type);
                    this.editor.setValue(template.code);
                    this.sandbox.updatePreview(template.code, type);
                    document.getElementById('templates-modal').classList.add('hidden');
                });

                grid.appendChild(card);
            });
        });
    }

    renderWelcomeScreen() {
        const history = document.getElementById('chat-history');
        // Only show if chat is essentially empty (just the welcome message)
        if (history.children.length <= 1) {
            const welcomeDiv = document.createElement('div');
            welcomeDiv.id = 'welcome-chips';
            welcomeDiv.className = 'flex flex-col items-center justify-center py-6 text-gray-400';
            welcomeDiv.innerHTML = `
                <i class="fa-solid fa-wand-magic-sparkles text-3xl mb-3 text-gray-300"></i>
                <p class="mb-3 text-sm">Quick start ideas:</p>
                <div class="flex flex-wrap justify-center gap-2 px-2">
                    ${this.suggestionChips.map(c => `
                        <button class="chip px-3 py-1.5 bg-white hover:bg-gray-100 rounded-full text-xs border border-gray-200 transition-colors text-gray-600 hover:text-gray-800 shadow-sm"
                                data-prompt="${c.prompt}"
                                data-mode="${c.mode}">
                            ${c.label}
                        </button>
                    `).join('')}
                </div>
            `;
            history.appendChild(welcomeDiv);

            // Add event listeners to chips
            welcomeDiv.querySelectorAll('.chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    const prompt = chip.dataset.prompt;
                    const mode = chip.dataset.mode;

                    // Switch to the appropriate mode
                    this.setMode(mode);

                    // Set the prompt in the input and submit
                    document.getElementById('chat-input').value = prompt;
                    this.handleChatSubmit();

                    // Remove the welcome chips
                    welcomeDiv.remove();
                });
            });
        }
    }

    undoAIChange() {
        const result = this.editor.undoAIChange();
        if (result === false) {
            this.showNotification('Nothing to undo', 'info');
            return;
        }

        if (result === true) {
            this.showNotification('Reverted last AI change', 'success');
            this.sandbox.updatePreview(this.editor.getValue(), this.currentMode);
        } else if (result && result.mode) {
            // Need to switch mode
            this.setMode(result.mode);
            this.showNotification(`Reverted AI change (switched to ${result.mode})`, 'success');
            this.sandbox.updatePreview(this.editor.getValue(), result.mode);
        }

        this.updateUndoButton();
    }

    updateUndoButton() {
        const btn = document.getElementById('undo-ai-btn');
        if (this.editor.canUndo()) {
            btn.disabled = false;
            btn.classList.remove('text-gray-300');
            btn.classList.add('text-gray-500', 'hover:text-gray-800');
        } else {
            btn.disabled = true;
            btn.classList.add('text-gray-300');
            btn.classList.remove('text-gray-500', 'hover:text-gray-800');
        }
    }

    clearAll() {
        if (!confirm('Clear everything? This will reset the editor, chat history, and preview.')) {
            return;
        }

        // Clear editor
        this.editor.setValue('');
        this.editor.undoStack = [];

        // Clear chat history
        this.ai.clearHistory();
        const chatHistory = document.getElementById('chat-history');
        chatHistory.innerHTML = `
            <div class="flex gap-3">
                <div class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center shrink-0 shadow-sm">
                    <i class="fa-solid fa-robot text-xs text-white"></i>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg rounded-tl-none p-3 text-sm text-gray-700 shadow-sm">
                    Hello! I'm your AI coding assistant. I can generate HTML, Three.js scenes, and Python scripts.
                    What would you like to build today?
                </div>
            </div>
        `;

        // Clear preview
        const iframe = document.getElementById('preview-frame');
        iframe.srcdoc = '';

        // Clear any attached image
        this.removeImage();

        // Reset undo button
        this.updateUndoButton();

        // Show welcome chips again
        this.renderWelcomeScreen();

        this.showNotification('Everything cleared', 'success');
    }

    popoutPreview() {
        const code = this.editor.getValue();
        const mode = this.currentMode;

        // Generate the HTML content
        let content = '';
        if (mode === 'html') {
            content = code;
        } else if (mode === 'three') {
            content = this.sandbox.generateThreeJSHTML(code);
        } else if (mode === 'python') {
            this.showNotification('Python preview cannot be popped out', 'info');
            return;
        }

        // Open in new tab
        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write(content);
            newWindow.document.close();
            this.showNotification('Preview opened in new tab', 'success');
        } else {
            this.showNotification('Pop-up blocked. Please allow pop-ups.', 'error');
        }
    }

    // Model Selection
    renderModelList() {
        const list = document.getElementById('model-list');
        list.innerHTML = '';

        CONFIG.MODELS.forEach(model => {
            const isSelected = model.id === this.ai.getModel();
            const card = document.createElement('div');
            card.className = `p-3 rounded-lg cursor-pointer transition-all border ${isSelected ? 'bg-gray-100 border-gray-400' : 'bg-white border-gray-200 hover:bg-gray-50'}`;
            card.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-800">${model.name}</span>
                        ${model.free ? '<span class="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">FREE</span>' : ''}
                        ${model.vision ? '<span class="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium"><i class="fa-solid fa-eye"></i></span>' : ''}
                    </div>
                    ${isSelected ? '<i class="fa-solid fa-check text-gray-700"></i>' : ''}
                </div>
                <div class="text-xs text-gray-500 mt-1">${model.provider} • ${model.description}</div>
            `;

            card.addEventListener('click', () => {
                this.selectModel(model.id);
            });

            list.appendChild(card);
        });
    }

    selectModel(modelId) {
        this.ai.setModel(modelId);
        this.updateModelDisplay();
        this.renderModelList();
        document.getElementById('model-modal').classList.add('hidden');

        const modelInfo = this.ai.getModelInfo();
        this.showNotification(`Switched to ${modelInfo.name}`, 'success');
    }

    updateModelDisplay() {
        const modelInfo = this.ai.getModelInfo();
        document.getElementById('current-model-name').textContent = modelInfo.name;

        // Update image upload button visibility based on vision support
        const imageLabel = document.getElementById('image-upload-label');
        if (modelInfo.vision) {
            imageLabel.classList.remove('opacity-50');
            imageLabel.title = 'Attach image (vision enabled)';
        } else {
            imageLabel.classList.add('opacity-50');
            imageLabel.title = 'Attach image (select a vision model first)';
        }
    }

    // Image Upload
    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Check if current model supports vision
        const modelInfo = this.ai.getModelInfo();
        if (!modelInfo.vision) {
            this.showNotification(`${modelInfo.name} doesn't support images. Select a vision model.`, 'error');
            event.target.value = '';
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showNotification('Please select an image file', 'error');
            event.target.value = '';
            return;
        }

        // Validate file size (max 20MB)
        if (file.size > 20 * 1024 * 1024) {
            this.showNotification('Image too large. Max size is 20MB.', 'error');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.pendingImageDataUrl = e.target.result;
            this.ai.setImage(this.pendingImageDataUrl);

            // Show preview
            document.getElementById('image-preview').src = this.pendingImageDataUrl;
            document.getElementById('image-preview-container').classList.remove('hidden');

            this.showNotification('Image attached', 'success');
        };
        reader.readAsDataURL(file);
    }

    removeImage() {
        this.pendingImageDataUrl = null;
        this.ai.clearImage();
        document.getElementById('image-upload').value = '';
        document.getElementById('image-preview-container').classList.add('hidden');
    }
}
