// Scene setup
const scene = new THREE.Scene();
const sceneContainer = document.getElementById('scene-container');
let width = sceneContainer.clientWidth;
let height = sceneContainer.clientHeight;
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
sceneContainer.appendChild(renderer.domElement);

// OrbitControls for camera movement (will be bypassed when follow mode is active)
const controls = new THREE.OrbitControls(camera, renderer.domElement);

// Default camera initial position (set off to the left and above)
camera.position.set(-10, 10 * Math.tan(THREE.Math.degToRad(20)), 10);
controls.target.set(0, 0, 0);
controls.update();

// Particle
const particle = new THREE.Mesh(
  new THREE.SphereGeometry(0.1, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xff0000 })
);
scene.add(particle);

// Trail
const maxTrailPoints = 1000;
const trailPositions = [];
const trail = new THREE.Line(
  new THREE.BufferGeometry(),
  new THREE.LineBasicMaterial({ color: 0x0000ff })
);
scene.add(trail);

// Axes helper
scene.add(new THREE.AxesHelper(5));

// Simulation parameters with initial values.
let params = {
  mass: 1,
  charge: 1,
  B: 1,
  v_perp: 1,
  v_parallel: 1,
  speed: 1,
  followCamera: false,
  reset: function () {
    t = 0;
    trailPositions.length = 0;
  }
};

let t = 0;
const clock = new THREE.Clock();

// Fixed offset vector for camera follow mode:
// Here, horizontal offset in x is -10. For a 20° downward angle from horizontal,
// the vertical offset is: 10 * tan(20°) ≈ 3.64.
const fixedCameraOffset = new THREE.Vector3(-10, 10 * Math.tan(THREE.Math.degToRad(20)), 0);

// Function to update particle position based on simulation parameters.
function updateParticle() {
  const omega = Math.abs(params.charge * params.B / params.mass);
  if (omega === 0 || params.v_perp === 0) {
    particle.position.set(params.v_perp * t, 0, params.v_parallel * t);
  } else {
    const r = params.v_perp / omega;
    particle.position.set(
      r * Math.sin(omega * t),
      -r * (1 - Math.cos(omega * t)),
      params.v_parallel * t
    );
  }
  trailPositions.push(particle.position.clone());
  if (trailPositions.length > maxTrailPoints) trailPositions.shift();
  trail.geometry.setFromPoints(trailPositions);
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  t += params.speed * delta;
  updateParticle();

  // If follow mode is activated, update the camera's position relative to the particle.
  if (params.followCamera) {
    // Set camera position to particle position plus the fixed offset.
    camera.position.copy(particle.position).add(fixedCameraOffset);
    // The camera always looks at the particle.
    camera.lookAt(particle.position);
    // Optionally update the OrbitControls target if you want to keep it in sync.
    controls.target.copy(particle.position);
    controls.update();
  }
  
  renderer.render(scene, camera);
}
animate();

// --- Manual Configuration Menu Setup ---

// Helper to attach slider event listeners.
function bindSlider(inputId, valueId, paramName, resetOnChange = false) {
  const slider = document.getElementById(inputId);
  const valueDisplay = document.getElementById(valueId);
  slider.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    params[paramName] = value;
    valueDisplay.textContent = value;
    if (resetOnChange) {
      t = 0; 
      trailPositions.length = 0;
    }
  });
}

// Bind each slider to its parameter.
bindSlider('mass-input', 'mass-value', 'mass', true);
bindSlider('charge-input', 'charge-value', 'charge', true);
bindSlider('B-input', 'B-value', 'B', true);
bindSlider('v_perp-input', 'v_perp-value', 'v_perp', true);
bindSlider('v_parallel-input', 'v_parallel-value', 'v_parallel', true);
bindSlider('speed-input', 'speed-value', 'speed', false);

// Bind the Follow Particle checkbox.
const followCheckbox = document.getElementById('follow-checkbox');
followCheckbox.addEventListener('change', (e) => {
  params.followCamera = e.target.checked;
});

// Bind the Reset Simulation button.
const resetButton = document.getElementById('reset-btn');
resetButton.addEventListener('click', () => {
  params.reset();
});
  
// Handle window resize
function onWindowResize() {
  width = sceneContainer.clientWidth;
  height = sceneContainer.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
onWindowResize();
window.addEventListener('resize', onWindowResize);

// Also listen for flex container resize using ResizeObserver
const resizeObserver = new ResizeObserver(entries => {
  for (let entry of entries) {
    if (entry.target === sceneContainer) {
      onWindowResize();
    }
  }
});
resizeObserver.observe(sceneContainer);
