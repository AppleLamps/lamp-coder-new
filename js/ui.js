class UI {
    constructor(ai, editor, sandbox) {
        this.ai = ai;
        this.editor = editor;
        this.sandbox = sandbox;
        this.currentMode = 'html';

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

        // Update UI buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active', 'bg-blue-600', 'text-white');
                btn.classList.remove('bg-gray-700', 'text-gray-300');
            } else {
                btn.classList.remove('active', 'bg-blue-600', 'text-white');
                btn.classList.add('bg-gray-700', 'text-gray-300');
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
        const bg = role === 'user' ? 'bg-gray-600' : 'bg-blue-600';

        div.innerHTML = `
            <div class="w-8 h-8 rounded-full ${bg} flex items-center justify-center shrink-0">
                <i class="fa-solid ${icon} text-xs"></i>
            </div>
            <div class="bg-gray-700 rounded-lg ${role === 'user' ? 'rounded-tr-none' : 'rounded-tl-none'} p-3 text-sm text-gray-200 prose prose-invert max-w-none">
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
            'success': 'bg-green-500',
            'info': 'bg-blue-500'
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

    renderTemplates() {
        const grid = document.getElementById('templates-grid');
        grid.innerHTML = '';

        Object.entries(TEMPLATES).forEach(([type, templates]) => {
            templates.forEach(template => {
                const card = document.createElement('div');
                card.className = 'bg-gray-700 p-4 rounded hover:bg-gray-600 cursor-pointer transition-colors border border-gray-600';
                card.innerHTML = `
                    <div class="flex items-center gap-3 mb-2">
                        <div class="w-8 h-8 rounded bg-gray-800 flex items-center justify-center text-blue-400">
                            <i class="${template.icon}"></i>
                        </div>
                        <h3 class="font-bold text-gray-200">${template.name}</h3>
                    </div>
                    <p class="text-xs text-gray-400 mb-2">${template.description}</p>
                    <span class="text-xs bg-gray-800 px-2 py-1 rounded text-gray-500 uppercase">${type}</span>
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
