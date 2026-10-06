import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js';

// ============================================================
// GABBA AFTER DARK — mobile-first survival prototype
// Procedural stand-ins only. No show art, models, music, or audio shipped.
// ============================================================

const CONFIG = {
  worldHalfSize: 25,
  playerHeight: 1.65,
  playerRadius: 0.42,
  walkSpeed: 4.25,
  sprintSpeed: 6.8,
  maxHealth: 100,
  renderScaleMobile: 0.74,
  renderScaleDesktop: 1,
  pickupRadius: 1.45,
  enemyDamagePerSecond: 27,
  enemyTouchRadius: 1.05,
  goobleSpawnSeconds: 240,
  goobleWarningSeconds: 210,
  lanceUnlockCount: 10,
};

const CHARACTERS = [
  { id: 'plex', name: 'Plex', color: 0xf6c642, x: -18, z: -17 },
  { id: 'muno', name: 'Muno', color: 0xe53e35, x: 18, z: -15 },
  { id: 'foofa', name: 'Foofa', color: 0xf37ca4, x: -17, z: 15 },
  { id: 'toodee', name: 'Toodie', color: 0x4a9be8, x: 17, z: 17 },
  { id: 'brobee', name: 'Brobee', color: 0x69b856, x: 2, z: -20 },
];

const POWERS = [
  {
    id: 'tummy', owner: 'Brobee', label: 'TUMMY', song: 'Party in My Tummy', icon: '♪', color: 0x83d36e,
    x: 11, z: 7, cooldown: 26,
    description: 'Healing song — restores 45 health.'
  },
  {
    id: 'flowers', owner: 'Foofa', label: 'FLOWERS', song: 'I Love Flowers', icon: '♪', color: 0xf5a4bf,
    x: -5, z: -11, cooldown: 24,
    description: 'Flower dizzy-lines confuse and stun nearby hunters.'
  },
  {
    id: 'bugs', owner: 'Muno', label: 'BUGS', song: 'I Like Bugs', icon: '♪', color: 0xe65b55,
    x: -11, z: 5, cooldown: 22,
    description: 'Ride a giant beetle under your POV for a burst of speed.'
  },
  {
    id: 'fish', owner: 'Toodie', label: 'FISH', song: 'I Like Fish', icon: '♪', color: 0x68b5ee,
    x: 14, z: -2, cooldown: 18,
    description: 'Creates a fishy scent trail toward Toodie, Brobee, or Party in My Tummy.'
  },
  {
    id: 'space', owner: 'Plex', label: 'SPACE', song: 'Give Baby Space', icon: '♪', color: 0xf9dd73,
    x: -14, z: -3, cooldown: 32,
    description: 'Sends every active hunter to the far side of the map.'
  },
];

const WALLS = [
  [-21, 0, 2, 34, 4], [21, 0, 2, 34, 4],
  [0, -22, 34, 2, 4], [0, 22, 34, 2, 4],
  [-10, -12, 12, 2, 3.2], [8, -11, 11, 2, 3.2],
  [-6, 11, 2, 13, 3.2], [8, 11, 2, 13, 3.2],
  [-15, 3, 9, 2, 3.2], [14, 3, 8, 2, 3.2],
  [0, 1, 2, 12, 3.2], [-1, -16, 2, 7, 3.2],
  [-13, 16, 2, 7, 3.2], [14, -17, 2, 6, 3.2],
];

const gameEl = document.querySelector('#game');
const hudEl = document.querySelector('#hud');
const startScreen = document.querySelector('#start-screen');
const endScreen = document.querySelector('#end-screen');
const startButton = document.querySelector('#start-button');
const restartButton = document.querySelector('#restart-button');
const healthFill = document.querySelector('#health-fill');
const countEl = document.querySelector('#count');
const objectiveEl = document.querySelector('#objective');
const timerEl = document.querySelector('#timer');
const threatEl = document.querySelector('#threat');
const messageEl = document.querySelector('#message');
const joystickEl = document.querySelector('#joystick');
const joystickKnob = document.querySelector('#joystick-knob');
const sprintEl = document.querySelector('#sprint');
const powerButtonsEl = document.querySelector('#power-buttons');
const endEyebrow = document.querySelector('#end-eyebrow');
const endTitle = document.querySelector('#end-title');
const endCopy = document.querySelector('#end-copy');
const bugRideEl = document.querySelector('#bug-ride');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020205);
scene.fog = new THREE.FogExp2(0x020205, 0.038);

