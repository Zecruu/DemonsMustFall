import { HERO_UNLOCK_GEMS, TOWER_MAX_LEVEL } from "../data/constants";
import { UNITS, type UnitDef } from "../data/catalog";
import { IAP_PRODUCTS } from "../data/economy";
import { el, show } from "./dom";

export class Hud {
  selectedId: string | null = null;

  constructor(
    private readonly onSelect: (id: string) => void,
    private readonly onUnleash: () => void,
    private readonly onShop: () => void,
    private readonly onBuy: (productId: string) => void,
    private readonly onUnlock: (heroId: string) => void,
  ) {
    this.renderBuildBar(new Set(["slayer", "infernal"]));
    el<HTMLButtonElement>("unleash").addEventListener("click", () => this.onUnleash());
    el<HTMLButtonElement>("shop-open").addEventListener("click", () => this.onShop());
    el<HTMLButtonElement>("shop-close").addEventListener("click", () => show("shop", false));
  }

  renderBuildBar(unlocked: Set<string>): void {
    const bar = el("build-bar");
    bar.replaceChildren();
    for (const unit of UNITS) {
      const locked = Boolean(unit.locked && !unlocked.has(unit.id));
      const button = document.createElement("button");
      button.type = "button";
      button.className = `card${this.selectedId === unit.id ? " selected" : ""}${locked ? " locked" : ""}`;
      button.innerHTML = `<span class="kind">${unit.kind}</span><strong>${unit.name}</strong><em>${unit.role}</em><b>${unit.cost}g</b>`;
      button.addEventListener("click", () => {
        if (locked) {
          this.onUnlock(unit.id);
          return;
        }
        this.selectedId = this.selectedId === unit.id ? null : unit.id;
        this.renderBuildBar(unlocked);
        if (this.selectedId) {
          this.onSelect(this.selectedId);
        }
      });
      bar.append(button);
    }
  }

  refresh(stats: {
    gold: number;
    gems: number;
    lives: number;
    waveName: string;
    obliterated: number;
    hint: string;
  }): void {
    el("gold").textContent = `${stats.gold}g`;
    el("gems").textContent = `${stats.gems}◆`;
    el("lives").textContent = `${stats.lives}♥`;
    el("wave").textContent = stats.waveName;
    el("obliterated").textContent = `${stats.obliterated.toLocaleString()} fallen`;
    el("hint").textContent = stats.hint;
  }

  setCombat(active: boolean): void {
    el<HTMLButtonElement>("unleash").hidden = active;
    el("build-wrap").classList.toggle("dim", active);
  }

  renderShop(gems: number, unlocked: Set<string>): void {
    el("shop-gems").textContent = `${gems} Bloodstones`;
    const list = el("shop-list");
    list.replaceChildren();
    for (const product of IAP_PRODUCTS) {
      const row = document.createElement("div");
      row.className = "shop-row";
      const owned = product.unlockHero ? unlocked.has(product.unlockHero) : false;
      row.innerHTML = `<div><strong>${product.title}</strong><p>${product.blurb}</p></div>`;
      const button = document.createElement("button");
      button.type = "button";
      if (owned) {
        button.textContent = "Owned";
        button.disabled = true;
      } else if (product.unlockHero) {
        button.textContent = `${HERO_UNLOCK_GEMS}◆`;
        button.addEventListener("click", () => this.onUnlock(product.unlockHero ?? ""));
      } else {
        button.textContent = "Preview grant";
        button.addEventListener("click", () => this.onBuy(product.id));
      }
      row.append(button);
      list.append(row);
    }
  }

  selectedDef(unlocked: Set<string>): UnitDef | null {
    if (!this.selectedId) {
      return null;
    }
    const unit = UNITS.find((item) => item.id === this.selectedId);
    if (!unit || (unit.locked && !unlocked.has(unit.id))) {
      return null;
    }
    return unit;
  }

  describeUpgrade(kind: string, level: number, cost: number): string {
    if (kind === "tower" && level >= TOWER_MAX_LEVEL) {
      return "Tower is maxed. Heroes scale forever.";
    }
    return `Tap again to upgrade to Lv${level + 1} for ${cost}g`;
  }
}
