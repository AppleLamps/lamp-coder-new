document.addEventListener('DOMContentLoaded', () => {
    // Initialize modules
    const ai = new AI();
    const editor = new Editor('code-editor');
    const sandbox = new Sandbox('preview-frame');
    const ui = new UI(ai, editor, sandbox);

    // Initial setup
    // Load a default template or welcome message?
    // Let's load the first HTML template
    const defaultTemplate = TEMPLATES.html[0];
    editor.setValue(defaultTemplate.code);
    sandbox.updatePreview(defaultTemplate.code, 'html');
});
