import * as THREE from "three";
import {
  ARENA_HALF,
  DEMON_CONTACT_COOLDOWN_MS,
  DEMON_MAX_HP,
  DEMON_RADIUS,
  DEMON_SPEED,
  DEMON_TOUCH_DAMAGE,
} from "../data/constants";
import { createDemonMesh } from "../meshes";
import { applyDamage, canAct } from "../systems/combat";

export class Demon {
  readonly mesh: THREE.Group;
  hp = DEMON_MAX_HP;
  falling = false;
  gone = false;
  readonly radius = DEMON_RADIUS;

  private nextTouchAt = 0;
  private struckThisSwing = false;
  private fallT = 0;

  constructor(scene: THREE.Scene, x: number, z: number) {
    this.mesh = createDemonMesh();
    this.mesh.position.set(x, 0, z);
    scene.add(this.mesh);
  }

  get isAlive(): boolean {
    return this.hp > 0 && !this.falling && !this.gone;
  }

  get touchDamage(): number {
    return DEMON_TOUCH_DAMAGE;
  }

  beginSwing(): void {
    this.struckThisSwing = false;
  }

  canTouch(now: number): boolean {
    return this.isAlive && canAct(now, this.nextTouchAt);
  }

  markTouched(now: number): void {
    this.nextTouchAt = now + DEMON_CONTACT_COOLDOWN_MS;
  }

  chase(target: THREE.Vector3, dt: number): void {
    if (!this.isAlive) {
      return;
    }

    const dx = target.x - this.mesh.position.x;
    const dz = target.z - this.mesh.position.z;
    const length = Math.hypot(dx, dz) || 1;
    this.mesh.position.x = THREE.MathUtils.clamp(
      this.mesh.position.x + (dx / length) * DEMON_SPEED * dt,
      -ARENA_HALF + 0.8,
      ARENA_HALF - 0.8,
    );
    this.mesh.position.z = THREE.MathUtils.clamp(
      this.mesh.position.z + (dz / length) * DEMON_SPEED * dt,
      -ARENA_HALF + 0.8,
      ARENA_HALF - 0.8,
    );
    this.mesh.rotation.y = Math.atan2(dx, dz);
  }

  takeHit(amount: number): boolean {
    if (!this.isAlive || this.struckThisSwing) {
      return false;
    }

    this.struckThisSwing = true;
    this.hp = applyDamage(this.hp, amount);
    this.flash(0xffe8a3, 90);
    if (this.hp <= 0) {
      this.fall();
    }
    return true;
  }

  fall(): void {
    if (this.falling) {
      return;
    }
    this.falling = true;
    this.hp = 0;
  }

  updateFall(dt: number): void {
    if (!this.falling || this.gone) {
      return;
    }

    this.fallT += dt / 0.46;
    const t = Math.min(1, this.fallT);
    this.mesh.rotation.x = t * (Math.PI / 2);
    this.mesh.position.y = THREE.MathUtils.lerp(0, -0.15, t);
    this.mesh.scale.setScalar(THREE.MathUtils.lerp(1, 0.86, t));
    if (t >= 1) {
      this.gone = true;
    }
  }

  dispose(scene: THREE.Scene): void {
    scene.remove(this.mesh);
    this.gone = true;
  }

  private flash(color: number, ms: number): void {
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material.emissive.setHex(color);
      }
    });
    window.setTimeout(() => {
      if (this.falling) {
        return;
      }
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.emissive.setHex(0x000000);
        }
      });
    }, ms);
  }
}
