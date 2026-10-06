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
  renderScaleMobile: 1,
  renderScaleDesktop: 1,
  maxStamina: 100,
  staminaDrainPerSecond: 25,
  staminaRegenPerSecond: 18,
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
  [-25, 0, 1, 50, 2.4], [25, 0, 1, 50, 2.4],
  [0, -25, 50, 1, 2.4], [0, 25, 50, 1, 2.4],
  [-7, -7, 5, 1.3, 1.8], [8, -7, 5, 1.3, 1.8],
  [-7, 7, 5, 1.3, 1.8], [8, 7, 5, 1.3, 1.8],
];

const appShell = document.querySelector('#app-shell');
const screenFrame = document.querySelector('#screen-frame');
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
const lookstickEl = document.querySelector('#lookstick');
const lookstickKnob = document.querySelector('#lookstick-knob');
const sprintEl = document.querySelector('#sprint');
const fullscreenToggle = document.querySelector('#fullscreen-toggle');
const musicToggle = document.querySelector('#music-toggle');
const bgm = document.querySelector('#bgm');
const staminaFill = document.querySelector('#stamina-fill');
const minimap = document.querySelector('#minimap');
const minimapCtx = minimap.getContext('2d');
const powerButtonsEl = document.querySelector('#power-buttons');
const endEyebrow = document.querySelector('#end-eyebrow');
const endTitle = document.querySelector('#end-title');
const endCopy = document.querySelector('#end-copy');
const bugRideEl = document.querySelector('#bug-ride');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020205);
scene.fog = new THREE.FogExp2(0x020205, 0.038);

const camera = new THREE.PerspectiveCamera(72, 1, 0.05, 85);
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.shadowMap.enabled = false;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.domElement.setAttribute('aria-label', '3D game view');
gameEl.appendChild(renderer.domElement);

const clock = new THREE.Clock();
const player = {
  position: new THREE.Vector3(0, CONFIG.playerHeight, 14),
  yaw: 0,
  pitch: 0,
  health: CONFIG.maxHealth,
  stamina: CONFIG.maxStamina,
  sprinting: false,
  sprintToggle: false,
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

// ---------- Gabba Land ----------
scene.background = new THREE.Color(0x151a2c);
scene.fog = new THREE.FogExp2(0x151a2c, 0.017);

scene.add(new THREE.HemisphereLight(0xb8d9ff, 0x442b50, 1.25));
const moon = new THREE.DirectionalLight(0xfff0c7, 1.05);
moon.position.set(-8, 18, 9);
scene.add(moon);

const flashlight = new THREE.SpotLight(0xfff4d6, 8.2, 23, Math.PI / 6, 0.5, 1.2);
flashlight.position.set(0, 0, 0);
flashlight.target.position.set(0, 0, -5);
camera.add(flashlight);
camera.add(flashlight.target);
scene.add(camera);

function addGround(x, z, color) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(25, 25),
    new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: .08 })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0, z);
  scene.add(mesh);
}
addGround(-12.5, -12.5, 0x5b3b83); // Muno Land
addGround(-12.5,  12.5, 0x86a83d); // Foofa Land
addGround( 12.5, -12.5, 0x9a4e2a); // Brobee Land
addGround( 12.5,  12.5, 0x4b9fc8); // Toodee Land

const stationFloor = new THREE.Mesh(
  new THREE.CylinderGeometry(6.4, 6.4, .22, 20),
  new THREE.MeshLambertMaterial({ color: 0xd0a62a, emissive: 0x6c4d08, emissiveIntensity: .25 })
);
stationFloor.position.y = .11;
scene.add(stationFloor);

const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x332f43 });
for (const [x, z, w, d, h] of WALLS) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMaterial);
  wall.position.set(x, h / 2, z);
  scene.add(wall);
  collisionBoxes.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
}

const rockMat = new THREE.MeshLambertMaterial({ color: 0x8353a7 });
for (let i = 0; i < 13; i++) {
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(.65 + (i % 3) * .22, 0), rockMat);
  rock.scale.y = 1.2 + (i % 2) * .6;
  rock.position.set(-22 + (i % 5) * 4.1, .7, -22 + Math.floor(i / 5) * 4.5);
  scene.add(rock);
}

