import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js';

// ============================================================
// GABBA AFTER DARK — mobile-first survival prototype
// Procedural stand-ins only. No show art, models, music, or audio shipped.
// ============================================================

const CONFIG = {
  worldHalfSize: 32,
  playerHeight: 1.65,
  playerRadius: 0.42,
  walkSpeed: 6.0,
  sprintSpeed: 9.4,
  maxHealth: 3,
  renderScaleMobile: 1,
  renderScaleDesktop: 1,
  maxStamina: 100,
  staminaDrainPerSecond: 25,
  staminaRegenPerSecond: 18,
  pickupRadius: 1.45,
  enemyTouchRadius: 1.55,
  contactKnockback: 7.5,
  contactInvulnerability: 1.2,
  goobleSpawnSeconds: 240,
  goobleWarningSeconds: 210,
  lanceUnlockCount: 10,
};

const CHARACTERS = [
  { id: 'plex', name: 'Plex', color: 0xf6c642, x: -23, z: -21 },
  { id: 'muno', name: 'Muno', color: 0xe53e35, x: 24, z: -20 },
  { id: 'foofa', name: 'Foofa', color: 0xf37ca4, x: -23, z: 21 },
  { id: 'toodee', name: 'Toodie', color: 0x4a9be8, x: 23, z: 23 },
  { id: 'brobee', name: 'Brobee', color: 0x69b856, x: 4, z: -25 },
];

const POWERS = [
  {
    id: 'tummy', owner: 'Brobee', label: 'TUMMY', song: 'Party in My Tummy', icon: '♪', color: 0x83d36e,
    x: 18, z: 9, cooldown: 26,
    description: 'Healing song — restores 45 health.'
  },
  {
    id: 'flowers', owner: 'Foofa', label: 'FLOWERS', song: 'I Love Flowers', icon: '♪', color: 0xf5a4bf,
    x: -8, z: -18, cooldown: 24,
    description: 'Flower dizzy-lines confuse and stun nearby hunters.'
  },
  {
    id: 'bugs', owner: 'Muno', label: 'BUGS', song: 'I Like Bugs', icon: '♪', color: 0xe65b55,
    x: -18, z: 6, cooldown: 22,
    description: 'Ride a giant beetle under your POV for a burst of speed.'
  },
  {
    id: 'fish', owner: 'Toodie', label: 'FISH', song: 'I Like Fish', icon: '♪', color: 0x68b5ee,
    x: 22, z: -3, cooldown: 18,
    description: 'Creates a fishy scent trail toward Toodie, Brobee, or Party in My Tummy.'
  },
  {
    id: 'space', owner: 'Plex', label: 'SPACE', song: 'Give Baby Space', icon: '♪', color: 0xf9dd73,
    x: -20, z: -5, cooldown: 32,
    description: 'Sends every active hunter to the far side of the map.'
  },
];

const WALLS = [
  [-32, 0, 1, 64, 2.8], [32, 0, 1, 64, 2.8],
  [0, -32, 64, 1, 2.8], [0, 32, 64, 1, 2.8],
  [-8, -8, 6, 1.4, 2.1], [9, -8, 6, 1.4, 2.1],
  [-8, 8, 6, 1.4, 2.1], [9, 8, 6, 1.4, 2.1],
  [-22, 13, 8, 1.2, 2.2], [-18, 18, 1.2, 9, 2.2],
  [20, -15, 7, 1.2, 2.2], [24, -11, 1.2, 8, 2.2],
  [17, 21, 8, 1.2, 2.0]
];

const appShell = document.querySelector('#app-shell');
const screenFrame = document.querySelector('#screen-frame');
const gameEl = document.querySelector('#game');
const hudEl = document.querySelector('#hud');
const startScreen = document.querySelector('#start-screen');
const endScreen = document.querySelector('#end-screen');
const startButton = document.querySelector('#start-button');
const restartButton = document.querySelector('#restart-button');
const heartsEl = document.querySelector('#hearts');
const countEl = document.querySelector('#count');
const jumpscareEl = document.querySelector('#jumpscare');
const jumpscareName = document.querySelector('#jumpscare-name');
const settingsScreen = document.querySelector('#settings-screen');
const settingsButton = document.querySelector('#settings-button');
const ingameSettings = document.querySelector('#ingame-settings');
const settingsClose = document.querySelector('#settings-close');
const settingsReset = document.querySelector('#settings-reset');
const settingLook = document.querySelector('#setting-look');
const settingBrightness = document.querySelector('#setting-brightness');
const settingFog = document.querySelector('#setting-fog');
const settingStatic = document.querySelector('#setting-static');
const settingMusic = document.querySelector('#setting-music');
const settingInvert = document.querySelector('#setting-invert');
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
const briefcaseTray = document.querySelector('#briefcase-tray');
const caseIcon = document.querySelector('#case-icon');

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
  usedPowers: new Set(),
  bugRideUntil: 0,
  invulnerableUntil: 0,
  moving: false,
  isSprinting: false,
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
let lastJumpScareAt = -999;
let pausedForSettings = false;
let escapePhase = false;
let radarSweep = 0;
let nextPlayerStepAt = 0;
let nextHunterStepAt = 0;

