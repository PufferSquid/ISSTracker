let scene, camera, renderer, globe, issMarker, controls;

export async function initializeGlobe(container, dotNetRef) {
    const containerElement = container;

    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Camera
    camera = new THREE.PerspectiveCamera(75, containerElement.clientWidth / containerElement.clientHeight, 0.1, 1000);
    camera.position.z = 2.5;

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerElement.clientWidth, containerElement.clientHeight);
    containerElement.appendChild(renderer.domElement);

    // Controls - disable user interaction to let us control rotation
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.enableRotate = false;
    controls.autoRotate = false;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Create Earth
    createEarth();

    // Create ISS marker
    createIssMarker(0, 0); // Start at 0,0

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = containerElement.clientWidth / containerElement.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(containerElement.clientWidth, containerElement.clientHeight);
    });

    // Start animation loop
    animate();
}

function createEarth() {
    const geometry = new THREE.SphereGeometry(1, 64, 64);

    // Load Earth texture
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg');
    const bumpMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg');
    const specularMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg');

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
}

function createIssMarker(lat, lon) {
    // Remove existing marker if it exists
    if (issMarker) {
        scene.remove(issMarker);
    }

    // Convert lat/lon to 3D position
    const position = latLonToPosition(lat, lon, 1.02); // Slightly above surface

    // Create marker (simple red sphere for now)
    const geometry = new THREE.SphereGeometry(0.02, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    issMarker = new THREE.Mesh(geometry, material);
    issMarker.position.copy(position);
    scene.add(issMarker);
}

function latLonToPosition(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
}

export function updateIssPosition(lat, lon) {
    // Update ISS marker position
    const newPosition = latLonToPosition(lat, lon, 1.02);
    issMarker.position.copy(newPosition);

    // Rotate the globe to keep ISS centered
    // We'll rotate the opposite way to keep ISS in view
    const targetRotationY = -lon * (Math.PI / 180);
    const targetRotationX = lat * (Math.PI / 180);

    // Smooth rotation
    gsap.to(globe.rotation, {
        y: targetRotationY,
        x: targetRotationX,
        duration: 1
    });
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}