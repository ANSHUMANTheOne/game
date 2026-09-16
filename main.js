Lgt(0x87ceeb, 0x3a7d3a, 0.6);scene.adight = new THREE.DirectionalLight(0xfff4d6, 1);
itio
sunLue
sunLi.width = 2048
sunLight.shado.mapSize.height = 2048;
sunLight.shadow.amera.right = 160;
sunLight.shadow.camra.b
sunLight.shadow.c
sunLight.shadow.camra.far = 350
sunLight.shadow.bia
scene.add(sunLight)scene.add(sunLight.target);
cost groundGeo = new THREE.PlaneG
cont groundMat = new THREE.MeshStandardMaterial({ color: 0x6fbf5f });
cons ground = new THREE.Mesh(groundGeo, groundMat);
groud.rotation.x = -Math.PI / 2;
groun.receiveShadow = true;
scene.add(ground);
const loader = ne LTFLoader();
const TILE_SIZE = 10;
const CAR_COLLISION_RADIUS = 1.4

function loadModel(path) {
return new Promise((resolve, reject) => {
  oader.load(path, (gltf) => resolve(gltf.scene), undefined, reject)
  });}
function applyHeightGradient(geometry, bodyHex) {  geometry.computeBoundingBox()
  const bbox = geometry.boundingBox  const minY = bbox.min.y
  const range = Math.max(bbox.max.y - minY, 0.001);
  const position = geometry.attributes.position;
  const base = new THREE.Color(bodyHex);  const topTone = base.clone().lerp(new THREE.Color(0xffffff), 0.3);  const bottomTone = base.clone().lerp(new THREE.Color(0x000000), 0.3);
  const colors = new Float32Array(position.count * 3);
  const tempColor = new THREE.Color();  for (let i = 0; i < position.count; i++ 
    const t = (position.getY(i) - minY) / range;
    tempColor.copy(bottomTone).lerp(topTone, t);
   colors[i * 3] = tempColor.r;
    colors[i * 3 + 1] = tempColor.g;
   colors[i * 3 + 2] = tempColor.b;
  } geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
}
function applyBuildingWindows(geometry, bodyHex, scaleY) {  geometry.computeBoundingBox()
  const bbox = geometry.boundingBox;  const minY = bbox.min.
  const range = Math.max(bbox.max.y - minY, 0.0001);  const position = geometry.attributes.position;
  const body = new THREE.Color(bodyHex)
  const window_ = new THREE.Color(0x8fd0f0);  const base = body.clone().lerp(new THREE.Color(0x000000), 0.25);  const floorHeight = Math.max(1.6 / Math.max(scaleY, 0.001), 0.05);
  const colors = new Flot32Array(position.count * 3);
  const c = new THREE.Clr();
  for (let i = 0; i < position.count; i++) {
    const height = positiongetY(i) - minY;
    const t = height / range;
    const bandPos = ((height % floorHeight) + floorHeight) % floorHeight / floorHeight;
    if (t < 0.06
      c.copy(base)
    } else if (bandPos> 0.55 && bandPos < 0.85) {
      c.copy(window_);    } else 
      c.copy(body);   }
   colors[i * 3] = c.r;
  colors[i * 3 + 1] = c.g;
   colors[i * 3 + 2] = c.b;
  }  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));}
function applyVehiclePaint(geometry, bodyHex) {
  geometry.computeBondingBox();
  const bbox = geomty.boundingBox;
  const minY = bbox.min.y;
  const minZ = bbox.minz;
  const minX = bbox.min.x;
  const rangeY = Math.max(bbox.max.y - minY, 0.000);
  const rangeZ = Math.max(bbox.max.z - minZ, 0.000
  const rangeX = Math.max(bbox.max.x - minX, 0.0001);  const position = geometry.attributes.position;
  const body = new THREE.Color(bodyHex);  const glass = new THREE.Color(0x3b4a52)
  const tireBlack = new THREE.Color(0x0d0d0d)  const rimWhite = new THREE.Color(0xf0f0f0);
  const colors = new Float2Array(position.count * 3);
  const c = new THREE.Color);
  for (let i = 0; i < positin.count; i++) {
    const ty = (position.get(i) - minY) / rangeY;
    const tz = (position.getZi) - minZ) / rangeZ;
    const tx = (position.getX(i) - minX) / rangeX;
    const nearOuterEdge = tx < 0.16 || tx > 0.84;
    const inCabinHeight = ty > 0.55 && ty < 0.2;
    const inCabinLength = tz > 0.2 && tz < 0.;
    if (ty < 0.22 && nearOuterEdge) {
      if (ty > 0.1 && ty < 0.15) {
       c.copy(rimWhite);
      } else {
      c.copy(tireBlack)
    
    } else if (inCabnHeight && inCabinLength) {
      c.copy(glass);    } else 
      c.copy(body);  
    colors[i * 3] = c.r;    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b;  }
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}
funcion applyGrandstandTiers(geometry, scaleY) {
  geometry.computeBoundingBox();
  const bbox = geometry.oundingBox;
  const minY = bbox.miny
  const range = Math.max(bbox.max.y - minY, 0.0001);
  const position = geometry.attributes.position

  const red = new THREE.Color(0xd6432f);
  const white = new THREE.Color(0xf2f2f2
  const tierHeight = Math.max(1.1 / Math.max(scaleY, 0.001), 0.05)
  const colors = new Float32Array(position.count * 3);  const c = new THREE.Color()
  for (let i = 0; i < position.count; i++) {    const height = position.getY(i) - minY
    const tierIndex = Math.floor(height / tierHeight);   c.copy(tierIndex % 2 === 0 ? red : white);
   colors[i * 3] = c.r;
  colors[i * 3 + 1] = c.g;
   colors[i * 3 + 2] = c.b;
  }  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));}
