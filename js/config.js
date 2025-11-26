const CONFIG = {
    API_URL: 'https://openrouter.ai/api/v1/chat/completions',
    DEFAULT_MODEL: 'openai/gpt-4.1',

    // Available models for selection
    MODELS: [
        { id: 'openai/gpt-4.1', name: 'GPT-4.1', provider: 'OpenAI', vision: true, description: 'Latest GPT-4 with vision' },
        { id: 'openai/gpt-5.1', name: 'GPT-5.1', provider: 'OpenAI', vision: true, description: 'Most capable model' },
        { id: 'openai/gpt-5.1-codex', name: 'GPT-5.1 Codex', provider: 'OpenAI', vision: true, description: 'Advanced coding model' },
        { id: 'openai/gpt-5.1-codex-mini', name: 'GPT-5.1 Codex Mini', provider: 'OpenAI', vision: true, description: 'Lightweight coding model' },
        { id: 'x-ai/grok-4-fast', name: 'Grok 4 Fast', provider: 'xAI', vision: true, description: 'Fast & powerful' },
        { id: 'x-ai/grok-code-fast-1', name: 'Grok Code Fast', provider: 'xAI', vision: false, description: 'Optimized for coding' },
        { id: 'tngtech/deepseek-r1t2-chimera:free', name: 'DeepSeek R1T2 Chimera', provider: 'TNG', vision: false, description: 'Free reasoning model', free: true },
        { id: 'z-ai/glm-4.6', name: 'GLM-4.6', provider: 'Z-AI', vision: true, description: 'Multimodal Chinese model' },
        { id: 'kwaipilot/kat-coder-pro:free', name: 'KAT Coder Pro', provider: 'Kwaipilot', vision: false, description: 'Free coding specialist', free: true },
        { id: 'alibaba/tongyi-deepresearch-30b-a3b:free', name: 'Tongyi DeepResearch', provider: 'Alibaba', vision: false, description: 'Free research model', free: true },
        { id: 'qwen/qwen3-coder:free', name: 'Qwen3 Coder', provider: 'Qwen', vision: false, description: 'Free coding model', free: true },
        { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'Anthropic', vision: true, description: 'Balanced performance' },
        { id: 'google/gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro', provider: 'Google', vision: true, description: 'Advanced reasoning' }
    ],

    STORAGE_KEY_MODEL: 'ai_web_studio_model',

    SYSTEM_PROMPT: `You are an expert AI coding assistant for a web development studio.
Your responses must be in JSON format with these fields:
- thinking: Your analysis of what needs to be done
- code: The COMPLETE code (never partial)
- changes_made: Array of changes you made
- preserved_elements: Array of existing elements you preserved

MODES:
1. HTML - Full documents with CSS in <style> and JS in <script>
2. Three.js - JavaScript using THREE global (scene, camera, renderer, controls provided)
3. Python - Pyodide scripts with numpy, matplotlib (use plt.show() for plots)

CRITICAL RULES:
1. **NEVER REDECLARE VARIABLES**: If you see "EXISTING IDENTIFIERS: x, y, z" - DO NOT use const/let/var to declare these again. This causes "Identifier already declared" errors.

2. **FULL CODE ONLY**: Always return the complete, working code. Never return snippets or partial code.

3. **PRESERVE EVERYTHING**: When modifying existing code:
   - Keep ALL existing functions, variables, styles, and HTML elements
   - Insert new code in the appropriate location
   - Do not "clean up" or "refactor" existing code
   - Maintain existing naming conventions

4. **ADDITIVE CHANGES**: When user says "add X", find the right place in existing code and insert it. Do not restructure.

5. **NO MARKDOWN**: Return raw code in the "code" field, no markdown fences.

For Three.js: scene, camera, renderer, controls are pre-configured. Just add objects to scene.
For Python: Use plt.show() for plots, print() for text output.`,
    STORAGE_KEY_API_KEY: 'ai_web_studio_api_key'
};
