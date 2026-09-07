import Phaser from "phaser";
import {
  PLAYER_ATTACK_COOLDOWN_MS,
  PLAYER_ATTACK_DAMAGE,
  PLAYER_ATTACK_DURATION_MS,
  PLAYER_ATTACK_RADIUS,
  PLAYER_ATTACK_RANGE,
  PLAYER_IFRAMES_MS,
  PLAYER_MAX_HP,
  PLAYER_SPEED,
  PLAYER_TEXTURE,
  SLASH_TEXTURE,
} from "../data/constants";
import { applyDamage, attackOrigin, canAct, facingFromInput, type Vec2 } from "../systems/combat";

export class Player extends Phaser.Physics.Arcade.Sprite {
  hp = PLAYER_MAX_HP;
  facing: Vec2 = { x: 1, y: 0 };

  private attackUntil = 0;
  private attackCooldownUntil = 0;
  private invulnerableUntil = 0;
  private slash?: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, PLAYER_TEXTURE);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(10);
    this.setCollideWorldBounds(true);
    this.setDamping(true);
    this.setDrag(0.0008);
    this.setMaxVelocity(PLAYER_SPEED);

    const body = this.requireBody();
    body.setCircle(16, 8, 10);
  }

  get isAttacking(): boolean {
    return this.scene.time.now < this.attackUntil;
  }

  get isAlive(): boolean {
    return this.hp > 0;
  }

  move(dx: number, dy: number): void {
    if (!this.isAlive) {
      this.setVelocity(0, 0);
      return;
    }

    this.facing = facingFromInput(dx, dy, this.facing);

    if (dx === 0 && dy === 0) {
      this.setVelocity(0, 0);
      return;
    }

    const length = Math.hypot(dx, dy);
    this.setVelocity((dx / length) * PLAYER_SPEED, (dy / length) * PLAYER_SPEED);
    this.setFlipX(this.facing.x < 0);
  }

  tryAttack(): boolean {
    const now = this.scene.time.now;
    if (!this.isAlive || !canAct(now, this.attackCooldownUntil)) {
      return false;
    }

    this.attackUntil = now + PLAYER_ATTACK_DURATION_MS;
    this.attackCooldownUntil = now + PLAYER_ATTACK_COOLDOWN_MS;
    this.showSlash();
    return true;
  }

  attackCenter(): Vec2 {
    return attackOrigin(this.x, this.y, this.facing, PLAYER_ATTACK_RANGE);
  }

  get attackRadius(): number {
    return PLAYER_ATTACK_RADIUS;
  }

  get attackDamage(): number {
    return PLAYER_ATTACK_DAMAGE;
  }

  takeHit(amount: number): boolean {
    const now = this.scene.time.now;
    if (!this.isAlive || !canAct(now, this.invulnerableUntil)) {
      return false;
    }

    this.hp = applyDamage(this.hp, amount);
    this.invulnerableUntil = now + PLAYER_IFRAMES_MS;
    this.setTint(0xff6b6b);
    this.scene.time.delayedCall(140, () => {
      if (this.active) {
        this.clearTint();
      }
    });

    return true;
  }

  updateSlash(): void {
    if (!this.slash) {
      return;
    }

    const center = this.attackCenter();
    this.slash.setPosition(center.x, center.y);
    this.slash.setRotation(Math.atan2(this.facing.y, this.facing.x));
    this.slash.setVisible(this.isAttacking);
    this.slash.setAlpha(this.isAttacking ? 0.95 : 0);
  }

  private showSlash(): void {
    if (!this.slash) {
      this.slash = this.scene.add.image(this.x, this.y, SLASH_TEXTURE);
      this.slash.setDepth(12);
    }

    this.updateSlash();
  }

  private requireBody(): Phaser.Physics.Arcade.Body {
    const body = this.body;
    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      throw new Error("Player is missing an Arcade Physics body");
    }
    return body;
  }
}
