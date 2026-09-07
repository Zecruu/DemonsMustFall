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
  readonly demons: Demon[] = [];
  private readonly visuals: THREE.Group[] = [];
  private readonly bodyMats: THREE.MeshStandardMaterial[] = [];
  private nextFree = 0;

  constructor(scene: THREE.Scene) {
    const bodyGeo = new THREE.IcosahedronGeometry(0.22, 0);
    const hornGeo = new THREE.ConeGeometry(0.05, 0.18, 5);

    for (let i = 0; i < MAX_DEMONS; i += 1) {
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xb42334,
        emissive: 0x4a0b14,
        roughness: 0.62,
        metalness: 0.08,
      });
      const hornMat = new THREE.MeshStandardMaterial({ color: 0x3a0c14, roughness: 0.7 });
      const group = new THREE.Group();
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.24;
      const left = new THREE.Mesh(hornGeo, hornMat);
      const right = new THREE.Mesh(hornGeo, hornMat);
      left.position.set(-0.09, 0.42, 0.02);
      right.position.set(0.09, 0.42, 0.02);
      left.rotation.z = 0.4;
      right.rotation.z = -0.4;
      group.add(body, left, right);
      group.visible = false;
      scene.add(group);

      this.visuals.push(group);
      this.bodyMats.push(bodyMat);
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
    }
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
      this.write(i, demon, 0xb42334);
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
      this.write(i, demon, 0xb42334);

      if (demon.hp <= 0) {
        this.kill(i, onFall, wave);
      }
    }
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
    const visual = this.visuals[index];
    const mat = this.bodyMats[index];
    if (!visual || !mat) {
      return;
    }
    const slump = demon.falling ? demon.fall * 1.2 : 0;
    visual.visible = true;
    visual.position.set(demon.x, slump * -0.08, demon.z);
    visual.rotation.set(slump * 1.45, 0, slump * 0.35);
    visual.scale.setScalar(demon.falling ? 1 - demon.fall * 0.4 : 1);
    mat.color.setHex(hex);
    mat.emissive.setHex(demon.falling ? 0x1a0508 : 0x4a0b14);
  }

  private hide(index: number): void {
    const visual = this.visuals[index];
    if (visual) {
      visual.visible = false;
    }
  }
}
