import { CAMPAIGN_WAVES, MAX_DEMONS, TOWER_MAX_LEVEL } from "../data/constants";

export function heroDamage(base: number, level: number): number {
  return base * (1 + (level - 1) ** 1.18 * 0.38);
}

export function towerDamage(base: number, level: number): number {
  const capped = Math.min(level, TOWER_MAX_LEVEL);
  return base * (1 + (capped - 1) * 0.28);
}

export function upgradeCost(baseCost: number, level: number): number {
  return Math.floor(baseCost * 0.55 * 1.24 ** (level - 1));
}

export function canUpgrade(kind: "hero" | "tower", level: number): boolean {
  return kind === "hero" || level < TOWER_MAX_LEVEL;
}

export function waveDemonCount(wave: number, endless: boolean): number {
  const core = 18 + wave * 12 + Math.floor(wave * wave * 1.15);
  if (endless) {
    return Math.min(MAX_DEMONS, core + wave * 8);
  }
  const finalBonus = wave >= CAMPAIGN_WAVES ? 80 : 0;
  return Math.min(MAX_DEMONS, core + finalBonus);
}

export function demonHp(wave: number): number {
  return 10 + wave * 5 + Math.floor(wave ** 1.32);
}

export function demonSpeed(wave: number): number {
  return 1.55 + Math.min(1.8, wave * 0.08);
}

export function spawnInterval(wave: number): number {
  return Math.max(0.045, 0.16 - wave * 0.008);
}

export function killGold(wave: number): number {
  return 1 + Math.floor(wave / 4);
}
