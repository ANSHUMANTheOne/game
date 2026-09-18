import * as THREE from "three";

const canvas = document.getElementById("game-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  resizeCameras();
});

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8d8f0);
scene.fog = new THREE.Fog(0xa8d8f0, 150, 620);

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x8fce7a, 0.7));
const sunLight = new THREE.DirectionalLight(0xfff6e0, 1.3);
sunLight.position.set(40, 80, 20);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.left = -70;
sunLight.shadow.camera.right = 70;
sunLight.shadow.camera.top = 90;
sunLight.shadow.camera.bottom = -90;
sunLight.shadow.camera.far = 320;
sunLight.shadow.bias = -0.0006;
scene.add(sunLight);
scene.add(sunLight.target);

const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  depthWrite: false,
  fog: false,
  uniforms: {
    topColor: { value: new THREE.Color(0x4a90d9) },
    midColor: { value: new THREE.Color(0xa8d8f0) },
    botColor: { value: new THREE.Color(0xffe3c2) },
    sunDir: { value: new THREE.Vector3(0.4, 0.6, 0.7).normalize() },
  },
  vertexShader: `
    varying vec3 vPos;
    void main() {
      vPos = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 topColor;
    uniform vec3 midColor;
    uniform vec3 botColor;
    uniform vec3 sunDir;
    varying vec3 vPos;
    void main() {
      vec3 dir = normalize(vPos);
      float h = dir.y;
      vec3 col;
      if (h > 0.12) {
        col = mix(midColor, topColor, smoothstep(0.12, 0.65, h));
      } else {
        col = mix(botColor, midColor, smoothstep(-0.08, 0.12, h));
      }
      float sun = max(dot(dir, sunDir), 0.0);
      col += vec3(1.0, 0.9, 0.7) * pow(sun, 60.0) * 0.9;
      col += vec3(1.0, 0.85, 0.6) * pow(sun, 6.0) * 0.18;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
});
const skyDome = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 14), skyMat);
scene.add(skyDome);

const mat = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05, ...opts });
const glassMat = mat(0x9adcf0, { roughness: 0.12, metalness: 0.25, transparent: true, opacity: 0.92 });
const darkMat = mat(0x33333f, { roughness: 0.75 });
const tireMat = mat(0x26262e, { roughness: 0.95 });
const rimMat = mat(0xfff4d6, { roughness: 0.35, metalness: 0.2 });
const woodMat = mat(0xc98d5e);
const steelMat = mat(0x9aa0ad, { metalness: 0.6, roughness: 0.35 });
const kerbRedMat = mat(0xd64545, { roughness: 0.8 });
const kerbWhiteMat = mat(0xf2f2f2, { roughness: 0.8 });
const shortestAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const clamp = THREE.MathUtils.clamp;

const VEHICLES = {
  sedan:     { emoji: "🚗", color: 0x7ec8f7, len: 4.2, wid: 2.0, body: 0.72, cabin: 0.6,  max: 27, acc: 15, wheel: 0.36 },
  sports:    { emoji: "🏎️", color: 0xff8fa3, len: 4.1, wid: 2.0, body: 0.55, cabin: 0.48, max: 33, acc: 21, wheel: 0.35 },
  taxi:      { emoji: "🚕", color: 0xffd166, len: 4.2, wid: 2.0, body: 0.72, cabin: 0.6,  max: 27, acc: 15, wheel: 0.36 },
  van:       { emoji: "🚐", color: 0xf8f9fa, len: 4.9, wid: 2.1, body: 1.15, cabin: 0.5,  max: 23, acc: 12, wheel: 0.38 },
  pickup:    { emoji: "🛻", color: 0x95d5b2, len: 4.9, wid: 2.1, body: 0.8,  cabin: 0.58, max: 25, acc: 14, wheel: 0.42 },
  truck:     { emoji: "🚚", color: 0xffa94d, len: 6.6, wid: 2.3, body: 1.55, cabin: 0.7,  max: 19, acc: 9,  wheel: 0.48 },
  ambulance: { emoji: "🚑", color: 0xffffff, len: 5.3, wid: 2.2, body: 1.25, cabin: 0.45, max: 25, acc: 13, wheel: 0.4 },
  police:    { emoji: "🚓", color: 0xf4f4f8, len: 4.5, wid: 2.0, body: 0.72, cabin: 0.6,  max: 30, acc: 18, wheel: 0.36 },
  f1:        { emoji: "🏁", color: 0xff5a4e, len: 4.4, wid: 2.0, body: 0.4,  cabin: 0.35, max: 38, acc: 26, wheel: 0.4 },
  tractor:   { emoji: "🚜", color: 0x6ab04c, len: 3.9, wid: 2.0, body: 0.75, cabin: 0.7,  max: 14, acc: 10, wheel: 0.5 },
  bus:       { emoji: "🚌", color: 0xffd166, len: 7.6, wid: 2.3, body: 1.5,  cabin: 0.4,  max: 20, acc: 8,  wheel: 0.46 },
  train:     { emoji: "🚂", color: 0xd64545, len: 5.6, wid: 2.2, body: 1.3,  cabin: 0.8,  max: 30, acc: 10, wheel: 0.42 },
};

function makeWheel(radius, width) {
  const g = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 18), tireMat);
  tire.rotation.z = Math.PI / 2;
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.55, radius * 0.55, width + 0.05, 12), rimMat);
  rim.rotation.z = Math.PI / 2;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.18, radius * 0.18, width + 0.08, 8), darkMat);
  hub.rotation.z = Math.PI / 2;
  g.add(tire, rim, hub);
  g.traverse((m) => (m.castShadow = true));
  return g;
}

function buildVehicle(type) {
  const cfg = VEHICLES[type];
  const g = new THREE.Group();
  const bodyMat = mat(cfg.color);
  const skirtMat = mat(new THREE.Color(cfg.color).lerp(new THREE.Color(0x000000), 0.25));
  const wheels = [];
  const y0 = cfg.wheel;
  const bodyY = y0 + cfg.body / 2 - 0.08;

  const addMesh = (geo, m, x, y, z) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    g.add(mesh);
    return mesh;
  };

  if (type === "train") {
    addMesh(new THREE.BoxGeometry(cfg.wid, 0.45, cfg.len), darkMat, 0, 0.62, 0);
    addMesh(new THREE.BoxGeometry(cfg.wid, 1.15, cfg.len * 0.6), bodyMat, 0, 1.35, -cfg.len * 0.15);
    addMesh(new THREE.BoxGeometry(cfg.wid * 0.96, 0.85, cfg.len * 0.28), glassMat, 0, 2.28, -cfg.len * 0.3);
    addMesh(new THREE.BoxGeometry(cfg.wid * 1.06, 0.14, cfg.len * 0.34), mat(0xf8f9fa), 0, 2.74, -cfg.len * 0.3);
    const boiler = addMesh(new THREE.CylinderGeometry(0.78, 0.78, cfg.len * 0.42, 16), darkMat, 0, 1.5, cfg.len * 0.22);
    boiler.rotation.x = Math.PI / 2;
    for (const zz of [-0.7, 0, 0.7]) {
      const band = addMesh(new THREE.TorusGeometry(0.79, 0.05, 8, 16), steelMat, 0, 1.5, cfg.len * 0.22 + zz);
      band.rotation.y = Math.PI / 2;
    }
    addMesh(new THREE.CylinderGeometry(0.16, 0.26, 0.75, 10), darkMat, 0, 2.6, cfg.len * 0.37);
    addMesh(new THREE.CylinderGeometry(0.09, 0.09, 0.5, 8), steelMat, 0, 2.2, cfg.len * 0.05);
    const cow = addMesh(new THREE.ConeGeometry(0.95, 1, 4), mat(0xb03a3a), 0, 0.6, cfg.len * 0.56);
    cow.rotation.x = -0.5;
    cow.rotation.y = Math.PI / 4;
    for (const side of [-1, 1]) {
      addMesh(new THREE.BoxGeometry(0.08, 0.12, cfg.len * 0.5), steelMat, side * (cfg.wid / 2 - 0.05), 0.62, 0);
    }
    for (const side of [-1, 1])
      for (const axle of [-1, 0, 1]) {
        const w = makeWheel(cfg.wheel * 0.92, 0.24);
        w.position.set(side * (cfg.wid / 2), cfg.wheel * 0.92, axle * cfg.len * 0.28);
        g.add(w);
        wheels.push(w);
      }
  } else if (type === "f1") {
    addMesh(new THREE.BoxGeometry(0.9, 0.42, cfg.len), bodyMat, 0, 0.55, 0);
    addMesh(new THREE.BoxGeometry(0.5, 0.28, cfg.len * 0.42), bodyMat, 0, 0.42, cfg.len * 0.55);
    addMesh(new THREE.BoxGeometry(0.8, 0.35, 0.8), glassMat, 0, 0.95, -0.2);
    addMesh(new THREE.BoxGeometry(1.95, 0.09, 0.5), darkMat, 0, 1.0, -cfg.len * 0.52);
    addMesh(new THREE.BoxGeometry(1.6, 0.08, 0.4), darkMat, 0, 0.85, cfg.len * 0.42);
    for (const side of [-1, 1]) {
      const wF = makeWheel(0.36, 0.32);
      wF.position.set(side * 1.0, 0.36, cfg.len * 0.32);
      const wR = makeWheel(0.43, 0.38);
      wR.position.set(side * 1.0, 0.43, -cfg.len * 0.32);
      g.add(wF, wR);
      wheels.push(wF, wR);
    }
  } else {
    const big = type === "van" || type === "bus" || type === "truck" || type === "ambulance";
    const axleZ = cfg.len * 0.32;

    if (big) {
      addMesh(new THREE.BoxGeometry(cfg.wid, cfg.body, cfg.len), bodyMat, 0, bodyY, 0);
      addMesh(new THREE.BoxGeometry(cfg.wid + 0.05, cfg.body * 0.28, cfg.len * 0.98), skirtMat, 0, y0 + cfg.body * 0.1, 0);
      addMesh(new THREE.BoxGeometry(cfg.wid * 1.02, cfg.cabin * 0.95, cfg.len * 0.94), glassMat, 0, bodyY + cfg.body / 2 - cfg.cabin * 0.25, 0);
      addMesh(new THREE.BoxGeometry(cfg.wid * 0.92, 0.16, cfg.len * 0.92), bodyMat, 0, bodyY + cfg.body / 2 + 0.05, 0);
      addMesh(new THREE.BoxGeometry(cfg.wid * 0.42, 0.12, cfg.len * 0.45), mat(0xd9dde2), 0, bodyY + cfg.body / 2 + 0.16, 0);
    } else {
      addMesh(new THREE.BoxGeometry(cfg.wid, cfg.body * 0.6, cfg.len), bodyMat, 0, y0 + cfg.body * 0.3, 0);
      addMesh(new THREE.BoxGeometry(cfg.wid + 0.04, cfg.body * 0.22, cfg.len * 0.97), skirtMat, 0, y0 + cfg.body * 0.11, 0);
      addMesh(new THREE.BoxGeometry(cfg.wid * 0.97, cfg.body * 0.52, cfg.len * 0.95), bodyMat, 0, y0 + cfg.body * 0.66, -0.02);
      const cabY = y0 + cfg.body + cfg.cabin / 2 - 0.12;
      const cabZ = type === "sports" ? -0.35 : -0.18;
      const cabinLen = cfg.len * 0.46;
      addMesh(new THREE.BoxGeometry(cfg.wid * 0.82, cfg.cabin, cabinLen), glassMat, 0, cabY, cabZ);
      addMesh(new THREE.BoxGeometry(cfg.wid * 0.72, cfg.cabin * 0.6, cabinLen * 0.78), glassMat, 0, cabY + cfg.cabin * 0.25, cabZ);
      addMesh(new THREE.BoxGeometry(cfg.wid * 0.76, 0.12, cabinLen * 0.7), type === "taxi" ? darkMat : bodyMat, 0, cabY + cfg.cabin * 0.56, cabZ);
      const windshield = addMesh(new THREE.BoxGeometry(cfg.wid * 0.78, 0.09, cabinLen * 0.55), glassMat, 0, cabY - cfg.cabin * 0.2, cabZ + cabinLen * 0.52);
      windshield.rotation.x = -0.55;
      const rearGlass = addMesh(new THREE.BoxGeometry(cfg.wid * 0.78, 0.09, cabinLen * 0.48), glassMat, 0, cabY - cfg.cabin * 0.2, cabZ - cabinLen * 0.5);
      rearGlass.rotation.x = 0.55;
      addMesh(new THREE.BoxGeometry(cfg.wid * 0.9, 0.09, cfg.len * 0.2), bodyMat, 0, y0 + cfg.body * 0.94, cfg.len * 0.37);
      addMesh(new THREE.BoxGeometry(cfg.wid * 0.9, 0.09, cfg.len * 0.17), bodyMat, 0, y0 + cfg.body * 0.94, -cfg.len * 0.39);
    }

    for (const side of [-1, 1])
      for (const axle of [-1, 1]) {
        addMesh(new THREE.BoxGeometry(0.14, cfg.wheel * 1.15, cfg.wheel * 1.7), skirtMat, side * (cfg.wid / 2 + 0.02), cfg.wheel * 1.08, axle * axleZ);
        const r = type === "tractor" && axle === -1 ? cfg.wheel * 1.35 : cfg.wheel;
        const w = makeWheel(r, 0.3);
        w.position.set(side * (cfg.wid / 2 + 0.04), r, axle * axleZ);
        g.add(w);
        wheels.push(w);
      }

    for (const side of [-1, 1])
      addMesh(new THREE.BoxGeometry(0.1, 0.1, 0.24), darkMat, side * (cfg.wid / 2 + 0.09), bodyY + cfg.body * 0.32, cfg.len * 0.12);
    addMesh(new THREE.BoxGeometry(cfg.wid * 0.52, 0.16, 0.07), darkMat, 0, bodyY, cfg.len / 2 + 0.03);
    addMesh(new THREE.BoxGeometry(cfg.wid * 0.6, 0.1, 0.06), mat(0x22222c), 0, bodyY - cfg.body * 0.12, -cfg.len / 2 - 0.03);
    addMesh(new THREE.CylinderGeometry(0.05, 0.05, 0.18, 8), steelMat, -cfg.wid * 0.25, y0 + 0.12, -cfg.len / 2 - 0.06);

    for (const side of [-1, 1]) {
      addMesh(new THREE.BoxGeometry(0.32, 0.14, 0.08), mat(0xfff3b0, { emissive: 0xffe9a0, emissiveIntensity: 0.6 }), side * cfg.wid * 0.3, bodyY + cfg.body * 0.18, cfg.len / 2 + 0.02);
      addMesh(new THREE.BoxGeometry(0.32, 0.14, 0.08), mat(0xe74c3c, { emissive: 0xc0392b, emissiveIntensity: 0.6 }), side * cfg.wid * 0.3, bodyY + cfg.body * 0.18, -cfg.len / 2 - 0.02);
    }

    if (type === "taxi") addMesh(new THREE.BoxGeometry(0.6, 0.18, 0.3), mat(0xffd166), 0, bodyY + cfg.body / 2 + cfg.cabin * 0.7, -0.18);
    if (type === "police") {
      g.userData.lightBar = [];
      for (const [x, c] of [[-0.35, 0x3b82f6], [0.35, 0xef4444]]) {
        const l = addMesh(new THREE.BoxGeometry(0.5, 0.16, 0.3), mat(c, { emissive: c, emissiveIntensity: 0.2 }), x, bodyY + cfg.body / 2 + cfg.cabin * 0.68, -0.18);
        g.userData.lightBar.push(l);
      }
      addMesh(new THREE.BoxGeometry(cfg.wid + 0.03, 0.26, cfg.len * 0.36), mat(0x2f2f38), 0, bodyY, 0);
    }
    if (type === "ambulance") addMesh(new THREE.BoxGeometry(cfg.wid + 0.03, 0.2, cfg.len * 0.66), mat(0xef4444), 0, bodyY, 0);
    if (type === "truck") {
      addMesh(new THREE.BoxGeometry(cfg.wid * 1.04, 1.75, cfg.len * 0.52), mat(0xe9ecef), 0, cfg.wheel + 0.98, -cfg.len * 0.21);
      addMesh(new THREE.BoxGeometry(cfg.wid * 1.06, 0.12, cfg.len * 0.54), steelMat, 0, cfg.wheel + 0.22, -cfg.len * 0.21);
    }
    if (type === "pickup") addMesh(new THREE.BoxGeometry(cfg.wid * 0.88, 0.4, cfg.len * 0.32), bodyMat, 0, bodyY + cfg.body * 0.42, -cfg.len * 0.28);
    if (type === "sports") addMesh(new THREE.BoxGeometry(1.75, 0.09, 0.42), darkMat, 0, bodyY + cfg.body / 2 + cfg.cabin * 0.8, -cfg.len * 0.42);
    if (type === "tractor") addMesh(new THREE.CylinderGeometry(0.07, 0.07, 0.95, 8), darkMat, 0.4, cfg.wheel + cfg.body + 0.5, cfg.len * 0.25);
  }

  g.traverse((m) => {
    if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; }
  });
  g.userData = { ...g.userData, wheels, cfg, type };
  return g;
}

const sparks = [];
for (let i = 0; i < 90; i++) {
  const s = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.35), new THREE.MeshBasicMaterial({ color: i % 3 ? 0xffb347 : 0xff5a4e }));
  s.visible = false;
  scene.add(s);
  sparks.push({ mesh: s, vel: new THREE.Vector3(), life: 0 });
}
function emitSparks(pos, n) {
  let e = 0;
  for (const p of sparks) {
    if (p.life > 0) continue;
    p.mesh.visible = true;
    p.mesh.position.copy(pos);
    p.mesh.position.x += (Math.random() - 0.5) * 0.8;
    p.vel.set((Math.random() - 0.5) * 6, 3 + Math.random() * 5, -6 - Math.random() * 6);
    p.life = 0.35 + Math.random() * 0.35;
    if (++e >= n) break;
  }
}
const smokes = [];
for (let i = 0; i < 40; i++) {
  const s = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), new THREE.MeshBasicMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.5 }));
  s.visible = false;
  scene.add(s);
  smokes.push({ mesh: s, life: 0 });
}
function emitSmoke(pos) {
  for (const p of smokes) {
    if (p.life > 0) continue;
    p.mesh.visible = true;
    p.mesh.position.copy(pos);
    p.mesh.scale.setScalar(0.5 + Math.random() * 0.5);
    p.life = 0.7;
    return;
  }
}
function updateParticles(dt) {
  for (const p of sparks) {
    if (p.life <= 0) continue;
    p.life -= dt;
    if (p.life <= 0) { p.mesh.visible = false; continue; }
    p.mesh.position.addScaledVector(p.vel, dt);
    p.vel.y -= 22 * dt;
    p.mesh.rotation.x += 10 * dt;
  }
  for (const p of smokes) {
    if (p.life <= 0) continue;
    p.life -= dt;
    if (p.life <= 0) { p.mesh.visible = false; continue; }
    p.mesh.scale.multiplyScalar(1 + 2.2 * dt);
    p.mesh.material.opacity = 0.5 * (p.life / 0.7);
    p.mesh.position.y += 1.2 * dt;
  }
}

const skids = [];
const skidGeo = new THREE.PlaneGeometry(0.3, 1.1);
for (let i = 0; i < 160; i++) {
  const m = new THREE.Mesh(
    skidGeo,
    new THREE.MeshBasicMaterial({ color: 0x18181c, transparent: true, opacity: 0, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.visible = false;
  scene.add(m);
  skids.push({ mesh: m, life: 0 });
}
let skidIdx = 0;
function dropSkid(x, z, heading) {
  const s = skids[skidIdx++ % skids.length];
  s.mesh.visible = true;
  s.mesh.position.set(x, 0.035, z);
  s.mesh.rotation.z = -heading;
  s.life = 7;
}
function updateSkids(dt) {
  for (const s of skids) {
    if (s.life <= 0) continue;
    s.life -= dt;
    if (s.life <= 0) { s.mesh.visible = false; continue; }
    s.mesh.material.opacity = Math.min(0.5, (s.life / 7) * 0.5);
  }
}

const CONTROLS_P1 = { f: "KeyW", b: "KeyS", l: "KeyA", r: "KeyD", drift: "ShiftLeft" };
const CONTROLS_P2 = { f: "ArrowUp", b: "ArrowDown", l: "ArrowLeft", r: "ArrowRight", drift: "ShiftRight" };

const keys = {};
window.addEventListener("keydown", (e) => (keys[e.code] = true));
window.addEventListener("keyup", (e) => (keys[e.code] = false));

function makePlayer(type, x, z, controls) {
  const obj = buildVehicle(type);
  obj.position.set(x, 0, z);
  scene.add(obj);
  return {
    obj, type, controls,
    speed: 0, heading: 0, velHeading: 0, vy: 0,
    stun: 0, railLocked: false, finished: false, finishTime: 0,
    prog: 0, drifting: false, skidAcc: 0,
    cam: { yaw: Math.PI, pitch: 0.24, dragging: false, lastX: 0, lastY: 0 },
    camera: new THREE.PerspectiveCamera(62, 1, 0.1, 1400),
  };
}

function updateCarPhysics(p, dt, opts = {}) {
  const cfg = p.obj.userData.cfg;
  const u = opts;

  if (p.finished) { p.speed *= 1 - 2 * dt; }
  else if (p.stun > 0) { p.stun -= dt; }
  else {
    const c = p.controls;
    if (keys[c.f]) p.speed += cfg.acc * dt;
    else if (keys[c.b]) p.speed -= cfg.acc * 1.4 * dt;
    else p.speed *= 1 - 0.5 * dt;
    let topSpeed = cfg.max;
    if (p.type === "train") topSpeed = p.railLocked ? 36 : 16;
    p.speed = clamp(p.speed, -8, topSpeed);

    if (u.grassSlow) {
      const ax = Math.abs(p.obj.position.x);
      if (ax > 14 && p.speed > 5) p.speed *= 1 - 0.45 * dt;
    }

    const steer = (keys[c.l] ? 1 : 0) - (keys[c.r] ? 1 : 0);
    const speedFrac = Math.min(1, Math.abs(p.speed) / 10);
    const highSpeedDamp = 1 - 0.25 * speedFrac;
    const driftBonus = keys[c.drift] ? 1.6 : 1;
    p.heading += steer * 1.6 * driftBonus * highSpeedDamp * speedFrac * dt * Math.sign(p.speed || 1);

    p.drifting = keys[c.drift] && Math.abs(p.speed) > 8;
    const grip = p.drifting ? 1.6 : u.onIce ? 2.4 : 11;
    p.velHeading += shortestAngle(p.heading - p.velHeading) * Math.min(1, grip * dt);
    if (p.drifting) p.speed *= 1 - 0.15 * dt;

    const targetRoll = -steer * 0.05 * speedFrac * (p.drifting ? 1.8 : 1);
    p.obj.rotation.z += (targetRoll - p.obj.rotation.z) * Math.min(1, 8 * dt);
  }

  p.obj.position.x += Math.sin(p.velHeading) * p.speed * dt;
  p.obj.position.z += Math.cos(p.velHeading) * p.speed * dt;
  p.obj.rotation.y = p.heading;

  if (!p.isCop && Math.abs(p.speed) > 6) {
    const driftAngle = Math.abs(shortestAngle(p.heading - p.velHeading));
    const hardBrake = keys[p.controls.b] && p.speed > 10;
    if ((p.drifting && driftAngle > 0.18) || driftAngle > 0.35 || hardBrake) {
      p.skidAcc += dt;
      if (p.skidAcc > 0.035) {
        p.skidAcc = 0;
        const cfgL = cfg.len;
        const cfgW = cfg.wid;
        const rx = p.obj.position.x - Math.sin(p.heading) * cfgL * 0.32;
        const rz = p.obj.position.z - Math.cos(p.heading) * cfgL * 0.32;
        const sx = Math.cos(p.heading) * cfgW * 0.5;
        const sz = -Math.sin(p.heading) * cfgW * 0.5;
        dropSkid(rx + sx, rz + sz, p.velHeading);
        dropSkid(rx - sx, rz - sz, p.velHeading);
      }
    }
  }

  if (p.drifting && Math.abs(shortestAngle(p.heading - p.velHeading)) > 0.22 && Math.random() < 0.7) {
    emitSmoke(new THREE.Vector3(
      p.obj.position.x - Math.sin(p.heading) * cfg.len * 0.4 + (Math.random() - 0.5) * 1.6,
      0.3,
      p.obj.position.z - Math.cos(p.heading) * cfg.len * 0.4
    ));
  }

  for (const w of p.obj.userData.wheels) w.children[0].rotation.x += p.speed * dt * 2.4;
  sunLight.target = p.obj;
  sunLight.position.set(p.obj.position.x + 40, 80, p.obj.position.z + 20);
}

canvas.addEventListener("pointerdown", (e) => {
  const p = G.players[e.clientX < window.innerWidth / 2 ? 0 : G.players.length - 1];
  if (!p) return;
  p.cam.dragging = true;
  p.cam.lastX = e.clientX;
  p.cam.lastY = e.clientY;
});
window.addEventListener("pointerup", () => {
  for (const p of G.players) p.cam.dragging = false;
});
window.addEventListener("pointermove", (e) => {
  for (const p of G.players) {
    if (!p.cam.dragging) continue;
    p.cam.yaw -= (e.clientX - p.cam.lastX) * 0.006;
    p.cam.pitch += (e.clientY - p.cam.lastY) * 0.005;
    p.cam.lastX = e.clientX;
    p.cam.lastY = e.clientY;
    p.cam.pitch = clamp(p.cam.pitch, 0.06, 1.15);
  }
});

function updateCamera(p, dt) {
  if (!p.cam.dragging) {
    p.cam.yaw += shortestAngle(p.heading + Math.PI - p.cam.yaw) * Math.min(1, 2.2 * dt);
  }
  const dist = 12 * Math.cos(p.cam.pitch);
  const height = 3.5 + 12 * Math.sin(p.cam.pitch);
  const target = new THREE.Vector3(
    p.obj.position.x + Math.sin(p.cam.yaw) * dist,
    p.obj.position.y + height,
    p.obj.position.z + Math.cos(p.cam.yaw) * dist
  );
  p.camera.position.lerp(target, 1 - Math.pow(0.0001, dt));
  p.camera.lookAt(p.obj.position.x, p.obj.position.y + 1.5, p.obj.position.z);
  if (shake > 0) {
    p.camera.position.x += (Math.random() - 0.5) * shake * 0.6;
    p.camera.position.y += (Math.random() - 0.5) * shake * 0.6;
  }
}

const LANE_RIGHT = [4, 7, 10];
const LANE_LEFT = [-4, -7, -10];
const RAIL_X = 14.5;
const CHUNK_LEN = 60;
const CHUNK_COUNT = 14;
const CROSS_EVERY = 6;

const H = { stars: 0, timeLeft: 300, cops: [], copTimer: 0, walmart: null, walmartTimer: 12 };

function chunkIsCrossing(i) { return i % CROSS_EVERY === 3; }

const highwayChunks = [];
let G_highwayGround = null;
let G_mountains = null;

function buildHighway() {
  const asphaltMat = mat(0x4a4a52, { roughness: 0.95 });

  const paintLine = (g, x, z, w, l, color) => {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(w, l), mat(color));
    line.rotation.x = -Math.PI / 2;
    line.position.set(x, 0.03, z);
    g.add(line);
  };

  for (let idx = 0; idx < CHUNK_COUNT; idx++) {
    const g = new THREE.Group();
    const z0 = idx * CHUNK_LEN;
    const zMid = z0 + CHUNK_LEN / 2;

    for (const side of [1, -1]) {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(13, CHUNK_LEN), asphaltMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(side * 7, 0.01, zMid);
      road.receiveShadow = true;
      g.add(road);
    }
    paintLine(g, -0.28, zMid, 0.16, CHUNK_LEN, 0xffd166);
    paintLine(g, 0.28, zMid, 0.16, CHUNK_LEN, 0xffd166);
    for (const side of [1, -1]) {
      paintLine(g, side * 1.6, zMid, 0.14, CHUNK_LEN, 0xf8f9fa);
      paintLine(g, side * 13.6, zMid, 0.14, CHUNK_LEN, 0xf8f9fa);
      for (let i = 0; i < 6; i++) {
        paintLine(g, side * 5.5, z0 + i * 10 + 2.5, 0.12, 4, 0xf8f9fa);
        paintLine(g, side * 8.5, z0 + i * 10 + 2.5, 0.12, 4, 0xf8f9fa);
      }
    }

    for (const off of [-0.8, 0.8]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, CHUNK_LEN), steelMat);
      rail.position.set(RAIL_X + off, 0.1, zMid);
      g.add(rail);
    }
    for (let i = 0; i < CHUNK_LEN / 3; i++) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.5), woodMat);
      s.position.set(RAIL_X, 0.04, z0 + i * 3 + 1);
      g.add(s);
    }

    if (chunkIsCrossing(idx)) {
      const deck = new THREE.Mesh(new THREE.PlaneGeometry(26, 9), mat(0x5a5a64));
      deck.rotation.x = -Math.PI / 2;
      deck.position.set(4, 0.02, zMid);
      g.add(deck);
      for (const side of [1, -1])
        for (let i = 0; i < 6; i++) {
          const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 9), mat(i % 2 ? 0xf8f9fa : 0xe74c3c));
          stripe.rotation.x = -Math.PI / 2;
          stripe.position.set(RAIL_X + side * (1.6 + i * 0.8), 0.035, zMid);
          g.add(stripe);
        }
    } else {
      for (const side of [-1, 1]) {
        const fx = RAIL_X + side * 1.5;
        for (const hy of [0.35, 0.7]) {
          const bar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, CHUNK_LEN), steelMat);
          bar.position.set(fx, hy, zMid);
          g.add(bar);
        }
        for (let i = 0; i < CHUNK_LEN / 3; i++) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.85, 0.08), steelMat);
          post.position.set(fx, 0.42, z0 + i * 3 + 0.5);
          g.add(post);
        }
      }
    }

    for (let i = 0; i < 6; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const x = side * (24 + Math.random() * 55);
      const z = z0 + Math.random() * CHUNK_LEN;
      const roll = Math.random();
      let obj;
      if (roll < 0.55) {
        obj = new THREE.Group();
        const s = 0.9 + Math.random() * 0.9;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.3 * s, 7), woodMat);
        trunk.position.y = 0.65 * s;
        const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.2 * s, 9, 8), mat(0x74c69d, { flatShading: true }));
        canopy.position.y = 1.9 * s;
        obj.add(trunk, canopy);
      } else if (roll < 0.8) {
        obj = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5 + Math.random() * 0.5, 0), mat(0x74c69d, { flatShading: true }));
        obj.position.y = 0.4;
      } else {
        obj = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.4), mat(0xb0b8c0, { flatShading: true }));
        obj.position.y = 0.35;
      }
      obj.position.x = x;
      obj.position.z = z;
      obj.traverse?.((m) => (m.castShadow = true));
      g.add(obj);
    }

    scene.add(g);
    highwayChunks.push({ group: g, zBase: z0 });
  }

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1800, 2600), mat(0x8fce7a, { roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.06;
  ground.receiveShadow = true;
  scene.add(ground);
  G_highwayGround = ground;

  const mountains = new THREE.Group();
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const dist = 420 + Math.random() * 130;
    const h = 45 + Math.random() * 75;
    const m = new THREE.Mesh(
      new THREE.ConeGeometry(60 + Math.random() * 50, h, 5),
      mat(new THREE.Color(0xa8c5b8).lerp(new THREE.Color(0xc3aee0), Math.random()), { flatShading: true, roughness: 1 })
    );
    m.position.set(Math.cos(angle) * dist, h / 2 - 4, Math.sin(angle) * dist);
    mountains.add(m);
  }
  scene.add(mountains);
  G_mountains = mountains;
}

function recycleHighway(playerZ) {
  for (const c of highwayChunks) {
    if (c.zBase + CHUNK_LEN < playerZ - CHUNK_LEN * 1.5) {
      const maxZ = Math.max(...highwayChunks.map((k) => k.zBase));
      c.group.position.z += maxZ + CHUNK_LEN - c.zBase;
      c.zBase = maxZ + CHUNK_LEN;
    }
  }
}

function worldCrossingDist(z) {
  const period = CROSS_EVERY * CHUNK_LEN;
  const crossZ = 3 * CHUNK_LEN + CHUNK_LEN / 2;
  const base = ((z % period) + period) % period;
  return Math.min(Math.abs(base - crossZ), period - Math.abs(base - crossZ));
}

function spawnWalmart() {
  const g = new THREE.Group();
  const store = new THREE.Mesh(new THREE.BoxGeometry(9, 4, 7), mat(0xf8f9fa));
  store.position.y = 2;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.5, 7.4), mat(0x4a90d9));
  roof.position.y = 4.25;
  const c = document.createElement("canvas");
  c.width = 256; c.height = 64;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = "#f2c94c";
  ctx.font = "bold 44px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("★ WALLMART ★", 128, 47);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.7), new THREE.MeshBasicMaterial({ map: tex }));
  sign.position.set(0, 3.4, 3.55);
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(1.2), new THREE.MeshBasicMaterial({ color: 0xffd166 }));
  star.position.y = 7;
  g.add(store, roof, sign, star);
  g.userData.star = star;
  g.position.set(Math.random() > 0.5 ? 19 : -19, 0, G.players[0].obj.position.z + 320);
  scene.add(g);
  H.walmart = g;
}
function removeWalmart() {
  if (!H.walmart) return;
  scene.remove(H.walmart);
  H.walmart = null;
  H.walmartTimer = 25 + Math.random() * 20;
}
function robWalmart() {
  H.stars++;
  showToast("🛒 robbed the mart! ⭐ +1, cops coming for 30s");
  flash("rgba(255, 215, 100, 0.4)");
  removeWalmart();
  spawnCop();
  H.copTimer = 30;
}
function nearestPlayer(x, z) {
  let best = G.players[0];
  let bestD = Infinity;
  for (const p of G.players) {
    const d = (p.obj.position.x - x) ** 2 + (p.obj.position.z - z) ** 2;
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}
function spawnCop() {
  if (H.cops.length >= 5) return;
  const target = G.players[G.players.length - 1];
  const cop = makePlayer("police", target.obj.position.x + 6, target.obj.position.z - 25, {});
  cop.isCop = true;
  cop.copSpeed = 0;
  H.cops.push(cop);
  showToast("🚨 police chase! survive 30 seconds");
}
function updateCops(dt) {
  if (H.cops.length) {
    H.copTimer -= dt;
    if (H.copTimer <= 0) {
      for (const c of H.cops) scene.remove(c.obj);
      H.cops.length = 0;
      showToast("😎 you lost the cops! kept your ⭐");
      return;
    }
  }
  for (const cop of H.cops) {
    const target = nearestPlayer(cop.obj.position.x, cop.obj.position.z);
    const o = cop.obj;
    const dx = target.obj.position.x - o.position.x;
    const dz = target.obj.position.z - o.position.z;
    o.rotation.y += shortestAngle(Math.atan2(dx, dz) - o.rotation.y) * Math.min(1, 3 * dt);
    cop.copSpeed = Math.min(cop.copSpeed + 10 * dt, 25);
    o.position.x += Math.sin(o.rotation.y) * cop.copSpeed * dt;
    o.position.z += Math.cos(o.rotation.y) * cop.copSpeed * dt;
    o.position.x = clamp(o.position.x, -20, RAIL_X + 3);
    for (const w of o.userData.wheels) w.children[0].rotation.x += cop.copSpeed * dt * 2;
    const t = performance.now() / 150;
    o.userData.lightBar?.forEach((l, li) => (l.material.emissiveIntensity = Math.floor(t + li) % 2 ? 1.6 : 0.15));

    if (Math.hypot(dx, dz) < 3.4 && target.stun <= 0) {
      const lost = Math.ceil(H.stars / 2);
      H.stars -= lost;
      target.stun = 1.5;
      target.speed = 0;
      showToast(`🚨 busted! lost ${lost} ⭐`);
      flash("rgba(80, 120, 255, 0.45)");
      for (const c of H.cops) scene.remove(c.obj);
      H.cops.length = 0;
      H.copTimer = 0;
    }
  }
}

const TRAFFIC_TYPES = ["sedan", "taxi", "van", "pickup", "truck", "bus", "sports", "ambulance", "tractor"];
const traffic = [];
function spawnTrafficCar(car, aheadOfZ) {
  const dir = Math.random() > 0.45 ? 1 : -1;
  const lanes = dir === 1 ? LANE_RIGHT : LANE_LEFT;
  car.userData.dir = dir;
  car.userData.laneX = lanes[Math.floor(Math.random() * lanes.length)];
  car.userData.cruise = dir === 1 ? 9 + Math.random() * 5 : 10 + Math.random() * 6;
  car.userData.knocked = 0;
  car.userData.spin = 0;
  car.position.set(car.userData.laneX, 0, aheadOfZ + 40 + Math.random() * 380);
  car.rotation.set(0, dir === 1 ? 0 : Math.PI, 0);
}
function updateTraffic(dt) {
  for (const car of traffic) {
    const u = car.userData;
    if (u.knocked > 0) {
      u.knocked -= dt;
      car.rotation.y += u.spin * dt;
      u.spin *= 1 - 1.5 * dt;
      if (u.knocked <= 0) { car.rotation.y = u.dir === 1 ? 0 : Math.PI; u.spin = 0; }
    }
    car.position.z += u.dir * u.cruise * dt;
    car.position.x += (u.laneX - car.position.x) * Math.min(1, 1.5 * dt);
    for (const w of car.userData.wheels) w.children[0].rotation.x += u.cruise * dt * 2;

    for (const p of G.players) {
      if (p.stun > 0 || p.finished) continue;
      const dx = p.obj.position.x - car.position.x;
      const dz = p.obj.position.z - car.position.z;
      if (dx * dx + dz * dz < 7.5) {
        const impact = Math.abs(p.speed + (u.dir === -1 ? u.cruise : -u.cruise));
        const side = Math.sign(dx) || 1;
        u.knocked = 1.4;
        u.spin = -side * (1.5 + impact * 0.15);
        u.laneX = car.position.x + side * 3.5;
        p.speed *= 0.5;
        p.heading += side * 0.25;
        p.velHeading += side * 0.4;
        flash("rgba(255, 80, 80, 0.4)");
        emitSparks(new THREE.Vector3((p.obj.position.x + car.position.x) / 2, 0.8, (p.obj.position.z + car.position.z) / 2), 10);
        shake = Math.min(1, 0.3 + impact * 0.02);
      }
    }
    if (car.position.z < G.players[0].obj.position.z - 150 || car.position.z > G.players[0].obj.position.z + 560)
      spawnTrafficCar(car, G.players[0].obj.position.z + 100);
  }
}

function updateTrain(p, dt) {
  const x = p.obj.position.x;
  if (!p.railLocked && Math.abs(x - RAIL_X) < 1.5 && Math.abs(p.speed) > 2) p.railLocked = true;
  if (!p.railLocked) return;

  const nearCross = worldCrossingDist(p.obj.position.z) < 6;
  if (!nearCross) {
    p.obj.position.x += (RAIL_X - p.obj.position.x) * Math.min(1, 6 * dt);
    const target = Math.cos(p.heading) >= 0 ? 0 : Math.PI;
    p.heading += shortestAngle(target - p.heading) * Math.min(1, 5 * dt);
    p.velHeading = p.heading;
    p.obj.position.x = clamp(p.obj.position.x, RAIL_X - 1.25, RAIL_X + 1.25);
  }
  if (Math.abs(p.obj.position.x - RAIL_X) > 5) p.railLocked = false;
  if (Math.abs(p.obj.position.x - RAIL_X) > 1.5 && Math.abs(p.speed) > 3 && !nearCross) {
    p.speed *= 1 - 0.5 * dt;
    if (Math.random() < 0.5)
      emitSparks(new THREE.Vector3(p.obj.position.x, 0.4, p.obj.position.z + 1.8), 3);
  }
}

function switchVehicle(type) {
  const p = G.players[0];
  const pos = p.obj.position.clone();
  scene.remove(p.obj);
  const fresh = makePlayer(type, pos.x, pos.z, CONTROLS_P1);
  if (type === "train") { fresh.heading = 0; fresh.velHeading = 0; fresh.railLocked = true; }
  G.players[0] = fresh;
  showToast((VEHICLES[type]?.emoji ?? "🚗") + " new ride delivered!");
}

const S = { tiles: [], scores: [0, 0], resetting: false, target: 3, players: [] };
function buildSpleef() {
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(700, 700),
    mat(0x4a90d9, { roughness: 0.3, metalness: 0.1 })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = -10;
  scene.add(water);

  const TILE = 3;
  const N = 27;
  const iceMat = mat(0xbfe8ff, { roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.9 });
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) {
      const t = new THREE.Mesh(new THREE.BoxGeometry(TILE - 0.15, 0.5, TILE - 0.15), iceMat.clone());
      t.position.set((i - N / 2 + 0.5) * TILE, 0, (j - N / 2 + 0.5) * TILE);
      t.receiveShadow = true;
      t.castShadow = true;
      scene.add(t);
      S.tiles.push({ mesh: t, falling: false, crackTimer: 0 });
    }
}
function resetSpleef() {
  for (const t of S.tiles) {
    t.falling = false;
    t.crackTimer = 0;
    t.mesh.position.y = 0;
    t.mesh.rotation.set(0, 0, 0);
    t.mesh.visible = true;
    t.mesh.material.color.set(0xbfe8ff);
  }
  S.players.forEach((p, i) => {
    p.obj.position.set(i === 0 ? -24 : 24, 0, 0);
    p.heading = i === 0 ? Math.PI / 2 : -Math.PI / 2;
    p.velHeading = p.heading;
    p.speed = 0;
    p.vy = 0;
    p.obj.rotation.set(0, p.heading, 0);
  });
  S.resetting = false;
}
function updateSpleef(dt) {
  if (S.resetting) return;
  for (const t of S.tiles) {
    if (t.crackTimer > 0 && !t.falling) {
      t.crackTimer -= dt;
      if (t.crackTimer <= 0) t.falling = true;
    }
    if (t.falling) {
      t.mesh.position.y -= 5 * dt;
      t.mesh.rotation.x += dt * 1.5;
      if (t.mesh.position.y < -9) t.mesh.visible = false;
    }
  }
  S.players.forEach((p, idx) => {
    if (p.vy === 0) {
      if (Math.abs(p.speed) > 4) {
        for (const t of S.tiles) {
          if (t.falling || t.crackTimer > 0) continue;
          const dx = t.mesh.position.x - p.obj.position.x;
          const dz = t.mesh.position.z - p.obj.position.z;
          if (dx * dx + dz * dz < 2.6) {
            t.crackTimer = 0.4 + Math.random() * 0.3;
            t.mesh.material.color.set(0xdff3ff);
          }
        }
      }
      let supported = false;
      for (const t of S.tiles) {
        if (t.falling || !t.mesh.visible) continue;
        const dx = t.mesh.position.x - p.obj.position.x;
        const dz = t.mesh.position.z - p.obj.position.z;
        if (dx * dx + dz * dz < 4.5) { supported = true; break; }
      }
      if (!supported) { p.vy = 0.01; showToast(`💦 p${idx + 1} fell in!`); }
    } else {
      p.vy -= 20 * dt;
      p.obj.position.y += p.vy * dt;
      p.obj.rotation.z += dt * 2;
      if (p.obj.position.y < -14) {
        S.resetting = true;
        S.scores[1 - idx]++;
        updateSpleefHUD();
        if (S.scores[1 - idx] >= S.target) {
          endGame(`player ${1 - idx + 1} wins!`, `${S.scores[0]} - ${S.scores[1]}`);
        } else {
          showToast(`🏆 point p${1 - idx + 1}! (${S.scores[0]}-${S.scores[1]})`);
          setTimeout(() => S.resetting && resetSpleef(), 1800);
        }
      }
    }
  });
}
function updateSpleefHUD() {
  document.getElementById("p1-info1").textContent = `💥 ${S.scores[0]}`;
  document.getElementById("p2-info1").textContent = `💥 ${S.scores[1]}`;
  document.getElementById("p2-info2").textContent = `first to ${S.target}`;
}

const C = { path: [], checkpoints: [], cpSpacing: 40, total: 0 };
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let trackSeed = 20260916;
function makeCheckerTexture(cols, rows) {
  const c = document.createElement("canvas");
  c.width = cols * 8;
  c.height = rows * 8;
  const ctx = c.getContext("2d");
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      ctx.fillStyle = (i + j) % 2 ? "#1a1a1c" : "#f2f2f2";
      ctx.fillRect(i * 8, j * 8, 8, 8);
    }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function buildGrandstand(px, pz, rot) {
  const g = new THREE.Group();
  for (let t = 0; t < 5; t++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(11, 0.9, 1.7), t % 2 ? kerbWhiteMat : kerbRedMat);
    step.position.set(0, 0.45 + t * 0.85, -t * 1.6);
    step.castShadow = true;
    g.add(step);
  }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(12, 0.3, 10), mat(0x4a90d9));
  roof.position.set(0, 5.2, -3.4);
  roof.castShadow = true;
  g.add(roof);
  for (const postX of [-5.4, 5.4]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 5.2, 8), steelMat);
    post.position.set(postX, 2.6, -7.2);
    g.add(post);
  }
  g.position.set(px, 0, pz);
  g.rotation.y = rot;
  scene.add(g);
}
function buildCircuit() {
  C.checkpoints = [];
  const rnd = mulberry32(trackSeed);
  const pts = [];
  let x = 0, z = 0, h = 0;
  const push = () => pts.push({ x, z, h });
  push();
  for (let s = 0; s < 12; s++) {
    const straight = 70 + rnd() * 60;
    const steps = Math.floor(straight / 5);
    for (let i = 0; i < steps; i++) {
      x += Math.sin(h) * 5;
      z += Math.cos(h) * 5;
      push();
    }
    h += (rnd() > 0.5 ? 1 : -1) * (0.4 + rnd() * 0.5);
  }
  for (let i = 0; i < 10; i++) { x += Math.sin(h) * 5; z += Math.cos(h) * 5; push(); }
  C.path = pts;
  C.total = pts.length;

  const width = 13;
  const positions = [];
  const indices = [];
  const right = new THREE.Vector3();
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    right.set(Math.cos(p.h), 0, -Math.sin(p.h));
    positions.push(p.x + right.x * width / 2, 0.02, p.z + right.z * width / 2);
    positions.push(p.x - right.x * width / 2, 0.02, p.z - right.z * width / 2);
    if (i < pts.length - 1) {
      const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const road = new THREE.Mesh(geo, mat(0x4a4a52, { roughness: 0.95, side: THREE.DoubleSide }));
  road.receiveShadow = true;
  scene.add(road);

  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    right.set(Math.cos(p.h), 0, -Math.sin(p.h));
    for (const side of [-1, 1]) {
      const kerb = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 5.6), i % 2 ? kerbWhiteMat : kerbRedMat);
      kerb.position.set(p.x + right.x * side * (width / 2 + 0.4), 0.06, p.z + right.z * side * (width / 2 + 0.4));
      kerb.rotation.y = p.h;
      kerb.receiveShadow = true;
      scene.add(kerb);
    }
  }

  for (let i = 0; i < pts.length; i += 6) {
    const p = pts[i];
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 3.5), kerbWhiteMat);
    dash.rotation.x = -Math.PI / 2;
    dash.rotation.z = -p.h;
    dash.position.set(p.x, 0.045, p.z);
    scene.add(dash);
  }

  const checkTex = makeCheckerTexture(20, 3);
  const gantry = (idx) => {
    const p = pts[Math.min(idx, pts.length - 1)];
    const rightV = new THREE.Vector3(Math.cos(p.h), 0, -Math.sin(p.h));
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.6, 7, 0.6), kerbRedMat);
      post.position.set(p.x + rightV.x * side * (width / 2 + 1), 3.5, p.z + rightV.z * side * (width / 2 + 1));
      post.castShadow = true;
      scene.add(post);
    }
    const banner = new THREE.Mesh(
      new THREE.BoxGeometry(width + 3, 1.6, 0.25),
      new THREE.MeshBasicMaterial({ map: checkTex })
    );
    banner.position.set(p.x, 7, p.z);
    banner.rotation.y = p.h;
    scene.add(banner);
  };
  gantry(0);
  gantry(pts.length - 1);

  for (let i = C.cpSpacing; i < pts.length - 5; i += C.cpSpacing) {
    C.checkpoints.push(i);
    const p = pts[i];
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.6, width), mat(0x7ec8f7));
    line.rotation.x = -Math.PI / 2;
    line.rotation.z = -p.h;
    line.position.set(p.x, 0.05, p.z);
    scene.add(line);
  }

  const startP = pts[0];
  const startRight = new THREE.Vector3(Math.cos(startP.h), 0, -Math.sin(startP.h));
  buildGrandstand(startP.x + startRight.x * (width / 2 + 10), startP.z + startRight.z * (width / 2 + 10), startP.h);
  buildGrandstand(startP.x - startRight.x * (width / 2 + 10), startP.z - startRight.z * (width / 2 + 10), startP.h + Math.PI);
  const midP = pts[Math.floor(pts.length / 2)];
  const midRight = new THREE.Vector3(Math.cos(midP.h), 0, -Math.sin(midP.h));
  buildGrandstand(midP.x + midRight.x * (width / 2 + 10), midP.z + midRight.z * (width / 2 + 10), midP.h);

  for (let i = 2; i < pts.length; i++) {
    const turn = Math.abs(pts[i].h - pts[i - 1].h);
    if (turn > 0.45 && Math.random() < 0.7) {
      const p = pts[i];
      right.set(Math.cos(p.h), 0, -Math.sin(p.h));
      const side = pts[i].h > pts[i - 1].h ? 1 : -1;
      for (let n = 0; n < 2; n++) {
        for (let stack = 0; stack < 3; stack++) {
          const tire = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.22, 8, 12), tireMat);
          tire.rotation.x = -Math.PI / 2;
          tire.position.set(
            p.x + right.x * side * (width / 2 + 2.2 + n * 1.2),
            0.24 + stack * 0.45,
            p.z + right.z * side * (width / 2 + 2.2 + n * 1.2)
          );
          tire.castShadow = true;
          scene.add(tire);
        }
      }
    }
  }

  const bounds = pts.reduce((a, p) => ({
    minX: Math.min(a.minX, p.x), maxX: Math.max(a.maxX, p.x),
    minZ: Math.min(a.minZ, p.z), maxZ: Math.max(a.maxZ, p.z),
  }), { minX: 0, maxX: 0, minZ: 0, maxZ: 0 });
  const gw = Math.max(400, bounds.maxX - bounds.minX + 500);
  const gh = Math.max(400, bounds.maxZ - bounds.minZ + 500);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(gw, gh), mat(0x8fce7a, { roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set((bounds.minX + bounds.maxX) / 2, -0.06, (bounds.minZ + bounds.maxZ) / 2);
  ground.receiveShadow = true;
  scene.add(ground);

  for (let i = 4; i < pts.length; i += 9) {
    const p = pts[i];
    const rightV = new THREE.Vector3(Math.cos(p.h), 0, -Math.sin(p.h));
    for (const side of [-1, 1]) {
      if (Math.random() < 0.5) continue;
      const d = width / 2 + 6 + Math.random() * 14;
      const s = 0.9 + Math.random() * 0.9;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.3 * s, 7), woodMat);
      trunk.position.set(p.x + rightV.x * side * d, 0.65 * s, p.z + rightV.z * side * d);
      const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.2 * s, 9, 8), mat(0x74c69d, { flatShading: true }));
      canopy.position.set(p.x + rightV.x * side * d, 1.9 * s, p.z + rightV.z * side * d);
      canopy.castShadow = true;
      scene.add(trunk, canopy);
    }
  }
}
function updateCircuitProgress(p, dt) {
  if (p.finished) return;
  let best = p.prog, bestD = Infinity;
  for (let i = p.prog; i < Math.min(C.path.length, p.prog + 45); i++) {
    const d = (C.path[i].x - p.obj.position.x) ** 2 + (C.path[i].z - p.obj.position.z) ** 2;
    if (d < bestD) { bestD = d; best = i; }
  }
  p.prog = best;
  if (best >= C.path.length - 4) {
    p.finished = true;
    p.finishTime = G.modeTime;
    const key = "lp_circuit_best_" + trackSeed;
    if (!G.split) {
      const prevBest = parseFloat(localStorage.getItem(key) || "0");
      let sub = `your time: ${p.finishTime.toFixed(2)}s`;
      if (!prevBest || p.finishTime < prevBest) {
        localStorage.setItem(key, p.finishTime.toFixed(2));
        sub += " · 🏆 new best!";
      } else sub += ` · best: ${prevBest.toFixed(2)}s`;
      endGame("🏁 finished!", sub);
    } else {
      const other = G.players[1 - G.players.indexOf(p)];
      if (other && other.finished) {
        const winner = p.finishTime <= other.finishTime ? 1 : 2;
        endGame(`🏁 player ${winner} wins!`, `${G.players[0].finishTime.toFixed(2)}s vs ${G.players[1].finishTime.toFixed(2)}s`);
      }
    }
  }
}

const G = { mode: null, players: [], split: false, started: false, over: false, modeTime: 0 };
window.LP = { keys, G };
let shake = 0;
const clock = new THREE.Clock();

const $ = (id) => document.getElementById(id);
let toastTimer = null;
function showToast(msg) {
  $("toast").textContent = msg;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2400);
}
function flash(color) {
  $("flash").style.background = `radial-gradient(ellipse at center, transparent 40%, ${color} 100%)`;
  $("flash").style.opacity = "1";
  setTimeout(() => ($("flash").style.opacity = "0"), 200);
}
function runCountdown(cb) {
  const steps = ["3", "2", "1", "go!"];
  let i = 0;
  $("countdown").classList.add("show");
  const tick = () => {
    if (i < steps.length) {
      $("countdown").textContent = steps[i];
      i++;
      setTimeout(tick, 750);
    } else {
      $("countdown").classList.remove("show");
      G.started = true;
      cb?.();
    }
  };
  tick();
}
function endGame(title, sub) {
  if (G.over) return;
  G.over = true;
  G.started = false;
  $("results-title").textContent = title;
  $("results-main").textContent = sub;
  $("results").classList.remove("hidden");
}
$("btn-again").onclick = () => location.reload();
$("btn-menu").onclick = () => location.reload();
$("btn-exit").onclick = () => location.reload();

let nextMode = "highway";

$("mode-spleef").onclick = () => startSpleef();
$("mode-highway").onclick = () => {
  $("menu").classList.add("hidden");
  $("highway-opts").classList.remove("hidden");
};
$("mode-circuit").onclick = () => {
  $("menu").classList.add("hidden");
  $("circuit-opts").classList.remove("hidden");
};
$("circuit-back").onclick = () => {
  $("circuit-opts").classList.add("hidden");
  $("menu").classList.remove("hidden");
};
$("highway-back").onclick = () => {
  $("highway-opts").classList.add("hidden");
  $("menu").classList.remove("hidden");
};
$("select-back").onclick = () => {
  $("select-screen").classList.add("hidden");
  $("menu").classList.remove("hidden");
};
$("hw-solo").onclick = () => {
  G.mode = "highway";
  nextMode = "highway";
  $("highway-opts").classList.add("hidden");
  $("select-screen").classList.remove("hidden");
};
$("hw-2p").onclick = () => {
  G.mode = "highway";
  nextMode = "highway-2p";
  $("highway-opts").classList.add("hidden");
  $("select-screen").classList.remove("hidden");
};
$("circuit-solo").onclick = () => {
  nextMode = "circuit-solo";
  $("circuit-opts").classList.add("hidden");
  $("select-screen").classList.remove("hidden");
};
$("circuit-2p").onclick = () => {
  nextMode = "circuit-2p";
  $("circuit-opts").classList.add("hidden");
  $("select-screen").classList.remove("hidden");
};

function pickTrack(seed, btnId) {
  trackSeed = seed;
  for (const id of ["track-1", "track-2", "track-3"]) $(id).style.background = "";
  $(btnId).style.background = "#7ec8f7";
}
$("track-1").onclick = () => pickTrack(20260916, "track-1");
$("track-2").onclick = () => pickTrack(777, "track-2");
$("track-3").onclick = () => pickTrack(424242, "track-3");

const RATINGS = {
  sedan: { grip: 7 }, sports: { grip: 9 }, taxi: { grip: 7 }, van: { grip: 6 },
  pickup: { grip: 6 }, truck: { grip: 4 }, ambulance: { grip: 6 }, police: { grip: 8 },
  f1: { grip: 10 }, tractor: { grip: 8 }, bus: { grip: 4 }, train: { grip: 3 },
};
function statBar(label, cls, frac, valText) {
  return `<div class="stat-row"><span class="lbl">${label}</span><div class="stat-bar ${cls}"><div style="width:${Math.round(frac * 100)}%"></div></div><span class="val">${valText}</span></div>`;
}
for (const [name, v] of Object.entries(VEHICLES)) {
  const grip = RATINGS[name]?.grip ?? 6;
  const zeroToHundred = v.acc > 0 ? (v.max / 3.6 / v.acc).toFixed(1) : "-";
  const btn = document.createElement("button");
  btn.className = "mode-card deal-card";
  btn.innerHTML = `
    <div class="top"><span class="big">${v.emoji}</span><span class="name">${name.toUpperCase()}</span></div>
    ${statBar("spd", "speed", v.max / 40, Math.round(v.max * 3.6) + " km/h")}
    ${statBar("acc", "acc", Math.min(1, v.acc / 26), "0-100 " + zeroToHundred + "s")}
    ${statBar("grp", "grip", grip / 10, grip + "/10")}
    ${statBar("siz", "size", Math.min(1, v.len / 8), v.len.toFixed(1) + "m")}
    <span class="deal-price">${name === "train" ? "🚂 rails only" : "test drive →"}</span>
  `;
  btn.onclick = () => {
    $("select-screen").classList.add("hidden");
    if (nextMode === "highway-2p") startHighway2P(name);
    else if (nextMode === "circuit-solo") startCircuit(false, name);
    else if (nextMode === "circuit-2p") startCircuit(true, name);
    else if (G.mode === "highway" && G.players.length) switchVehicle(name);
    else startHighway(name);
  };
  $("vehicle-grid").appendChild(btn);
}

function showHUDs(n) {
  $("hud-p1").classList.remove("hidden");
  if (n > 1) $("hud-p2").classList.remove("hidden");
  $("btn-exit").classList.remove("hidden");
}

function resizeCameras() {
  if (!G.players.length) return;
  const half = G.split ? window.innerWidth / 2 : window.innerWidth;
  for (const p of G.players) {
    p.camera.aspect = half / window.innerHeight;
    p.camera.updateProjectionMatrix();
  }
}

function startHighway(type) {
  $("select-screen").classList.add("hidden");
  G.mode = "highway";
  buildHighway();
  const p = makePlayer(type, type === "train" ? RAIL_X : LANE_RIGHT[1], 0, CONTROLS_P1);
  if (type === "train") { p.heading = 0; p.velHeading = 0; p.railLocked = true; }
  G.players.push(p);
  showHUDs(1);
  resizeCameras();
  $("btn-garage").classList.remove("hidden");
  if (type === "train") $("train-hint").classList.remove("hidden");

  for (let i = 0; i < 18; i++) {
    const car = buildVehicle(TRAFFIC_TYPES[i % TRAFFIC_TYPES.length]);
    scene.add(car);
    traffic.push(car);
    spawnTrafficCar(car, i * 35);
  }
  runCountdown(() => showToast(type === "train" ? "🚂 choo choo! cross only at the crossings" : "rob the mart for ⭐!"));
}

function startHighway2P(type) {
  $("select-screen").classList.add("hidden");
  G.mode = "highway";
  G.split = true;
  buildHighway();
  const p1 = makePlayer(type, type === "train" ? RAIL_X : LANE_RIGHT[0], 0, CONTROLS_P1);
  const p2 = makePlayer("taxi", LANE_LEFT[0], 6, CONTROLS_P2);
  p2.heading = Math.PI;
  p2.velHeading = Math.PI;
  if (type === "train") { p1.heading = 0; p1.velHeading = 0; p1.railLocked = true; }
  G.players.push(p1, p2);
  showHUDs(2);
  resizeCameras();
  $("btn-garage").classList.add("hidden");

  for (let i = 0; i < 18; i++) {
    const car = buildVehicle(TRAFFIC_TYPES[i % TRAFFIC_TYPES.length]);
    scene.add(car);
    traffic.push(car);
    spawnTrafficCar(car, i * 35);
  }
  runCountdown(() => showToast("🛒 whoever robs more marts in 5 min wins!"));
}

function startSpleef() {
  $("menu").classList.add("hidden");
  G.mode = "spleef";
  G.split = true;
  buildSpleef();
  const p1 = makePlayer("sedan", -24, 0, CONTROLS_P1);
  const p2 = makePlayer("sports", 24, 0, CONTROLS_P2);
  p1.heading = p1.velHeading = Math.PI / 2;
  p2.heading = p2.velHeading = -Math.PI / 2;
  G.players.push(p1, p2);
  S.players = G.players;
  showHUDs(2);
  resizeCameras();
  $("btn-garage").classList.add("hidden");
  updateSpleefHUD();
  runCountdown(() => showToast("💥 speed over ice to crack it, slow down to stay safe"));
}

function startCircuit(split, type = "sports") {
  $("select-screen").classList.add("hidden");
  G.mode = "circuit";
  G.split = split;
  buildCircuit();
  const p0 = C.path[0];
  const rightV = new THREE.Vector3(Math.cos(p0.h), 0, -Math.sin(p0.h));
  const p1 = makePlayer(type, p0.x + rightV.x * 3, p0.z + rightV.z * 3, CONTROLS_P1);
  G.players.push(p1);
  if (split) {
    const p2 = makePlayer("sedan", p0.x - rightV.x * 3, p0.z - rightV.z * 3, CONTROLS_P2);
    G.players.push(p2);
  }
  showHUDs(G.players.length);
  resizeCameras();
  $("btn-garage").classList.add("hidden");
  runCountdown(() => showToast("🏁 race to the finish! blue lines are checkpoints"));
}

function updateHUD() {
  const [p1, p2] = G.players;
  $("p1-speed").textContent = Math.round(Math.abs(p1.speed) * 3.6) + " km/h";
  if (G.mode === "highway") {
    $("p1-info1").textContent = "⭐ " + H.stars;
    $("p1-info2").textContent = "🚓 " + H.cops.length + (H.cops.length ? ` ${Math.ceil(H.copTimer)}s` : "");
    const t = Math.max(0, Math.ceil(H.timeLeft));
    $("p1-info3").textContent = `⏱ ${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
    if (p2) {
      $("p2-speed").textContent = Math.round(Math.abs(p2.speed) * 3.6) + " km/h";
      $("p2-info1").textContent = "⭐ " + H.stars;
      $("p2-info2").textContent = "⏱ " + Math.max(0, Math.ceil(H.timeLeft)) + "s";
    }
  } else if (G.mode === "circuit") {
    $("p1-info1").textContent = `⏱ ${G.modeTime.toFixed(1)}s`;
    const nextCp = C.checkpoints.find((c) => c > p1.prog);
    $("p1-info2").textContent = nextCp ? `cp ${C.checkpoints.indexOf(nextCp) + 1}/${C.checkpoints.length}` : "final stretch!";
    if (p2) {
      $("p2-speed").textContent = Math.round(Math.abs(p2.speed) * 3.6) + " km/h";
      const nextCp2 = C.checkpoints.find((c) => c > p2.prog);
      $("p2-info1").textContent = p2.finished ? "🏁 done!" : nextCp2 ? `cp ${C.checkpoints.indexOf(nextCp2) + 1}/${C.checkpoints.length}` : "final stretch!";
      $("p2-info2").textContent = `⏱ ${G.modeTime.toFixed(1)}s`;
    }
  }
}

