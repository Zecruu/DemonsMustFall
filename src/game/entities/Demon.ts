import Phaser from "phaser";
import {
  DEMON_CONTACT_COOLDOWN_MS,
  DEMON_MAX_HP,
  DEMON_SPEED,
  DEMON_TEXTURE,
  DEMON_TOUCH_DAMAGE,
} from "../data/constants";
import { applyDamage, canAct } from "../systems/combat";

export class Demon extends Phaser.Physics.Arcade.Sprite {
  hp = DEMON_MAX_HP;
  falling = false;

  private nextTouchAt = 0;
  private struckThisSwing = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, DEMON_TEXTURE);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(8);
    this.setCollideWorldBounds(true);

    const body = this.requireBody();
    body.setCircle(15, 9, 12);
    body.setBounce(0.15);
  }

  get isAlive(): boolean {
    return this.hp > 0 && !this.falling && this.active;
  }

  get touchDamage(): number {
    return DEMON_TOUCH_DAMAGE;
  }

  canTouch(now: number): boolean {
    return this.isAlive && canAct(now, this.nextTouchAt);
  }

  markTouched(now: number): void {
    this.nextTouchAt = now + DEMON_CONTACT_COOLDOWN_MS;
  }

  beginSwing(): void {
    this.struckThisSwing = false;
  }

  chase(targetX: number, targetY: number): void {
    if (!this.isAlive) {
      this.setVelocity(0, 0);
      return;
    }

    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    this.setVelocity(Math.cos(angle) * DEMON_SPEED, Math.sin(angle) * DEMON_SPEED);
    this.setFlipX(targetX < this.x);
  }

  takeHit(amount: number): boolean {
    if (!this.isAlive || this.struckThisSwing) {
      return false;
    }

    this.struckThisSwing = true;
    this.hp = applyDamage(this.hp, amount);
    this.setTint(0xffe8a3);

    const knockback = new Phaser.Math.Vector2(this.body?.velocity.x ?? 0, this.body?.velocity.y ?? 0)
      .normalize()
      .scale(-220);
    this.setVelocity(knockback.x, knockback.y);

    this.scene.time.delayedCall(80, () => {
      if (this.active && !this.falling) {
        this.clearTint();
      }
    });

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
    this.requireBody().enable = false;
    this.setVelocity(0, 0);
    this.setTint(0x5a1d28);

    this.scene.tweens.add({
      targets: this,
      angle: this.flipX ? -95 : 95,
      alpha: 0,
      y: this.y + 36,
      scale: 0.85,
      duration: 460,
      ease: "Quad.easeIn",
      onComplete: () => {
        this.destroy();
      },
    });
  }

  private requireBody(): Phaser.Physics.Arcade.Body {
    const body = this.body;
    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      throw new Error("Demon is missing an Arcade Physics body");
    }
    return body;
  }
}
