export type CellType = "empty" | "path" | "build" | "spawn" | "base";

export type GridPos = { col: number; row: number };

export const PATH: GridPos[] = [
  { col: 3, row: 0 },
  { col: 3, row: 1 },
  { col: 3, row: 2 },
  { col: 3, row: 3 },
  { col: 3, row: 4 },
  { col: 3, row: 5 },
  { col: 3, row: 6 },
  { col: 3, row: 7 },
  { col: 3, row: 8 },
  { col: 3, row: 9 },
  { col: 3, row: 10 },
];

export function cellType(col: number, row: number): CellType {
  if (col === 3 && row === 0) {
    return "spawn";
  }
  if (col === 3 && row === 10) {
    return "base";
  }
  if (col === 3 && row >= 1 && row <= 9) {
    return "path";
  }
  if ((col === 1 || col === 2 || col === 4 || col === 5) && row >= 1 && row <= 9) {
    return "build";
  }
  return "empty";
}

export function isBuildable(col: number, row: number): boolean {
  return cellType(col, row) === "build";
}