const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.05, 85);
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.shadowMap.enabled = false;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.domElement.setAttribute('aria-label', '3D game view');
gameEl.appendChild(renderer.domElement);

const clock = new THREE.Clock();
const player = {
  position: new THREE.Vector3(0, CONFIG.playerHeight, 0),
  yaw: 0,
  pitch: 0,
  health: CONFIG.maxHealth,
  sprinting: false,
  collected: new Set(),
  unlocked: new Set(),
  powerReadyAt: new Map(),
  bugRideUntil: 0,
};

const collectibles = [];
const collectibleById = new Map();
const enemies = [];
const collisionBoxes = [];
const scentParticles = [];
const dizzyEffects = [];
const keys = new Set();
let started = false;
let ended = false;
let messageTimer = null;
let pickupSoundCtx = null;
let gameStartTime = 0;
let goobleSpawned = false;
let goobleWarned = false;
let lanceUnlocked = false;
let lanceTV = null;
let lanceScreen = null;
let scentUntil = 0;
let scentTargetId = null;

// ---------- visual setup ----------
scene.add(new THREE.HemisphereLight(0x61709b, 0x120b12, 0.22));
const moon = new THREE.DirectionalLight(0x8ca6ff, 0.35);
moon.position.set(-8, 16, 6);
scene.add(moon);

const flashlight = new THREE.SpotLight(0xf0f0d8, 6.4, 17, Math.PI / 7, 0.55, 1.35);
flashlight.position.set(0, 0, 0);
flashlight.target.position.set(0, 0, -4);
camera.add(flashlight);
camera.add(flashlight.target);
scene.add(camera);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 60),
  new THREE.MeshLambertMaterial({ color: 0x111116 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const grid = new THREE.GridHelper(50, 25, 0x272431, 0x17151c);
grid.position.y = 0.012;
scene.add(grid);

const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x292831 });
for (const [x, z, w, d, h] of WALLS) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMaterial);
  wall.position.set(x, h / 2, z);
  scene.add(wall);
  collisionBoxes.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
}

// Sparse dead-garden props for a cheap creepy silhouette on phones.
const postMat = new THREE.MeshLambertMaterial({ color: 0x18151b });
for (let i = 0; i < 26; i++) {
  const a = (i / 26) * Math.PI * 2;
  const r = 19 + (i % 3) * 1.35;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 2.5 + (i % 4) * .25, 5), postMat);
  post.position.set(Math.cos(a) * r, 1.3, Math.sin(a) * r);
  post.rotation.z = ((i % 5) - 2) * .035;
  scene.add(post);
}

function makeCharacterStandIn(def) {
  const root = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: def.color, emissive: def.color, emissiveIntensity: 0.14 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.46, 0.85, 4, 8), mat);
  body.position.y = 0.95;
  root.add(body);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: 0xf5f5ee }));
  eye.position.set(0, 1.22, -0.43);
  root.add(eye);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.045, 6, 20), new THREE.MeshBasicMaterial({ color: def.color }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.08;
  root.add(ring);
  root.position.set(def.x, 0.05, def.z);
  root.userData = { type: 'character', id: def.id, name: def.name, color: def.color };
  scene.add(root);
  collectibles.push(root);
  collectibleById.set(def.id, root);
}

function makeMusicNoteGeometry(color) {
  const root = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.29, 9, 7), mat);
  head.scale.set(1.25, .8, .72);
  head.position.set(-.17, .55, 0);
  root.add(head);
  const stem = new THREE.Mesh(new THREE.BoxGeometry(.11, .8, .11), mat);
  stem.position.set(.08, .93, 0);
  root.add(stem);
  const flag = new THREE.Mesh(new THREE.BoxGeometry(.4, .11, .11), mat);
  flag.position.set(.23, 1.28, 0);
  flag.rotation.z = -.24;
  root.add(flag);
  return root;
}

