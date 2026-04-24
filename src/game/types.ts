export const BOARD_SIZE = 10;

export type Orientation = 'horizontal' | 'vertical';

export type BugTypeId =
  | 'context-window-collapse'
  | 'infinite-execution-loop'
  | 'cascading-hallucination'
  | 'agentic-regression'
  | 'stale-workspace-index';

export interface BugType {
  id: BugTypeId;
  /** Display name presented to the player. */
  name: string;
  /** Underlying classic Battleship analogue (used in educational copy). */
  classic: string;
  size: number;
  /** Educational description shown when the bug is resolved (sunk). */
  description: string;
}

export const BUG_TYPES: readonly BugType[] = [
  {
    id: 'context-window-collapse',
    name: 'Context Window Collapse',
    classic: 'Carrier',
    size: 5,
    description:
      'The most massive issue. This happens when an agent is fed too many files and "forgets" the original instructions, leading to a complete breakdown in logic across the project.',
  },
  {
    id: 'infinite-execution-loop',
    name: 'Infinite Execution Loop',
    classic: 'Battleship',
    size: 4,
    description:
      'A classic autonomous agent issue. This is when the agent gets stuck in the terminal, trying the same broken `npm run build` command over and over without trying a new strategy.',
  },
  {
    id: 'cascading-hallucination',
    name: 'Cascading Hallucination',
    classic: 'Cruiser',
    size: 3,
    description:
      "The AI assumes a specific library or API endpoint exists (when it doesn't) and confidently writes multiple components relying on that fake data.",
  },
  {
    id: 'agentic-regression',
    name: 'Agentic Regression',
    classic: 'Submarine',
    size: 3,
    description:
      'The "sneaky" bug. The agent successfully writes a new feature, but in doing so, silently deletes or breaks a previously working piece of code because it did not check the dependencies.',
  },
  {
    id: 'stale-workspace-index',
    name: 'Stale Workspace Index',
    classic: 'Destroyer',
    size: 2,
    description:
      'A quick, common error where the AI copilot gives bad advice simply because it has not registered your most recent file save.',
  },
] as const;

export interface Coord {
  row: number;
  col: number;
}

export interface BugPlacement {
  bugId: BugTypeId;
  /** Top-left origin cell of the placement. */
  origin: Coord;
  orientation: Orientation;
}

export type ShotResult = 'miss' | 'hit' | 'sunk';

export interface ShotRecord {
  coord: Coord;
  result: ShotResult;
  /** Bug that was hit/sunk, if any. */
  bugId?: BugTypeId;
}

export interface BoardState {
  placements: BugPlacement[];
  /** Coords that have been shot at, keyed as `r,c`. */
  shots: Record<string, ShotResult>;
  /** Bug ids that have been fully resolved. */
  resolvedBugs: BugTypeId[];
}

export type Phase = 'setup' | 'playing' | 'game_over';
export type Side = 'player' | 'ai';

export interface AITargetingMemory {
  /** Coords queued for follow-up after a hit. */
  queue: Coord[];
  /** Coords of hits on a bug currently being pursued (not yet sunk). */
  activeHits: Coord[];
}

export interface ActivityLogEntry {
  id: number;
  timestamp: number;
  side: Side;
  message: string;
  kind: 'shot' | 'sink' | 'phase' | 'system';
}

export interface PendingModal {
  id: number;
  bugId: BugTypeId;
  resolvedBy: Side;
}