function finalizeMsh(child) {
  child.castShado  true;
  child.receiveShadow = true;
  const materials = Aray.isArray(child.material) ? child.material : [child.material];
  const paintedMaterials = materials.map((mat) => {
    const clonedMat = mt.clone();
    clonedMat.map = null    clonedMat.emissiveMap = null
   clonedMat.emissive = new THREE.Color(0x000000);
   clonedMat.emissiveIntensity = 0;
   clonedMat.vertexColors = true;
   clonedMat.color.set(0xffffff);
 clonedMat.roughness = 0.9;
   clonedMat.metalness = 0.02;
  clonedMat.envMapIntensity = 0.4;
    lonedMat.needsUpdate = true;
    rturn clonedMat;
  });  child.material = Array.isArray(child.material) ? paintedMaterials : paintedMaterials[0];

function prepareObet(object, bodyHex) {
  object.traverse((child) => {
    if (child.isMesh) 
      child.geometry = child.geometry.clone();
      applyHeightGradient(child.geometry, bodyHex);
    finalizeMesh(child);

  });}
unction prepareBuilding(object, bodyHex, scaleY) {
 object.traverse((child) => {
 if (child.isMesh) {
     child.geometry = child.geometry.clone();
    applyBuildingWindows(child.geometry, bodyHex, scaleY);
     finalizeMesh(child);
    }  });}
unction prepareVehicle(object, bodyHex) 
 object.traverse((child) => {
    if (child.isMesh) {
     child.geometry = child.geometry.clone();
      applyVehiclePaint(child.geometry, bodyHex);
     finalizeMesh(child);
    } })
}
fuction prepareGrandstand(object, scaleY) {
  bject.traverse((child) => {
   if (child.isMesh) {
   child.geometry = child.geometry.clone();
     applyGrandstandTiers(child.geometry, scaleY);
     finalizeMesh(child);
    }  });

const collidables = [];
unction registerCollider(col, row, radius) 
 collidables.push({ x: col * TILE_SIZE, z: row * TILE_SIZE, radius });
}

function plceAt(object, row, col, rotationSteps = 0, extraY = 0, colliderRadius = 0) {
  object.position.set(col * TILE_SIZE, extraY, row * TILE_SIZE);
  object.rotaion.y = (rotationSteps * Math.PI) / 2
  scene.add(obct);
  if (colliderRaius > 0) registerCollider(col, row, colliderRadius);
  return object;}
onst ASSET_PATHS = {
layerCar: '/assets/sedan-sports.glb',
  uildingA: '/assets/building-a.glb',
  uildingB: '/assets/building-b.glb',
  bildingC: '/assets/building-c.glb',
  buldingD: '/assets/building-d.glb',
  buldingE: '/assets/building-e.glb',
  buidingF: '/assets/building-f.glb',
  buildingG: '/assets/building-g.glb',
  buildingH: '/assets/buildin-h.glb',
  buildingI: '/assets/buildigi.glb',
  buildingJ: '/assets/building-j.glb',
  treeLarge: '/assets/treeLarge.lb',
  treeSmall: '/assets/treeSmall.glb',
  lightPost: '/assets/lightPostModrn.glb',
  electricityPole: '/assets/electrity-pole.glb'
  trafficLight: '/assets/traffic-ligh.glb',
  fence: '/assets/fenceStraight.glb',  fenceCurved: '/assets/fenceCurved.glb'
  cone: '/assets/construction-cone.glb',  billboard: '/assets/billboard.glb
  flagCheckers: '/assets/flagCheckers.gb',
  grandStand: '/assets/grandStand.glb',  grandStandCovered: '/assets/grandStandCovered.glb',
pitsGarage: '/assets/pitsGarage.glb',
  itsOffice: '/assets/pitsOffice.glb',
  aceCarRed: '/assets/raceCarRed.glb',
  rceCarGreen: '/assets/raceCarGreen.glb',
  raceCarOrange: '/assets/raceCarOrange.glb',
  raceCarWhite: '/assts/raceCarWhite.glb',
  suv: '/assets/suv.l',
  taxi: '/assets/taxi.glb',
  van: '/assets/van.glb'
};

const BUILDING_KEYS =
  'buildingA', 'buildingB', 'buildingC', 'buildingD', 'buildingE
  'buildingF', 'buildingG', 'buildingH', 'buildingI', 'buildingJ',]
