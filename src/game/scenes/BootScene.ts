import Phaser from "phaser";
import {
  DEMON_TEXTURE,
  FLOOR_TEXTURE,
  PLAYER_TEXTURE,
  SLASH_TEXTURE,
  WALL_TEXTURE,
} from "../data/constants";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    this.bakeTextures();
    this.scene.start("TitleScene");
  }

  private bakeTextures(): void {
    const gfx = this.add.graphics();

    gfx.fillStyle(0x1a1218);
    gfx.fillRect(0, 0, 64, 64);
    gfx.lineStyle(1, 0x2a1c24, 0.8);
    gfx.strokeRect(0.5, 0.5, 63, 63);
    gfx.fillStyle(0x24181f, 0.7);
    gfx.fillRect(8, 8, 16, 10);
    gfx.generateTexture(FLOOR_TEXTURE, 64, 64);
    gfx.clear();

    gfx.fillStyle(0x0d0a0c);
    gfx.fillRect(0, 0, 48, 48);
    gfx.fillStyle(0x3a2430);
    gfx.fillRect(6, 6, 36, 36);
    gfx.generateTexture(WALL_TEXTURE, 48, 48);
    gfx.clear();

    gfx.fillStyle(0x2ec4b6);
    gfx.fillCircle(24, 28, 16);
    gfx.fillStyle(0xf4d35e);
    gfx.fillTriangle(24, 6, 16, 20, 32, 20);
    gfx.fillStyle(0x0b1d1a);
    gfx.fillCircle(19, 26, 2.4);
    gfx.fillCircle(29, 26, 2.4);
    gfx.fillStyle(0xfff6d8);
    gfx.fillTriangle(34, 22, 46, 18, 36, 30);
    gfx.generateTexture(PLAYER_TEXTURE, 48, 48);
    gfx.clear();

    gfx.fillStyle(0x9b1d2e);
    gfx.fillCircle(24, 30, 15);
    gfx.fillStyle(0x5c1020);
    gfx.fillTriangle(10, 22, 6, 4, 20, 16);
    gfx.fillTriangle(38, 22, 42, 4, 28, 16);
    gfx.fillStyle(0xf0d38a);
    gfx.fillCircle(19, 28, 2.2);
    gfx.fillCircle(29, 28, 2.2);
    gfx.fillStyle(0x2b0b12);
    gfx.fillTriangle(20, 36, 24, 41, 28, 36);
    gfx.generateTexture(DEMON_TEXTURE, 48, 48);
    gfx.clear();

    gfx.fillStyle(0xffe08a, 0.95);
    gfx.fillTriangle(6, 8, 46, 24, 6, 40);
    gfx.generateTexture(SLASH_TEXTURE, 48, 48);
    gfx.destroy();
  }
}
