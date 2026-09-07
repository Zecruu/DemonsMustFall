import * as THREE from "three";
import { CAMERA_OFFSET, DEMON_TOUCH_DAMAGE, PLAYER_MAX_HP } from "./data/constants";
import { Demon } from "./entities/Demon";
import { Player } from "./entities/Player";
import { createArena } from "./meshes";
import { impact } from "./native";
import { circlesOverlap, waveDemonCount } from "./systems/combat";
import { Input } from "./systems/input";
import { Hud } from "./ui/Hud";

type Mode = "title" | "combat" | "gameover";

export class Game {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(50, 1, 0.1, 80);
  private readonly clock = new THREE.Clock();
  private readonly input = new Input();
  private readonly hud = new Hud();
  private readonly lookAt = new THREE.Vector3();
  private readonly cameraTarget = new THREE.Vector3(CAMERA_OFFSET.x, CAMERA_OFFSET.y, CAMERA_OFFSET.z);

  private player: Player | null = null;
  private demons: Demon[] = [];
  private mode: Mode = "title";
  private wave = 1;
  private fallen = 0;
  private swingOpen = false;
  private spawning = false;
  private titleAngle = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene.background = new THREE.Color(0x07060a);
    this.scene.fog = new THREE.FogExp2(0x07060a, 0.042);

    const hemi = new THREE.HemisphereLight(0xffe6c8, 0x1a0a10, 0.85);
    const sun = new THREE.DirectionalLight(0xffd8a8, 1.55);
    sun.position.set(8, 14, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 2;
    sun.shadow.camera.far = 40;
    sun.shadow.camera.left = -14;
    sun.shadow.camera.right = 14;
    sun.shadow.camera.top = 14;
    sun.shadow.camera.bottom = -14;
    const ember = new THREE.PointLight(0xff6b4a, 18, 26, 2);
    ember.position.set(0, 3.4, 0);
    this.scene.add(hemi, sun, ember);

    createArena(this.scene);
    this.camera.position.copy(this.cameraTarget);
    this.camera.lookAt(0, 0.6, 0);

    this.bindUi();
    this.resize();
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("keydown", (event) => {
      if (event.code === "Enter" && this.mode === "title") {
        this.startHunt();
      }
      if (event.code === "KeyR" && this.mode === "gameover") {
        this.startHunt();
      }
    });

    console.info("[DemonsMustFall] Three.js combat scaffold ready", {
      maxHp: PLAYER_MAX_HP,
      renderer: this.renderer.capabilities.isWebGL2 ? "webgl2" : "webgl",
    });
    this.renderer.setAnimationLoop(() => this.tick());
  }

  private bindUi(): void {
    document.querySelector("#start")?.addEventListener("click", () => this.startHunt());
    document.querySelector("#retry")?.addEventListener("click", () => this.startHunt());
  }

  private startHunt(): void {
    this.clearCombat();
    this.player = new Player(this.scene);
    this.wave = 1;
    this.fallen = 0;
    this.swingOpen = false;
    this.spawning = false;
    this.mode = "combat";
    this.setOverlay("title", true);
    this.setOverlay("gameover", true);
    this.hud.show();
    this.hud.refresh(this.player.hp, this.fallen, this.wave);
    this.spawnWave();
    void impact("medium");
    console.info("[DemonsMustFall] Hunt started");
  }

  private tick(): void {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.input.refresh();

    if (this.mode === "title") {
      this.titleAngle += dt * 0.18;
      this.camera.position.set(Math.sin(this.titleAngle) * 12, 11, Math.cos(this.titleAngle) * 12);
      this.camera.lookAt(0, 0.4, 0);
      this.renderer.render(this.scene, this.camera);
      return;
    }

    if (this.mode === "combat" && this.player) {
      this.updateCombat(dt);
    }

    const focus = this.player?.position ?? this.lookAt;
    this.cameraTarget.set(focus.x + CAMERA_OFFSET.x, CAMERA_OFFSET.y, focus.z + CAMERA_OFFSET.z);
    this.camera.position.lerp(this.cameraTarget, 1 - Math.pow(0.001, dt));
    this.lookAt.set(focus.x, 0.7, focus.z);
    this.camera.lookAt(this.lookAt);
    this.renderer.render(this.scene, this.camera);
  }