const BUILDING_COLORS = [  0xd98c5f, 0xc9a679, 0xb0bec5, 0xe0d6c3, 0xa9c9a4
  0xd9b48f, 0xbcaaa4, 0xcfd8dc, 0xe6c79c, 0xb5c9c3]
const RACE_CAR_KEYS = ['raceCarRed', 'raceCarGreen', 'raceCarOrange', 'raceCarWhite'];const RACE_CAR_COLORS = {
raceCarRed: 0xd93a2f,
  aceCarGreen: 0x2f9e52,
  aceCarOrange: 0xe07a1f,
  rceCarWhite: 0xeceff1,
};const PARKED_CAR_KEYS = ['suv', 'taxi', 'van]
const PARKED_CAR_COLORS = [0x3f6fbf, 0xc9c9c9, 0xe0b83a];

function randomChoice(list) {  return list[Math.floor(Math.random() * list.length)];
}

function randomIndex(length) {  return Math.floor(Math.random() * length)

sync function loadAllAssets() {
 const entries = Object.entries(ASSET_PATHS);
 const models = {};
 await Promise.all(
 entries.map(async ([key, path]) => {
     try {
      models[key] = await loadModel(path);
    } catch (err) {
      console.error(`Failed to load ${key} from ${path}:`, err);
      }    })
)
 return models;
}

function makeTrakStraightTexture() {
  const size = 128;
  const canvasEl = doument.createElement('canvas')
  canvasEl.width = siz
  canvasEl.height = size;  const ctx = canvasEl.getContext('2d');
  ctx.fillStyle = '#2a2a2e';  ctx.fillRect(0, 0, size, size);
  const curbWidth = 14  const stripeCount = 6
  const stripeHeight = size / stripeCout;
  for (let i = 0; i < stripeCount; i++) 
    ctx.fillStyle = i % 2 === 0 ? '#d6432f' : '#f2f2f2';    ctx.fillRect(0, i * stripeHeight, curbWidth, stripeHeight);    ctx.fillRect(size - curbWidth, i * stripeHeight, curbWidth, stripeHeight);
 }
  ctx.fillStyle = '#f2f2f'
  ctx.fillRect(size / 2 - 3, 8, 6, 22);
  ctx.fillRect(size / 2 - 3, 53, 6, 22;
  ctx.fillRect(size / 2 - 3, 98, 6, 22);

  const textur = new THREE.CanvasTexture(canvasEl);
  texture.colorace = THREE.SRGBColorSpace
  return texture;}
function makeTrackCornerTexture() {  const size = 128
  const canvasEl = docunt.createElement('canvas');
  canvasEl.width = size;  canvasEl.height = size
  const ctx = canvasEl.getContext('2d');
  ctx.fillStyle = '#2a2a2e';  ctx.fillRect(0, 0, size, size);
  const crbWidth = 14;
  const squares = 8;
  const squareSize = size / squares;
  for (let i = 0; i < squares; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#d6432f' : '#f2f2f2'
    ctx.fillRect(0, i * squareSize, curbWidth, squareSiz)
    ctx.fillRect(size - curbWidth, i * squareSize, curbWidth, squareSize);
    ctx.fillRect(i * squareSize, 0, squareSize, curbWidth);
  ctx.fillRect(i * squareSize, size - curbWidth, squareSize, curbWidth);
  }
  const textur = new THREE.CanvasTexture(canvasEl);
  texture.colorace = THREE.SRGBColorSpace;
  return texture;}
function makeTrackStartTexture() {  const size = 128
  const canvasEl = docunt.createElement('canvas');
  canvasEl.width = size;  canvasEl.height = size
  const ctx = canvasEl.getContext('2d');
  ctx.fillStyle = '#2a2a2e';  ctx.fillRect(0, 0, size, size);
  onst checkerSize = 16;
  for (let y = 0; y < size; y += checkerSize) {
   for (let x = 0; x < size; x += checkerSize) 
     const isLight = ((x / checkerSize) + (y / checkerSize)) % 2 === 0;
      ctx.fillStyle = isLight ? '#f2f2f2' : '#1a1a1c';
    ctx.fillRect(x, y, checkerSize, checkerSize);
    }
  }
  const texture new THREE.CanvasTexture(canvasEl)
  texture.colorSpce = THREE.SRGBColorSpace;
  return texture;}
function makeRoadTexture() {  const size = 12
  const canvasEl = document.createElement('canvas');  canvasEl.width = size
  canvasEl.height = size;  const ctx = canvasEl.getContext('2d');
  ctx.fillStyle = '#3a3a40';  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#4a4a52';
  ctx.lineWidth = 2;  ctx.strokeRect(1, 1, size - 2, size - 2;
  ctx.fillStyle = '#e8e8e8';
  ctx.fillRect(size / 2 - 3, 8, 6, 22;
  ctx.fillRect(size / 2 - 3, 53, 6, 22);
  ctx.fillRect(size / 2 - 3, 98, 6, 22);
  const texture new THREE.CanvasTexture(canvasEl);
  texture.colorSpce = THREE.SRGBColorSpace
  return texture;}
function makePlainRoadTexture() {  const size = 6
  const canvasEl = document.createElement('canvas');  canvasEl.width = size
  canvasEl.height = size;  const ctx = canvasEl.getContext('2d');
 ctx.fillStyle = '#3a3a40';
ctx.fillRect(0, 0, size, size);
  tx.strokeStyle = '#4a4a52';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, size - 2, size - 2)
  const texture = new THREE.CanvasTexturecnvasEl);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;


const laneTexture = makeRoadTexture()
const plainTexture = makePlainRoadTexture()
const trackStraightTexture = makeTrackStraightTexte();
const trackCornerTexture = makeTrackCornerTexture();const trackStartTexture = makeTrackStartTexture();
const laneRoadMaterial = new THREE.MeshStandardMaterial({ map: laneTexture });const plainRoadMaterial = new THREE.MeshStandardMaterial({ map: plainTexture })
const trackStraightMaterial = new THREE.MeshStandardMaterial({ map: trackStraightTextur});
const trackCornerMaterial = new THREE.MeshStandardMaterial({ map: trackCornerTexture });const trackStartMaterial = new THREE.MeshStandardMaterial({ map: trackStartTexture });
const CITY_ROAD_TILE_SIZE = TILE_SIZE * 1.05
const TRACK_ROAD_TILE_SIZE = TILE_SIZE * 1.2;const cityRoadGeometry = new THREE.PlaneGeometry(CITY_ROAD_TILE_SIZE, CITY_ROAD_TILE_SIZE);const trackRoadGeometry = new THREE.PlaneGeometry(TRACK_ROAD_TILE_SIZE, TRACK_ROAD_TILE_SIZE);
const CITY_MIN = ;
const CITY_MAX =8
const TRACK_MIN_COL = 12;
const TRACK_MAX_COL = 0;
const TRACK_MIN_ROW = 0;
const TRACK_MAX_ROW = 8;
const BRIDGE_ROW =
const BRIDGE_MIN_COL = CITY_MAX + 1
const BRIDGE_MAX_COL = TRACK_MIN_COL - 1;const BRIDGE_DECK_HEIGHT = 6;
const WORLD_MIN_X = (CITY_MIN - 2) * TILE_SIZE;const WORLD_MAX_X = (TRACK_MAX_COL + 2) * TILE_SIZ
const WORLD_MIN_Z = (Math.min(CITY_MIN, TRACK_MIN_ROW) - 2) * TILE_SIZE;const WORLD_MAX_Z = (Math.max(CITY_MAX, TRACK_MAX_ROW) + 2) * TILE_SIZE;
function isCityRoad(row, col) 
  if (row < CITY_MIN || row > CITY_MAX | col < CITY_MIN || col > CITY_MAX) return false;
  return row % 3 === 0 || col % 3 === 0;}
function isTrackRoad(row, col) {
 if (row < TRACK_MIN_ROW || row > TRACK_MAX_ROW || col < TRACK_MIN_COL || col > TRACK_MAX_COL) return false
 return row === TRACK_MIN_ROW || row === TRACK_MAX_ROW || col === TRACK_MIN_COL || col === TRACK_MAX_COL;
}

function isBridgeRoad(row, col){
  return row === BRIDGE_ROW && col >= BRIDGE_MIN_COL && col <= BRIDGE_MAX_COL;

function isRoad(row, col)
  if (isBridgeRoad(row, col)) return true;  if (col <= CITY_MAX) return isCityRoad(row, col)
  if (col >= TRACK_MIN_COL) return isTrackRoad(row, col);  return false;
const BRIDGE_HEIGHT_KEYFRAMES = [  { col: CITY_MAX, height: 0 }
  { col: BRIDGE_MIN_COL, height: BRIDGE_DECK_HEIGHT * 0.55 }
  { col: (BRIDGE_MIN_COL + BRIDGE_MAX_COL) / 2, height: BRIDG_DECK_HEIGHT },
  { col: BRIDGE_MAX_COL, height: BRIDGE_DECK_HEIGHT * 0.55 },  { col: TRACK_MIN_COL, height: 0 },
;
function getBridgeHeight(col 
  for (let i = 0; i < BRIDGE_HEIGHT_KEYFRAMES.length - 1; i++) {
    const a = BRIDGE_HEIGHT_KEYFRAMES[i]
    const b = BRIDGE_HEIGHT_KEYFRAMES[i + 1];
    if (col >= a.col && col <= b.col) {
    const t = (col - a.col) / (b.col - a.col);
   return a.height + (b.height - a.height) * t
    }  
  return 0;}
function getGroundHeightAt(x, z) { const col = x / TILE_SIZE;
 const row = z / TILE_SIZE;
if (Math.abs(row - BRIDGE_ROW) < 0.6 && col >= CITY_MAX && col <= TRACK_MIN_COL) {
   return getBridgeHeight(col);
  }  return 0;}
function bildBridge() {
  const dcMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a40, side: THREE.DoubleSide });
  const underMaterial = new THREE.MeshStandardMaterial({ color: 0x24242a, side: THREE.DoubleSide });
  const railMterial = new THREE.MeshStandardMaterial({ color: 0xd6432f });
  const pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x8c8c94 });
  const waterMaerial = new THREE.MeshStandardMaterial({
    color: 0x3f86
    transparent: tue,
    opacity: 0.85,  });
  const bridgeWidth = TRACK_ROAD_TIL_SIZE;
  const halfWidth = bridgeWidth / 2; const deckThickness = 0.6;
 const z = BRIDGE_ROW * TILE_SIZE;
  const buildRibbon = (yOffset) => {
  const positions = [];
   const indices = [];
  BRIDGE_HEIGHT_KEYFRAMES.forEach((kp) => {
     const x = kp.col * TILE_SIZE;
      const y = kp.height + yOffset;
    positions.push(x, y, z - halfWidth, x, y, z + halfWidth);
    )
    for (let i = 0; i < BRIDGE_HEIGHT_KEYFRAMES.length - 1; i++) {
      const a = i * ;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;      const d = (i + 1) * 2 + 1;
  indices.push(a, c, b, b, c, d)
    
    const geometry  new THREE.BufferGeometry();
    geometry.setAttibute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndx(indices);
    geometry.computertexNormals();
    return geometry;  };
  const deckMesh = new THREEMesh(buildRibbon(0), deckMaterial);
  deckMesh.castShadow = true;  deckMesh.receiveShadow = true;  scene.add(deckMesh);
  const underMesh = nw THREE.Mesh(buildRibbon(-deckThickness), underMaterial);
  underMesh.receiveSaow = true;
  scene.add(underMesh);

  for (let i = 0; i < BRIDGE_HEIGHT_KEFRAMES.length - 1; i++) {
    const a = BRIDGE_HEIGHT_KEYFRAMES[i];
    const b = BRIDGE_HEIGHT_KEYFRAMES[i  1]
    const segLength = (b.col - a.col) * TE_SIZE;
    const midX = ((a.col + b.col) / 2) * TIE_SIZE;
    const midY = (a.height + b.height) / 2;    const slopeAngle = Math.atan2(b.height - a.height, segLength);
    [z - halfWidth,  + halfWidth].forEach((railZ) => {
      const rail = n THREE.Mesh(new THREE.BoxGeometry(segLength, 1.2, 0.4), railMaterial);
      rail.rotation.z= slopeAngle;
      rail.position.st(midX, midY + 0.9, railZ);
      scene.add(rail);    });
  if (midY > 1.5) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(1, midY + deckThickness, 1), pillarMaterial);
      pillar.position.set(midX, (midY - deckThickness) / 2, z);
     pillar.castShadow = true
    scene.add(pillar);
    }
  }
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(TILE_SIZE * (BRIDGE_MAX_COL - BRIDGE_MIN_COL + 3), TILE_SIZE * 3),
  waterMateria
  
  water.rotation.x = -Math.PI/ 2;
  water.position.set(((BRIDGEMIN_COL + BRIDGE_MAX_COL) / 2) * TILE_SIZE, -0.6, z);
  water.receiveShadow = true;  scene.add(water);
function spawnRoadNetwor() {
  const rowMin = Math.mi(CITY_MIN, TRACK_MIN_ROW);
  const rowMax = Math.maxCITY_MAX, TRACK_MAX_ROW);
  const colMin = CITY_MIN;  const colMax = TRACK_MAX_COL;  const startFinishCol = Math.round((TRACK_MIN_COL + TRACK_MAX_COL) / 2);
  for (let row = rowMin; row <= rowax; row++) {
    for (let col = colMin; col <= oMax; col++) {
      if (!isRoad(row, col)) continue;
      if (isBridgeRoad(row, col)) continue

      const isTrackCell = col >= TRACK_MIN_COL;
      const hasNorth = isRoad(row - 1, cl)
      const hasSouth = isRoad(row + 1, co;
      const hasEast = isRoad(row, col + 1);      const hasWest = isRoad(row, col - 1);
      const connectionCount = [hasNorth, hasSouth, hasEast, hasWest].filtr(Boolean).length;
      const isHorizontalOnly = hasEast && hasWest && !hasNorth && !hasSouh;
      const isVerticalOnly = hasNorth && hasSouth && !hasEast && !hasWest      const isStraight = connectionCount === 2 && (isHorizontalOnly || isVerticalOnly);
      let mesh;      if (isTrackCell) {
      if (row === TRACK_MIN_ROW && col === startFinishCol) {
         mesh = new THREE.Mesh(trackRoadGeometry, trackStartMaterial);
      } else if (isStraight) {
        mesh = new THREE.Mesh(trackRoadGeometry, trackStraightMaterial);
          if (isHorizontalOnly) mesh.rotation.z = Math.PI / 2;
      } else {
       mesh = new THREE.Mesh(trackRoadGeometry, trackCornerMaterial);
        }
      } ese if (isStraight) {
        mesh = new THREE.Mesh(cityRoadGeometry, laneRoadMaterial);
        if isHorizontalOnly) mesh.rotation.z = Math.PI / 2;
      } els
        mesh = new THREE.Mesh(cityRoadGeometry, plainRoadMaterial);      }
     mesh.rotation.x = -Math.PI / 2;
     mesh.position.set(col * TILE_SIZE, 0.02, row * TILE_SIZE);
   mesh.receiveShadow = true;
     scene.add(mesh);
   }
  }}
