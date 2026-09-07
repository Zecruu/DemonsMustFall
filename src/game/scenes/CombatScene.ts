import Phaser from "phaser";
import {
  ARENA_PADDING,
  DEMON_TOUCH_DAMAGE,
  FLOOR_TEXTURE,
  GAME_HEIGHT,
  GAME_WIDTH,
  WALL_TEXTURE,
} from "../data/constants";
import { Demon } from "../entities/Demon";
import { Player } from "../entities/Player";
import { circlesOverlap, waveDemonCount } from "../systems/combat";
import { Hud } from "../ui/Hud";

export class CombatScene extends Phaser.Scene {
  private player!: Player;
  private demons!: Phaser.Physics.Arcade.Group;
  private hud!: Hud;
  private keys!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
  };

  private wave = 1;
  private fallen = 0;
  private spawning = false;
  private swingStarted = false;

  constructor() {
    super("CombatScene");
  }

  create(): void {
    this.wave = 1;
    this.fallen = 0;
    this.spawning = false;
    this.swingStarted = false;

    this.drawArena();
    this.physics.world.setBounds(
      ARENA_PADDING,
      ARENA_PADDING,
      GAME_WIDTH - ARENA_PADDING * 2,
      GAME_HEIGHT - ARENA_PADDING * 2,
    );

    this.player = new Player(this, GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.demons = this.physics.add.group({ classType: Demon, runChildUpdate: false });
    this.hud = new Hud(this);
    this.hud.refresh(this.player.hp, this.fallen, this.wave);

    this.physics.add.collider(this.player, this.demons);
    this.physics.add.collider(this.demons, this.demons);

    this.bindInput();
    this.spawnWave();
  }

  update(): void {
    if (!this.player.isAlive) {
      this.scene.start("GameOverScene", { fallen: this.fallen, wave: this.wave });
      return;
    }

    const dx =
      Number(this.keys.right.isDown || this.keys.d.isDown) -
      Number(this.keys.left.isDown || this.keys.a.isDown);
    const dy =
      Number(this.keys.down.isDown || this.keys.s.isDown) -
      Number(this.keys.up.isDown || this.keys.w.isDown);

    this.player.move(dx, dy);
    this.player.updateSlash();

    if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
      this.tryPlayerAttack();
    }

    if (this.player.isAttacking) {
      if (!this.swingStarted) {
        this.swingStarted = true;
        this.forEachDemon((demon) => demon.beginSwing());
      }
      this.resolveAttacks();
    } else {
      this.swingStarted = false;
    }

    this.forEachDemon((demon) => {
      demon.chase(this.player.x, this.player.y);
      this.resolveTouch(demon);
    });

    if (!this.spawning && this.livingDemonCount() === 0) {
      this.wave += 1;
      this.spawnWave();
    }

    this.hud.refresh(this.player.hp, this.fallen, this.wave);
  }

  private bindInput(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error("Keyboard input is required for CombatScene");
    }

    this.keys = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      w: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      space: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    };

    this.input.on("pointerdown", () => this.tryPlayerAttack());
  }

  private tryPlayerAttack(): void {
    this.player.tryAttack();
  }

  private resolveAttacks(): void {
    const center = this.player.attackCenter();
    this.forEachDemon((demon) => {
      if (
        circlesOverlap(
          center.x,
          center.y,
          this.player.attackRadius,
          demon.x,
          demon.y,
          18,
        ) &&
        demon.takeHit(this.player.attackDamage)
      ) {
        if (!demon.isAlive) {
          this.fallen += 1;
        }
      }
    });
  }

  private resolveTouch(demon: Demon): void {
    if (!demon.canTouch(this.time.now)) {
      return;
    }

    if (!circlesOverlap(this.player.x, this.player.y, 18, demon.x, demon.y, 18)) {
      return;
    }

    if (this.player.takeHit(DEMON_TOUCH_DAMAGE)) {
      demon.markTouched(this.time.now);
    }
  }

  private spawnWave(): void {
    this.spawning = true;
    const count = waveDemonCount(this.wave);

    for (let i = 0; i < count; i += 1) {
      const edge = i % 4;
      const jitter = Phaser.Math.Between(80, 220);
      let x = ARENA_PADDING + 36;
      let y = ARENA_PADDING + 36;

      if (edge === 0) {
        x = Phaser.Math.Between(ARENA_PADDING + 40, GAME_WIDTH - ARENA_PADDING - 40);
        y = ARENA_PADDING + 40;
      } else if (edge === 1) {
        x = Phaser.Math.Between(ARENA_PADDING + 40, GAME_WIDTH - ARENA_PADDING - 40);
        y = GAME_HEIGHT - ARENA_PADDING - 40;
      } else if (edge === 2) {
        x = ARENA_PADDING + 40;
        y = Phaser.Math.Between(ARENA_PADDING + 40, GAME_HEIGHT - ARENA_PADDING - 40);
      } else {
        x = GAME_WIDTH - ARENA_PADDING - 40;
        y = Phaser.Math.Between(ARENA_PADDING + 80, GAME_HEIGHT - ARENA_PADDING - 40);
      }

      const demon = new Demon(this, x + (jitter % 17), y);
      this.demons.add(demon);
    }

    this.time.delayedCall(250, () => {
      this.spawning = false;
    });
  }

  private livingDemonCount(): number {
    let living = 0;
    this.forEachDemon((demon) => {
      if (demon.isAlive) {
        living += 1;
      }
    });
    return living;
  }

  private forEachDemon(visit: (demon: Demon) => void): void {
    for (const child of this.demons.getChildren()) {
      if (child instanceof Demon && child.active) {
        visit(child);
      }
    }
  }

  private drawArena(): void {
    this.cameras.main.setBackgroundColor(0x07060a);
    this.add.tileSprite(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      FLOOR_TEXTURE,
    );

    this.add.tileSprite(GAME_WIDTH / 2, ARENA_PADDING / 2, GAME_WIDTH, ARENA_PADDING, WALL_TEXTURE);
    this.add.tileSprite(
      GAME_WIDTH / 2,
      GAME_HEIGHT - ARENA_PADDING / 2,
      GAME_WIDTH,
      ARENA_PADDING,
      WALL_TEXTURE,
    );
    this.add.tileSprite(ARENA_PADDING / 2, GAME_HEIGHT / 2, ARENA_PADDING, GAME_HEIGHT, WALL_TEXTURE);
    this.add.tileSprite(
      GAME_WIDTH - ARENA_PADDING / 2,
      GAME_HEIGHT / 2,
      ARENA_PADDING,
      GAME_HEIGHT,
      WALL_TEXTURE,
    );

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 22, "Let none remain standing.", {
        fontFamily: "Georgia, serif",
        fontSize: "16px",
        color: "#8a6a58",
      })
      .setOrigin(0.5)
      .setDepth(20);
  }
}
