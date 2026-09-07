import * as THREE from "three";
import { MAX_DEMONS } from "../data/constants";
import { killGold } from "../systems/scaling";

export type Demon = {
  alive: boolean;
  falling: boolean;
  hp: number;
  maxHp: number;
  pathIndex: number;
  t: number;
  x: number;
  z: number;
  fall: number;
};

type PathPoint = { x: number; z: number };

export class Horde {
  readonly mesh: THREE.InstancedMesh;
  readonly demons: Demon[] = [];
  private readonly dummy = new THREE.Object3D();
  private readonly color = new THREE.Color();
  private nextFree = 0;

  constructor(scene: THREE.Scene) {
    const geometry = new THREE.ConeGeometry(0.16, 0.34, 5);
    const material = new THREE.MeshStandardMaterial({
      color: 0x9b1d2e,
      roughness: 0.7,
      metalness: 0.08,
    });
    this.mesh = new THREE.InstancedMesh(geometry, material, MAX_DEMONS);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.castShadow = false;
    this.mesh.count = MAX_DEMONS;
    scene.add(this.mesh);
    this.color.setHex(0x9b1d2e);
    for (let i = 0; i < MAX_DEMONS; i += 1) {
      this.mesh.setColorAt(i, this.color);
    }
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }

    for (let i = 0; i < MAX_DEMONS; i += 1) {
      this.demons.push({
        alive: false,
        falling: false,
        hp: 0,
        maxHp: 1,
        pathIndex: 0,
        t: 0,
        x: 0,
        z: 0,
        fall: 0,
      });
      this.hide(i);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  reset(): void {
    for (let i = 0; i < this.demons.length; i += 1) {
      const demon = this.demons[i];
      if (!demon) {
        continue;
      }
      demon.alive = false;
      demon.falling = false;
      demon.fall = 0;
      this.hide(i);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  living(): number {
    let count = 0;
    for (const demon of this.demons) {
      if (demon.alive) {
        count += 1;
      }
    }
    return count;
  }

  spawn(hp: number, path: PathPoint[]): boolean {
    for (let n = 0; n < MAX_DEMONS; n += 1) {
      const i = (this.nextFree + n) % MAX_DEMONS;
      const demon = this.demons[i];
      if (!demon || demon.alive || demon.falling) {
        continue;
      }
      const start = path[0];
      if (!start) {
        return false;
      }
      demon.alive = true;
      demon.falling = false;
      demon.hp = hp;
      demon.maxHp = hp;
      demon.pathIndex = 0;
      demon.t = 0;
      demon.x = start.x;
      demon.z = start.z;
      demon.fall = 0;
      this.nextFree = (i + 1) % MAX_DEMONS;
      this.write(i, demon, 0x9b1d2e);
      return true;
    }
    return false;
  }

  update(
    dt: number,
    path: PathPoint[],
    speed: number,
    onLeak: () => void,
    onFall: (gold: number) => void,
    wave: number,
  ): void {
    for (let i = 0; i < this.demons.length; i += 1) {
      const demon = this.demons[i];
      if (!demon) {
        continue;
      }
      if (demon.falling) {
        demon.fall += dt * 2.4;
        if (demon.fall >= 1) {
          demon.falling = false;
          this.hide(i);
        } else {
          this.write(i, demon, 0x5c1020);
        }
        continue;
      }
      if (!demon.alive) {
        continue;
      }

      const from = path[demon.pathIndex];
      const to = path[demon.pathIndex + 1];
      if (!from || !to) {
        demon.alive = false;
        this.hide(i);
        onLeak();
        continue;
      }

      demon.t += (speed * dt) / Math.max(0.2, Math.hypot(to.x - from.x, to.z - from.z));
      if (demon.t >= 1) {
        demon.t = 0;
        demon.pathIndex += 1;
      }
      const a = path[demon.pathIndex];
      const b = path[demon.pathIndex + 1] ?? a;
      if (!a || !b) {
        continue;
      }
      demon.x = THREE.MathUtils.lerp(a.x, b.x, demon.t);
      demon.z = THREE.MathUtils.lerp(a.z, b.z, demon.t);
      this.write(i, demon, 0x9b1d2e);

      if (demon.hp <= 0) {
        this.kill(i, onFall, wave);
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  hurt(index: number, amount: number, onFall: (gold: number) => void, wave: number): boolean {
    const demon = this.demons[index];
    if (!demon?.alive) {
      return false;
    }
    demon.hp -= amount;
    if (demon.hp <= 0) {
      this.kill(index, onFall, wave);
      return true;
    }
    this.write(index, demon, 0xffe08a);
    return false;
  }

  private kill(index: number, onFall: (gold: number) => void, wave: number): void {
    const demon = this.demons[index];
    if (!demon || !demon.alive) {
      return;
    }
    demon.alive = false;
    demon.falling = true;
    demon.fall = 0;
    onFall(killGold(wave));
  }

  private write(index: number, demon: Demon, hex: number): void {
    const slump = demon.falling ? demon.fall * 1.2 : 0;
    this.dummy.position.set(demon.x, 0.18 - slump * 0.12, demon.z);
    this.dummy.rotation.set(slump * 1.4, index * 0.37, slump * 0.6);
    this.dummy.scale.setScalar(demon.falling ? 1 - demon.fall * 0.45 : 1);
    this.dummy.updateMatrix();
    this.mesh.setMatrixAt(index, this.dummy.matrix);
    this.mesh.setColorAt(index, this.color.setHex(hex));
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
  }

  private hide(index: number): void {
    this.dummy.position.set(0, -20, 0);
    this.dummy.scale.setScalar(0.0001);
    this.dummy.updateMatrix();
    this.mesh.setMatrixAt(index, this.dummy.matrix);
  }
}
