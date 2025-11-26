const TEMPLATES = {
    html: [
        {
            name: "Landing Page",
            icon: "fa-solid fa-pager",
            description: "Modern landing page with hero section",
            code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Modern Landing Page</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 text-gray-800 font-sans">
    <!-- Navbar -->
    <nav class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <span class="text-2xl font-bold text-indigo-600">Brand</span>
                </div>
                <div class="flex items-center space-x-4">
                    <a href="#" class="text-gray-600 hover:text-indigo-600">Features</a>
                    <a href="#" class="text-gray-600 hover:text-indigo-600">Pricing</a>
                    <a href="#" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Get Started</a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <div class="relative bg-white overflow-hidden">
        <div class="max-w-7xl mx-auto">
            <div class="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
                <main class="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                    <div class="sm:text-center lg:text-left">
                        <h1 class="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                            <span class="block xl:inline">Data to enrich your</span>
                            <span class="block text-indigo-600 xl:inline">online business</span>
                        </h1>
                        <p class="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                            Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure qui lorem cupidatat commodo. Elit sunt amet fugiat veniam occaecat fugiat aliqua.
                        </p>
                        <div class="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                            <div class="rounded-md shadow">
                                <a href="#" class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10">
                                    Get started
                                </a>
                            </div>
                            <div class="mt-3 sm:mt-0 sm:ml-3">
                                <a href="#" class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10">
                                    Live demo
                                </a>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
        <div class="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
            <img class="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full" src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2850&q=80" alt="">
        </div>
    </div>
</body>
</html>`
        },
        {
            name: "Contact Form",
            icon: "fa-solid fa-envelope",
            description: "Responsive contact form with validation",
            code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact Form</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 flex items-center justify-center min-h-screen">
    <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 class="text-2xl font-bold mb-6 text-gray-800">Contact Us</h2>
        <form onsubmit="event.preventDefault(); alert('Message Sent!');">
            <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="name">Name</label>
                <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="name" type="text" placeholder="Your Name" required>
            </div>
            <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="email">Email</label>
                <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="email" type="email" placeholder="your@email.com" required>
            </div>
            <div class="mb-6">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="message">Message</label>
                <textarea class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="message" rows="4" placeholder="Your message..." required></textarea>
            </div>
            <div class="flex items-center justify-between">
                <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition-colors" type="submit">
                    Send Message
                </button>
            </div>
        </form>
    </div>
</body>
</html>`
        },
        {
            name: "Canvas Game",
            icon: "fa-solid fa-gamepad",
            description: "Simple coin collector game",
            code: `<!DOCTYPE html>
<html>
<head>
    <title>Coin Collector</title>
    <style>
        body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #222; color: white; font-family: sans-serif; }
        canvas { border: 2px solid #fff; background: #333; }
        #score { position: absolute; top: 20px; font-size: 24px; }
    </style>
</head>
<body>
    <div id="score">Score: 0</div>
    <canvas id="gameCanvas" width="400" height="400"></canvas>
    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const scoreEl = document.getElementById('score');

        let score = 0;
        const player = { x: 200, y: 200, size: 20, speed: 5 };
        const coin = { x: 0, y: 0, size: 10 };

        function spawnCoin() {
            coin.x = Math.random() * (canvas.width - coin.size);
            coin.y = Math.random() * (canvas.height - coin.size);
        }

        spawnCoin();

        const keys = {};
        window.addEventListener('keydown', e => keys[e.key] = true);
        window.addEventListener('keyup', e => keys[e.key] = false);

        function update() {
            if (keys['ArrowUp']) player.y -= player.speed;
            if (keys['ArrowDown']) player.y += player.speed;
            if (keys['ArrowLeft']) player.x -= player.speed;
            if (keys['ArrowRight']) player.x += player.speed;

            // Boundaries
            player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
            player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

            // Collision
            if (player.x < coin.x + coin.size &&
                player.x + player.size > coin.x &&
                player.y < coin.y + coin.size &&
                player.y + player.size > coin.y) {
                score++;
                scoreEl.textContent = 'Score: ' + score;
                spawnCoin();
            }
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Player
            ctx.fillStyle = '#3498db';
            ctx.fillRect(player.x, player.y, player.size, player.size);
            
            // Coin
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(coin.x + coin.size/2, coin.y + coin.size/2, coin.size/2, 0, Math.PI * 2);
            ctx.fill();
        }

        function loop() {
            update();
            draw();
            requestAnimationFrame(loop);
        }

        loop();
    </script>
</body>
</html>`
        }
    ],
    three: [
        {
            name: "Rotating Cube",
            icon: "fa-solid fa-cube",
            description: "Basic 3D cube with lighting",
            code: `// Create a cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Add lights
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
}
animate();`
        },
        {
            name: "Particle System",
            icon: "fa-solid fa-snowflake",
            description: "5000 interactive particles",
            code: `const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 5000;

const posArray = new Float32Array(particlesCount * 3);

for(let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 10;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

const material = new THREE.PointsMaterial({
    size: 0.02,
    color: 0x00ffff,
});

const particlesMesh = new THREE.Points(particlesGeometry, material);
scene.add(particlesMesh);

// Mouse interaction
const mouse = new THREE.Vector2();
document.addEventListener('mousemove', (event) => {
    mouse.x = event.clientX / window.innerWidth * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

function animate() {
    requestAnimationFrame(animate);
    particlesMesh.rotation.y += 0.001;
    particlesMesh.rotation.x = mouse.y * 0.5;
    particlesMesh.rotation.y = mouse.x * 0.5;
    renderer.render(scene, camera);
}
animate();`
        }
    ],
    python: [
        {
            name: "Data Visualization",
            icon: "fa-solid fa-chart-line",
            description: "Matplotlib chart example",
            code: `import matplotlib.pyplot as plt
import numpy as np

# Generate data
x = np.linspace(0, 10, 100)
y = np.sin(x)
z = np.cos(x)

# Create plot
plt.figure(figsize=(8, 6))
plt.plot(x, y, label='Sin(x)', color='blue', linewidth=2)
plt.plot(x, z, label='Cos(x)', color='red', linestyle='--', linewidth=2)

plt.title('Sine and Cosine Waves')
plt.xlabel('X Axis')
plt.ylabel('Y Axis')
plt.legend()
plt.grid(True)

# Show plot
plt.show()`
        },
        {
            name: "NumPy Matrix",
            icon: "fa-solid fa-calculator",
            description: "Matrix operations with NumPy",
            code: `import numpy as np

# Create matrices
A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])

print("Matrix A:")
print(A)
print("\nMatrix B:")
print(B)

# Matrix multiplication
C = np.dot(A, B)
print("\nDot Product (A . B):")
print(C)

# Eigenvalues
eigenvalues, eigenvectors = np.linalg.eig(C)
print("\nEigenvalues of C:")
print(eigenvalues)`
        }
    ]
};
