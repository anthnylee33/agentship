# AgentShip

A single-player Battleship-style game, reskinned as an educational tool where
the player uses autonomous agents to clear technical debt.

* Two 10×10 architecture maps (player vs. AI).
* Classic Battleship rules: hit grants an extra shot, miss ends the turn.
* AI opponent with adjacent-targeting memory once a hit lands.
* All randomness is seedable so games and tests are deterministic.

## Tech stack

* **Vite + React + TypeScript** (functional components + hooks)
* **Tailwind CSS** for styling (dark slate theme, Inter)
* **React Context** for global game state — no Redux, no other state libs
* **Vitest** for pure-logic unit tests
* Deploys cleanly to **Vercel**

## Getting started

```bash
npm install
npm run dev      # local dev server
npm run build    # production build (tsc -b && vite build)
npm run test     # vitest run (logic-only, deterministic)
npm run lint
```

## Project layout

```
src/
  game/                 Pure game logic (zero React).
    types.ts            Domain types and bug catalogue.
    rng.ts              Seedable mulberry32 RNG.
    board.ts            Placement validation, shot resolution, sink detection.
    ai.ts               AI targeting memory + shot selection.
    __tests__/          Vitest unit tests (deterministic via seed).
  context/
    GameContext.tsx     Single top-level Context provider; reducer + hooks.
  components/
    Board.tsx           10×10 grid with hover preview and shot overlays.
    SetupPanel.tsx      Manual placement + auto-place + reset + start.
    ActivityLog.tsx     Live feed of player and AI actions.
    EducationalModal.tsx  Blocking modal queue when bugs are resolved.
    Header.tsx          Status pill, seed control, new-incident button.
  App.tsx               Dashboard layout (two boards + sidebar).
  main.tsx              Entry point.
```

## Game rules

* `setup` → `playing` → `game_over`.
* Player must place all 5 bug types before starting.
* Manual placement: select a bug, choose orientation, click a starting cell.
  Auto-place and Reset placements are always available.
* AI bugs are auto-placed when the game starts.
* Player starts. A **hit** keeps the turn, a **miss** passes turn.
* When a bug is **resolved** (sunk), an educational modal blocks the next shot
  for the side that resolved it. Multiple sinks in a streak queue up.

### Bug catalogue

| Bug | Classic | Size |
|---|---|---|
| Context Window Collapse | Carrier | 5 |
| Infinite Execution Loop | Battleship | 4 |
| Cascading Hallucination | Cruiser | 3 |
| Agentic Regression | Submarine | 3 |
| Stale Workspace Index | Destroyer | 2 |

Shot terminology: **Code Clean** (miss), **Bug Identified** (hit), **Bug Resolved** (sunk).

## Determinism

Every random decision flows through a seedable mulberry32 RNG (`src/game/rng.ts`).
Unit tests pin the seed, so placements and AI behavior are reproducible.

## Deploying to Vercel

The repo includes `vercel.json` with the framework set to Vite. Import the repo
in Vercel and the defaults will Just Work — `npm run build` produces `dist/`.