function opulateCityBlocks(models) {
  for (letrow = CITY_MIN; row <= CITY_MAX; row++) {
    for (let col = CITY_MIN; col <= CITY_MAX; col++) {
      if (isCityRoad(row, col)) {
       if (Math.random() < 0.12) 
         const light = models.trafficLight.clone();
          prepareObject(light, 0x333333);
         placeAt(light, row, col, Math.floor(Math.random() * 4));
        }
      continue;
    
      const roll = Math.random();      if (roll < 0.55) 
        const buildingIndex = randomIndex(BUILDIG_KEYS.length);
        const building = models[BUILDING_KEYS[buldingIndex]].clone();
        const scaleY = 2.6 + Math.random() * 3.8        building.scale.set(2.8, scaleY, 2.8)
        prepareBuilding(building, BUILDING_COLORS[buildingIndex], scaleY);        placeAt(building, row, col, Math.floor(Math.random() * 4), 0, 2.6);
    } else if (roll < 0.68) {
       const tree = randomChoice([models.treeLarge, models.treeSmall]).clone();
      tree.scale.setScalar(2.2 + Math.random() * 0.8);
      prepareObject(tree, 0x4caf50);
        placeAt(tree, row, col, 0, 0, 1.2);
      } else if (roll < 0.78) {        const pole = models.elcricityPole.clone();
        pole.scale.setScalar(1.8);
        prepareObject(pole, 0x777777;
        placeAt(pole, row, col, 0, 0, 0.3);
      } else if (roll < 0.86) 
        const carIndex = randomdex(PARKED_CAR_KEYS.length);
        const car = models[PARKEDCAR_KEYS[carIndex]].clone()
        car.scale.setScalar(1.0);        prepareVehicle(car, PARKED_CAR_COLORS[carIndex])
        placeAt(car, row, col, Math.floor(Math.random() * 4), 0, 1.5);      } else if (roll < 0.92)
        const billboard = models.billoard.clone();
        billboard.scale.setScalar(2);        prepareObject(billboard, 0xf5f5f5);
      placeAt(billboard, row, col, Math.floor(Math.random() * 4), 0, 1.0);
     } else if (roll < 0.97) {
      const light = models.lightPost.clone();
      light.scale.setScalar(1.8);
        prepareObject(light, 0x999999);
      placeAt(light, row, col, 0, 0, 0.3);
    }
    }
  }