function makeSongStandIn(def) {
  const root = new THREE.Group();
  const note = makeMusicNoteGeometry(def.color);
  root.add(note);
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.82, 0.035, 5, 20),
    new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: .85 })
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.y = .75;
  root.add(halo);
  root.position.set(def.x, 0.12, def.z);
  root.userData = { type: 'power', id: def.id, name: def.song, owner: def.owner, color: def.color };
  scene.add(root);
  collectibles.push(root);
  collectibleById.set(def.id, root);
}

CHARACTERS.forEach(makeCharacterStandIn);
POWERS.forEach(makeSongStandIn);

function makeLanceTV() {
  const root = new THREE.Group();
  const shell = new THREE.Mesh(
    new THREE.BoxGeometry(4.5, 3.25, 1.3),
    new THREE.MeshLambertMaterial({ color: 0x211c2a, emissive: 0x100a18, emissiveIntensity: .5 })
  );
  shell.position.y = 1.9;
  root.add(shell);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(3.5, 2.15),
    new THREE.MeshBasicMaterial({ color: 0x111726 })
  );
  screen.position.set(0, 2.0, -0.66);
  root.add(screen);
  lanceScreen = screen;

  // Original geometric stand-in for DJ Lance inside the TV.
  const lance = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.38, .85, 4, 8), new THREE.MeshBasicMaterial({ color: 0xf47a27 }));
  body.position.y = 1.95;
  lance.add(body);
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(.55, .65, .26, 8), new THREE.MeshBasicMaterial({ color: 0xf47a27 }));
  hat.position.y = 2.8;
  lance.add(hat);
  lance.position.z = -.73;
  root.add(lance);

  const leftKnob = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .12, 8), new THREE.MeshBasicMaterial({ color: 0xc8b95b }));
  leftKnob.rotation.x = Math.PI / 2;
  leftKnob.position.set(1.75, 1.15, -.69);
  root.add(leftKnob);
  const rightKnob = leftKnob.clone();
  rightKnob.position.x = 1.38;
  root.add(rightKnob);

  const antennaMat = new THREE.MeshBasicMaterial({ color: 0x6d6772 });
  for (const dir of [-1, 1]) {
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1.25, 5), antennaMat);
    antenna.position.set(.32 * dir, 3.95, 0);
    antenna.rotation.z = dir * .42;
    root.add(antenna);
  }

  root.position.set(0, 0, 19.4);
  root.userData = { type: 'lance-tv' };
  scene.add(root);
  collisionBoxes.push({ minX: -2.3, maxX: 2.3, minZ: 18.65, maxZ: 20.2 });
  lanceTV = root;
}
makeLanceTV();

function makeEnemy(characterDef, index, options = {}) {
  const root = new THREE.Group();
  const isGooble = options.gooble === true;
  const baseColor = isGooble ? 0x5c58a3 : characterDef.color;
  const mat = new THREE.MeshLambertMaterial({
    color: isGooble ? 0x16131f : 0x08080a,
    emissive: baseColor,
    emissiveIntensity: isGooble ? .16 : .22,
  });
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(isGooble ? .66 : .58, isGooble ? 1.75 : 2.0, 4, 7),
    mat
  );
  body.position.y = 1.58;
  root.add(body);

  const faceMat = new THREE.MeshBasicMaterial({ color: isGooble ? 0xb8b0d8 : baseColor });
  const face = new THREE.Mesh(new THREE.SphereGeometry(.28, 8, 6), faceMat);
  face.scale.set(.78, 1.25, .22);
  face.position.set(0, 2.55, -.5);
  root.add(face);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xf3f0e8 });
  for (const x of [-.09, .09]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.035, 6, 5), eyeMat);
    eye.position.set(x, 2.61, -.57);
    root.add(eye);
  }

  const spawnPoints = [
    [-22, -18], [22, 18], [-22, 18], [22, -18], [0, 23], [0, -23]
  ];
  const [sx, sz] = spawnPoints[index % spawnPoints.length];
  root.position.set(sx, 0, sz);
  root.userData = {
    id: isGooble ? 'gooble' : 'hunter-' + characterDef.id,
    name: isGooble ? 'Gooble' : characterDef.name + ' hunter',
    speed: isGooble ? 1.05 : 1.52 + index * .16,
    stunnedUntil: 0,
    phase: Math.random() * 10,
    isGooble,
  };
  scene.add(root);
  enemies.push(root);

  if (isGooble) {
    showMessage('GOOBLE HAS ENTERED GABBA LAND. He is slow. He does not stop.', 4400);
    beep(92, .5);
  } else {
    showMessage(characterDef.name + ' is rescued. Something shaped like ' + characterDef.name + ' woke up.', 3200);
  }
}

