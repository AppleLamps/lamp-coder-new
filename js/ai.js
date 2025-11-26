class AI {
    constructor(editor) {
        this.apiKey = localStorage.getItem(CONFIG.STORAGE_KEY_API_KEY) || '';
        this.history = [];
        this.editor = editor;
    }

    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem(CONFIG.STORAGE_KEY_API_KEY, key);
    }

    getApiKey() {
        return this.apiKey;
    }

    addToHistory(role, content) {
        this.history.push({ role, content });
    }

    clearHistory() {
        this.history = [];
    }

    async generateCode(userPrompt, currentMode) {
        if (!this.apiKey) {
            throw new Error("API Key is missing. Please set it in Settings.");
        }

        // Add user message to history
        this.addToHistory('user', `[Mode: ${currentMode}] ${userPrompt}`);

        // Prepare messages for API
        const messages = [
            { role: 'system', content: CONFIG.SYSTEM_PROMPT },
            ...this.history
        ];

        // Include the current editor content so the AI works against the live code
        const currentCode = this.editor?.getValue ? this.editor.getValue() : '';
        if (currentCode) {
            messages.push({
                role: 'system',
                content: `Current Editor Content:\n${currentCode}\n\nRefuse to output markdown wrappers. Output only code.`
            });
        }

        try {
            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': window.location.origin, // Required by OpenRouter
                    'X-Title': 'AI Web Studio'
                },
                body: JSON.stringify({
                    model: CONFIG.DEFAULT_MODEL,
                    messages: messages
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'API request failed');
            }

            const data = await response.json();
            const aiContent = data.choices[0].message.content;

            // Add assistant response to history
            this.addToHistory('assistant', aiContent);

            return aiContent;

        } catch (error) {
            console.error('AI Generation Error:', error);
            throw error;
        }
    }
}
