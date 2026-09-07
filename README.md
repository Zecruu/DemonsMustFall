# Demons Must Fall

A playable first scaffold for an indie arena combat game: you are the slayer, the demons chase, and they fall when struck.

This is a foundation, not a finished game. The loop is small on purpose so later systems (bosses, loot, rooms, audio, desktop packaging) can land without a rewrite.

## Stack

- **TypeScript**
- **Phaser 4** for scenes, input, arcade physics, and rendering
- **Vite** for the web build

The same web build can later be wrapped for desktop (Tauri or Electron) without changing the game code.

## Requirements

- Node.js 20 or newer
- npm 10 or newer

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`). The title screen should appear immediately.

Other commands:

```bash
npm run typecheck   # TypeScript only
npm run build       # production bundle in dist/
npm run preview     # serve the production bundle
```

## Controls

| Input | Action |
| --- | --- |
| WASD or arrow keys | Move |
| Space or click | Strike |
| Enter | Start from the title |
| R or click | Restart after you fall |

Strike demons until their health is gone. They rotate and drop when they die. Clear a wave and the next one is larger. Touching a living demon costs a heart.

## Layout

```text
src/
  main.ts                 Game bootstrap
  game/
    config.ts             Phaser game config
    data/constants.ts     Tunable combat and arena numbers
    systems/combat.ts     Phaser-light combat helpers
    entities/             Player and demon behavior
    scenes/               Boot, title, combat, game over
    ui/Hud.ts             Hearts, fallen count, wave
```

Procedural textures are baked in `BootScene` so the first version has no binary art assets.

## Next (not in this PR)

- Real sprite sheets, VFX, and audio
- Rooms, elite demons, and a boss that must fall
- Persistence and a desktop wrapper