function buildPowerButtons() {
  powerButtonsEl.innerHTML = '';
  POWERS.forEach((power, i) => {
    const btn = document.createElement('button');
    btn.className = 'power';
    btn.dataset.power = power.id;
    btn.innerHTML = '\n      <span class="music-icon">' + power.icon + '</span>\n      <span class="power-copy"><b>' + power.song + '</b><small>' + power.owner + ' · ' + power.label + '</small></span>\n      <span class="num">' + (i + 1) + '</span>\n      <div class="cool"></div>';
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); usePower(power.id); });
    powerButtonsEl.appendChild(btn);
  });
}
buildPowerButtons();

// ---------- controls ----------
const joystick = { x: 0, y: 0, pointerId: null };
function updateJoystick(clientX, clientY) {
  const rect = joystickEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  let dx = clientX - cx;
  let dy = clientY - cy;
  const max = rect.width * .32;
  const len = Math.hypot(dx, dy) || 1;
  if (len > max) { dx = dx / len * max; dy = dy / len * max; }
  joystick.x = dx / max;
  joystick.y = dy / max;
  joystickKnob.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
}
function resetJoystick() {
  joystick.x = 0; joystick.y = 0; joystick.pointerId = null;
  joystickKnob.style.transform = 'translate(-50%,-50%)';
}
joystickEl.addEventListener('pointerdown', e => {
  e.preventDefault();
  joystick.pointerId = e.pointerId;
  joystickEl.setPointerCapture(e.pointerId);
  updateJoystick(e.clientX, e.clientY);
});
joystickEl.addEventListener('pointermove', e => { if (e.pointerId === joystick.pointerId) updateJoystick(e.clientX, e.clientY); });
joystickEl.addEventListener('pointerup', e => { if (e.pointerId === joystick.pointerId) resetJoystick(); });
joystickEl.addEventListener('pointercancel', resetJoystick);

function setSprint(on) {
  player.sprinting = on;
  sprintEl.classList.toggle('active', on);
}
sprintEl.addEventListener('pointerdown', e => { e.preventDefault(); sprintEl.setPointerCapture(e.pointerId); setSprint(true); });
sprintEl.addEventListener('pointerup', () => setSprint(false));
sprintEl.addEventListener('pointercancel', () => setSprint(false));

let lookPointer = null;
let lastLookX = 0;
let lastLookY = 0;
renderer.domElement.addEventListener('pointerdown', e => {
  if (!started || ended) return;
  if (e.pointerType === 'touch' && e.clientX < innerWidth * .43) return;
  lookPointer = e.pointerId;
  lastLookX = e.clientX;
  lastLookY = e.clientY;
  renderer.domElement.setPointerCapture?.(e.pointerId);
});
renderer.domElement.addEventListener('pointermove', e => {
  if (e.pointerId !== lookPointer) return;
  const dx = e.clientX - lastLookX;
  const dy = e.clientY - lastLookY;
  lastLookX = e.clientX;
  lastLookY = e.clientY;
  const sensitivity = e.pointerType === 'touch' ? .0043 : .003;
  player.yaw -= dx * sensitivity;
  player.pitch -= dy * sensitivity;
  player.pitch = THREE.MathUtils.clamp(player.pitch, -1.1, 1.1);
});
renderer.domElement.addEventListener('pointerup', e => { if (e.pointerId === lookPointer) lookPointer = null; });
renderer.domElement.addEventListener('pointercancel', e => { if (e.pointerId === lookPointer) lookPointer = null; });

