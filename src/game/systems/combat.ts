export type Vec2 = { x: number; y: number };

export function facingFromInput(dx: number, dy: number, current: Vec2): Vec2 {
  if (dx === 0 && dy === 0) {
    return current;
  }

  const length = Math.hypot(dx, dy);
  return { x: dx / length, y: dy / length };
}

export function attackOrigin(x: number, y: number, facing: Vec2, range: number): Vec2 {
  return {
    x: x + facing.x * range * 0.62,
    y: y + facing.y * range * 0.62,
  };
}

export function circlesOverlap(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
): boolean {
  const dx = ax - bx;
  const dy = ay - by;
  const radius = ar + br;
  return dx * dx + dy * dy <= radius * radius;
}

export function applyDamage(hp: number, amount: number): number {
  return Math.max(0, hp - Math.max(0, amount));
}

export function waveDemonCount(wave: number): number {
  return Math.min(12, 2 + wave);
}

export function canAct(now: number, lockedUntil: number): boolean {
  return now >= lockedUntil;
}
