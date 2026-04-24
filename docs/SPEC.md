# Project Name: AgentShip — The Agentic Refactor

## Objective

Build a single-player Battleship-style game against an AI opponent, reskinned
as an enterprise SaaS dashboard where the player uses autonomous agents to
clear technical debt.

## Technical Stack

* Framework: React (functional components + Hooks)
* Language: TypeScript
* Build Tool: Vite
* Styling: Tailwind CSS
* State Management: React Context (single top-level provider) + native React
  state/hooks (no Redux)
* Unit Tests: Vitest (logic-only tests for core game rules)
* Deployment Target: Vercel

## Core Game Overview

This is a **two-board** Battleship game:

* **Player Board (Defense):** Shows the player's bug placements. The AI attacks
  this board.
* **AI Board (Offense Target):** The player attacks this board. AI bug
  placements are hidden until hit/resolved.

The theme is "clearing technical debt".

## Game Rules (Classic Battleship)

* Board size: 10x10
* Placement: horizontal or vertical only
* No overlapping placements
* Turns: **player starts**
* **Classic turn rule:** a **hit grants an additional shot**; a **miss ends
  the turn**.
* Game ends immediately when all bug segments on a side are resolved.

### Shot Outcomes (Terminology)

* "Code Clean" = miss
* "Bug Identified" = hit
* "Bug Resolved" = sunk

## Bug Types (Battleship Mappings)

* **Carrier (Size 5) — "Context Window Collapse"**: The most massive issue.
  This happens when an agent is fed too many files and "forgets" the original
  instructions, leading to a complete breakdown in logic across the project.
* **Battleship (Size 4) — "Infinite Execution Loop"**: A classic autonomous
  agent issue. This is when the agent gets stuck in the terminal, trying the
  same broken `npm run build` command over and over without trying a new
  strategy.
* **Cruiser (Size 3) — "Cascading Hallucination"**: The AI assumes a specific
  library or API endpoint exists (when it doesn't) and confidently writes
  multiple components relying on that fake data.
* **Submarine (Size 3) — "Agentic Regression"**: The "sneaky" bug. The agent
  successfully writes a new feature, but in doing so, silently deletes or
  breaks a previously working piece of code because it did not check the
  dependencies.
* **Destroyer (Size 2) — "Stale Workspace Index"**: A quick, common error
  where the AI copilot gives bad advice simply because it has not registered
  your most recent file save.

## Setup Phase (Placement)

The game has phases: `setup` -> `playing` -> `game_over`.

During `setup`:

* The player must place all 5 bugs on the **Player Board** before starting.
* Provide:
  * an **Auto-place** button
  * a **Reset placements** button
* Manual placement UX:
  * selecting a bug type to place
  * placing by clicking a starting cell
  * rotate orientation via an on-screen toggle (Horizontal/Vertical)
* Validation:
  * placements must be in-bounds
  * no overlaps

AI bug placements:

* The AI board is auto-placed at the start of the game.

## AI Opponent Requirements

The AI represents legacy code fighting back.

Behavior:

* The AI chooses shots on the **Player Board**.
* Once it registers a "Bug Identified" (hit), it must prioritize adjacent cells
  until that bug is fully resolved (sunk).
* AI continues shooting while it keeps hitting (classic rules).

Determinism (for tests):

* All randomness must be seedable.
* Unit tests must run with a fixed seed to produce deterministic placements
  and AI decisions.

## UI/UX Design Specifications (Modern SaaS Dashboard)

### Theme

* Dark mode only.
* Deep slate palette (e.g., `bg-slate-900` for background, `bg-slate-800` for
  cards/panels).
* Typography: Inter (preferred). If Inter is used, include it as part of the
  app setup.

### Layout

* Dashboard UI.
* Two-grid layout:
  * Desktop: Player Board and AI Board displayed side-by-side.
  * Mobile: boards stacked vertically.
* Include an **Activity Log** sidebar (or below on mobile) tracking both
  player and AI actions.
* Center the boards inside cards with subtle drop shadow and rounded corners
  (`rounded-xl`).

### The Grids (System Architecture Maps)

* Each grid is 100 cells representing microservices.
* Unscanned cells are `bg-slate-700`.
* Hover states pulse (use Tailwind's `animate-pulse` or equivalent).

Interaction rules:

* During `playing`:
  * Player may click **only** on the AI Board.
  * Player Board is not clickable.
* During AI turn:
  * all player input is disabled.

### Visual Indicators

* "Code Clean" (Miss): cell turns soft, glowing neon blue.
* "Bug Identified" (Hit): cell turns vibrant amber or red.
* "Bug Resolved" (Sunk): apply a distinct, stronger styling than a normal hit
  (so it's clearly different).

## Educational Modals (Blocking)

When a full bug is resolved (sunk), show a blurred-background educational modal
explaining the bug type.

Requirements:

* The modal is **blocking**: it prevents the next shot.
  * If the player sunk a bug, the player may not take the next shot until the
    modal is dismissed.
  * If the AI sunk a bug, the AI may not take the next shot until the modal
    is dismissed.
* If multiple bugs are resolved during a hit streak, modals must be **queued**
  and shown **one at a time** in order of resolution.
* The Activity Log should record the sink event immediately when it happens.

## State Management & Architecture Requirements

* Keep game rules as **pure logic functions** (no React dependency) so they
  are easily unit tested.
* UI consumes game state via a **single top-level React Context provider**.
* Avoid adding additional state libraries.

Minimum state domains to represent:

* Boards (player + AI): placements, shots taken, resolved bugs
* Turn/phase: `setup | playing | game_over`, `currentTurn`
* AI targeting memory (adjacent targeting after a hit)
* Activity log
* Modal queue and current modal

## Vite / Tailwind Setup Requirements

* Use a standard Vite + React + TypeScript project layout.
* Tailwind CSS configured for the Vite project.
* Dark theme styles should be the default (no theme toggle).

## Testing Requirements

Provide basic unit tests demonstrating enterprise standards.

Scope:

* Test core game logic only (pure functions), including:
  * valid placement generation and overlap rules
  * hit/miss detection
  * sink detection
  * classic turn continuation rules (hit = extra shot)
  * AI adjacent-targeting behavior after a hit
* Tests must be deterministic (seeded randomness).

## Output Requirements

1. Scaffold the Vite app.
2. Build the logic and UI.
3. Ensure there are basic unit tests for the core grid logic.
4. Prepare the app for a Vercel deployment.

---

## Changelog

* Renamed project from `Bug Bash` to `AgentShip`.
* Removed the previous restriction prohibiting the words "Ship", "Water", and
  "Missile" in the UI. The theme remains "clearing technical debt"; UI copy
  continues to favor enterprise/SaaS terminology, but the lexical restriction
  is no longer enforced.
* Replaced the bug catalogue with agent-themed failure modes: Context Window
  Collapse (Carrier, 5), Infinite Execution Loop (Battleship, 4), Cascading
  Hallucination (Cruiser, 3), Agentic Regression (Submarine, 3), Stale
  Workspace Index (Destroyer, 2). The educational modal copy was updated to
  match.
