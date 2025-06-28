let scene, camera, renderer, globe, issMarker, controls;

export async function initializeGlobe(container, dotNetHelper) {
    // Scene setup
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    camera.position.z = 2;

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 600);
    container.appendChild(renderer.domElement);

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;

    // Create Earth
    createEarth();

    // Create ISS marker
    createISSMarker(0, 0);

    // Animation loop
    animate();
}

function createEarth() {
    const geometry = new THREE.SphereGeometry(1, 64, 64);

    // Load Earth texture
    const texture = new THREE.TextureLoader().load('earth-texture.jpg');
    const material = new THREE.MeshPhongMaterial({ map: texture });

    globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    // Add directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
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

    const geometry = new THREE.SphereGeometry(0.02, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    issMarker = new THREE.Mesh(geometry, material);
    issMarker.position.set(x, y, z);

    scene.add(issMarker);
}

export function updateISSPosition(lat, lon) {
    createISSMarker(lat, lon);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);

    // Rotate Earth slowly
    if (globe) globe.rotation.y += 0.0005;
}