  private updateCombat(dt: number): void {
    const player = this.player;
    if (!player) {
      return;
    }

    const now = performance.now();
    player.move(this.input.moveX, this.input.moveY, dt);

    if (this.input.consumeAttack() && player.tryAttack(now)) {
      void impact("light");
    }

    if (player.isAttacking) {
      if (!this.swingOpen) {
        this.swingOpen = true;
        for (const demon of this.demons) {
          demon.beginSwing();
        }
      }
      this.resolveAttacks(player);
    } else {
      this.swingOpen = false;
    }

    for (const demon of this.demons) {
      demon.chase(player.position, dt);
      demon.updateFall(dt);
      this.separate(player, demon);
      this.resolveTouch(player, demon, now);
    }

    for (const demon of this.demons) {
      if (demon.gone) {
        demon.dispose(this.scene);
      }
    }
    this.demons = this.demons.filter((demon) => !demon.gone);

    if (!player.isAlive) {
      this.endHunt();
      return;
    }

    if (!this.spawning && this.demons.length === 0) {
      this.wave += 1;
      this.spawnWave();
    }

    this.hud.refresh(player.hp, this.fallen, this.wave);
  }

  private resolveAttacks(player: Player): void {
    const center = player.attackCenter();
    for (const demon of this.demons) {
      if (
        circlesOverlap(
          center.x,
          center.y,
          player.attackRadius,
          demon.mesh.position.x,
          demon.mesh.position.z,
          demon.radius,
        ) &&
        demon.takeHit(player.attackDamage)
      ) {
        void impact("medium");
        if (!demon.isAlive) {
          this.fallen += 1;
          console.info("[DemonsMustFall] Demon fell", { fallen: this.fallen, wave: this.wave });
        }
      }
    }
  }

  private resolveTouch(player: Player, demon: Demon, now: number): void {
    if (!demon.canTouch(now)) {
      return;
    }
    if (
      !circlesOverlap(
        player.position.x,
        player.position.z,
        player.radius,
        demon.mesh.position.x,
        demon.mesh.position.z,
        demon.radius,
      )
    ) {
      return;
    }
    if (player.takeHit(DEMON_TOUCH_DAMAGE, now)) {
      demon.markTouched(now);
      void impact("heavy");
    }
  }

  private separate(player: Player, demon: Demon): void {
    if (!demon.isAlive) {
      return;
    }
    const min = player.radius + demon.radius;
    const dx = player.position.x - demon.mesh.position.x;
    const dz = player.position.z - demon.mesh.position.z;
    const dist = Math.hypot(dx, dz) || 0.0001;
    if (dist >= min) {
      return;
    }
    const push = (min - dist) / 2;
    player.position.x += (dx / dist) * push;
    player.position.z += (dz / dist) * push;
    demon.mesh.position.x -= (dx / dist) * push;
    demon.mesh.position.z -= (dz / dist) * push;
  }

  private spawnWave(): void {
    this.spawning = true;
    const count = waveDemonCount(this.wave);
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 + this.wave * 0.35;
      const x = Math.cos(angle) * 8.2;
      const z = Math.sin(angle) * 8.2;
      this.demons.push(new Demon(this.scene, x, z));
    }
    window.setTimeout(() => {
      this.spawning = false;
    }, 200);
    console.info("[DemonsMustFall] Wave spawned", { wave: this.wave, demons: count });
  }

  private endHunt(): void {
    this.mode = "gameover";
    this.hud.hide();
    const summary = document.querySelector("#summary");
    if (summary) {
      summary.textContent = `Demons felled  ${this.fallen}   ·   Wave  ${this.wave}`;
    }
    this.setOverlay("gameover", false);
    console.info("[DemonsMustFall] Player fell", { fallen: this.fallen, wave: this.wave });
  }

  private clearCombat(): void {
    this.player?.dispose(this.scene);
    this.player = null;
    for (const demon of this.demons) {
      demon.dispose(this.scene);
    }
    this.demons = [];
  }

  private setOverlay(id: "title" | "gameover", hidden: boolean): void {
    const el = document.querySelector(`#${id}`);
    if (el instanceof HTMLElement) {
      el.hidden = hidden;
    }
  }

  private resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / Math.max(height, 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }
}
