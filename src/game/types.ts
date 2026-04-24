export const BOARD_SIZE = 10;

export type Orientation = 'horizontal' | 'vertical';

export type BugTypeId =
  | 'systemic-architecture-flaw'
  | 'memory-leak'
  | 'race-condition'
  | 'infinite-loop'
  | 'syntax-error';

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
    id: 'systemic-architecture-flaw',
    name: 'Systemic Architecture Flaw',
    classic: 'Carrier',
    size: 5,
    description:
      'Systemic Architecture Flaws span large portions of a system and emerge when foundational design decisions no longer match the product. They are the most expensive class of technical debt to remediate because they require coordinated, cross-cutting refactors.',
  },
  {
    id: 'memory-leak',
    name: 'Memory Leak',
    classic: 'Battleship',
    size: 4,
    description:
      'Memory Leaks occur when allocated resources are never released, causing gradual degradation and eventual failure. They are notoriously hard to diagnose because their symptoms appear far from the leak site.',
  },
  {
    id: 'race-condition',
    name: 'Race Condition',
    classic: 'Cruiser',
    size: 3,
    description:
      "Race Conditions arise when concurrent operations interleave in unexpected orders. They are difficult to reproduce and often hide behind 'works on my machine' until production load exposes them.",
  },
  {
    id: 'infinite-loop',
    name: 'Infinite Loop',
    classic: 'Submarine',
    size: 3,
    description:
      'Infinite Loops trap a thread or process in a state it cannot escape. They consume CPU, block downstream work, and frequently stem from a missing termination condition or an incorrect loop invariant.',
  },
  {
    id: 'syntax-error',
    name: 'Syntax Error',
    classic: 'Destroyer',
    size: 2,
    description:
      'Syntax Errors are the smallest class of bug — surface-level mistakes that prevent code from being parsed or compiled. They are usually quick to fix once located.',
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
