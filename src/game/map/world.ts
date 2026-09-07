import { CELL, GRID_COLS, GRID_ROWS } from "../data/constants";
import type { GridPos } from "./layout";

export function cellToWorld(col: number, row: number): { x: number; z: number } {
  return {
    x: (col - (GRID_COLS - 1) / 2) * CELL,
    z: (row - (GRID_ROWS - 1) / 2) * CELL,
  };
}

export function worldToCell(x: number, z: number): GridPos {
  return {
    col: Math.round(x / CELL + (GRID_COLS - 1) / 2),
    row: Math.round(z / CELL + (GRID_ROWS - 1) / 2),
  };
}

export function inBounds(col: number, row: number): boolean {
  return col >= 0 && row >= 0 && col < GRID_COLS && row < GRID_ROWS;
}

export function pathWorld(points: GridPos[]): { x: number; z: number }[] {
  return points.map((point) => cellToWorld(point.col, point.row));
}