for (let i = 0; i < 52; i++) {
  const col = i % 8;
  const row = Math.floor(i / 8);
  const x = -23 + col * 3.0 + (row % 2) * .7;
  const z = 3.2 + row * 3.0;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.025, .045, .55 + (i % 3) * .12, 5), new THREE.MeshLambertMaterial({ color: 0x3d742d }));
  stem.position.set(x, .3, z);
  scene.add(stem);
  const flower = new THREE.Group();
  const petalColor = [0xff9fc5,0xffe86a,0xffffff,0xe98aff][i % 4];
  for (let p=0;p<6;p++) {
    const petal = new THREE.Mesh(new THREE.SphereGeometry(.13,6,4), new THREE.MeshBasicMaterial({ color: petalColor }));
    const a=p/6*Math.PI*2;
    petal.position.set(Math.cos(a)*.17, Math.sin(a)*.17, 0);
    petal.scale.set(.65,1,.45);
    flower.add(petal);
  }
  const center = new THREE.Mesh(new THREE.SphereGeometry(.08,6,4), new THREE.MeshBasicMaterial({ color: 0xffc83d }));
  flower.add(center);
  flower.position.set(x, .67 + (i % 3)*.1, z);
  flower.rotation.x = -.2;
  scene.add(flower);
}

const trunkMat = new THREE.MeshLambertMaterial({ color: 0x55321f });
const leafMat = new THREE.MeshLambertMaterial({ color: 0xc16a28 });
for (let i = 0; i < 13; i++) {
  const x = 4 + (i % 4) * 5.5, z = -22 + Math.floor(i / 4) * 5.6;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.18, .27, 2.4, 6), trunkMat);
  trunk.position.set(x, 1.2, z);
  scene.add(trunk);
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(.72 + (i % 3) * .12, 0), leafMat);
  crown.position.set(x, 2.5, z);
  scene.add(crown);
}

const iceMat = new THREE.MeshLambertMaterial({ color: 0xa9e9ff, emissive: 0x1c6680, emissiveIntensity: .18 });
for (let i = 0; i < 15; i++) {
  const shard = new THREE.Mesh(new THREE.ConeGeometry(.34 + (i % 3) * .1, 1.3 + (i % 4) * .3, 5), iceMat);
  shard.position.set(4 + (i % 4) * 5.5, .65, 4 + Math.floor(i / 4) * 5.3);
  scene.add(shard);
}

for (let i = 0; i < 8; i++) {
  const tower = new THREE.Mesh(new THREE.BoxGeometry(.55, 1.8, .55), new THREE.MeshLambertMaterial({ color: 0xe4c23a }));
  const a = i / 8 * Math.PI * 2;
  tower.position.set(Math.cos(a) * 5.1, .9, Math.sin(a) * 5.1);
  scene.add(tower);
}

