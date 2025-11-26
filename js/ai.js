class AI {
    constructor(editor) {
        this.apiKey = localStorage.getItem(CONFIG.STORAGE_KEY_API_KEY) || '';
        this.history = [];
        this.editor = editor;

        // Current model (load from storage or use default)
        this.currentModel = localStorage.getItem(CONFIG.STORAGE_KEY_MODEL) || CONFIG.DEFAULT_MODEL;

        // Pending image for next message
        this.pendingImage = null;

        // JSON Schema for structured code generation
        this.codeResponseSchema = {
            type: "json_schema",
            json_schema: {
                name: "code_response",
                strict: true,
                schema: {
                    type: "object",
                    properties: {
                        thinking: {
                            type: "string",
                            description: "Brief analysis of what changes are needed and how to preserve existing code"
                        },
                        code: {
                            type: "string",
                            description: "The complete, full code output. Must include ALL existing functionality."
                        },
                        changes_made: {
                            type: "array",
                            items: { type: "string" },
                            description: "List of specific changes made to the code"
                        },
                        preserved_elements: {
                            type: "array",
                            items: { type: "string" },
                            description: "List of existing elements that were preserved"
                        }
                    },
                    required: ["thinking", "code", "changes_made", "preserved_elements"],
                    additionalProperties: false
                }
            }
        };
    }

    // Extract const/let/var/function declarations to warn AI about existing identifiers
    extractDeclaredIdentifiers(code) {
        const identifiers = new Set();

        // Match const, let, var declarations
        const varRegex = /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
        let match;
        while ((match = varRegex.exec(code)) !== null) {
            identifiers.add(match[1]);
        }

        // Match function declarations
        const funcRegex = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
        while ((match = funcRegex.exec(code)) !== null) {
            identifiers.add(match[1]);
        }

        // Match class declarations
        const classRegex = /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
        while ((match = classRegex.exec(code)) !== null) {
            identifiers.add(match[1]);
        }

        return Array.from(identifiers);
    }

    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem(CONFIG.STORAGE_KEY_API_KEY, key);
    }

    getApiKey() {
        return this.apiKey;
    }

    setModel(modelId) {
        this.currentModel = modelId;
        localStorage.setItem(CONFIG.STORAGE_KEY_MODEL, modelId);
    }

    getModel() {
        return this.currentModel;
    }

    getModelInfo() {
        return CONFIG.MODELS.find(m => m.id === this.currentModel) || CONFIG.MODELS[0];
    }

    // Set image for next message (base64 data URL)
    setImage(imageDataUrl) {
        this.pendingImage = imageDataUrl;
    }

    clearImage() {
        this.pendingImage = null;
    }

    hasImage() {
        return this.pendingImage !== null;
    }

    addToHistory(role, content) {
        this.history.push({ role, content });
    }

    clearHistory() {
        this.history = [];
    }

    async generateCode(userPrompt, currentMode, onChunk = null) {
        if (!this.apiKey) {
            throw new Error("API Key is missing. Please set it in Settings.");
        }

        // Check if using image with non-vision model
        const modelInfo = this.getModelInfo();
        if (this.pendingImage && !modelInfo.vision) {
            throw new Error(`${modelInfo.name} doesn't support images. Please select a vision-capable model.`);
        }

        const currentCode = this.editor?.getValue ? this.editor.getValue() : '';
        const declaredIdentifiers = currentCode ? this.extractDeclaredIdentifiers(currentCode) : [];

        // Build the structured prompt
        const structuredPrompt = this.buildStructuredPrompt(userPrompt, currentMode, currentCode, declaredIdentifiers);

        // Add user message to history (simplified version for history)
        this.addToHistory('user', `[Mode: ${currentMode}] ${userPrompt}${this.pendingImage ? ' [with image]' : ''}`);

        // Build the user message content (multimodal if image attached)
        let userContent;
        if (this.pendingImage) {
            userContent = [
                { type: "text", text: structuredPrompt },
                {
                    type: "image_url",
                    image_url: {
                        url: this.pendingImage
                    }
                }
            ];
        } else {
            userContent = structuredPrompt;
        }

        // Prepare messages for API
        const messages = [
            { role: 'system', content: CONFIG.SYSTEM_PROMPT },
            ...this.history.slice(0, -1), // Exclude the simplified user message we just added
            { role: 'user', content: userContent }
        ];

        // Clear the pending image after building the message
        this.clearImage();

        try {
            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'AI Web Studio'
                },
                body: JSON.stringify({
                    model: this.currentModel,
                    messages: messages,
                    response_format: this.codeResponseSchema,
                    stream: true
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'API request failed');
            }

            // Handle streaming response
            const fullContent = await this.handleStreamingResponse(response, onChunk);

            // Parse the structured JSON response
            const parsedResponse = this.parseStructuredResponse(fullContent);

            // Add assistant response to history (just the code for brevity)
            this.addToHistory('assistant', `Generated code with changes: ${parsedResponse.changes_made.join(', ')}`);

            // Log the thinking and changes for debugging
            console.log('AI Thinking:', parsedResponse.thinking);
            console.log('Changes Made:', parsedResponse.changes_made);
            console.log('Preserved:', parsedResponse.preserved_elements);

            return parsedResponse.code;

        } catch (error) {
            console.error('AI Generation Error:', error);
            throw error;
        }
    }

    async handleStreamingResponse(response, onChunk) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE messages
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);

                    if (data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data);

                        // Check for errors in chunk
                        if (parsed.error) {
                            throw new Error(parsed.error.message || 'Stream error');
                        }

                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                            fullContent += content;

                            // Call the chunk callback for live updates
                            if (onChunk) {
                                onChunk(content, fullContent);
                            }
                        }
                    } catch (e) {
                        // Skip invalid JSON lines (like empty data)
                        if (data.trim() && !data.includes('[DONE]')) {
                            console.warn('Failed to parse SSE chunk:', data);
                        }
                    }
                }
            }
        }

        return fullContent;
    }

    buildStructuredPrompt(userPrompt, currentMode, currentCode, declaredIdentifiers) {
        let prompt = `MODE: ${currentMode}\n\nUSER REQUEST: ${userPrompt}\n\n`;

        if (currentCode && currentCode.trim()) {
            prompt += `CURRENT CODE (YOU MUST PRESERVE ALL EXISTING FUNCTIONALITY):\n\`\`\`\n${currentCode}\n\`\`\`\n\n`;

            if (declaredIdentifiers.length > 0) {
                prompt += `⚠️ EXISTING IDENTIFIERS (DO NOT REDECLARE - this will cause errors):\n`;
                prompt += declaredIdentifiers.map(id => `  - ${id}`).join('\n');
                prompt += '\n\n';
            }

            prompt += `CRITICAL INSTRUCTIONS:
1. Return the COMPLETE code including ALL existing functionality
2. DO NOT remove any existing features, styles, or functionality
3. DO NOT redeclare any of the existing identifiers listed above
4. Insert new code in the appropriate location within the existing structure
5. Preserve all existing variable names, CSS classes, and HTML structure
6. If modifying a function, keep its original signature unless explicitly asked to change it`;
        } else {
            prompt += `This is a NEW file. Generate complete, working code for the request.`;
        }

        return prompt;
    }

    parseStructuredResponse(content) {
        try {
            // Try to parse as JSON
            const parsed = JSON.parse(content);

            // Validate required fields
            if (!parsed.code) {
                throw new Error('Response missing code field');
            }

            return {
                thinking: parsed.thinking || '',
                code: parsed.code,
                changes_made: parsed.changes_made || [],
                preserved_elements: parsed.preserved_elements || []
            };
        } catch (parseError) {
            console.warn('Failed to parse structured response, falling back to raw content:', parseError);

            // Fallback: treat the entire content as code
            // Try to extract code from markdown fences if present
            let code = content;
            const codeBlockMatch = content.match(/```(?:html|javascript|python|js)?\n?([\s\S]*?)```/);
            if (codeBlockMatch) {
                code = codeBlockMatch[1].trim();
            }

            return {
                thinking: 'Fallback mode - structured parsing failed',
                code: code,
                changes_made: ['Unable to parse structured response'],
                preserved_elements: []
            };
        }
    }
}
