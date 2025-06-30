let scene, camera, renderer, globe, issMarker, controls;
let issPath = []; // To store ISS positions for path visualization
let pathLine; // To visualize the ISS path

export async function initializeGlobe(container, dotNetRef) {
    const containerElement = container;

    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Camera - position slightly angled for better view
    camera = new THREE.PerspectiveCamera(75, containerElement.clientWidth / containerElement.clientHeight, 0.1, 1000);
    camera.position.z = 2.5;
    camera.position.y = 0.5; // Slightly elevated view

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerElement.clientWidth, containerElement.clientHeight);
    containerElement.appendChild(renderer.domElement);

    // Controls - allow user to rotate the globe manually
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.enableRotate = true;
    controls.autoRotate = false;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Create Earth
    createEarth();

    // Create initial ISS marker at 0,0
    createIssMarker(0, 0);

    // Create path visualization
    createPathVisualization();

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

    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');
    const bumpMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_normal_2048.jpg');
    const specularMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_normal_2048.jpg');

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


function createPathVisualization() {
    const material = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
    const geometry = new THREE.BufferGeometry();
    pathLine = new THREE.Line(geometry, material);
    scene.add(pathLine);
}

function updatePath(newLat, newLon) {
    // Add new position to path
    issPath.push(latLonToPosition(newLat, newLon, 1.02));

    // Limit path length to prevent memory issues
    if (issPath.length > 100) {
        issPath.shift();
    }

    // Update path visualization
    const positions = [];
    issPath.forEach(pos => {
        positions.push(pos.x, pos.y, pos.z);
    });

    pathLine.geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
    );
}

function updateMarkerPosition(lat, lon) {
    const position = latLonToPosition(lat, lon, 1.02);
    issMarker.position.copy(position);

    // Make the ISS always face "forward" along its path
    if (issPath.length > 1) {
        const prevPos = issPath[issPath.length - 2] || position;
        const direction = new THREE.Vector3().subVectors(position, prevPos);
        issMarker.lookAt(direction.add(position));
    }
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
    updateMarkerPosition(lat, lon);

    // Update path visualization
    updatePath(lat, lon);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function createIssMarker(lat, lon) {
    // Remove existing marker if it exists
    if (issMarker) {
        scene.remove(issMarker);
    }

    // Convert lat/lon to 3D position
    const position = latLonToPosition(lat, lon, 1.02); // Slightly above surface

    // Create marker (simple red sphere for now)
    const geometry = new THREE.SphereGeometry(0.01, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    issMarker = new THREE.Mesh(geometry, material);
    issMarker.position.copy(position);
    scene.add(issMarker);
}
