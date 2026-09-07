import * as THREE from "three";
import { UNITS } from "./data/catalog";
import { HERO_UNLOCK_GEMS, STARTING_GEMS, STARTING_GOLD, STARTING_LIVES } from "./data/constants";
import { IAP_PRODUCTS } from "./data/economy";
import { Horde } from "./entities/Horde";
import { Structures, type Structure } from "./entities/Structures";
import { Board } from "./map/Board";
import { isBuildable } from "./map/layout";
import { inBounds, worldToCell } from "./map/world";
import { impact } from "./native";
import { campaignComplete, makeWave, type WaveSpec } from "./systems/waves";
import { el, show } from "./ui/dom";
import { Hud } from "./ui/Hud";

type Phase = "title" | "build" | "combat" | "end";

export class Game {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-8, 8, 8, -8, 0.1, 80);
  private readonly timer = new THREE.Timer();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private readonly hit = new THREE.Vector3();

  private readonly board: Board;
  private readonly horde: Horde;
  private readonly structures: Structures;
  private readonly hud: Hud;

  private phase: Phase = "title";
  private endless = false;
  private gold = STARTING_GOLD;
  private gems = STARTING_GEMS;
  private lives = STARTING_LIVES;
  private obliterated = 0;
  private wave = 1;
  private spec: WaveSpec = makeWave(1, false);
  private spawned = 0;
  private spawnAcc = 0;
  private unlocked = new Set(["slayer", "infernal"]);
  private picked: Structure | null = null;
  private hint = "Place heroes on the dark tiles beside the lane.";

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.scene.background = new THREE.Color(0x07060a);
    this.scene.fog = new THREE.FogExp2(0x07060a, 0.035);
    this.scene.add(new THREE.HemisphereLight(0xffe6c8, 0x1a0a10, 0.9));
    const sun = new THREE.DirectionalLight(0xffd8a8, 1.35);
    sun.position.set(6, 14, 4);
    sun.castShadow = true;
    this.scene.add(sun);

    this.board = new Board(this.scene);
    this.horde = new Horde(this.scene);
    this.structures = new Structures(this.scene);
    this.hud = new Hud(
      () => {
        this.picked = null;
        this.hint = "Tap a lane-side tile to station that unit.";
        this.syncHud();
      },
      () => this.unleash(),
      () => this.openShop(),
      (productId) => this.previewGrant(productId),
      (heroId) => this.unlockHero(heroId),
    );

    this.bindUi();
    this.resize();
    window.addEventListener("resize", () => this.resize());
    canvas.addEventListener("pointerdown", (event) => this.onPointer(event));
    window.addEventListener("keydown", (event) => this.onKey(event));

    this.timer.connect(document);
    this.renderer.setAnimationLoop((time) => this.tick(time));
    console.info("[DemonsMustFall] Tower-hero scaffold ready", {
      units: UNITS.map((unit) => unit.id),
      maxDemons: this.horde.demons.length,
    });
  }

  private bindUi(): void {
    el<HTMLButtonElement>("mode-campaign").addEventListener("click", () => this.startRun(false));
    el<HTMLButtonElement>("mode-endless").addEventListener("click", () => this.startRun(true));
    el<HTMLButtonElement>("again").addEventListener("click", () => {
      show("end", false);
      show("title", true);
      this.phase = "title";
    });
  }

  private startRun(endless: boolean): void {
    this.endless = endless;
    this.gold = STARTING_GOLD;
    this.lives = STARTING_LIVES;
    this.obliterated = 0;
    this.wave = 1;
    this.spec = makeWave(1, endless);
    this.spawned = 0;
    this.spawnAcc = 0;
    this.picked = null;
    this.hud.selectedId = null;
    this.structures.clear();
    this.horde.reset();
    this.hud.renderBuildBar(this.unlocked);
    this.phase = "build";
    this.hint = endless
      ? "Endless: waves never stop. Scale your heroes without a cap."
      : "Campaign: 8 waves. The last is The Falling Host.";
    show("title", false);
    show("end", false);
    show("play", true);
    this.hud.setCombat(false);
    this.syncHud();
    console.info("[DemonsMustFall] Run started", { endless });
  }

  private unleash(): void {
    if (this.phase !== "build") {
      return;
    }
    if (this.structures.items.length === 0) {
      this.hint = "Station at least one hero or tower first.";
      this.syncHud();
      return;
    }
    this.phase = "combat";
    this.spawned = 0;
    this.spawnAcc = 0;
    this.hud.setCombat(true);
    this.hint = this.spec.final ? "FINAL WAVE — bury them." : `${this.spec.count} demons inbound.`;
    this.syncHud();
    void impact("medium");
    console.info("[DemonsMustFall] Wave unleashed", this.spec);
  }

  private tick(time?: number): void {
    this.timer.update(time);
    const dt = Math.min(this.timer.getDelta(), 0.05);

    if (this.phase === "combat") {
      this.spawnAcc += dt;
      while (this.spawned < this.spec.count && this.spawnAcc >= this.spec.interval) {
        this.spawnAcc -= this.spec.interval;
        if (this.horde.spawn(this.spec.hp, this.board.path)) {
          this.spawned += 1;
        } else {
          break;
        }
      }

      this.horde.update(
        dt,
        this.board.path,
        this.spec.speed,
        () => this.leak(),
        (gold) => this.onKill(gold),
        this.wave,
      );
      this.structures.fire(
        dt,
        this.horde,
        (kills) => {
          if (kills >= 3) {
            void impact("light");
          }
        },
        (gold) => this.onKill(gold),
        this.wave,
      );

      if (this.lives <= 0) {
        this.finish(false);
      } else if (this.spawned >= this.spec.count && this.horde.living() === 0 && !this.horde.demons.some((d) => d.falling)) {
        this.waveCleared();
      }
    } else if (this.phase === "title") {
      this.camera.position.set(Math.sin(this.timer.getElapsed() * 0.12) * 2, 16, 11);
      this.camera.lookAt(0, 0, -0.6);
    }

    if (this.phase !== "title") {
      this.camera.position.set(0, 16.5, 11.2);
      this.camera.lookAt(0, 0, -0.55);
    }
    this.renderer.render(this.scene, this.camera);
  }

  private onKill(gold: number): void {
    this.obliterated += 1;
    this.gold += gold;
    this.syncHud();
  }

  private leak(): void {
    this.lives -= 1;
    this.hint = `A demon reached the keep. ${Math.max(0, this.lives)} hearts left.`;
    this.syncHud();
    void impact("heavy");
  }

  private waveCleared(): void {
    this.wave += 1;
    if (campaignComplete(this.wave, this.endless)) {
      this.finish(true);
      return;
    }
    this.spec = makeWave(this.wave, this.endless);
    this.phase = "build";
    this.hud.setCombat(false);
    this.gold += 25 + this.wave * 4;
    this.hint = `${this.spec.name} is next. Upgrade heroes — they scale forever.`;
    this.syncHud();
    console.info("[DemonsMustFall] Wave cleared", { next: this.spec });
  }

  private finish(won: boolean): void {
    this.phase = "end";
    show("play", false);
    show("end", true);
    el("end-title").textContent = won ? "The host has fallen" : "The keep has fallen";
    el("end-body").textContent = `${this.obliterated.toLocaleString()} demons obliterated · Wave ${this.spec.wave}`;
    console.info("[DemonsMustFall] Run over", { won, obliterated: this.obliterated, wave: this.spec.wave });
  }

  private onPointer(event: PointerEvent): void {
    if (this.phase !== "build" && this.phase !== "combat") {
      return;
    }
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    if (!this.raycaster.ray.intersectPlane(this.plane, this.hit)) {
      return;
    }
    const cell = worldToCell(this.hit.x, this.hit.z);
    if (!inBounds(cell.col, cell.row)) {
      return;
    }

    const existing = this.structures.at(cell.col, cell.row);
    if (existing) {
      this.tryUpgrade(existing);
      return;
    }

    if (this.phase !== "build") {
      return;
    }
    const def = this.hud.selectedDef(this.unlocked);
    if (!def) {
      this.hint = "Pick a hero or tower, then tap a dark tile.";
      this.syncHud();
      return;
    }
    if (!isBuildable(cell.col, cell.row) || this.structures.occupy(cell.col, cell.row)) {
      this.hint = "Only the tiles beside the lane can hold a unit.";
      this.syncHud();
      return;
    }
    if (this.gold < def.cost) {
      this.hint = `Need ${def.cost}g for ${def.name}.`;
      this.syncHud();
      return;
    }
    this.gold -= def.cost;
    this.structures.place(def, cell.col, cell.row);
    this.hint = `${def.name} stationed. Tap them between waves to scale.`;
    this.syncHud();
    void impact("light");
  }

  private tryUpgrade(structure: Structure): void {
    if (this.phase !== "build") {
      this.hint = "Upgrade between waves.";
      this.syncHud();
      return;
    }
    const cost = this.structures.upgradeCostOf(structure);
    if (this.picked?.id !== structure.id) {
      this.picked = structure;
      this.hint = this.hud.describeUpgrade(structure.def.kind, structure.level, cost);
      this.syncHud();
      return;
    }
    if (this.gold < cost || !this.structures.tryUpgrade(structure)) {
      this.hint =
        structure.def.kind === "tower"
          ? "Towers cap at level 5. Put gold into heroes."
          : `Need ${cost}g to scale ${structure.def.name}.`;
      this.syncHud();
      return;
    }
    this.gold -= cost;
    this.hint = `${structure.def.name} is Lv${structure.level}. Infinite scaling is online.`;
    this.syncHud();
    void impact("medium");
  }

  private openShop(): void {
    this.hud.renderShop(this.gems, this.unlocked);
    show("shop", true);
  }

  private previewGrant(productId: string): void {
    const product = IAP_PRODUCTS.find((item) => item.id === productId);
    if (!product) {
      return;
    }
    this.gems += product.gems;
    this.hint = `Preview grant: +${product.gems} Bloodstones. Wire StoreKit next.`;
    this.hud.renderShop(this.gems, this.unlocked);
    this.syncHud();
    console.info("[DemonsMustFall] IAP preview grant", product);
  }

  private unlockHero(heroId: string): void {
    if (this.unlocked.has(heroId)) {
      return;
    }
    if (this.gems < HERO_UNLOCK_GEMS) {
      this.hint = `Seraph costs ${HERO_UNLOCK_GEMS} Bloodstones. Open the shop.`;
      this.openShop();
      this.syncHud();
      return;
    }
    this.gems -= HERO_UNLOCK_GEMS;
    this.unlocked.add(heroId);
    this.hud.renderBuildBar(this.unlocked);
    this.hud.renderShop(this.gems, this.unlocked);
    this.hint = "Seraph unlocked — slow the horde so the lane cooks.";
    this.syncHud();
    console.info("[DemonsMustFall] Hero unlocked", { heroId, gems: this.gems });
  }

  private onKey(event: KeyboardEvent): void {
    if (event.code === "Space" && this.phase === "build") {
      event.preventDefault();
      this.unleash();
    }
    const index = ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5"].indexOf(event.code);
    if (index >= 0) {
      const unit = UNITS[index];
      if (unit) {
        this.hud.selectedId = unit.id;
        this.hud.renderBuildBar(this.unlocked);
      }
    }
  }

  private syncHud(): void {
    this.hud.refresh({
      gold: this.gold,
      gems: this.gems,
      lives: Math.max(0, this.lives),
      waveName: this.spec.name,
      obliterated: this.obliterated,
      hint: this.hint,
    });
  }

  private resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / Math.max(height, 1);
    const halfH = 7.2;
    const halfW = halfH * aspect;
    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.position.set(0, 16.5, 11.2);
    this.camera.lookAt(0, 0, -0.55);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }
}