addEventListener('keydown', e => {
  keys.add(e.code);
  if (/^Digit[1-5]$/.test(e.code)) usePower(POWERS[Number(e.code.slice(-1)) - 1]?.id);
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => { keys.clear(); setSprint(false); resetJoystick(); });

// ---------- game actions ----------
function showMessage(text, ms = 2700) {
  messageEl.textContent = text;
  messageEl.classList.add('show');
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => messageEl.classList.remove('show'), ms);
}

function beep(frequency = 520, duration = .07) {
  try {
    pickupSoundCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    const osc = pickupSoundCtx.createOscillator();
    const gain = pickupSoundCtx.createGain();
    osc.frequency.value = frequency;
    osc.type = 'square';
    gain.gain.value = .025;
    osc.connect(gain).connect(pickupSoundCtx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(.0001, pickupSoundCtx.currentTime + duration);
    osc.stop(pickupSoundCtx.currentTime + duration);
  } catch (_) {}
}

function collect(item) {
  if (player.collected.has(item.userData.id)) return;
  player.collected.add(item.userData.id);
  scene.remove(item);
  beep(item.userData.type === 'character' ? 220 : 720, .11);

  if (item.userData.type === 'character') {
    const def = CHARACTERS.find(c => c.id === item.userData.id);
    makeEnemy(def, enemies.length);
  } else {
    player.unlocked.add(item.userData.id);
    const power = POWERS.find(p => p.id === item.userData.id);
    showMessage(power.owner + ': ' + power.song + ' unlocked — ' + power.description, 3600);
  }

  if (player.collected.size >= CONFIG.lanceUnlockCount && !lanceUnlocked) {
    lanceUnlocked = true;
    showMessage('ALL TEN FOUND. THE TV BOX UNLOCKED — GET BACK TO DJ LANCE.', 5200);
    beep(1040, .28);
  }
  updateHud();
}

function makeDizzyFlowerEffect(enemy, now) {
  const group = new THREE.Group();
  const petalMat = new THREE.MeshBasicMaterial({ color: 0xff8ec4, transparent: true, opacity: .8 });
  for (let i = 0; i < 5; i++) {
    const petal = new THREE.Mesh(new THREE.SphereGeometry(.09, 5, 4), petalMat);
    const a = i / 5 * Math.PI * 2;
    petal.position.set(Math.cos(a) * .32, 0, Math.sin(a) * .32);
    petal.scale.set(1.5, .7, 1);
    group.add(petal);
  }
  const center = new THREE.Mesh(new THREE.SphereGeometry(.08, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffe85b }));
  group.add(center);
  group.position.copy(enemy.position);
  group.position.y = 3.05;
  scene.add(group);
  dizzyEffects.push({ group, enemy, created: now, until: now + 5.5 });
}

function sendHuntersFarAway() {
  const candidates = [
    new THREE.Vector3(-23, 0, -23), new THREE.Vector3(23, 0, -23),
    new THREE.Vector3(-23, 0, 23), new THREE.Vector3(23, 0, 23),
    new THREE.Vector3(0, 0, -24), new THREE.Vector3(0, 0, 24),
  ].sort((a, b) => b.distanceTo(player.position) - a.distanceTo(player.position));
  enemies.forEach((enemy, i) => {
    const target = candidates[i % candidates.length];
    enemy.position.set(target.x + (i % 2 ? .6 : -.6), 0, target.z);
  });
}

function chooseScentTarget() {
  const priority = ['toodee', 'brobee', 'tummy'];
  const possible = priority
    .map(id => collectibleById.get(id))
    .filter(item => item?.parent && !player.collected.has(item.userData.id));
  if (!possible.length) return null;
  possible.sort((a, b) => a.position.distanceTo(player.position) - b.position.distanceTo(player.position));
  return possible[0];
}

