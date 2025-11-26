class Sandbox {
    constructor(iframeId) {
        this.iframe = document.getElementById(iframeId);
        this.pythonOutput = document.getElementById('python-output');
        this.loadingOverlay = document.getElementById('preview-loading');
        this.pyodide = null;
        this.pyodideReady = false;
    }

    async initPyodide() {
        if (this.pyodideReady) return;

        try {
            this.showLoading(true);
            this.pyodide = await loadPyodide();
            await this.pyodide.loadPackage(["numpy", "matplotlib"]);
            this.pyodideReady = true;
            console.log("Pyodide loaded");
        } catch (err) {
            console.error("Failed to load Pyodide:", err);
        } finally {
            this.showLoading(false);
        }
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
        this.pythonOutput.classList.add('hidden');
        this.iframe.classList.remove('hidden');

        const doc = this.iframe.contentWindow.document;
        doc.open();
        doc.write(code);
        doc.close();
    }

    renderThreeJS(code) {
        this.pythonOutput.classList.add('hidden');
        this.iframe.classList.remove('hidden');

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
        this.pythonOutput.classList.remove('hidden');
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
                const img = document.createElement('img');
                img.src = 'data:image/png;base64,' + result;
                img.style.maxWidth = '100%';
                this.pythonOutput.appendChild(img);
            } else if (result !== undefined) {
                this.pythonOutput.innerHTML += `<div>Result: ${result}</div>`;
            }

        } catch (err) {
            this.pythonOutput.innerHTML += `<div style="color: red;">${err}</div>`;
        }
    }
}
