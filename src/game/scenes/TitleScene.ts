import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../data/constants";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x0b070a);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x140910, 0.92);

    this.add
      .text(GAME_WIDTH / 2, 210, "DEMONS MUST FALL", {
        fontFamily: "Palatino Linotype, Palatino, Georgia, serif",
        fontSize: "64px",
        color: "#f4e7c8",
        stroke: "#3b1018",
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 290, "An arena combat scaffold. Strike until they fall.", {
        fontFamily: "Georgia, serif",
        fontSize: "22px",
        color: "#c9a27a",
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 400, "WASD / Arrows  move\nSpace / Click  strike\nEnter  begin", {
        fontFamily: "Georgia, serif",
        fontSize: "22px",
        color: "#efe6d4",
        align: "center",
        lineSpacing: 8,
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(GAME_WIDTH / 2, 560, "Press Enter or click to hunt", {
        fontFamily: "Georgia, serif",
        fontSize: "24px",
        color: "#e85d4c",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0.25,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard?.once("keydown-ENTER", () => this.startHunt());
    this.input.once("pointerdown", () => this.startHunt());
  }

  private startHunt(): void {
    this.scene.start("CombatScene");
  }
}