function buildScentTrail(target) {
  for (const particle of scentParticles) scene.remove(particle);
  scentParticles.length = 0;
  if (!target) return;

  const from = new THREE.Vector3(player.position.x, .22, player.position.z);
  const to = new THREE.Vector3(target.position.x, .22, target.position.z);
  const distance = from.distanceTo(to);
  const steps = Math.min(22, Math.max(5, Math.floor(distance / 1.15)));
  const mat = new THREE.MeshBasicMaterial({ color: 0x62c8ff, transparent: true, opacity: .72 });
  for (let i = 1; i <= steps; i++) {
    const p = from.clone().lerp(to, i / (steps + 1));
    const fish = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(.11, 6, 4), mat);
    body.scale.set(1.6, .65, .7);
    fish.add(body);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(.1, .18, 3), mat);
    tail.rotation.z = Math.PI / 2;
    tail.position.x = -.18;
    fish.add(tail);
    fish.position.copy(p);
    fish.lookAt(to.x, p.y, to.z);
    scene.add(fish);
    scentParticles.push(fish);
  }
}

function usePower(id) {
  if (!started || ended || !id || !player.unlocked.has(id)) return;
  const power = POWERS.find(x => x.id === id);
  const now = performance.now() / 1000;
  const readyAt = player.powerReadyAt.get(id) || 0;
  if (now < readyAt) {
    showMessage(power.song + ' recharging: ' + Math.ceil(readyAt - now) + 's', 900);
    return;
  }
  player.powerReadyAt.set(id, now + power.cooldown);
  beep(880, .08);

  if (id === 'tummy') {
    player.health = Math.min(CONFIG.maxHealth, player.health + 45);
    showMessage('PARTY IN MY TUMMY — +45 health.');
  }

  if (id === 'flowers') {
    let affected = 0;
    enemies.forEach(enemy => {
      if (enemy.position.distanceTo(player.position) < 13) {
        enemy.userData.stunnedUntil = now + 5.5;
        makeDizzyFlowerEffect(enemy, now);
        affected++;
      }
    });
    showMessage(affected ? 'I LOVE FLOWERS — ' + affected + ' hunter' + (affected === 1 ? '' : 's') + ' dizzy.' : 'I LOVE FLOWERS — no hunter was close enough.');
  }

  if (id === 'bugs') {
    player.bugRideUntil = now + 8;
    showMessage('I LIKE BUGS — giant beetle ride! Speed boosted for 8 seconds.');
  }

  if (id === 'fish') {
    const target = chooseScentTarget();
    if (!target) {
      showMessage('I LIKE FISH — Toodie, Brobee, and Party in My Tummy are already found.');
    } else {
      scentTargetId = target.userData.id;
      scentUntil = now + 12;
      buildScentTrail(target);
      showMessage('I LIKE FISH — scent trail locked onto ' + target.userData.name + '.', 3200);
    }
  }

  if (id === 'space') {
    sendHuntersFarAway();
    showMessage('GIVE BABY SPACE — every hunter was sent to the far side of Gabba Land.', 3300);
  }
  updateHud();
}

function updateHud() {
  countEl.textContent = player.collected.size + ' / 10';
  healthFill.style.width = Math.max(0, player.health) + '%';
  objectiveEl.textContent = lanceUnlocked ? 'RETURN TO TV' : 'DJ LANCE';

  const now = performance.now() / 1000;
  const elapsed = started ? Math.max(0, now - gameStartTime) : 0;
  const minutes = Math.floor(elapsed / 60);
  const seconds = Math.floor(elapsed % 60).toString().padStart(2, '0');
  timerEl.textContent = minutes + ':' + seconds;
  threatEl.textContent = goobleSpawned ? 'GOOBLE' : enemies.length ? enemies.length + ' AWAKE' : 'QUIET';

  document.querySelectorAll('.power').forEach(btn => {
    const id = btn.dataset.power;
    const unlocked = player.unlocked.has(id);
    const p = POWERS.find(x => x.id === id);
    const readyAt = player.powerReadyAt.get(id) || 0;
    const remaining = Math.max(0, readyAt - now);
    const ratio = p ? Math.min(1, remaining / p.cooldown) : 0;
    btn.classList.toggle('unlocked', unlocked);
    btn.classList.toggle('ready', unlocked && remaining <= 0);
    btn.querySelector('.cool').style.transform = 'scaleX(' + (unlocked ? 1 - ratio : 0) + ')';
  });
}