function buildRaceCircuit(models) 
  const startRow = TRACK_MIN_ROW
  const midCol = Math.round((TRACK_MIN_COL + TRACK_MAX_COL) / 2)
  const flag = models.flagCheckers.clone();  flag.scale.setScalar(2.5)
  prepareObject(flag, 0xffffff);  placeAt(flag, startRow - 1, midCol, 0);
  for (let col = TRACK_MIN_C + 2; col <= TRACK_MAX_COL - 2; col += 4) {
    const grandStandKey = Mat.random() < 0.5 ? 'grandStand' : 'grandStandCovered';
    const stand = models[granStandKey].clone();
    stand.scale.set(7, 4, 3.5)
    prepareGrandstand(stand, 4);    placeAt(stand, TRACK_MIN_ROW - 2, col, 0, 0, 9);  }
  for (let row = TRACK_MIN_ROW + 2; row <= TRACK_MAX_ROW - 2; row += 4) {
    const grandStandKey = Mth.random() < 0.5 ? 'grandStand' : 'grandStandCovered';
    const stand = models[gadStandKey].clone();
    stand.scale.set(7, 4, 3.5);
    prepareGrandstand(stand, 4;
    placeAt(stand, row, TRACK_MAX_COL + 3, 1, 0, 9);
  }
  for (let col = TRACK_MIN_C + 2; col <= TRACK_MIN_COL + 6; col += 3) 
    const garageKey = Math.ranom() < 0.5 ? 'pitsGarage' : 'pitsOffice';
    const garage = models[garaeKey].clone();
    garage.scale.setScalar(3);    prepareObject(garage, 0xb8c4cc)
    placeAt(garage, TRACK_MAX_ROW + 2, col, 0, 0, 4.5)  }
  for (let col = TRACK_MIN_COL -2; col >= TRACK_MIN_COL - 4; col -= 2) {
    const cone = models.cone.clon();
    prepareObject(cone, 0xff8c00);    placeAt(cone, TRACK_MIN_ROW, col, 0, 0, 0.35);  }
  for (let row = TRACK_MIN_ROW; row <= TRACK_MAX_ROW; row += 2) {
    const fenceKey = Math.ranom() < 0.7 ? 'fence' : 'fenceCurved';
    const fence = models[feneey].clone();
    fence.scale.setScalar(2.2);
    prepareObject(fence, 0xd8d8d8);
  placeAt(fence, row, TRACK_MAX_COL + 1, 1, 0, 1.0);
  }

