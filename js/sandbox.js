class Sandbox {
    constructor(iframeId) {
        this.iframe = document.getElementById(iframeId);
        this.pythonOutputContainer = document.getElementById('python-output-container');
        this.pythonOutput = document.getElementById('python-output');
        this.loadingOverlay = document.getElementById('preview-loading');
        this.jsConsolePanel = document.getElementById('js-console-panel');
        this.jsConsoleOutput = document.getElementById('js-console-output');
        this.pyodide = null;
        this.pyodideReady = false;
        this.lastPlotData = null; // Store last plot for download

        // Listen for console messages from iframe
        window.addEventListener('message', (event) => this.handleConsoleMessage(event));

        // Console panel controls
        document.getElementById('clear-console-btn').addEventListener('click', () => this.clearConsole());
        document.getElementById('toggle-console-btn').addEventListener('click', () => this.toggleConsole());
    }

    // Console capture script to inject into iframe
    getConsoleCapture() {
        return `
<script>
(function() {
    const originalConsole = {
        log: console.log.bind(console),
        error: console.error.bind(console),
        warn: console.warn.bind(console),
        info: console.info.bind(console)
    };

    function sendToParent(type, args) {
        const message = Array.from(args).map(arg => {
            if (typeof arg === 'object') {
                try { return JSON.stringify(arg, null, 2); }
                catch { return String(arg); }
            }
            return String(arg);
        }).join(' ');

        window.parent.postMessage({ type: 'console', level: type, message: message }, '*');
    }

    console.log = function(...args) { originalConsole.log(...args); sendToParent('log', args); };
    console.error = function(...args) { originalConsole.error(...args); sendToParent('error', args); };
    console.warn = function(...args) { originalConsole.warn(...args); sendToParent('warn', args); };
    console.info = function(...args) { originalConsole.info(...args); sendToParent('info', args); };

    window.onerror = function(msg, url, line, col, error) {
        const errorMsg = error ? error.stack || msg : msg;
        window.parent.postMessage({ type: 'console', level: 'error', message: 'Error: ' + errorMsg + ' (line ' + line + ')' }, '*');
        return false;
    };

    window.addEventListener('unhandledrejection', function(event) {
        window.parent.postMessage({ type: 'console', level: 'error', message: 'Unhandled Promise Rejection: ' + event.reason }, '*');
    });
})();
</script>`;
    }

    handleConsoleMessage(event) {
        if (event.data && event.data.type === 'console') {
            this.showConsole();
            this.appendConsoleEntry(event.data.level, event.data.message);
        }
    }

    appendConsoleEntry(level, message) {
        const colors = {
            log: 'text-gray-300',
            info: 'text-blue-400',
            warn: 'text-yellow-400',
            error: 'text-red-400'
        };
        const icons = {
            log: 'fa-circle',
            info: 'fa-circle-info',
            warn: 'fa-triangle-exclamation',
            error: 'fa-circle-xmark'
        };

        const entry = document.createElement('div');
        entry.className = `flex items-start gap-2 ${colors[level] || 'text-gray-300'}`;
        entry.innerHTML = `
            <i class="fa-solid ${icons[level] || 'fa-circle'} text-[8px] mt-1 opacity-60"></i>
            <pre class="whitespace-pre-wrap break-all flex-1">${this.escapeHtml(message)}</pre>
        `;
        this.jsConsoleOutput.appendChild(entry);
        this.jsConsoleOutput.scrollTop = this.jsConsoleOutput.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showConsole() {
        this.jsConsolePanel.classList.remove('hidden');
    }

    hideConsole() {
        this.jsConsolePanel.classList.add('hidden');
    }

    toggleConsole() {
        this.jsConsolePanel.classList.toggle('hidden');
    }

    clearConsole() {
        this.jsConsoleOutput.innerHTML = '';
    }

    async initPyodide() {
        if (this.pyodideReady) return;

        try {
            this.showLoading(true);
            this.pyodide = await loadPyodide();
            await this.pyodide.loadPackage(["numpy", "matplotlib", "micropip"]);
            this.installedPackages = new Set(['numpy', 'matplotlib']);
            this.pyodideReady = true;
            console.log("Pyodide loaded");
        } catch (err) {
            console.error("Failed to load Pyodide:", err);
        } finally {
            this.showLoading(false);
        }
    }

    async installPackage(packageName) {
        if (!packageName || !packageName.trim()) {
            return { success: false, message: 'Please enter a package name' };
        }

        packageName = packageName.trim().toLowerCase();

        if (this.installedPackages && this.installedPackages.has(packageName)) {
            return { success: false, message: `${packageName} is already installed` };
        }

        if (!this.pyodideReady) {
            await this.initPyodide();
        }

        try {
            // Use micropip to install from PyPI
            await this.pyodide.runPythonAsync(`
import micropip
await micropip.install('${packageName}')
            `);

            if (!this.installedPackages) {
                this.installedPackages = new Set(['numpy', 'matplotlib']);
            }
            this.installedPackages.add(packageName);

            return { success: true, message: `Successfully installed ${packageName}` };
        } catch (err) {
            return { success: false, message: `Failed to install ${packageName}: ${err.message}` };
        }
    }

    getInstalledPackages() {
        return this.installedPackages ? Array.from(this.installedPackages) : ['numpy', 'matplotlib'];
    }

    showLoading(show) {
        if (show) {
            this.loadingOverlay.classList.remove('hidden');
        } else {
            this.loadingOverlay.classList.add('hidden');
        }
    }

    updatePreview(code, mode) {
        if (mode === 'html') {
            this.renderHTML(code);
        } else if (mode === 'three') {
            this.renderThreeJS(code);
        } else if (mode === 'python') {
            this.runPython(code);
        }
    }

    renderHTML(code) {
        this.pythonOutputContainer.classList.add('hidden');
        this.iframe.classList.remove('hidden');
        this.clearConsole();

        // Inject console capture script into the HTML
        let modifiedCode = code;
        const consoleScript = this.getConsoleCapture();

        // Insert after <head> or at start of document
        if (modifiedCode.includes('<head>')) {
            modifiedCode = modifiedCode.replace('<head>', '<head>' + consoleScript);
        } else if (modifiedCode.includes('<html>')) {
            modifiedCode = modifiedCode.replace('<html>', '<html><head>' + consoleScript + '</head>');
        } else {
            modifiedCode = consoleScript + modifiedCode;
        }

        const doc = this.iframe.contentWindow.document;
        doc.open();
        doc.write(modifiedCode);
        doc.close();
    }

    renderThreeJS(code) {
        this.pythonOutputContainer.classList.add('hidden');
        this.iframe.classList.remove('hidden');
        this.clearConsole();

        // Sanitize code to prevent script injection
        const sanitizedCode = code
            .replace(/<\/script>/gi, '<\\/script>')
            .replace(/<script/gi, '\\u003cscript')
            .replace(/javascript:/gi, '');

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; script-src 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net;">
    <style>body { margin: 0; overflow: hidden; }</style>
    ${this.getConsoleCapture()}
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
</head>
<body>
    <script>
        try {
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            document.body.appendChild(renderer.domElement);

            const controls = new THREE.OrbitControls(camera, renderer.domElement);
            camera.position.z = 5;

            // User code injection
            (function() {
                ${sanitizedCode}
            })();

            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });
        } catch (err) {
            console.error(err);
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'color:red; padding:20px; font-family:monospace; white-space:pre-wrap;';
            errorDiv.textContent = 'Error: ' + err.message + '\\n\\n' + err.stack;
            document.body.appendChild(errorDiv);
        }
    </script>
</body>
</html>`;

        const doc = this.iframe.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();
    }

    async runPython(code) {
        this.iframe.classList.add('hidden');
        this.pythonOutputContainer.classList.remove('hidden');
        this.pythonOutput.innerHTML = ''; // Clear previous output

        if (!this.pyodideReady) {
            this.pythonOutput.innerHTML = 'Loading Python runtime...';
            await this.initPyodide();
        }

        // Capture stdout
        this.pyodide.setStdout({
            batched: (msg) => {
                this.pythonOutput.innerHTML += `<div>${msg}</div>`;
            }
        });

        // Setup matplotlib backend to render to base64
        const setupCode = `
import io, base64
import matplotlib.pyplot as plt

def show_plot():
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    img_str = base64.b64encode(buf.read()).decode('utf-8')
    plt.clf()
    return img_str

# Monkey patch plt.show
plt.show = show_plot
`;

        try {
            await this.pyodide.runPythonAsync(setupCode);

            // Run user code
            let result = await this.pyodide.runPythonAsync(code);

            // Check if result is a base64 image (from plt.show)
            if (typeof result === 'string' && result.length > 100) { // Simple heuristic
                this.lastPlotData = result; // Store for download
                this.updateDownloadPlotButton(true);

                const imgContainer = document.createElement('div');
                imgContainer.className = 'relative inline-block group';
                imgContainer.innerHTML = `
                    <img src="data:image/png;base64,${result}" style="max-width: 100%;" class="rounded shadow-sm border border-gray-200">
                    <button class="absolute top-2 right-2 bg-white/90 hover:bg-white px-2 py-1 rounded text-xs text-gray-600 hover:text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-gray-200" onclick="window.sandbox.downloadPlotDirect('${result}')">
                        <i class="fa-solid fa-download"></i> Save
                    </button>
                `;
                this.pythonOutput.appendChild(imgContainer);
            } else if (result !== undefined) {
                this.pythonOutput.innerHTML += `<div>Result: ${result}</div>`;
            }

        } catch (err) {
            this.pythonOutput.innerHTML += `<div style="color: red;">${err}</div>`;
        }
    }

    clearPythonOutput() {
        this.pythonOutput.innerHTML = '';
        this.lastPlotData = null;
        this.updateDownloadPlotButton(false);
    }

    updateDownloadPlotButton(enabled) {
        const btn = document.getElementById('download-plot-btn');
        if (enabled) {
            btn.disabled = false;
            btn.classList.remove('text-gray-400');
            btn.classList.add('text-gray-500');
        } else {
            btn.disabled = true;
            btn.classList.add('text-gray-400');
            btn.classList.remove('text-gray-500');
        }
    }

    downloadLastPlot() {
        if (!this.lastPlotData) return;
        this.downloadPlotDirect(this.lastPlotData);
    }

    downloadPlotDirect(base64Data) {
        const link = document.createElement('a');
        link.href = 'data:image/png;base64,' + base64Data;
        link.download = 'plot.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Generate Three.js HTML for pop-out (used by UI)
    generateThreeJSHTML(code) {
        const sanitizedCode = code
            .replace(/<\/script>/gi, '<\\/script>')
            .replace(/<script/gi, '\\u003cscript')
            .replace(/javascript:/gi, '');

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Three.js Preview</title>
    <style>body { margin: 0; overflow: hidden; }</style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
</head>
<body>
    <script>
        try {
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            document.body.appendChild(renderer.domElement);

            const controls = new THREE.OrbitControls(camera, renderer.domElement);
            camera.position.z = 5;

            // User code
            (function() {
                ${sanitizedCode}
            })();

            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });
        } catch (err) {
            console.error(err);
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'color:red; padding:20px; font-family:monospace; white-space:pre-wrap;';
            errorDiv.textContent = 'Error: ' + err.message + '\\n\\n' + err.stack;
            document.body.appendChild(errorDiv);
        }
    </script>
</body>
</html>`;
    }
}