function finish(won) {
  if (ended) return;
  ended = true;
  hudEl.classList.add('hidden');
  endScreen.classList.add('active');
  document.body.classList.remove('danger', 'static-heavy');
  if (won) {
    endEyebrow.textContent = 'SUPER MUSIC FRIENDS SHOW SIGNAL RESTORED';
    endTitle.textContent = 'DJ LANCE IS OUT';
    endCopy.textContent = 'You found all five friends, recovered all five song powers, and made it back to the TV box alive.';
  } else {
    endEyebrow.textContent = 'SIGNAL LOST';
    endTitle.textContent = 'THE DARK GOT YOU';
    endCopy.textContent = 'You recovered ' + player.collected.size + ' of 10 collectibles. Try another route and save the songs for when the hunters stack up.';
  }
}

// ---------- collision ----------
function blocked(x, z) {
  const r = CONFIG.playerRadius;
  if (Math.abs(x) > CONFIG.worldHalfSize - r || Math.abs(z) > CONFIG.worldHalfSize - r) return true;
  return collisionBoxes.some(b => x > b.minX - r && x < b.maxX + r && z > b.minZ - r && z < b.maxZ + r);
}

function movePlayer(dt, now) {
  let strafe = joystick.x;
  let forward = -joystick.y;
  if (keys.has('KeyW') || keys.has('ArrowUp')) forward += 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) forward -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) strafe += 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) strafe -= 1;
  const mag = Math.hypot(strafe, forward);
  if (mag > 1) { strafe /= mag; forward /= mag; }

  const sprinting = player.sprinting || keys.has('ShiftLeft') || keys.has('ShiftRight');
  let speed = sprinting ? CONFIG.sprintSpeed : CONFIG.walkSpeed;
  if (now < player.bugRideUntil) speed *= 1.78;

  const sin = Math.sin(player.yaw);
  const cos = Math.cos(player.yaw);
  const dx = (strafe * cos - forward * sin) * speed * dt;
  const dz = (-strafe * sin - forward * cos) * speed * dt;

  const nx = player.position.x + dx;
  if (!blocked(nx, player.position.z)) player.position.x = nx;
  const nz = player.position.z + dz;
  if (!blocked(player.position.x, nz)) player.position.z = nz;

  camera.position.copy(player.position);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;
  bugRideEl.classList.toggle('active', now < player.bugRideUntil);
}

function updateCollectibles(t, dt) {
  for (const item of collectibles) {
    if (!item.parent) continue;
    item.rotation.y += dt * .65;
    item.position.y = .08 + Math.sin(t * 2 + item.position.x) * .10;
    const dx = item.position.x - player.position.x;
    const dz = item.position.z - player.position.z;
    if (dx * dx + dz * dz < CONFIG.pickupRadius * CONFIG.pickupRadius) collect(item);
  }
}

function updateLanceTV(now) {
  if (!lanceTV) return;
  const dist = Math.hypot(lanceTV.position.x - player.position.x, lanceTV.position.z - player.position.z);
  if (lanceScreen) {
    if (lanceUnlocked) {
      const flicker = .65 + Math.sin(now * 10) * .25;
      lanceScreen.material.color.setRGB(.12 * flicker, .45 * flicker, .24 * flicker);
    } else {
      const flicker = .65 + Math.sin(now * 3.1) * .08;
      lanceScreen.material.color.setRGB(.06 * flicker, .08 * flicker, .13 * flicker);
    }
  }
  if (lanceUnlocked && dist < 3.0) finish(true);
}

function updateScentTrail(now) {
  if (now >= scentUntil || !scentTargetId) {
    for (const particle of scentParticles) scene.remove(particle);
    scentParticles.length = 0;
    scentTargetId = null;
    return;
  }
  const target = collectibleById.get(scentTargetId);
  if (!target?.parent) {
    const next = chooseScentTarget();
    if (!next) {
      scentUntil = 0;
      return;
    }
    scentTargetId = next.userData.id;
    buildScentTrail(next);
  }
  scentParticles.forEach((p, i) => {
    p.position.y = .2 + Math.sin(now * 4 + i * .7) * .07;
    p.visible = Math.sin(now * 7 + i * .45) > -.55;
  });
}