function toWorld(row, col)   return new THREE.Vector3(col * TILE_SIZE, 0.05, row * TILE_SIZE);

const movingVehicles = [];
unction spawnLoopVehicle(models, key, colorHex, waypoints, startIndex, speed, scale = 1) {
onst car = models[key].clone();
  f (scale !== 1) car.scale.setScalar(scale);
  repareVehicle(car, colorHex);
  cr.position.copy(waypoints[startIndex]);
  scne.add(car);
  moingVehicles.push({
    oject: car,
    waypoints,
    targetIndex: (startIndex + 1) % waypoints.length,
    sped,
  });}
function spawnTrafficCars(models) {
  const loopPoints = [toWorld(0, 0),toWorld(0, 6), toWorld(6, 6), toWorld(6, 0)];
  PARKED_CAR_KEYS.forEach((key, i) => {
    spawnLoopVehicle(models, key, PARKED_CAR_COLORS[i], loopPoints, i % loopPoints.length, 0.12, 1.0);  });
function spawnCircuitRceCars(models) {
  const loopPoints = [    toWorld(TRACK_MIN_ROW, TRACK_MIN_COL)
    toWorld(TRACK_MIN_ROW, TRACK_MAX_COL),    toWorld(TRACK_MAX_ROW, TRACK_MAX_COL
    toWorld(TRACK_MAX_ROW, TRACK_MIN_COL),  ]
  RAE_CAR_KEYS.forEach((key, i) => {
    sawnLoopVehicle(models, key, RACE_CAR_COLORS[key], loopPoints, i % loopPoints.length, 0.22, 2.2);
  });}
function updatMovingVehicles() {
  movingVehice.forEach((vehicle) => {
    const target = vehicle.waypoints[vehicle.targetIndex];
    const toTarge = new THREE.Vector3().subVectors(target, vehicle.object.position);
    toTarget.y = 0;
    const distance = toTarget.length();
    if (disnce < 0.6) 
      vehicletargetIndex = (vehicle.targetIndex + 1) % vehicle.waypoints.length;
      return;    }
    oTarget.normalize();
    hicle.object.position.addScaledVector(toTarget, vehicle.speed);
    vhicle.object.rotation.y = Math.atan2(toTarget.x, toTarget.z);
  });}
let playerCar = null;
async function buildWorld() {  const worldModels = await loadAllAssets();
  playerCar = worldModels.playerCar.clone();
  playerCar.scale.stScalar(1.0);
  prepareVehicle(paerCar, 0xe6473c);
  playerCar.position.set(0, 0.05, 0);
  scene.add(playerCar)

  spawnRoadNetwork();
  buildBridge(
  populateCityBlocks(worldMods);
  buildRaceCircuit(worldModels)
  spawnTrafficCars(worldModels);  spawnCircuitRaceCars(worldModels);
document.getElementById('loading-screen').classList.add('hidden');
}buildWorld().catch((err) => console.error('Could not build the world:', err));
cost carPhysics = {
  seed: 0,
  maSpeed: 0.4,
  reerseMaxSpeed: -0.15,
  accleration: 0.01,
  deceleration: 0.005,
 brakeForce: 0.02
turnSpeed: 0.03,
};

const keysPressed = { forward: false, backward: false, left: false, right: false }

function handleKeyDown(event) 
  switch (event.key) 
    case 'w': case 'W': case 'ArrowUp': keysPressed.forward = true; break;  case 's': case 'S': case 'ArrowDown': keysPressed.backward = true; break;
   case 'a': case 'A': case 'ArrowLeft': keysPressed.left = true; break;
  case 'd': case 'D': case 'ArrowRight': keysPressed.right = true; break;
  }}
