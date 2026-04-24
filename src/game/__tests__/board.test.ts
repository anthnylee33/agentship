import { describe, expect, it } from 'vitest';
import {
  BOARD_SIZE,
  BUG_TYPES,
  allBugsResolved,
  autoPlaceAll,
  cellsForPlacement,
  coordKey,
  emptyBoard,
  isValidPlacement,
  resolveShot,
  shouldContinueTurn,
  type BugPlacement,
} from '..';
import { createRNG } from '../rng';

describe('placement validation', () => {
  it('accepts valid in-bounds horizontal placements', () => {
    const p: BugPlacement = {
      bugId: 'stale-workspace-index',
      origin: { row: 0, col: 0 },
      orientation: 'horizontal',
    };
    expect(isValidPlacement(p, [])).toBe(true);
  });

  it('rejects placements that run off the right edge', () => {
    const p: BugPlacement = {
      bugId: 'context-window-collapse', // size 5
      origin: { row: 0, col: 6 }, // 6,7,8,9,10 — out of bounds
      orientation: 'horizontal',
    };
    expect(isValidPlacement(p, [])).toBe(false);
  });

  it('rejects placements that run off the bottom edge', () => {
    const p: BugPlacement = {
      bugId: 'infinite-execution-loop', // size 4
      origin: { row: 7, col: 0 }, // rows 7,8,9,10
      orientation: 'vertical',
    };
    expect(isValidPlacement(p, [])).toBe(false);
  });

  it('rejects overlapping placements', () => {
    const a: BugPlacement = {
      bugId: 'cascading-hallucination',
      origin: { row: 1, col: 1 },
      orientation: 'horizontal',
    };
    const b: BugPlacement = {
      bugId: 'stale-workspace-index',
      origin: { row: 1, col: 2 }, // overlaps with a
      orientation: 'horizontal',
    };
    expect(isValidPlacement(a, [])).toBe(true);
    expect(isValidPlacement(b, [a])).toBe(false);
  });

  it('allows non-overlapping placements adjacent to existing bugs', () => {
    const a: BugPlacement = {
      bugId: 'cascading-hallucination',
      origin: { row: 1, col: 1 },
      orientation: 'horizontal',
    };
    const b: BugPlacement = {
      bugId: 'stale-workspace-index',
      origin: { row: 2, col: 1 },
      orientation: 'horizontal',
    };
    expect(isValidPlacement(b, [a])).toBe(true);
  });
});

describe('autoPlaceAll', () => {
  it('places every bug type with no overlaps and within bounds', () => {
    const rng = createRNG(12345);
    const placements = autoPlaceAll(rng);
    expect(placements).toHaveLength(BUG_TYPES.length);

    const occupied = new Set<string>();
    for (const p of placements) {
      for (const c of cellsForPlacement(p)) {
        expect(c.row).toBeGreaterThanOrEqual(0);
        expect(c.row).toBeLessThan(BOARD_SIZE);
        expect(c.col).toBeGreaterThanOrEqual(0);
        expect(c.col).toBeLessThan(BOARD_SIZE);
        expect(occupied.has(coordKey(c))).toBe(false);
        occupied.add(coordKey(c));
      }
    }

    const totalSize = BUG_TYPES.reduce((s, b) => s + b.size, 0);
    expect(occupied.size).toBe(totalSize);
  });

  it('is deterministic for a given seed', () => {
    const a = autoPlaceAll(createRNG(99));
    const b = autoPlaceAll(createRNG(99));
    expect(a).toEqual(b);
  });

  it('produces different layouts for different seeds', () => {
    const a = autoPlaceAll(createRNG(1));
    const b = autoPlaceAll(createRNG(2));
    expect(a).not.toEqual(b);
  });
});

describe('shot resolution', () => {
  const board = (() => {
    const b = emptyBoard();
    b.placements = [
      {
        bugId: 'stale-workspace-index', // size 2 at (0,0)-(0,1)
        origin: { row: 0, col: 0 },
        orientation: 'horizontal',
      },
      {
        bugId: 'cascading-hallucination', // size 3 at (5,5)-(5,7)
        origin: { row: 5, col: 5 },
        orientation: 'horizontal',
      },
    ];
    return b;
  })();

  it('detects misses', () => {
    const r = resolveShot(board, { row: 9, col: 9 });
    expect(r.result).toBe('miss');
    expect(r.bugId).toBeUndefined();
    expect(r.board.shots[coordKey({ row: 9, col: 9 })]).toBe('miss');
  });

  it('detects hits without sinking', () => {
    const r = resolveShot(board, { row: 5, col: 5 });
    expect(r.result).toBe('hit');
    expect(r.bugId).toBe('cascading-hallucination');
    expect(r.board.shots[coordKey({ row: 5, col: 5 })]).toBe('hit');
  });

  it('detects sinks when the final segment is hit', () => {
    let b = board;
    b = resolveShot(b, { row: 0, col: 0 }).board;
    const final = resolveShot(b, { row: 0, col: 1 });
    expect(final.result).toBe('sunk');
    expect(final.bugId).toBe('stale-workspace-index');
    expect(final.board.shots[coordKey({ row: 0, col: 0 })]).toBe('sunk');
    expect(final.board.shots[coordKey({ row: 0, col: 1 })]).toBe('sunk');
    expect(final.board.resolvedBugs).toContain('stale-workspace-index');
  });

  it('does not double-count when shooting an already-shot cell', () => {
    let b = board;
    b = resolveShot(b, { row: 5, col: 5 }).board;
    const repeat = resolveShot(b, { row: 5, col: 5 });
    expect(repeat.board).toBe(b);
  });
});

describe('turn continuation', () => {
  it('continues the turn on a hit', () => {
    expect(shouldContinueTurn('hit')).toBe(true);
  });
  it('continues the turn on a sink', () => {
    expect(shouldContinueTurn('sunk')).toBe(true);
  });
  it('ends the turn on a miss', () => {
    expect(shouldContinueTurn('miss')).toBe(false);
  });
});

describe('allBugsResolved', () => {
  it('returns true after every placement is sunk', () => {
    const b = emptyBoard();
    b.placements = [
      {
        bugId: 'stale-workspace-index',
        origin: { row: 0, col: 0 },
        orientation: 'horizontal',
      },
    ];
    let s = b;
    s = resolveShot(s, { row: 0, col: 0 }).board;
    expect(allBugsResolved(s)).toBe(false);
    s = resolveShot(s, { row: 0, col: 1 }).board;
    expect(allBugsResolved(s)).toBe(true);
  });
});