function updateDizzyEffects(now) {
  for (let i = dizzyEffects.length - 1; i >= 0; i--) {
    const fx = dizzyEffects[i];
    if (now >= fx.until || !fx.enemy.parent) {
      scene.remove(fx.group);
      dizzyEffects.splice(i, 1);
      continue;
    }
    fx.group.position.x = fx.enemy.position.x;
    fx.group.position.z = fx.enemy.position.z;
    fx.group.rotation.y += .09;
    fx.group.position.y = 3.0 + Math.sin(now * 5) * .12;
  }
}

function spawnGoobleIfNeeded(elapsed) {
  if (!goobleWarned && elapsed >= CONFIG.goobleWarningSeconds) {
    goobleWarned = true;
    showMessage('A LOW VOICE ECHOES FROM SOMEWHERE FAR AWAY...', 4200);
    beep(126, .32);
  }
  if (!goobleSpawned && elapsed >= CONFIG.goobleSpawnSeconds) {
    goobleSpawned = true;
    makeEnemy({ id: 'gooble', name: 'Gooble', color: 0x5c58a3 }, enemies.length, { gooble: true });
  }
}

function updateEnemies(dt, now) {
  let nearest = Infinity;

  for (const enemy of enemies) {
    const ex = enemy.position.x;
    const ez = enemy.position.z;
    const pdx = player.position.x - ex;
    const pdz = player.position.z - ez;
    const playerDist = Math.hypot(pdx, pdz);
    nearest = Math.min(nearest, playerDist);

    if (enemy.userData.stunnedUntil > now) {
      enemy.rotation.z = Math.sin(now * 18) * .08;
      continue;
    }
    enemy.rotation.z = 0;

    let dx = pdx;
    let dz = pdz;
    const dist = Math.hypot(dx, dz) || 1;
    dx /= dist;
    dz /= dist;

    const moveSpeed = enemy.userData.speed;
    const nx = enemy.position.x + dx * moveSpeed * dt;
    const nz = enemy.position.z + dz * moveSpeed * dt;
    if (Math.abs(nx) < 24.5) enemy.position.x = nx;
    if (Math.abs(nz) < 24.5) enemy.position.z = nz;
    enemy.lookAt(player.position.x, 1.55, player.position.z);
    enemy.position.y = Math.sin(now * 2.8 + enemy.userData.phase) * .06;

    if (playerDist < CONFIG.enemyTouchRadius) {
      const multiplier = enemy.userData.isGooble ? .72 : 1;
      player.health -= CONFIG.enemyDamagePerSecond * multiplier * dt;
      if (player.health <= 0) { player.health = 0; finish(false); }
    }
  }

  const close = nearest < 4.7 && !ended;
  document.body.classList.toggle('danger', close);
  document.body.classList.toggle('static-heavy', nearest < 7.5 && !ended);
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .05);
  const now = performance.now() / 1000;
  if (started && !ended) {
    const elapsed = now - gameStartTime;
    movePlayer(dt, now);
    updateCollectibles(now, dt);
    updateLanceTV(now);
    updateScentTrail(now);
    updateDizzyEffects(now);
    spawnGoobleIfNeeded(elapsed);
    updateEnemies(dt, now);
    updateHud();
  }
  renderer.render(scene, camera);
}

function resize() {
  const coarse = matchMedia('(pointer:coarse)').matches || innerWidth < 820;
  const scale = coarse ? CONFIG.renderScaleMobile : CONFIG.renderScaleDesktop;
  renderer.setPixelRatio(1);
  renderer.setSize(Math.max(1, Math.floor(innerWidth * scale)), Math.max(1, Math.floor(innerHeight * scale)), false);
  renderer.domElement.style.width = innerWidth + 'px';
  renderer.domElement.style.height = innerHeight + 'px';
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

function beginGame() {
  started = true;
  gameStartTime = performance.now() / 1000;
  startScreen.classList.remove('active');
  endScreen.classList.remove('active');
  hudEl.classList.remove('hidden');
  showMessage('Find the five friends and five song powers. Every friend you rescue wakes their hunter.', 4700);
  pickupSoundCtx?.resume?.();
}

startButton.addEventListener('click', beginGame);
restartButton.addEventListener('click', () => location.reload());

updateHud();
animate();
