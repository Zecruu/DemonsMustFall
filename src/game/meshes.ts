import * as THREE from "three";

function standard(color: number, extras: THREE.MeshStandardMaterialParameters = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.55,
    metalness: 0.12,
    ...extras,
  });
}

export function createSlayerMesh(): THREE.Group {
  const group = new THREE.Group();

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.62, 4, 10), standard(0x2ec4b6));
  body.position.y = 0.68;
  body.castShadow = true;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), standard(0xf4d35e));
  head.position.y = 1.18;
  head.castShadow = true;

  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.9), standard(0xfff6d8, { metalness: 0.65 }));
  blade.position.set(0.42, 0.72, 0.28);
  blade.castShadow = true;

  const slash = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.05, 8, 20, Math.PI * 0.72),
    new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0 }),
  );
  slash.rotation.x = Math.PI / 2;
  slash.position.set(0, 0.7, 0.55);
  slash.name = "slash";

  group.add(body, head, blade, slash);
  return group;
}

export function createDemonMesh(): THREE.Group {
  const group = new THREE.Group();
  const flesh = standard(0x9b1d2e, { roughness: 0.7 });

  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.46, 0), flesh);
  body.position.y = 0.52;
  body.castShadow = true;

  const hornGeo = new THREE.ConeGeometry(0.09, 0.42, 6);
  const hornMat = standard(0x5c1020);
  const left = new THREE.Mesh(hornGeo, hornMat);
  const right = new THREE.Mesh(hornGeo, hornMat);
  left.position.set(-0.2, 0.92, 0.05);
  right.position.set(0.2, 0.92, 0.05);
  left.rotation.z = 0.35;
  right.rotation.z = -0.35;
  left.castShadow = true;
  right.castShadow = true;

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xf0d38a });
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), eyeMat);
  const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), eyeMat);
  leftEye.position.set(-0.14, 0.58, 0.36);
  rightEye.position.set(0.14, 0.58, 0.36);

  group.add(body, left, right, leftEye, rightEye);
  return group;
}

export function createArena(scene: THREE.Scene): void {
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(ARENA_SIZE, 48),
    standard(0x1a1218, { roughness: 0.92, metalness: 0.04 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(3.2, 3.45, 48),
    new THREE.MeshBasicMaterial({ color: 0x5c1020, transparent: true, opacity: 0.55 }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  scene.add(ring);

  const wallMat = standard(0x2b1620, { roughness: 0.85 });
  const wall = new THREE.Mesh(new THREE.TorusGeometry(ARENA_SIZE, 0.55, 8, 48), wallMat);
  wall.rotation.x = Math.PI / 2;
  wall.position.y = 0.45;
  wall.castShadow = true;
  wall.receiveShadow = true;
  scene.add(wall);
}

const ARENA_SIZE = 10.4;
