document.addEventListener('DOMContentLoaded', () => {
    // Initialize modules
    const editor = new Editor('code-editor');
    window.editor = editor; // Expose for resizer to refresh CodeMirror

    const ai = new AI(editor);
    const sandbox = new Sandbox('preview-frame');
    window.sandbox = sandbox; // Expose for Python plot download buttons

    const ui = new UI(ai, editor, sandbox);
    const resizer = new PanelResizer();

    // Initial setup
    // Load a default template or welcome message?
    // Let's load the first HTML template
    const defaultTemplate = TEMPLATES.html[0];
    editor.setValue(defaultTemplate.code);
    sandbox.updatePreview(defaultTemplate.code, 'html');
});