function render() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setScissorTest(true);
  if (G.split) {
    renderer.setViewport(0, 0, w / 2, h);
    renderer.setScissor(0, 0, w / 2, h);
    renderer.render(scene, G.players[0].camera);
    renderer.setViewport(w / 2, 0, w / 2, h);
    renderer.setScissor(w / 2, 0, w / 2, h);
    renderer.render(scene, G.players[1].camera);
  } else {
    renderer.setViewport(0, 0, w, h);
    renderer.setScissor(0, 0, w, h);
    renderer.render(scene, G.players[0].camera);
  }
  renderer.setScissorTest(false);
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (G.players.length) {
    if (G.started && !G.over) {
      G.modeTime += dt;
      if (G.mode === "highway") {
        H.timeLeft -= dt;
        if (H.timeLeft <= 0) endGame("⏰ time!", `you collected ⭐ ${H.stars}`);
      }
    }

    for (const p of G.players) {
      switch (G.mode) {
        case "highway":
          updateCarPhysics(p, dt, { grassSlow: true });
          if (p.type === "train") updateTrain(p, dt);
          if (!G.split) {
            if (p.maxZ === undefined) p.maxZ = p.obj.position.z;
            if (p.obj.position.z < p.maxZ - 4) {
              p.obj.position.z = p.maxZ - 4;
              p.speed = Math.max(p.speed, 0);
              if (Math.random() < 0.02) showToast("wrong way! the highway only goes forward");
            }
            p.maxZ = Math.max(p.maxZ, p.obj.position.z);
          }
          p.obj.position.x = clamp(p.obj.position.x, -60, RAIL_X + 8);
          break;
        case "spleef":
          updateCarPhysics(p, dt, { onIce: true });
          break;
        case "circuit":
          updateCarPhysics(p, dt, {});
          updateCircuitProgress(p, dt);
          break;
      }
      updateCamera(p, dt);
    }

    if (G.mode === "highway" && G.started && !G.over) {
      updateTraffic(dt);
      updateCops(dt);
      H.walmartTimer -= dt;
      if (H.walmartTimer <= 0 && !H.walmart) {
        spawnWalmart();
        showToast("🛒 a walmart appeared ahead!");
      }
      if (H.walmart) {
        const anyPlayer = G.players.find(
          (p) => Math.hypot(p.obj.position.x - H.walmart.position.x, p.obj.position.z - H.walmart.position.z) < 6
        );
        H.walmart.userData.star.rotation.y += 2 * dt;
        H.walmart.userData.star.position.y = 7 + Math.sin(performance.now() / 400) * 0.4;
        if (anyPlayer) robWalmart();
        else if (H.walmart.position.z < G.players[0].obj.position.z - 80) removeWalmart();
      }
      recycleHighway(G.players[0].obj.position.z);
      G_highwayGround.position.z = G.players[0].obj.position.z;
      G_mountains.position.z = G.players[0].obj.position.z;
      skyDome.position.set(G.players[0].obj.position.x, 0, G.players[0].obj.position.z);
    }
    if (G.mode === "circuit") {
      skyDome.position.set(G.players[0].obj.position.x, 0, G.players[0].obj.position.z);
    }
    if (G.mode === "spleef") updateSpleef(dt);

    updateParticles(dt);
    updateSkids(dt);
    if (G.players.length) updateHUD();
    render();
  }
}

animate();