function basicMat(color, dark = false) {
  return new THREE.MeshLambertMaterial({
    color: dark ? 0x101014 : color,
    emissive: color,
    emissiveIntensity: dark ? .18 : .12
  });
}
function eye(root, x, y, z, scale = 1) {
  const white = new THREE.Mesh(new THREE.SphereGeometry(.13 * scale, 10, 7), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  white.position.set(x, y, z);
  root.add(white);
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(.055 * scale, 8, 6), new THREE.MeshBasicMaterial({ color: 0x111111 }));
  pupil.position.set(x, y, z - .105 * scale);
  root.add(pupil);
}
function limb(root, x, y, length, color, horizontal = false) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(.08, length, 4, 7), basicMat(color));
  m.position.set(x, y, 0);
  if (horizontal) m.rotation.z = Math.PI / 2;
  root.add(m);
}
function makeGabbaFigure(def, dark = false) {
  const root = new THREE.Group();
  const c = def.color;

  if (def.id === 'plex') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(.82, 1.05, .5), basicMat(c, dark));
    body.position.y = 1.05; root.add(body);
    const face = new THREE.Mesh(new THREE.BoxGeometry(.58, .35, .04), new THREE.MeshBasicMaterial({ color: dark ? 0x080808 : 0x26252b }));
    face.position.set(0, 1.24, -.27); root.add(face);
    eye(root, -.14, 1.25, -.31, .72); eye(root, .14, 1.25, -.31, .72);
    limb(root, -.56, 1.05, .58, dark ? 0x777777 : 0xb9bdc4, true);
    limb(root,  .56, 1.05, .58, dark ? 0x777777 : 0xb9bdc4, true);
    limb(root, -.22, .37, .55, dark ? 0x777777 : 0xb9bdc4);
    limb(root,  .22, .37, .55, dark ? 0x777777 : 0xb9bdc4);
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.46,5), basicMat(dark ? 0x555555 : 0xc0c0c0));
    antenna.position.set(0,1.82,0); root.add(antenna);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(.09,7,5), basicMat(0xe64a3d,dark));
    ball.position.set(0,2.07,0); root.add(ball);
  } else if (def.id === 'muno') {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(.44, 1.2, 5, 9), basicMat(c, dark));
    body.position.y = 1.2; root.add(body);
    eye(root, 0, 1.55, -.43, 1.25);
    for (let i=0;i<14;i++) {
      const bump = new THREE.Mesh(new THREE.SphereGeometry(.07,5,4), basicMat(c,dark));
      const a=i*2.4; bump.position.set(Math.sin(a)*.41,.55+(i%6)*.23,Math.cos(a)*.34); root.add(bump);
    }
    limb(root,-.5,.9,.5,c,true); limb(root,.5,.9,.5,c,true);
  } else if (def.id === 'foofa') {
    const body = new THREE.Mesh(new THREE.SphereGeometry(.58, 10, 8), basicMat(c, dark));
    body.scale.set(.9,1.35,.82); body.position.y = 1.0; root.add(body);
    eye(root,-.16,1.25,-.48,.85); eye(root,.16,1.25,-.48,.85);
    const center = new THREE.Mesh(new THREE.SphereGeometry(.16,8,6), basicMat(0xffefef,dark)); center.position.set(0,1.86,0); root.add(center);
    for(let i=0;i<6;i++){ const p=new THREE.Mesh(new THREE.SphereGeometry(.19,7,5),basicMat(dark?0x553548:0xffd9e7,dark)); const a=i/6*Math.PI*2; p.position.set(Math.cos(a)*.28,1.86+Math.sin(a)*.28,0); p.scale.set(.65,1,.5); root.add(p); }
    limb(root,-.48,.98,.45,c,true); limb(root,.48,.98,.45,c,true);
  } else if (def.id === 'toodee') {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(.43,.82,5,8),basicMat(c,dark)); body.position.y=.98; root.add(body);
    eye(root,-.15,1.25,-.41,.85); eye(root,.15,1.25,-.41,.85);
    for(const x of [-.23,.23]) { const ear=new THREE.Mesh(new THREE.ConeGeometry(.16,.42,4),basicMat(c,dark)); ear.position.set(x,1.7,0); root.add(ear); }
    const belly=new THREE.Mesh(new THREE.SphereGeometry(.33,8,6),basicMat(dark?0x222a30:0x9fd7f2,dark)); belly.scale.set(.8,1.15,.25); belly.position.set(0,.9,-.38); root.add(belly);
    limb(root,-.48,.95,.45,c,true); limb(root,.48,.95,.45,c,true);
  } else if (def.id === 'brobee') {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(.47,.72,5,8),basicMat(c,dark)); body.position.y=.93; root.add(body);
    eye(root,-.15,1.18,-.44,.82); eye(root,.15,1.18,-.44,.82);
    for(const y of [.65,.92,1.19]) { const stripe=new THREE.Mesh(new THREE.TorusGeometry(.43,.07,5,14),basicMat(dark?0x113015:0x226f35,dark)); stripe.rotation.x=Math.PI/2; stripe.position.y=y; root.add(stripe); }
    for(const x of [-.23,.23]) { const horn=new THREE.Mesh(new THREE.ConeGeometry(.11,.34,5),basicMat(0xe85a41,dark)); horn.position.set(x,1.65,0); root.add(horn); }
    limb(root,-.5,.9,.45,c,true); limb(root,.5,.9,.45,c,true);
  } else {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(.5,.8,5,8),basicMat(0xe8e8f2,dark)); body.position.y=1; root.add(body);
    eye(root,-.14,1.22,-.45,.78); eye(root,.14,1.22,-.45,.78);
  }
  return root;
}

