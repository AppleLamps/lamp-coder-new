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

        this.initEventListeners();
        this.renderTemplates();

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

        input.value = '';
        this.appendMessage('user', prompt);
        this.setLoading(true);

        try {
            const code = await this.ai.generateCode(prompt, this.currentMode);
            this.appendMessage('assistant', "I've generated the code for you. Check the editor!");

            this.editor.setValue(code);
            this.sandbox.updatePreview(code, this.currentMode);
        } catch (error) {
            this.appendMessage('assistant', `Error: ${error.message}`);
        } finally {
            this.setLoading(false);
        }
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

    setLoading(loading) {
        const btn = document.getElementById('send-btn');
        if (loading) {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            btn.disabled = true;
        } else {
            btn.innerHTML = '<i class="fa-solid fa-paper-plane text-xs"></i>';
            btn.disabled = false;
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
}