function handleKeyUp(ent) {
  switch (event.key) {    case 'w': case 'W': case 'ArrowUp': keysPressed.forward = false; break
    case 's': case 'S': case 'ArrowDown': keysPressed.backward = false; break;    case 'a': case 'A': case 'ArrowLeft': keysPressed.left = false; break;
   case 'd': case 'D': case 'ArrowRight': keysPressed.right = false; break;
 }
}window.addEventListener('keydown', handleKeDwn);
window.addEventListener('keyup', handleKeyUp);

function resolveCollisions(){
  collidables.forEach((collider) => {
    const dx = playerCar.position.x - colliderx;
    const dz = playerCar.position.z - collider
    const distance = Math.sqrt(dx * dx + dz * dz);    const minDistance = collider.radius + CAR_COLLISION_RADIUS;
   if (distance < minDistance && distance > 0.0001) {
     const pushX = (dx / distance) * minDistance;
   const pushZ = (dz / distance) * minDistance;
     playerCar.position.x = collider.x + pushX;
    playerCar.position.z = collider.z + pushZ;
     carPhysics.speed *= 0.4;
    }  });
  movingehicles.forEach((vehicle) => {
    const dx = playerCar.position.x - vehicle.object.position.x;
    const dz = playerCar.position.z - vehicle.object.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);    const minDistance = CAR_COLLISION_RADIUS + 1.;
    if (distance < minDistance && distance > 0.0001) {
      const pushX = (dx / distance) * minDistane;
      const pushZ = (dz / distance) * minDistance;
      playerCar.position.x = vehicle.object.position.x + pushX;      playerCar.position.z = vehicle.object.position.z + pushZ;
  carPhysics.speed *= 0.35;
  
  });}