function makeCharacterStandIn(def) {
  const root = makeGabbaFigure(def, false);
  root.traverse(obj => {
    if (obj.isMesh && obj.material && 'emissiveIntensity' in obj.material) obj.material.emissiveIntensity *= 1.25;
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.05, 6, 20), new THREE.MeshBasicMaterial({ color: def.color }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.08;
  root.add(ring);
  root.position.set(def.x, 0.05, def.z);
  root.scale.setScalar(1.18);
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
  const isGooble = options.gooble === true;
  const def = isGooble ? { id: 'gooble', name: 'Gooble', color: 0xc7c1df } : characterDef;
  const root = makeGabbaFigure(def, true);
  root.scale.setScalar(isGooble ? 1.35 : 1.62);

  if (isGooble) {
    const tearMat = new THREE.MeshBasicMaterial({ color: 0x79bff0 });
    const tear = new THREE.Mesh(new THREE.SphereGeometry(.08,6,5), tearMat);
    tear.scale.set(.55,1.5,.45); tear.position.set(.18,1.05,-.48); root.add(tear);
  }

  const spawnPoints = [
    [-22, -18], [22, 18], [-22, 18], [22, -18], [0, 23], [0, -23]
  ];
  const [sx, sz] = spawnPoints[index % spawnPoints.length];
  root.position.set(sx, 0, sz);
  root.userData = {
    id: isGooble ? 'gooble' : 'hunter-' + characterDef.id,
    name: isGooble ? 'Gooble' : characterDef.name,
    speed: isGooble ? 1.05 : 1.52 + index * .16,
    stunnedUntil: 0,
    phase: Math.random() * 10,
    isGooble,
  };
  scene.add(root);
  enemies.push(root);

  if (isGooble) {
    showMessage('GOOBLE IS HERE.', 3300);
    beep(92, .5);
  } else {
    showMessage(characterDef.name.toUpperCase() + ' FOUND! RUN!', 2600);
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
function makeStick(element, knob, onMove) {
  const state = { x: 0, y: 0, pointerId: null };
  function update(clientX, clientY) {
    const rect = element.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const max = rect.width * .32;
    const len = Math.hypot(dx, dy) || 1;
    if (len > max) { dx = dx / len * max; dy = dy / len * max; }
    state.x = dx / max;
    state.y = dy / max;
    knob.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
    onMove?.(state);
  }
  function reset() {
    state.x = 0; state.y = 0; state.pointerId = null;
    knob.style.transform = 'translate(-50%,-50%)';
    onMove?.(state);
  }
  element.addEventListener('pointerdown', e => {
    e.preventDefault();
    state.pointerId = e.pointerId;
    element.setPointerCapture?.(e.pointerId);
    update(e.clientX, e.clientY);
  });
  element.addEventListener('pointermove', e => { if (e.pointerId === state.pointerId) update(e.clientX, e.clientY); });
  element.addEventListener('pointerup', e => { if (e.pointerId === state.pointerId) reset(); });
  element.addEventListener('pointercancel', reset);
  return { state, reset };
}
const moveStick = makeStick(joystickEl, joystickKnob);
const lookStick = makeStick(lookstickEl, lookstickKnob);

function refreshSprintButton() {
  sprintEl.classList.toggle('active', player.sprintToggle);
  sprintEl.classList.toggle('empty', player.stamina <= 0.5);
  sprintEl.textContent = player.sprintToggle ? 'RUN ON' : 'RUN';
}
sprintEl.addEventListener('pointerdown', e => {
  e.preventDefault();
  if (player.stamina > 0.5 || player.sprintToggle) player.sprintToggle = !player.sprintToggle;
  refreshSprintButton();
});

let musicOn = false;
async function setMusic(on) {
  musicOn = on;
  musicToggle.classList.toggle('active', on);
  musicToggle.textContent = on ? 'MUSIC ON' : 'MUSIC';
  if (on) {
    bgm.volume = .22;
    try { await bgm.play(); } catch (_) { musicOn = false; musicToggle.classList.remove('active'); musicToggle.textContent = 'MUSIC'; }
  } else {
    bgm.pause();
  }
}
musicToggle.addEventListener('click', () => setMusic(!musicOn));

fullscreenToggle.addEventListener('click', async () => {
  try {
    if (!document.fullscreenElement && appShell.requestFullscreen) {
      await appShell.requestFullscreen({ navigationUI: 'hide' });
    } else if (document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen();
    } else {
      document.body.classList.toggle('pseudo-fullscreen');
    }
  } catch (_) {
    document.body.classList.toggle('pseudo-fullscreen');
  }
  setTimeout(resize, 120);
});
document.addEventListener('fullscreenchange', () => {
  fullscreenToggle.textContent = document.fullscreenElement ? 'EXIT FULL' : 'FULL';
  setTimeout(resize, 120);
});

let lookPointer = null;
let lastLookX = 0;
let lastLookY = 0;
renderer.domElement.addEventListener('pointerdown', e => {
  if (!started || ended || e.pointerType === 'touch') return;
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
  player.yaw -= dx * .003;
  player.pitch -= dy * .003;
  player.pitch = THREE.MathUtils.clamp(player.pitch, -1.1, 1.1);
});
renderer.domElement.addEventListener('pointerup', e => { if (e.pointerId === lookPointer) lookPointer = null; });
renderer.domElement.addEventListener('pointercancel', e => { if (e.pointerId === lookPointer) lookPointer = null; });

addEventListener('keydown', e => {
  keys.add(e.code);
  if (/^Digit[1-5]$/.test(e.code)) usePower(POWERS[Number(e.code.slice(-1)) - 1]?.id);
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => { keys.clear(); moveStick.reset(); lookStick.reset(); });

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
    showMessage(power.song.toUpperCase() + ' UNLOCKED!', 2600);
  }

  if (player.collected.size >= CONFIG.lanceUnlockCount && !lanceUnlocked) {
    lanceUnlocked = true;
    showMessage('ALL 10 FOUND! GET BACK TO DJ LANCE!', 4800);
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
  staminaFill.style.width = Math.max(0, player.stamina) + '%';
  objectiveEl.textContent = lanceUnlocked ? 'SAVE DJ LANCE' : 'FIND EVERYONE';

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
    endCopy.textContent = 'YOU SAVED DJ LANCE!';
  } else {
    endEyebrow.textContent = 'SIGNAL LOST';
    endTitle.textContent = 'THE DARK GOT YOU';
    endCopy.textContent = 'YOU FOUND ' + player.collected.size + ' OF 10. TRY AGAIN!';
  }
}

// ---------- collision ----------
function blocked(x, z) {
  const r = CONFIG.playerRadius;
  if (Math.abs(x) > CONFIG.worldHalfSize - r || Math.abs(z) > CONFIG.worldHalfSize - r) return true;
  return collisionBoxes.some(b => x > b.minX - r && x < b.maxX + r && z > b.minZ - r && z < b.maxZ + r);
}

function movePlayer(dt, now) {
  let strafe = moveStick.state.x;
  let forward = -moveStick.state.y;
  if (keys.has('KeyW') || keys.has('ArrowUp')) forward += 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) forward -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) strafe += 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) strafe -= 1;
  const mag = Math.hypot(strafe, forward);
  if (mag > 1) { strafe /= mag; forward /= mag; }

  player.yaw -= lookStick.state.x * 2.85 * dt;
  player.pitch -= lookStick.state.y * 2.15 * dt;
  player.pitch = THREE.MathUtils.clamp(player.pitch, -1.1, 1.1);

  const moving = Math.hypot(strafe, forward) > .08;
  const keyboardSprint = keys.has('ShiftLeft') || keys.has('ShiftRight');
  const wantsSprint = player.sprintToggle || keyboardSprint;
  const sprinting = wantsSprint && moving && player.stamina > 0;

  if (sprinting) {
    player.stamina = Math.max(0, player.stamina - CONFIG.staminaDrainPerSecond * dt);
    if (player.stamina <= 0) player.sprintToggle = false;
  } else {
    player.stamina = Math.min(CONFIG.maxStamina, player.stamina + CONFIG.staminaRegenPerSecond * dt);
  }
  refreshSprintButton();

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

function drawMinimap() {
  const ctx = minimapCtx;
  const w = minimap.width, h = minimap.height;
  const pad = 7;
  const scale = (w - pad * 2) / (CONFIG.worldHalfSize * 2);
  const mapX = x => pad + (x + CONFIG.worldHalfSize) * scale;
  const mapY = z => pad + (z + CONFIG.worldHalfSize) * scale;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#101525';
  ctx.fillRect(0, 0, w, h);

  const zones = [
    [-25,-25,25,25,'#654a8c'],
    [-25,0,25,25,'#789a45'],
    [0,-25,25,25,'#9a5934'],
    [0,0,25,25,'#4c9bc3']
  ];
  for (const [x,z,zw,zh,c] of zones) {
    ctx.fillStyle = c;
    ctx.globalAlpha = .72;
    ctx.fillRect(mapX(x), mapY(z), zw * scale, zh * scale);
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = 'rgba(255,255,255,.38)';
  ctx.lineWidth = 2;
  for (const [x,z,ww,dd] of WALLS) {
    ctx.strokeRect(mapX(x-ww/2), mapY(z-dd/2), ww*scale, dd*scale);
  }

  for (const item of collectibles) {
    if (!item.parent) continue;
    ctx.fillStyle = item.userData.type === 'character' ? '#fff7a8' : '#ffffff';
    ctx.beginPath();
    ctx.arc(mapX(item.position.x), mapY(item.position.z), item.userData.type === 'character' ? 3.2 : 2.2, 0, Math.PI*2);
    ctx.fill();
  }

  ctx.fillStyle = lanceUnlocked ? '#7cff9b' : '#f39b43';
  ctx.fillRect(mapX(lanceTV.position.x)-3, mapY(lanceTV.position.z)-3, 6, 6);

  for (const enemy of enemies) {
    ctx.fillStyle = enemy.userData.isGooble ? '#d9cfff' : '#ff4f5c';
    ctx.beginPath();
    ctx.arc(mapX(enemy.position.x), mapY(enemy.position.z), enemy.userData.isGooble ? 3.2 : 2.7, 0, Math.PI*2);
    ctx.fill();
  }

  const px = mapX(player.position.x), py = mapY(player.position.z);
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(-player.yaw);
  ctx.fillStyle = '#8ef4ff';
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(4.5, 5);
  ctx.lineTo(0, 2.5);
  ctx.lineTo(-4.5, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = 'rgba(255,255,255,.55)';
  ctx.lineWidth = 1;
  ctx.strokeRect(.5,.5,w-1,h-1);
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
    drawMinimap();
  }
  renderer.render(scene, camera);
}

function resize() {
  const rect = screenFrame.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  const coarse = matchMedia('(pointer:coarse)').matches || innerWidth < 900;
  const scale = coarse ? CONFIG.renderScaleMobile : CONFIG.renderScaleDesktop;
  const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.35 : 1.7);
  renderer.setPixelRatio(dpr);
  renderer.setSize(Math.max(1, Math.floor(width * scale)), Math.max(1, Math.floor(height * scale)), false);
  renderer.domElement.style.width = width + 'px';
  renderer.domElement.style.height = height + 'px';
  camera.aspect = width / height;
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
  showMessage('DJ LANCE IS TRAPPED! FIND 5 FRIENDS + 5 SONGS.', 4200);
  pickupSoundCtx?.resume?.();
  setMusic(true);
}

startButton.addEventListener('click', beginGame);
restartButton.addEventListener('click', () => location.reload());

refreshSprintButton();
updateHud();
drawMinimap();
animate();