const DEFAULT_SETTINGS = {
  lookSensitivity: 1.0,
  brightness: 0.92,
  fog: 1.0,
  static: 1.0,
  music: 0.22,
  invertY: false
};
let settings = {...DEFAULT_SETTINGS};
try { settings = {...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('gabbaAfterDarkSettings') || '{}')}; } catch (_) {}

function saveSettings(){
  localStorage.setItem('gabbaAfterDarkSettings', JSON.stringify(settings));
}
function applySettings(){
  settingLook.value=settings.lookSensitivity;
  settingBrightness.value=settings.brightness;
  settingFog.value=settings.fog;
  settingStatic.value=settings.static;
  settingMusic.value=settings.music;
  settingInvert.checked=settings.invertY;
  document.body.style.setProperty('--game-brightness', settings.brightness);
  document.body.style.setProperty('--static-opacity', String(.25 * settings.static));
  document.body.classList.add('bright-game');
  scene.fog.density = 0.034 * settings.fog;
  bgm.volume = settings.music;
}
function openSettings(){
  pausedForSettings = started && !ended;
  settingsScreen.classList.add('active');
}
function closeSettings(){
  settingsScreen.classList.remove('active');
  saveSettings();
}
settingsButton.addEventListener('click', openSettings);
ingameSettings.addEventListener('click', openSettings);
settingsClose.addEventListener('click', closeSettings);
settingsReset.addEventListener('click', ()=>{ settings={...DEFAULT_SETTINGS}; applySettings(); saveSettings(); });
for (const el of [settingLook,settingBrightness,settingFog,settingStatic,settingMusic]) {
  el.addEventListener('input', ()=>{
    settings.lookSensitivity=Number(settingLook.value);
    settings.brightness=Number(settingBrightness.value);
    settings.fog=Number(settingFog.value);
    settings.static=Number(settingStatic.value);
    settings.music=Number(settingMusic.value);
    applySettings(); saveSettings();
  });
}
settingInvert.addEventListener('change', ()=>{ settings.invertY=settingInvert.checked; saveSettings(); });

// ---------- Gabba Land ----------
scene.background = new THREE.Color(0x080b12);
scene.fog = new THREE.FogExp2(0x090d14, 0.034);

scene.add(new THREE.HemisphereLight(0x6f83a4, 0x160e18, 0.78));
const moon = new THREE.DirectionalLight(0xc5d0ff, 0.65);
moon.position.set(-8, 18, 9);
scene.add(moon);

const flashlight = new THREE.SpotLight(0xfff0d0, 7.4, 20, Math.PI / 7, 0.58, 1.3);
flashlight.position.set(0, 0, 0);
flashlight.target.position.set(0, 0, -5);
camera.add(flashlight);
camera.add(flashlight.target);
scene.add(camera);

function addGround(x, z, color) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(32, 32),
    new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: .08 })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0, z);
  scene.add(mesh);
}
addGround(-16, -16, 0x5b3b83); // Muno Land
addGround(-16,  16, 0x86a83d); // Foofa Land
addGround( 16, -16, 0x9a4e2a); // Brobee Land
addGround( 16,  16, 0x4b9fc8); // Toodee Land

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

const trunkMat = new THREE.MeshLambertMaterial({ color: 0x4d2b1b });
const leafMat = new THREE.MeshLambertMaterial({ color: 0xb95d27 });
for (let i = 0; i < 28; i++) {
  const col = i % 6, row = Math.floor(i / 6);
  const x = 2.5 + col * 4.25 + (row % 2) * 1.1;
  const z = -23 + row * 4.4;
  const height = 5.8 + (i % 4) * .9;
  const trunkRadius = .38 + (i % 3) * .05;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(trunkRadius*.72, trunkRadius, height, 6), trunkMat);
  trunk.position.set(x, height / 2, z);
  scene.add(trunk);
  collisionBoxes.push({minX:x-trunkRadius,maxX:x+trunkRadius,minZ:z-trunkRadius,maxZ:z+trunkRadius});
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.35 + (i % 3) * .22, 0), leafMat);
  crown.scale.y = 1.55;
  crown.position.set(x, height + .5, z);
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