function clampToWorldBounds() {  playerCar.position.x = Math.max(WORLD_MIN_X, Math.min(WORLD_MAX_X, playerCar.position.x)
  playerCar.position.z = Math.max(WORLD_MIN_Z, Math.min(WORLD_MAX_Z, playerCar.position.z));}
function updateCarPhysics() {  if (!playerCar) return;
  if(keysPressed.forward) {
    crPhysics.speed += carPhysics.acceleration;
  } else if (keysPressed.backward) {
    carPysics.speed -= carPhysics.brakeForce;
  } els 
    if (carPhysics.speed > 0) {
      carPhysics.speed -= carPhysics.deceleration
      if (carPhysics.speed < 0) carPhysics.speed = 0;
    } else if (carPhysics.speed < 0) {
    carPhysics.speed += carPhysics.deceleration
   if (carPhysics.speed > 0) carPhysics.speed = 0;
    }  }
  carPhysics.speed = Math.min(carPhysics.speed, carPhysics.maxSpeed);  carPhysics.speed = Math.max(carPhysics.speed, carPhysics.reverseMaxSpeed);
  const turnAmount = carPhysics.turnSpeed * (carPhysi.speed / carPhysics.maxSpeed);
  if (keysPressed.left) playerCar.rotateY(turnAmount);  if (keysPressed.right) playerCar.rotateY(-turnAmount);
const forwardDirection = new THREE.Vector3(0, 0, 1);
  orwardDirection.applyQuaternion(playerCar.quaternion);
  orwardDirection.multiplyScalar(carPhysics.speed);
  payerCar.position.add(forwardDirection);
  resolveCollisions)
  clampToWorldBounds();

  const groundHeight = getGroundHeightAt(plyerCar.position.x, playerCar.position.z);
  playerCar.position.y = groundHeight + 0.05;
}
const baseCameraDistance 10
const baseCameraHeight = 5;let orbitYaw = 0
let orbitPitch = 0.1;
let isDragging = fale;
let lastPointerX = 0let lastPointerY = 0;
canvas.addEventLisener('pointerdown', (event) => {
  isDragging = true
  lastPointerX = event.clientX;  lastPointerY = event.clientY;});
window.addEventListener('pointerup', () => {
  sDragging = false;
};
window.addEventListener('pointermove', (event) => {
  if (!isDragging) retur;
  const deltaX = event.clientX - lastPointerX;
  const deltaY = event.clienY - lastPointerY;
  lastPointerX = event.clien
  lastPointerY = event.clientY;
  orbitYaw -= deltaX * 0.005;  orbitPitch += deltaY * 0.005
  orbitPitch = Math.max(-0.4, Math.min(0.8, orbitPitch));})
function updateFollowCamera() {  if (!playerCar) return;
  const horizontalDistance = baseCameraDistance * Math.cos(orbitPitch);  const height = baseCameraHeight + baseCameraDistance * Math.sin(orbitPitch);
  const offsetX = Math.sin(orbitYaw) * horizontalDistance;  const offsetZ = -Math.cos(orbitYaw) * horizontalDistance;
  const cameraOffset = new THREE.Vector3(offsetX, height, offsetZ);
  const idealPosition = cameraOffset.clone();
  idealPosition.applyMatrix4(playerCar.matrixWorld);
  camera.position.lerp(idealPosition, 0.08);

  const lookAheadOffset = new THREE.Vector3(0, 1, 0)
  const lookAtTarget = lookAheadOffset.clone();
  lookAtTarget.applyMatrix4(playerCar.matrixWorld);
  camera.lookAt(lookAtTarget);
}

const speedValueEl = document.getElementById('speed-value');
function updateSpeedDisplay() {
  const kmh = Math.round(carPhysics.speed * 100);
  speedValueEl.textContent = Math.abs(kmh);
}

const btnReset = document.getElementById('btn-reset');

btnReset.addEventListener('click', () => {
  if (playerCar) {
    playerCar.position.set(0, 0.05, 0);
    playerCar.rotation.set(0, 0, 0);
  }
  carPhysics.speed = 0;
});

function animate() {
  requestAnimationFrame(animate);
  updateCarPhysics();
  updateMovingVehicles();
  updateFollowCamera();
  updateSpeedDisplay();
  renderer.render(scene, camera);
}

animate();