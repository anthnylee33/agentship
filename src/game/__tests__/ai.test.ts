import { describe, expect, it } from 'vitest';
import {
  emptyAIMemory,
  emptyBoard,
  pickAIShot,
  resolveShot,
  updateAIMemory,
  type BoardState,
  type Coord,
} from '..';
import { createRNG } from '../rng';

function makeBoardWithBug(): BoardState {
  const b = emptyBoard();
  b.placements = [
    {
      bugId: 'cascading-hallucination', // size 3, at (4,4)-(4,6)
      origin: { row: 4, col: 4 },
      orientation: 'horizontal',
    },
  ];
  return b;
}

describe('AI targeting', () => {
  it('is deterministic for a given seed', () => {
    const board = makeBoardWithBug();
    const a = pickAIShot(board, emptyAIMemory(), createRNG(7));
    const b = pickAIShot(board, emptyAIMemory(), createRNG(7));
    expect(a).toEqual(b);
  });

  it('queues orthogonal neighbors after a hit and prioritizes them on the next shot', () => {
    let board = makeBoardWithBug();
    let memory = emptyAIMemory();
    const hitAt: Coord = { row: 4, col: 5 };

    const r = resolveShot(board, hitAt);
    expect(r.result).toBe('hit');
    board = r.board;
    memory = updateAIMemory(memory, hitAt, r.result, board);

    expect(memory.queue.length).toBeGreaterThan(0);
    for (const c of memory.queue) {
      const dr = Math.abs(c.row - hitAt.row);
      const dc = Math.abs(c.col - hitAt.col);
      expect(dr + dc).toBe(1);
    }

    // Next shot should come from the queue, not random space.
    const next = pickAIShot(board, memory, createRNG(123));
    const inQueue = memory.queue.some(
      (q) => q.row === next.row && q.col === next.col,
    );
    expect(inQueue).toBe(true);
  });

  it('prunes targets to the active axis after two in-line hits', () => {
    let board = makeBoardWithBug();
    let memory = emptyAIMemory();

    const first: Coord = { row: 4, col: 4 };
    let r = resolveShot(board, first);
    board = r.board;
    memory = updateAIMemory(memory, first, r.result, board);

    const second: Coord = { row: 4, col: 5 };
    r = resolveShot(board, second);
    board = r.board;
    memory = updateAIMemory(memory, second, r.result, board);

    // Every queued cell must now share the row of the active hits.
    expect(memory.queue.length).toBeGreaterThan(0);
    for (const c of memory.queue) {
      expect(c.row).toBe(4);
    }
  });

  it('clears targeting memory when the bug is sunk', () => {
    let board = makeBoardWithBug();
    let memory = emptyAIMemory();
    const path: Coord[] = [
      { row: 4, col: 4 },
      { row: 4, col: 5 },
      { row: 4, col: 6 },
    ];
    for (const p of path) {
      const r = resolveShot(board, p);
      board = r.board;
      memory = updateAIMemory(memory, p, r.result, board);
    }
    expect(memory.queue).toHaveLength(0);
    expect(memory.activeHits).toHaveLength(0);
  });

  it('shrinks the queue on a miss without clearing other targets', () => {
    let board = makeBoardWithBug();
    let memory = emptyAIMemory();

    const hit: Coord = { row: 4, col: 5 };
    let r = resolveShot(board, hit);
    board = r.board;
    memory = updateAIMemory(memory, hit, r.result, board);

    const queuedBefore = memory.queue.length;
    expect(queuedBefore).toBeGreaterThan(0);

    // Pick a queued cell that is *not* part of the bug -> miss.
    const target = memory.queue.find(
      (c) => !(c.row === 4 && (c.col === 4 || c.col === 6)),
    );
    expect(target).toBeDefined();

    r = resolveShot(board, target!);
    board = r.board;
    memory = updateAIMemory(memory, target!, r.result, board);

    expect(memory.queue.some((c) => c.row === target!.row && c.col === target!.col)).toBe(false);
    expect(memory.activeHits).toHaveLength(1);
  });
});
