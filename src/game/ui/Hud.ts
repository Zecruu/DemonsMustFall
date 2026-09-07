import Phaser from "phaser";
import { GAME_WIDTH, PLAYER_MAX_HP } from "../data/constants";

export class Hud {
  private readonly hpText: Phaser.GameObjects.Text;
  private readonly fallenText: Phaser.GameObjects.Text;
  private readonly waveText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "Palatino Linotype, Palatino, Georgia, serif",
      fontSize: "22px",
      color: "#f4e7c8",
      stroke: "#12080c",
      strokeThickness: 4,
    };

    this.hpText = scene.add.text(28, 20, "", style).setScrollFactor(0).setDepth(100);
    this.fallenText = scene.add
      .text(GAME_WIDTH - 28, 20, "", { ...style, align: "right" })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(100);
    this.waveText = scene.add
      .text(GAME_WIDTH / 2, 20, "", { ...style, align: "center" })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(100);
  }

  refresh(hp: number, fallen: number, wave: number): void {
    const hearts = "♥".repeat(hp) + "♡".repeat(Math.max(0, PLAYER_MAX_HP - hp));
    this.hpText.setText(hearts);
    this.fallenText.setText(`Fallen  ${fallen}`);
    this.waveText.setText(`Wave  ${wave}`);
  }
}
