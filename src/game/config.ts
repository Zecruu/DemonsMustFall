import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "./data/constants";
import { BootScene } from "./scenes/BootScene";
import { CombatScene } from "./scenes/CombatScene";
import { GameOverScene } from "./scenes/GameOverScene";
import { TitleScene } from "./scenes/TitleScene";

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#07060a",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, TitleScene, CombatScene, GameOverScene],
  pixelArt: false,
  banner: false,
};
