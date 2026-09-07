import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../data/constants";

type GameOverData = {
  fallen?: number;
  wave?: number;
};

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  create(data: GameOverData): void {
    const fallen = data.fallen ?? 0;
    const wave = data.wave ?? 1;

    this.cameras.main.setBackgroundColor(0x09060a);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x12080c, 0.94);

    this.add
      .text(GAME_WIDTH / 2, 220, "YOU HAVE FALLEN", {
        fontFamily: "Palatino Linotype, Palatino, Georgia, serif",
        fontSize: "56px",
        color: "#e85d4c",
        stroke: "#2a0b10",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 320, `Demons felled  ${fallen}\nReached wave  ${wave}`, {
        fontFamily: "Georgia, serif",
        fontSize: "26px",
        color: "#f4e7c8",
        align: "center",
        lineSpacing: 10,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 460, "Press R or click to rise again", {
        fontFamily: "Georgia, serif",
        fontSize: "22px",
        color: "#c9a27a",
      })
      .setOrigin(0.5);

    this.input.keyboard?.once("keydown-R", () => this.scene.start("CombatScene"));
    this.input.once("pointerdown", () => this.scene.start("CombatScene"));
  }
}
