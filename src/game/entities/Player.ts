import * as THREE from "three";
import {
  ARENA_HALF,
  PLAYER_ATTACK_COOLDOWN_MS,
  PLAYER_ATTACK_DAMAGE,
  PLAYER_ATTACK_DURATION_MS,
  PLAYER_ATTACK_RADIUS,
  PLAYER_ATTACK_RANGE,
  PLAYER_IFRAMES_MS,
  PLAYER_MAX_HP,
  PLAYER_RADIUS,
  PLAYER_SPEED,
} from "../data/constants";
import { createSlayerMesh } from "../meshes";
import { applyDamage, attackOrigin, canAct, facingFromInput, type Vec2 } from "../systems/combat";

export class Player {
  readonly mesh: THREE.Group;
  hp = PLAYER_MAX_HP;
  facing: Vec2 = { x: 0, y: -1 };
  readonly radius = PLAYER_RADIUS;

  private attackUntil = 0;
  private attackCooldownUntil = 0;
  private invulnerableUntil = 0;
  private readonly slash: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    this.mesh = createSlayerMesh();
    const slash = this.mesh.getObjectByName("slash");
    if (!(slash instanceof THREE.Mesh)) {
      throw new Error("Slayer mesh is missing the slash cue");
    }
    this.slash = slash;
    scene.add(this.mesh);
  }

  get position(): THREE.Vector3 {
    return this.mesh.position;
  }

  get isAlive(): boolean {
    return this.hp > 0;
  }

  get isAttacking(): boolean {
    return performance.now() < this.attackUntil;
  }

  get attackDamage(): number {
    return PLAYER_ATTACK_DAMAGE;
  }

  get attackRadius(): number {
    return PLAYER_ATTACK_RADIUS;
  }

  attackCenter(): Vec2 {
    return attackOrigin(this.mesh.position.x, this.mesh.position.z, this.facing, PLAYER_ATTACK_RANGE);
  }

  move(dx: number, dz: number, dt: number): void {
    if (!this.isAlive) {
      return;
    }

    if (dx !== 0 || dz !== 0) {
      this.facing = facingFromInput(dx, dz, this.facing);
      this.mesh.position.x = THREE.MathUtils.clamp(
        this.mesh.position.x + dx * PLAYER_SPEED * dt,
        -ARENA_HALF + 0.8,
        ARENA_HALF - 0.8,
      );
      this.mesh.position.z = THREE.MathUtils.clamp(
        this.mesh.position.z + dz * PLAYER_SPEED * dt,
        -ARENA_HALF + 0.8,
        ARENA_HALF - 0.8,
      );
      this.mesh.rotation.y = Math.atan2(this.facing.x, this.facing.y);
    }

    const material = this.slash.material;
    if (material instanceof THREE.MeshBasicMaterial) {
      material.opacity = this.isAttacking ? 0.95 : 0;
    }
    this.slash.visible = this.isAttacking;
  }

  tryAttack(now: number): boolean {
    if (!this.isAlive || !canAct(now, this.attackCooldownUntil)) {
      return false;
    }
    this.attackUntil = now + PLAYER_ATTACK_DURATION_MS;
    this.attackCooldownUntil = now + PLAYER_ATTACK_COOLDOWN_MS;
    return true;
  }

  takeHit(amount: number, now: number): boolean {
    if (!this.isAlive || !canAct(now, this.invulnerableUntil)) {
      return false;
    }
    this.hp = applyDamage(this.hp, amount);
    this.invulnerableUntil = now + PLAYER_IFRAMES_MS;
    this.flash(0xff6b6b, 140);
    return true;
  }

  dispose(scene: THREE.Scene): void {
    scene.remove(this.mesh);
  }

  private flash(color: number, ms: number): void {
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material.emissive.setHex(color);
      }
    });
    window.setTimeout(() => {
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.emissive.setHex(0x000000);
        }
      });
    }, ms);
  }
}
