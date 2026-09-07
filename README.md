# Demons Must Fall

A playable first scaffold for a **mobile App Store** action game: you hunt demons in a 3D arena and they fall when struck.

This is a foundation, not a finished commercial build. The loop is small so later systems (bosses, rooms, art, audio, Game Center) can land without a rewrite.

## Stack

- **TypeScript** + **Three.js** for the 3D combat scene
- **Vite** for the web build
- **Capacitor** to wrap that same build as a native iOS app for TestFlight / App Store

Preview in a browser (desktop or phone). Ship to the App Store from Xcode on a Mac.

## Requirements

- Node.js 20 or newer
- For App Store / device builds: a Mac with Xcode and an Apple Developer account

## Run (web preview)

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`). On a phone, use the Network URL on the same Wi-Fi.

Other commands:

```bash
npm run typecheck
npm run build
npm run preview
```

## Controls

| Input | Action |
| --- | --- |
| Left virtual stick | Move |
| STRIKE button | Attack |
| WASD or arrows | Move (desktop) |
| Space | Attack (desktop) |
| Begin the hunt / Enter | Start |
| Rise again / R | Restart after you fall |

Demons chase you. A strike that depletes their health makes them fall. Clear a wave and a larger one arrives. Touching a living demon costs a heart.

## iOS / App Store

The game is a web scene packaged with Capacitor (`com.zecruu.demonsmustfall`). The `ios/` Xcode project is already in the repo. Archive and upload still happen in Xcode on a Mac.

```bash
npm install
npm run ios:sync
npm run ios:open
```

In Xcode:

1. Select the **App** target and your Team for signing
2. Confirm the bundle id `com.zecruu.demonsmustfall`
3. Add App Store icons, launch screen, and privacy strings as you flesh the game out
4. Run on a device or Simulator
5. Product → Archive → Distribute App when you are ready for TestFlight / App Store Connect

Haptics and the status bar are wired through Capacitor plugins and no-op in the browser.

## Layout

```text
src/
  main.ts                 Bootstrap + native shell
  game/
    Game.ts               Scene, camera, combat loop
    meshes.ts             Procedural slayer / demon / arena
    native.ts             Capacitor status bar + haptics
    data/constants.ts     Tunable combat numbers
    systems/combat.ts     Engine-light combat helpers
    systems/input.ts      Stick, strike button, keyboard
    entities/             Player and demon behavior
    ui/Hud.ts             Hearts, fallen count, wave
capacitor.config.ts       iOS wrapper config
```

Placeholder meshes are built in code so the first version has no binary art pack.

## Next (not in this PR)

- Real characters, VFX, and audio
- App icons, splash, and store listing assets
- Rooms, elites, and a boss that must fall
- Game Center / IAP only if you actually need them
