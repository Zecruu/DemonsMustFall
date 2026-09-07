export type UnitKind = "hero" | "tower";
export type TargetStyle = "first" | "closest";

export type UnitDef = {
  id: string;
  name: string;
  kind: UnitKind;
  role: string;
  cost: number;
  range: number;
  fireRate: number;
  damage: number;
  splash: number;
  slow: number;
  color: number;
  locked?: boolean;
};

export const UNITS: UnitDef[] = [
  {
    id: "slayer",
    name: "Kael",
    kind: "hero",
    role: "Duelist",
    cost: 70,
    range: 1.45,
    fireRate: 6.5,
    damage: 14,
    splash: 0,
    slow: 0,
    color: 0x2ec4b6,
  },
  {
    id: "infernal",
    name: "Nyx",
    kind: "hero",
    role: "Obliterator",
    cost: 95,
    range: 2.3,
    fireRate: 2.2,
    damage: 9,
    splash: 1.15,
    slow: 0,
    color: 0xc084fc,
  },
  {
    id: "seraph",
    name: "Seraph",
    kind: "hero",
    role: "Warden",
    cost: 85,
    range: 2.1,
    fireRate: 3.4,
    damage: 4,
    splash: 0.7,
    slow: 0.45,
    color: 0xf4d35e,
    locked: true,
  },
  {
    id: "spike",
    name: "Spike Tower",
    kind: "tower",
    role: "Lane chip",
    cost: 40,
    range: 1.7,
    fireRate: 4.2,
    damage: 6,
    splash: 0,
    slow: 0,
    color: 0x9ca3af,
  },
  {
    id: "flame",
    name: "Flame Tower",
    kind: "tower",
    role: "Horde burn",
    cost: 55,
    range: 1.9,
    fireRate: 1.6,
    damage: 5,
    splash: 1.35,
    slow: 0,
    color: 0xe85d4c,
  },
];

export function unitById(id: string): UnitDef {
  const found = UNITS.find((unit) => unit.id === id);
  if (!found) {
    throw new Error(`Unknown unit ${id}`);
  }
  return found;
}
