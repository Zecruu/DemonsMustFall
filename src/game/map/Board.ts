import * as THREE from "three";
import { CELL, GRID_COLS, GRID_ROWS } from "../data/constants";
import { cellType, PATH } from "./layout";
import { cellToWorld, pathWorld } from "./world";

export class Board {
  readonly path: { x: number; z: number }[];
  readonly root = new THREE.Group();

  constructor(scene: THREE.Scene) {
    this.path = pathWorld(PATH);
    scene.add(this.root);

    const grass = new THREE.MeshStandardMaterial({ color: 0x1a1218, roughness: 0.92 });
    const pathMat = new THREE.MeshStandardMaterial({ color: 0x3a2430, roughness: 0.78 });
    const buildMat = new THREE.MeshStandardMaterial({ color: 0x3d2a28, roughness: 0.8 });
    const spawnMat = new THREE.MeshStandardMaterial({ color: 0x5c1020, emissive: 0x3a0810, roughness: 0.5 });
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x2ec4b6, emissive: 0x0b3d38, roughness: 0.4 });

    for (let row = 0; row < GRID_ROWS; row += 1) {
      for (let col = 0; col < GRID_COLS; col += 1) {
        const kind = cellType(col, row);
        const mat =
          kind === "path" || kind === "spawn" || kind === "base"
            ? pathMat
            : kind === "build"
              ? buildMat
              : grass;
        const tile = new THREE.Mesh(new THREE.BoxGeometry(CELL * 0.96, 0.12, CELL * 0.96), mat);
        const { x, z } = cellToWorld(col, row);
        tile.position.set(x, -0.06, z);
        tile.receiveShadow = true;
        this.root.add(tile);

        if (kind === "spawn") {
          const portal = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.05, 8, 18), spawnMat);
          portal.rotation.x = Math.PI / 2;
          portal.position.set(x, 0.2, z);
          this.root.add(portal);
        }
        if (kind === "base") {
          const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.32), baseMat);
          crystal.position.set(x, 0.42, z);
          this.root.add(crystal);
        }
      }
    }

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(GRID_COLS + 4, GRID_ROWS + 4),
      new THREE.MeshStandardMaterial({ color: 0x0b070a, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.14;
    this.root.add(ground);
  }
}
