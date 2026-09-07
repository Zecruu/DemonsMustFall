# Demons Must Fall

A playable first scaffold for a **mobile tower-hero** game: one lane, a grid, heroes and towers you station beside the path, and hordes of demons that should not survive the walk.

This is a foundation, not a finished store build. The loop is small so later rooms, bosses, cosmetics, and StoreKit can land without a rewrite.

## Fantasy

You are holding the keep. Demons pour down a single lane. Place **heroes** (infinite scaling, distinct jobs) and **towers** (cheap lane tools) on the dark tiles beside the path. Campaign ends on a final host. Endless does not.

It should feel like a flood getting deleted — lots of small demons, a running “fallen” count, splash heroes that cook the pack.

## Stack

- **TypeScript** + **Three.js** (orthographic board, instanced horde)
- **Vite** for the web preview
- **Capacitor** (`com.zecruu.demonsmustfall`) for iOS / App Store

## Requirements

- Node.js 20 or newer
- For device / App Store builds: a Mac with Xcode and an Apple Developer account

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`). On a phone, use the Network URL on the same Wi-Fi.

```bash
npm run typecheck
npm run build
npm run preview
```

## How to play

1. Choose **Campaign** (8 waves, last is The Falling Host) or **Endless**
2. Tap a card, then tap a dark tile beside the lane
3. **Unleash wave** (or press Space)
4. Between waves, tap a stationed unit twice to upgrade
5. Heroes scale forever. Towers stop at level 5.

| Input | Action |
| --- | --- |
| Tap card, tap tile | Place hero or tower |
| Tap unit twice (build phase) | Upgrade |
| Unleash wave / Space | Start the next horde |
| 1–5 | Select cards |
| Shop | Bloodstones + hero unlock stub |

Kael shreds single targets. Nyx deletes clumps. Spike / Flame are the cheap towers. Seraph (slow aura) is locked behind Bloodstones.

## Monetization (stub)

The shop is wired as data, not as a live App Store purchase:

- Soft currency: gold from kills and wave clear
- Premium: Bloodstones (preview grant in this scaffold)
- IAP product ids live in `src/game/data/economy.ts`
- Seraph unlock costs Bloodstones

Next step on a Mac is a Capacitor Purchases / StoreKit plugin — do not ship the preview grant.

## iOS / App Store

```bash
npm install
npm run ios:sync
npm run ios:open
```

The `ios/` Xcode project is already in the repo. Signing, icons polish, and App Store Connect are still on you.

## Layout

```text
src/game/
  Game.ts                 Board, placement, waves
  data/catalog.ts         Heroes + towers
  data/economy.ts         IAP product stubs
  systems/scaling.ts      Infinite hero curve, wave size
  systems/waves.ts        Campaign final wave / endless
  map/                    One-lane grid
  entities/Horde.ts       Instanced demons
  entities/Structures.ts  Heroes and towers
  ui/                     HUD, build bar, shop
```

## Next (not in this PR)

- More lanes, elites, and a named boss host
- Real StoreKit, hero gacha/pity if you actually want it
- Art, audio, and a proper live-ops calendar
