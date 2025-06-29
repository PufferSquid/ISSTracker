let scene, camera, renderer, globe, issMarker, controls;
let animationId;
let dotNetHelper;

export function initializeGlobe(container, helper) {
    dotNetHelper = helper;

    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Camera
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 2;

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.minDistance = 1.5;
    controls.maxDistance = 5;

    // Create Earth
    createEarth();

    // Create ISS marker
    createISSMarker(0, 0);

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Start animation
    animate();
}

function createEarth() {
    const geometry = new THREE.SphereGeometry(1, 64, 64);

    // Load textures
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('textures/earth-texture.jpg');
    const bumpMap = textureLoader.load('textures/earth-bump.jpg');
    const specularMap = textureLoader.load('textures/earth-specular.jpg');

    const material = new THREE.MeshPhongMaterial({
        map: texture,
        bumpMap: bumpMap,
        bumpScale: 0.05,
        specularMap: specularMap,
        specular: new THREE.Color('grey'),
        shininess: 5
    });

    globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    // Add directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Add stars background
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.05
    });

    const starsVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

function createISSMarker(lat, lon) {
    // Convert lat/lon to 3D position
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const radius = 1.02; // Slightly above Earth's surface
    const x = - (radius * Math.sin(phi) * Math.cos(theta));
    const y = (radius * Math.cos(phi));
    const z = (radius * Math.sin(phi) * Math.sin(theta));

    if (issMarker) scene.remove(issMarker);

    // Create marker with glow effect
    const geometry = new THREE.SphereGeometry(0.02, 16, 16);
    const material = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.8
    });
    issMarker = new THREE.Mesh(geometry, material);
    issMarker.position.set(x, y, z);

    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    issMarker.add(glow);

    scene.add(issMarker);

    // Notify Blazor of position change
    if (dotNetHelper) {
        dotNetHelper.invokeMethodAsync('SetISSPosition', lat, lon);
    }
}

export function updateISSPosition(lat, lon) {
    createISSMarker(lat, lon);
}

function animate() {
    animationId = requestAnimationFrame(animate);

    // Rotate Earth slowly (0.1 degrees per frame)
    if (globe) globe.rotation.y += 0.001;

    controls.update();
    renderer.render(scene, camera);
}

function onWindowResize() {
    const container = renderer.domElement.parentElement;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

export function disposeGlobe() {
    cancelAnimationFrame(animationId);
    window.removeEventListener('resize', onWindowResize);

    // Clean up Three.js objects
    if (renderer) {
        renderer.dispose();
    }

    if (controls) {
        controls.dispose();
    }

    // Remove canvas from DOM
    if (renderer?.domElement?.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
}