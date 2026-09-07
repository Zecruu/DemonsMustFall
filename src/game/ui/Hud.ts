import { PLAYER_MAX_HP } from "../data/constants";

export class Hud {
  private readonly hp = document.querySelector("#hp") as HTMLElement;
  private readonly wave = document.querySelector("#wave") as HTMLElement;
  private readonly fallen = document.querySelector("#fallen") as HTMLElement;
  private readonly root = document.querySelector("#hud") as HTMLElement;
  private readonly touch = document.querySelector("#touch") as HTMLElement;

  show(): void {
    this.root.hidden = false;
    this.touch.hidden = false;
  }

  hide(): void {
    this.root.hidden = true;
    this.touch.hidden = true;
  }

  refresh(hp: number, fallen: number, wave: number): void {
    this.hp.textContent = "♥".repeat(hp) + "♡".repeat(Math.max(0, PLAYER_MAX_HP - hp));
    this.fallen.textContent = `Fallen  ${fallen}`;
    this.wave.textContent = `Wave  ${wave}`;
  }
}
