# AI Web Studio

A sophisticated AI-powered web development environment that allows you to generate, edit, and simulate HTML, Three.js, and Python code directly in the browser.

## Features

- **AI Chat Interface**: Generate code using natural language with GPT-5.1.
- **Multi-Language Support**:
  - **HTML/CSS/JS**: Full web page generation with Tailwind CSS support.
  - **Three.js**: Create interactive 3D scenes and particle systems.
  - **Python**: Run Python scripts in the browser using Pyodide (WebAssembly), with support for NumPy and Matplotlib.
- **Secure Sandbox**: Real-time preview in an isolated iframe.
- **Code Editor**: Professional editor with syntax highlighting.
- **Templates**: Quick-start templates for landing pages, games, data visualization, and more.
- **Clean Light Theme**: Professional light theme with white backgrounds and black accents for a minimalist, modern appearance.

## Setup

1. Clone this repository or download the files.
2. Open `index.html` in a modern web browser (Chrome, Edge, Firefox).
3. Click the **Settings** button in the top right corner.
4. Enter your **OpenRouter API Key**.
    - The key is stored locally in your browser's LocalStorage.

## Usage

1. **Select a Mode**: Choose between HTML, Three.js, or Python using the buttons above the chat input.
2. **Describe your idea**: Type a request like "Create a login form" or "Show a 3D rotating earth".
3. **Generate**: The AI will generate the code and automatically render it in the preview panel.
4. **Edit**: You can manually tweak the code in the editor and click **Run** to update the preview.

## Technologies

- **Frontend**: Vanilla JavaScript, Tailwind CSS
- **Editor**: CodeMirror 5
- **3D Engine**: Three.js
- **Python Runtime**: Pyodide (WebAssembly)
- **AI**: OpenRouter API (GPT-5.1)

## License

MIT
