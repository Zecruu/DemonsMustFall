import * as THREE from "three";
import { unitById, type UnitDef } from "../data/catalog";
import { cellToWorld } from "../map/world";
import { canUpgrade, heroDamage, towerDamage, upgradeCost } from "../systems/scaling";
import type { Horde } from "./Horde";

export type Structure = {
  id: number;
  def: UnitDef;
  col: number;
  row: number;
  level: number;
  cooldown: number;
  mesh: THREE.Group;
};

export class Structures {
  readonly items: Structure[] = [];
  private nextId = 1;

  constructor(private readonly scene: THREE.Scene) {}

  occupy(col: number, row: number): boolean {
    return this.items.some((item) => item.col === col && item.row === row);
  }

  at(col: number, row: number): Structure | undefined {
    return this.items.find((item) => item.col === col && item.row === row);
  }

  place(def: UnitDef, col: number, row: number): Structure {
    const { x, z } = cellToWorld(col, row);
    const mesh = makeStructureMesh(def);
    mesh.position.set(x, 0, z);
    this.scene.add(mesh);
    const structure: Structure = {
      id: this.nextId,
      def,
      col,
      row,
      level: 1,
      cooldown: 0,
      mesh,
    };
    this.nextId += 1;
    this.items.push(structure);
    return structure;
  }

  upgradeCostOf(structure: Structure): number {
    return upgradeCost(structure.def.cost, structure.level);
  }

  tryUpgrade(structure: Structure): boolean {
    if (!canUpgrade(structure.def.kind, structure.level)) {
      return false;
    }
    structure.level += 1;
    structure.mesh.scale.setScalar(1 + (structure.level - 1) * 0.06);
    return true;
  }

  damageOf(structure: Structure): number {
    return structure.def.kind === "hero"
      ? heroDamage(structure.def.damage, structure.level)
      : towerDamage(structure.def.damage, structure.level);
  }

  fire(
    dt: number,
    horde: Horde,
    onHit: (kills: number) => void,
    onFall: (gold: number) => void,
    wave: number,
  ): void {
    for (const structure of this.items) {
      structure.cooldown -= dt;
      if (structure.cooldown > 0) {
        continue;
      }
      const origin = structure.mesh.position;
      const range = structure.def.range;
      let best = -1;
      let bestScore = Number.POSITIVE_INFINITY;
      for (let i = 0; i < horde.demons.length; i += 1) {
        const demon = horde.demons[i];
        if (!demon?.alive) {
          continue;
        }
        const dist = Math.hypot(demon.x - origin.x, demon.z - origin.z);
        if (dist > range) {
          continue;
        }
        const score = demon.pathIndex + demon.t;
        if (score < bestScore) {
          bestScore = score;
          best = i;
        }
      }
      if (best < 0) {
        continue;
      }

      structure.cooldown = 1 / structure.def.fireRate;
      const target = horde.demons[best];
      if (!target) {
        continue;
      }
      const dmg = this.damageOf(structure);
      let kills = 0;
      if (structure.def.splash > 0) {
        for (let i = 0; i < horde.demons.length; i += 1) {
          const demon = horde.demons[i];
          if (!demon?.alive) {
            continue;
          }
          if (Math.hypot(demon.x - target.x, demon.z - target.z) <= structure.def.splash) {
            if (horde.hurt(i, dmg, onFall, wave)) {
              kills += 1;
            }
            if (structure.def.slow > 0) {
              demon.t = Math.max(0, demon.t - structure.def.slow * 0.012);
            }
          }
        }
      } else if (horde.hurt(best, dmg, onFall, wave)) {
        kills += 1;
      }
      if (kills > 0) {
        onHit(kills);
      }
    }
  }

  clear(): void {
    for (const item of this.items) {
      this.scene.remove(item.mesh);
    }
    this.items.length = 0;
  }
}

export function defFromId(id: string): UnitDef {
  return unitById(id);
}

function makeStructureMesh(def: UnitDef): THREE.Group {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: def.color,
    roughness: 0.45,
    metalness: 0.18,
  });
  if (def.kind === "hero") {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.34, 4, 8), bodyMat);
    body.position.y = 0.42;
    const crest = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.22, 6),
      new THREE.MeshStandardMaterial({ color: 0xf4e7c8, roughness: 0.4 }),
    );
    crest.position.y = 0.78;
    group.add(body, crest);
  } else {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.5, 8), bodyMat);
    shaft.position.y = 0.28;
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.1, 0.34),
      new THREE.MeshStandardMaterial({ color: 0x3a2430, roughness: 0.7 }),
    );
    cap.position.y = 0.56;
    group.add(shaft, cap);
  }
  return group;
}
