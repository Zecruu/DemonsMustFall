export class Input {
  moveX = 0;
  moveY = 0;

  private attackQueued = false;
  private readonly keys = new Set<string>();
  private stickX = 0;
  private stickY = 0;
  private readonly knob: HTMLElement;
  private readonly stick: HTMLElement;

  constructor() {
    this.stick = document.querySelector("#stick") as HTMLElement;
    this.knob = document.querySelector("#stick-knob") as HTMLElement;
    const attack = document.querySelector("#attack") as HTMLButtonElement;

    window.addEventListener("keydown", (event) => {
      this.keys.add(event.code);
      if (event.code === "Space") {
        event.preventDefault();
        this.attackQueued = true;
      }
    });
    window.addEventListener("keyup", (event) => this.keys.delete(event.code));

    this.stick.addEventListener("pointerdown", (event) => this.onStick(event, true));
    this.stick.addEventListener("pointermove", (event) => this.onStick(event, false));
    this.stick.addEventListener("pointerup", (event) => this.endStick(event));
    this.stick.addEventListener("pointercancel", (event) => this.endStick(event));

    attack.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      this.attackQueued = true;
    });
  }

  consumeAttack(): boolean {
    const queued = this.attackQueued;
    this.attackQueued = false;
    return queued;
  }

  refresh(): void {
    const keyX =
      Number(this.keys.has("ArrowRight") || this.keys.has("KeyD")) -
      Number(this.keys.has("ArrowLeft") || this.keys.has("KeyA"));
    const keyY =
      Number(this.keys.has("ArrowDown") || this.keys.has("KeyS")) -
      Number(this.keys.has("ArrowUp") || this.keys.has("KeyW"));

    const x = this.stickX || keyX;
    const y = this.stickY || keyY;
    const length = Math.hypot(x, y);
    if (length > 1) {
      this.moveX = x / length;
      this.moveY = y / length;
      return;
    }
    this.moveX = x;
    this.moveY = y;
  }

  private onStick(event: PointerEvent, capture: boolean): void {
    event.preventDefault();
    if (capture) {
      this.stick.setPointerCapture(event.pointerId);
    }
    if (!this.stick.hasPointerCapture(event.pointerId) && !capture) {
      return;
    }

    const rect = this.stick.getBoundingClientRect();
    const radius = rect.width / 2;
    const dx = event.clientX - (rect.left + radius);
    const dy = event.clientY - (rect.top + radius);
    const length = Math.hypot(dx, dy);
    const clamped = length > radius ? radius : length;
    const nx = length === 0 ? 0 : (dx / length) * clamped;
    const ny = length === 0 ? 0 : (dy / length) * clamped;

    this.stickX = nx / radius;
    this.stickY = ny / radius;
    this.knob.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
  }

  private endStick(event: PointerEvent): void {
    if (this.stick.hasPointerCapture(event.pointerId)) {
      this.stick.releasePointerCapture(event.pointerId);
    }
    this.stickX = 0;
    this.stickY = 0;
    this.knob.style.transform = "translate(-50%, -50%)";
  }
}