function addBoxObstacle(x,z,w,d,h,color){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color}));
  mesh.position.set(x,h/2,z); scene.add(mesh);
  collisionBoxes.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});
  return mesh;
}
function addLandmarks(){
  // Nature/camping inspired treehouse + campfire clearing.
  addBoxObstacle(-22,17,5.5,4.2,3.6,0x5a3a24);
  const roof=new THREE.Mesh(new THREE.ConeGeometry(4.0,2.2,4),new THREE.MeshLambertMaterial({color:0x7b4b2d}));
  roof.position.set(-22,4.7,17); roof.rotation.y=Math.PI/4; scene.add(roof);
  for(let i=0;i<4;i++){ const leg=new THREE.Mesh(new THREE.CylinderGeometry(.22,.3,3.8,6),trunkMat); leg.position.set(-24+(i%2)*4,1.9,15.5+Math.floor(i/2)*3); scene.add(leg); }
  const fireRing=new THREE.Mesh(new THREE.TorusGeometry(1.1,.18,6,16),new THREE.MeshLambertMaterial({color:0x5c554d}));
  fireRing.rotation.x=Math.PI/2; fireRing.position.set(-13,.18,18); scene.add(fireRing);
  const fire=new THREE.PointLight(0xff7b2c,2.2,8); fire.position.set(-13,1,18); scene.add(fire);

  // Plex robot/space landmark.
  const ship=new THREE.Group();
  const hull=new THREE.Mesh(new THREE.SphereGeometry(2.5,12,8),new THREE.MeshLambertMaterial({color:0xd4b329,emissive:0x66520a,emissiveIntensity:.22}));
  hull.scale.set(1.5,.55,1); hull.position.y=1.4; ship.add(hull);
  const dome=new THREE.Mesh(new THREE.SphereGeometry(1.25,10,7),new THREE.MeshLambertMaterial({color:0x7fc9dc,transparent:true,opacity:.75}));
  dome.scale.y=.65; dome.position.y=2.15; ship.add(dome);
  ship.position.set(21,0,-16); ship.rotation.y=-.4; scene.add(ship);
  collisionBoxes.push({minX:17.5,maxX:24.5,minZ:-19,maxZ:-13});

  // Toodee pond / crystal island.
  const pond=new THREE.Mesh(new THREE.CylinderGeometry(4.5,4.5,.12,24),new THREE.MeshLambertMaterial({color:0x277fa8,emissive:0x0f4055,emissiveIntensity:.3}));
  pond.position.set(20,.06,20); scene.add(pond);

  // Central show-stage speaker blocks.
  for(const x of [-5.5,5.5]){
    addBoxObstacle(x,3.5,2.2,2.2,4.2,0x29222f);
    for(const y of [1.2,2.9]){ const cone=new THREE.Mesh(new THREE.CylinderGeometry(.62,.62,.16,12),new THREE.MeshBasicMaterial({color:0x111111})); cone.rotation.x=Math.PI/2; cone.position.set(x,y,2.35); scene.add(cone); }
  }
}
addLandmarks();

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
  const feature = (color) => new THREE.MeshBasicMaterial({ color: dark ? 0x0b0b0d : color });

  function mouth(y,z,w=.28,h=.08,color=0xf36a38){
    const m=new THREE.Mesh(new THREE.CapsuleGeometry(h,w,3,8),feature(color));
    m.rotation.z=Math.PI/2; m.position.set(0,y,z); root.add(m); return m;
  }
  function leg(x,y,length,color){
    const m=new THREE.Mesh(new THREE.CapsuleGeometry(.10,length,4,8),basicMat(color,dark));
    m.position.set(x,y,0); root.add(m);
  }

  if (def.id === 'plex') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(.86, 1.0, .58), basicMat(c,dark));
    body.position.y=1.03; root.add(body);
    const head = new THREE.Mesh(new THREE.BoxGeometry(.9,.62,.62),basicMat(c,dark));
    head.position.y=1.68; root.add(head);
    const face = new THREE.Mesh(new THREE.BoxGeometry(.62,.36,.035), feature(0x222329));
    face.position.set(0,1.68,-.328); root.add(face);
    eye(root,-.16,1.69,-.35,.8); eye(root,.16,1.69,-.35,.8);
    const chest=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.025,12),feature(0x232329));
    chest.rotation.x=Math.PI/2; chest.position.set(0,1.04,-.31); root.add(chest);
    limb(root,-.63,1.08,.72,dark?0x69696d:0xbec3c8,true);
    limb(root,.63,1.08,.72,dark?0x69696d:0xbec3c8,true);
    leg(-.23,.35,.48,dark?0x69696d:0xbec3c8); leg(.23,.35,.48,dark?0x69696d:0xbec3c8);
    const antenna=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.5,5),basicMat(dark?0x55555a:0xbfc5cb,dark));
    antenna.position.set(0,2.23,0); root.add(antenna);
    const ball=new THREE.Mesh(new THREE.SphereGeometry(.09,7,5),feature(0xe64a3d)); ball.position.set(0,2.5,0); root.add(ball);
  } else if (def.id === 'muno') {
    const body=new THREE.Mesh(new THREE.CapsuleGeometry(.46,1.45,5,10),basicMat(c,dark));
    body.position.y=1.3; root.add(body);
    eye(root,0,1.83,-.45,1.28);
    mouth(1.48,-.46,.22,.06,0xffffff);
    for(let i=0;i<18;i++){
      const bump=new THREE.Mesh(new THREE.SphereGeometry(.065,5,4),basicMat(c,dark));
      const a=i*2.18; bump.position.set(Math.sin(a)*.43,.5+(i%7)*.23,Math.cos(a)*.34); root.add(bump);
    }
    limb(root,-.62,1.15,.82,c,true); limb(root,.62,1.15,.82,c,true);
    leg(-.22,.3,.58,c); leg(.22,.3,.58,c);
  } else if (def.id === 'foofa') {
    const body=new THREE.Mesh(new THREE.SphereGeometry(.6,12,9),basicMat(c,dark));
    body.scale.set(.92,1.18,.82); body.position.y=.95; root.add(body);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.45,12,9),basicMat(c,dark));
    head.position.y=1.55; root.add(head);
    eye(root,-.15,1.62,-.41,.86); eye(root,.15,1.62,-.41,.86);
    mouth(1.38,-.43,.19,.055,0xe13f75);
    for(let i=0;i<7;i++){
      const petal=new THREE.Mesh(new THREE.SphereGeometry(.15,7,5),basicMat(dark?0x3a2b33:0xffe9ef,dark));
      const a=i/7*Math.PI*2; petal.position.set(Math.cos(a)*.34,1.12+Math.sin(a)*.12,-.33); petal.scale.set(.95,.55,.45); root.add(petal);
    }
    const fc=new THREE.Mesh(new THREE.SphereGeometry(.11,7,5),feature(0xffd33f)); fc.position.set(0,2.12,-.02); root.add(fc);
    for(let i=0;i<6;i++){
      const p=new THREE.Mesh(new THREE.SphereGeometry(.14,7,5),basicMat(dark?0x49313c:0xffd5e3,dark));
      const a=i/6*Math.PI*2; p.position.set(Math.cos(a)*.22,2.12+Math.sin(a)*.22,-.02); p.scale.set(.75,1,.55); root.add(p);
    }
    limb(root,-.58,1.02,.72,c,true); limb(root,.58,1.02,.72,c,true);
    leg(-.2,.3,.48,c); leg(.2,.3,.48,c);
  } else if (def.id === 'toodee') {
    const body=new THREE.Mesh(new THREE.CapsuleGeometry(.46,.9,5,9),basicMat(c,dark)); body.position.y=1.0; root.add(body);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.46,11,8),basicMat(c,dark)); head.position.y=1.52; root.add(head);
    eye(root,-.15,1.62,-.43,.9); eye(root,.15,1.62,-.43,.9);
    const nose=new THREE.Mesh(new THREE.SphereGeometry(.09,7,5),feature(0x18364d)); nose.position.set(0,1.46,-.48); root.add(nose);
    for(const x of [-.25,.25]){const ear=new THREE.Mesh(new THREE.ConeGeometry(.17,.38,4),basicMat(c,dark));ear.position.set(x,1.98,0);root.add(ear);}
    const belly=new THREE.Mesh(new THREE.SphereGeometry(.34,9,7),basicMat(dark?0x1c2933:0xa5dcef,dark));belly.scale.set(.85,1.15,.22);belly.position.set(0,.95,-.42);root.add(belly);
    for(const x of [-.43,.43]){const fin=new THREE.Mesh(new THREE.ConeGeometry(.16,.42,5),basicMat(dark?0x18232c:0x8fd1e8,dark));fin.position.set(x,1.46,-.05);fin.rotation.z=x<0?.9:-.9;root.add(fin);}
    limb(root,-.58,.98,.7,c,true); limb(root,.58,.98,.7,c,true);
    leg(-.2,.28,.52,c); leg(.2,.28,.52,c);
    const tail=new THREE.Mesh(new THREE.ConeGeometry(.2,.62,4),basicMat(c,dark));tail.position.set(0,.9,.55);tail.rotation.x=Math.PI/2;root.add(tail);
  } else if (def.id === 'brobee') {
    const body=new THREE.Mesh(new THREE.CapsuleGeometry(.5,.9,5,9),basicMat(c,dark));body.position.y=.95;root.add(body);
    eye(root,-.15,1.36,-.45,.88); eye(root,.15,1.36,-.45,.88);
    mouth(1.13,-.47,.22,.065,0xf06a3e);
    for(const y of [.58,.82,1.06,1.3]){
      const stripe=new THREE.Mesh(new THREE.TorusGeometry(.44,.065,5,16),basicMat(dark?0x0b2511:0x1f6e31,dark));
      stripe.rotation.x=Math.PI/2;stripe.position.y=y;root.add(stripe);
    }
    for(const x of [-.24,0,.24]){const horn=new THREE.Mesh(new THREE.ConeGeometry(.12,.36,5),basicMat(0xea563e,dark));horn.position.set(x,1.82,0);root.add(horn);}
    limb(root,-.92,1.02,1.55,c,true); limb(root,.92,1.02,1.55,c,true);
    leg(-.23,.26,.48,c); leg(.23,.26,.48,c);
  } else {
    const body=new THREE.Mesh(new THREE.CapsuleGeometry(.5,.8,5,8),basicMat(0xe8e8f2,dark)); body.position.y=1; root.add(body);
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
  root.scale.setScalar(0.62);
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
  root.scale.setScalar(isGooble ? 1.7 : 2.15);

  if (isGooble) {
    const tearMat = new THREE.MeshBasicMaterial({ color: 0x79bff0 });
    const tear = new THREE.Mesh(new THREE.SphereGeometry(.08,6,5), tearMat);
    tear.scale.set(.55,1.5,.45); tear.position.set(.18,1.05,-.48); root.add(tear);
  }

  const spawnPoints = [
    [-29, -25], [29, 25], [-29, 25], [29, -25], [0, 30], [0, -30]
  ];
  const [sx, sz] = spawnPoints[index % spawnPoints.length];
  root.position.set(sx, 0, sz);
  root.userData = {
    id: isGooble ? 'gooble' : 'hunter-' + characterDef.id,
    name: isGooble ? 'Gooble' : characterDef.name,
    speed: isGooble ? 2.0 : 3.25 + index * .16,
    lastHitAt: -999,
    stunnedUntil: 0,
    phase: Math.random() * 10,
    isGooble,
    waypoint: null,
    nextRouteAt: 0,
    state: isGooble ? 'chase' : 'wander',
    alertUntil: 0,
    lastSeenX: sx,
    lastSeenZ: sz,
    wanderTarget: new THREE.Vector2(sx,sz),
    nextWanderAt: 0,
    wasCloseVisible: false,
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
  POWERS.forEach((power) => {
    const btn = document.createElement('button');
    btn.className = 'power';
    btn.dataset.power = power.id;
    btn.style.setProperty('--power-color', '#' + power.color.toString(16).padStart(6,'0'));
    btn.setAttribute('aria-label', power.owner + ' song power: ' + power.song);
    btn.title = power.description;
    btn.innerHTML = '<span class="music-icon">♪</span>';
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

function powerStinger(id){
  const patterns={
    tummy:[[392,.07],[523,.07],[659,.11]],
    flowers:[[659,.05],[784,.05],[988,.12]],
    bugs:[[180,.04],[230,.04],[300,.04],[420,.08]],
    fish:[[440,.06],[392,.06],[330,.11]],
    space:[[700,.05],[520,.06],[300,.13]]
  };
  const seq=patterns[id]||[[520,.08]];
  let delay=0;
  seq.forEach(([f,d])=>{ setTimeout(()=>beep(f,d),delay*1000); delay+=d+.025; });
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

function footstep(kind='player', intensity=1){
  try{
    pickupSoundCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    const ctx=pickupSoundCtx;
    const osc=ctx.createOscillator();
    const gain=ctx.createGain();
    const filter=ctx.createBiquadFilter();
    osc.type='triangle';
    osc.frequency.value=kind==='hunter' ? 58 : 84;
    filter.type='lowpass';
    filter.frequency.value=kind==='hunter' ? 180 : 260;
    gain.gain.setValueAtTime(.0001,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime((kind==='hunter'?.035:.022)*intensity,ctx.currentTime+.008);
    gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.09);
    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime+.1);
  }catch(_){}
}
function updateFootsteps(now,moving,sprinting,nearestEnemy){
  if(moving && now>=nextPlayerStepAt){
    footstep('player',sprinting?1.25:.8);
    nextPlayerStepAt=now+(sprinting?.28:.43);
  }
  if(nearestEnemy<10 && now>=nextHunterStepAt){
    const intensity=THREE.MathUtils.clamp(1-(nearestEnemy/11),.15,1);
    footstep('hunter',.55+intensity*.9);
    nextHunterStepAt=now+THREE.MathUtils.lerp(.72,.34,intensity);
  }
}

function briefcaseCollect(color){
  caseIcon.textContent='★';
  caseIcon.style.color='#'+color.toString(16).padStart(6,'0');
  briefcaseTray.classList.remove('collecting');
  void briefcaseTray.offsetWidth;
  briefcaseTray.classList.add('collecting');
  setTimeout(()=>briefcaseTray.classList.remove('collecting'),700);
}
function collect(item) {
  if (player.collected.has(item.userData.id)) return;
  player.collected.add(item.userData.id);
  scene.remove(item);
  beep(item.userData.type === 'character' ? 220 : 720, .11);

  if (item.userData.type === 'character') {
    briefcaseCollect(item.userData.color);
    const def = CHARACTERS.find(c => c.id === item.userData.id);
    makeEnemy(def, enemies.length);
  } else {
    player.unlocked.add(item.userData.id);
    const power = POWERS.find(p => p.id === item.userData.id);
    showMessage(power.song.toUpperCase() + ' UNLOCKED!', 2600);
  }

  if (player.collected.size >= CONFIG.lanceUnlockCount && !lanceUnlocked) {
    lanceUnlocked = true;
    escapePhase = true;
    document.body.classList.add('escape-phase');
    showMessage('ALL 10 FOUND — GET BACK TO DJ LANCE!', 5200);
    beep(1040, .28);
    if(!goobleSpawned){
      goobleSpawned=true;
      makeEnemy({id:'gooble',name:'Gooble',color:0x5c58a3},enemies.length,{gooble:true});
    }
    enemies.forEach(e=>{ e.userData.state='chase'; e.userData.alertUntil=Infinity; });
  } else {
    const count=player.collected.size;
    if(count===3) showMessage('THE WOODS FEEL DIFFERENT...',2600);
    if(count===6) showMessage('SOMETHING IS GETTING CLOSER.',2600);
    if(count===8) showMessage('DON\'T STOP MOVING.',2600);
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
    new THREE.Vector3(-30, 0, -30), new THREE.Vector3(30, 0, -30),
    new THREE.Vector3(-30, 0, 30), new THREE.Vector3(30, 0, 30),
    new THREE.Vector3(0, 0, -31), new THREE.Vector3(0, 0, 31),
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
  if (!started || ended || !id || !player.unlocked.has(id) || player.usedPowers.has(id)) return;
  const power = POWERS.find(x => x.id === id);
  const now = performance.now() / 1000;
  player.usedPowers.add(id);
  powerStinger(id);

  if (id === 'tummy') {
    player.health = Math.min(CONFIG.maxHealth, player.health + 1);
    showMessage('PARTY IN MY TUMMY — +1 HEART!');
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
  heartsEl.textContent = Array.from({length: CONFIG.maxHealth}, (_,i) => i < player.health ? '♥' : '♡').join(' ');
  staminaFill.style.height = Math.max(0, player.stamina) + '%';

  document.querySelectorAll('.power').forEach(btn => {
    const id = btn.dataset.power;
    const unlocked = player.unlocked.has(id);
    const used = player.usedPowers.has(id);
    btn.classList.toggle('unlocked', unlocked && !used);
    btn.classList.toggle('ready', unlocked && !used);
    btn.classList.toggle('used', used);
  });
}

function finish(won) {
  if (ended) return;
  ended = true;
  hudEl.classList.add('hidden');
  endScreen.classList.add('active');
  document.body.classList.remove('danger', 'static-heavy', 'escape-phase');
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

  const lx = Math.abs(lookStick.state.x) < .14 ? 0 : Math.sign(lookStick.state.x) * ((Math.abs(lookStick.state.x) - .14) / .86);
  const ly = Math.abs(lookStick.state.y) < .14 ? 0 : Math.sign(lookStick.state.y) * ((Math.abs(lookStick.state.y) - .14) / .86);
  player.yaw -= lx * 1.72 * settings.lookSensitivity * dt;
  const lookY = settings.invertY ? -ly : ly;
  player.pitch -= lookY * 1.35 * settings.lookSensitivity * dt;
  player.pitch = THREE.MathUtils.clamp(player.pitch, -1.0, 1.0);

  const moving = Math.hypot(strafe, forward) > .08;
  const keyboardSprint = keys.has('ShiftLeft') || keys.has('ShiftRight');
  const wantsSprint = player.sprintToggle || keyboardSprint;
  const sprinting = wantsSprint && moving && player.stamina > 0;
  player.moving = moving;
  player.isSprinting = sprinting;

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

  const bobRate = sprinting ? 13.0 : 9.0;
  const bobAmp = moving ? (sprinting ? .075 : .045) : 0;
  camera.position.copy(player.position);
  camera.position.y += Math.sin(now * bobRate) * bobAmp;
  camera.position.x += Math.sin(now * bobRate * .5) * bobAmp * .18;
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

function drawMinimap(now=performance.now()/1000) {
  const ctx=minimapCtx,w=minimap.width,h=minimap.height,cx=w/2,cy=h/2,r=w*.45;
  ctx.clearRect(0,0,w,h);
  ctx.save();
  ctx.translate(cx,cy);

  ctx.fillStyle='rgba(5,9,12,.88)';
  ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(115,255,170,.2)';ctx.lineWidth=1;
  for(const rr of [r*.33,r*.66,r]){ctx.beginPath();ctx.arc(0,0,rr,0,Math.PI*2);ctx.stroke();}
  ctx.beginPath();ctx.moveTo(-r,0);ctx.lineTo(r,0);ctx.moveTo(0,-r);ctx.lineTo(0,r);ctx.stroke();

  radarSweep=(now*.95)%(Math.PI*2);
  const sweepX=Math.sin(radarSweep)*r,sweepY=-Math.cos(radarSweep)*r;
  const grad=ctx.createLinearGradient(0,0,sweepX,sweepY);
  grad.addColorStop(0,'rgba(110,255,160,.06)');grad.addColorStop(1,'rgba(110,255,160,.8)');
  ctx.strokeStyle=grad;ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(sweepX,sweepY);ctx.stroke();

  const range=18;
  for(const enemy of enemies){
    const dx=enemy.position.x-player.position.x,dz=enemy.position.z-player.position.z;
    const dist=Math.hypot(dx,dz);
    if(dist>range) continue;
    const worldAngle=Math.atan2(dx,-dz);
    const rel=worldAngle-player.yaw;
    const enemyAngle=(worldAngle+Math.PI*2)%(Math.PI*2);
    let diff=Math.abs(enemyAngle-radarSweep);diff=Math.min(diff,Math.PI*2-diff);
    if(diff>.42) continue;
    const rr=(dist/range)*r;
    const x=Math.sin(rel)*rr,y=-Math.cos(rel)*rr;
    ctx.fillStyle='rgba(255,53,68,.95)';
    ctx.beginPath();ctx.arc(x,y,5.5,0,Math.PI*2);ctx.fill();
  }

  ctx.fillStyle='#8df7ff';ctx.beginPath();ctx.arc(0,0,4.5,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.42)';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
  ctx.restore();
}

function enemyBlocked(x,z,r=.7){
  if(Math.abs(x)>CONFIG.worldHalfSize-r||Math.abs(z)>CONFIG.worldHalfSize-r) return true;
  return collisionBoxes.some(b=>x>b.minX-r&&x<b.maxX+r&&z>b.minZ-r&&z<b.maxZ+r);
}
function triggerJumpScare(enemy, now){
  if(now-lastJumpScareAt<7 || ended) return;
  lastJumpScareAt=now;
  const def=CHARACTERS.find(c=>enemy.userData.id==='hunter-'+c.id);
  const color=def ? '#'+def.color.toString(16).padStart(6,'0') : '#c7c1df';
  jumpscareEl.dataset.character=def?.id || 'gooble';
  jumpscareEl.style.setProperty('--jump-color',color);
  jumpscareName.textContent=(enemy.userData.name||'RUN').toUpperCase();
  jumpscareEl.classList.remove('active');
  void jumpscareEl.offsetWidth;
  jumpscareEl.classList.add('active');
  setTimeout(()=>jumpscareEl.classList.remove('active'),360);
  beep(enemy.userData.isGooble?88:115,.12);
  setTimeout(()=>beep(enemy.userData.isGooble?70:82,.16),80);
}
function segmentHitsBox(ax,az,bx,bz,b,pad=.9){
  const steps=10;
  for(let i=1;i<=steps;i++){
    const t=i/steps, x=THREE.MathUtils.lerp(ax,bx,t), z=THREE.MathUtils.lerp(az,bz,t);
    if(x>b.minX-pad&&x<b.maxX+pad&&z>b.minZ-pad&&z<b.maxZ+pad) return true;
  }
  return false;
}
function directPathBlocked(enemy){
  return collisionBoxes.some(b=>segmentHitsBox(enemy.position.x,enemy.position.z,player.position.x,player.position.z,b,.85));
}
function chooseWaypoint(enemy){
  const blocking=collisionBoxes.find(b=>segmentHitsBox(enemy.position.x,enemy.position.z,player.position.x,player.position.z,b,.9));
  if(!blocking){ enemy.userData.waypoint=null; return; }
  const pad=1.5;
  const corners=[
    new THREE.Vector2(blocking.minX-pad,blocking.minZ-pad),
    new THREE.Vector2(blocking.maxX+pad,blocking.minZ-pad),
    new THREE.Vector2(blocking.minX-pad,blocking.maxZ+pad),
    new THREE.Vector2(blocking.maxX+pad,blocking.maxZ+pad)
  ].filter(p=>!enemyBlocked(p.x,p.y,.8));
  corners.sort((a,b)=>(
    Math.hypot(a.x-enemy.position.x,a.y-enemy.position.z)+Math.hypot(a.x-player.position.x,a.y-player.position.z)
  )-(
    Math.hypot(b.x-enemy.position.x,b.y-enemy.position.z)+Math.hypot(b.x-player.position.x,b.y-player.position.z)
  ));
  enemy.userData.waypoint=corners[0]||null;
}
function pickSteer(enemy,dx,dz,step,now){
  if(!enemy.userData.nextRouteAt||now>=enemy.userData.nextRouteAt){
    enemy.userData.nextRouteAt=now+.35;
    if(directPathBlocked(enemy)) chooseWaypoint(enemy); else enemy.userData.waypoint=null;
  }
  let tx=player.position.x,tz=player.position.z;
  if(enemy.userData.waypoint){
    tx=enemy.userData.waypoint.x;tz=enemy.userData.waypoint.y;
    if(Math.hypot(tx-enemy.position.x,tz-enemy.position.z)<1.1) enemy.userData.waypoint=null;
  }
  let sx=tx-enemy.position.x,sz=tz-enemy.position.z;
  const len=Math.hypot(sx,sz)||1;sx/=len;sz/=len;
  const options=[[sx,sz],[sx*.7-sz*.7,sz*.7+sx*.7],[sx*.7+sz*.7,sz*.7-sx*.7]];
  for(const [ox,oz] of options){
    if(!enemyBlocked(enemy.position.x+ox*step,enemy.position.z+oz*step,.8)) return [ox,oz];
  }
  return [0,0];
}

function canSeePlayer(enemy){
  return !collisionBoxes.some(b=>segmentHitsBox(enemy.position.x,enemy.position.z,player.position.x,player.position.z,b,.25));
}
function setWanderTarget(enemy,now){
  const radius=8+Math.random()*9;
  const a=Math.random()*Math.PI*2;
  const x=THREE.MathUtils.clamp(enemy.position.x+Math.cos(a)*radius,-30,30);
  const z=THREE.MathUtils.clamp(enemy.position.z+Math.sin(a)*radius,-30,30);
  enemy.userData.wanderTarget.set(x,z);
  enemy.userData.nextWanderAt=now+3+Math.random()*4;
}
function updateEnemyState(enemy,dist,now){
  const id=enemy.userData.id;
  const progress=player.collected.size/CONFIG.lanceUnlockCount;
  const sees=canSeePlayer(enemy);

  if(escapePhase || enemy.userData.isGooble){
    enemy.userData.state='chase';
    enemy.userData.alertUntil=Infinity;
    return;
  }

  let notice=8+progress*6;
  if(id==='hunter-foofa') notice+=2.5;
  if(id==='hunter-plex') notice+=1.5;
  if(player.isSprinting) notice+=4;

  if(sees && dist<notice){
    enemy.userData.state='chase';
    enemy.userData.alertUntil=now+4+progress*4;
    enemy.userData.lastSeenX=player.position.x;
    enemy.userData.lastSeenZ=player.position.z;
  } else if(enemy.userData.state==='chase' && now>enemy.userData.alertUntil){
    enemy.userData.state='search';
    enemy.userData.searchUntil=now+5;
  } else if(enemy.userData.state==='search' && now>(enemy.userData.searchUntil||0)){
    enemy.userData.state='wander';
  }

  if(id==='hunter-plex' && enemy.userData.state==='search' && dist>10 && Math.random()<.0015){
    const a=Math.random()*Math.PI*2;
    const rr=11+Math.random()*4;
    const tx=THREE.MathUtils.clamp(player.position.x+Math.cos(a)*rr,-29,29);
    const tz=THREE.MathUtils.clamp(player.position.z+Math.sin(a)*rr,-29,29);
    if(!enemyBlocked(tx,tz,.8)) enemy.position.set(tx,0,tz);
  }
}
function updateEnemies(dt, now) {
  let nearest=Infinity;
  let nearestVisible=Infinity;
  const progress=player.collected.size/CONFIG.lanceUnlockCount;

  for(const enemy of enemies){
    const ex=enemy.position.x,ez=enemy.position.z;
    let pdx=player.position.x-ex,pdz=player.position.z-ez;
    const playerDist=Math.hypot(pdx,pdz);
    nearest=Math.min(nearest,playerDist);
    if(canSeePlayer(enemy)) nearestVisible=Math.min(nearestVisible,playerDist);

    if(enemy.userData.stunnedUntil>now){ enemy.rotation.z=Math.sin(now*18)*.08; continue; }
    enemy.rotation.z=0;
    updateEnemyState(enemy,playerDist,now);

    let tx=player.position.x,tz=player.position.z;
    if(enemy.userData.state==='wander'){
      if(now>=enemy.userData.nextWanderAt||Math.hypot(enemy.userData.wanderTarget.x-ex,enemy.userData.wanderTarget.y-ez)<1.4) setWanderTarget(enemy,now);
      tx=enemy.userData.wanderTarget.x;tz=enemy.userData.wanderTarget.y;
    } else if(enemy.userData.state==='search'){
      tx=enemy.userData.lastSeenX;tz=enemy.userData.lastSeenZ;
    } else {
      if(enemy.userData.id==='hunter-toodee' && player.moving){
        const lead=1.5+progress*1.3;
        tx=player.position.x-Math.sin(player.yaw)*lead;
        tz=player.position.z-Math.cos(player.yaw)*lead;
      }
    }

    let dx=tx-ex,dz=tz-ez;
    const dist=Math.hypot(dx,dz)||1;dx/=dist;dz/=dist;

    let personality=1;
    if(enemy.userData.id==='hunter-brobee') personality=.92;
    if(enemy.userData.id==='hunter-muno') personality=1.06;
    if(enemy.userData.id==='hunter-foofa') personality=.98;
    if(enemy.userData.id==='hunter-toodee') personality=1.03;
    if(enemy.userData.id==='hunter-plex') personality=1.0;

    const stateMult=enemy.userData.state==='chase'?1:(enemy.userData.state==='search'?.72:.48);
    const difficulty=1+progress*.24+(escapePhase?.2:0);
    const moveSpeed=enemy.userData.speed*personality*stateMult*difficulty;
    const step=moveSpeed*dt;

    let sx=dx,sz=dz;
    if(enemy.userData.state!=='wander'){
      [sx,sz]=pickSteer(enemy,dx,dz,step,now);
    } else if(enemyBlocked(ex+sx*step,ez+sz*step,.8)){
      setWanderTarget(enemy,now);sx=0;sz=0;
    }

    const nx=enemy.position.x+sx*step,nz=enemy.position.z+sz*step;
    if(!enemyBlocked(nx,enemy.position.z,.8)) enemy.position.x=nx;
    if(!enemyBlocked(enemy.position.x,nz,.8)) enemy.position.z=nz;
    enemy.lookAt(tx,1.55,tz);
    enemy.position.y=Math.sin(now*2.8+enemy.userData.phase)*.06;

    const closeAndVisible=playerDist<3.2&&canSeePlayer(enemy);
    if(closeAndVisible && enemy.userData.wasCloseVisible===false) triggerJumpScare(enemy,now);
    enemy.userData.wasCloseVisible=closeAndVisible;

    if(playerDist<CONFIG.enemyTouchRadius&&now>=player.invulnerableUntil){
      triggerJumpScare(enemy,now);
      player.health=Math.max(0,player.health-1);
      player.invulnerableUntil=now+CONFIG.contactInvulnerability;
      const awayX=pdx/(playerDist||1),awayZ=pdz/(playerDist||1);
      const newX=THREE.MathUtils.clamp(player.position.x+awayX*CONFIG.contactKnockback,-30.5,30.5);
      const newZ=THREE.MathUtils.clamp(player.position.z+awayZ*CONFIG.contactKnockback,-30.5,30.5);
      if(!blocked(newX,player.position.z)) player.position.x=newX;
      if(!blocked(player.position.x,newZ)) player.position.z=newZ;
      showMessage(player.health>0?'OUCH! '+player.health+' HEART'+(player.health===1?'':'S')+' LEFT!':'NO HEARTS LEFT!',1500);
      beep(115,.22);
      if(player.health<=0) finish(false);
    }
  }

  const close=nearest<6.2&&!ended;
  const staticRange=17;
  const proximity=nearest<staticRange?THREE.MathUtils.clamp(1-nearest/staticRange,0,1):0;
  const eased=proximity*proximity;
  screenFrame.style.setProperty('--crt-opacity',(.045+eased*.82*settings.static).toFixed(3));
  screenFrame.style.setProperty('--noise-opacity',(.04+eased*.68*settings.static).toFixed(3));
  screenFrame.style.setProperty('--game-contrast',(1+eased*.22).toFixed(2));
  document.body.classList.toggle('danger',close);
  document.body.classList.toggle('static-heavy',proximity>.05&&!ended);
  updateFootsteps(now,player.moving,player.isSprinting,nearest);
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .05);
  const now = performance.now() / 1000;
  if (started && !ended && !settingsScreen.classList.contains('active')) {
    const elapsed = now - gameStartTime;
    movePlayer(dt, now);
    updateCollectibles(now, dt);
    updateLanceTV(now);
    updateScentTrail(now);
    updateDizzyEffects(now);
    spawnGoobleIfNeeded(elapsed);
    updateEnemies(dt, now);
    updateHud();
    drawMinimap(now);
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

applySettings();
refreshSprintButton();
updateHud();
drawMinimap();
animate();
