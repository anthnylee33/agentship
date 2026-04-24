import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import {
  BUG_TYPES,
  allBugsResolved,
  autoPlaceAll,
  bugById,
  cellsForPlacement,
  coordKey,
  createRNG,
  emptyAIMemory,
  emptyBoard,
  isValidPlacement,
  pickAIShot,
  resolveShot,
  shouldContinueTurn,
  updateAIMemory,
  type ActivityLogEntry,
  type AITargetingMemory,
  type BoardState,
  type BugPlacement,
  type BugTypeId,
  type Coord,
  type Orientation,
  type PendingModal,
  type Phase,
  type RNG,
  type Side,
} from '../game';

interface GameState {
  seed: number;
  phase: Phase;
  currentTurn: Side;
  playerBoard: BoardState;
  aiBoard: BoardState;
  aiMemory: AITargetingMemory;
  log: ActivityLogEntry[];
  modalQueue: PendingModal[];
  /** Player setup UI selections. */
  selectedBugId: BugTypeId | null;
  setupOrientation: Orientation;
  /** Increments any time we want to nudge the AI effect (after dismiss). */
  aiTick: number;
  /** Winner when phase === 'game_over'. */
  winner: Side | null;
  /** True once the player dismisses the end-of-match modal. Reset on NEW_GAME. */
  endGameDismissed: boolean;
  nextLogId: number;
  nextModalId: number;
}

type Action =
  | { type: 'SET_SEED'; seed: number }
  | { type: 'SELECT_BUG'; bugId: BugTypeId | null }
  | { type: 'TOGGLE_ORIENTATION' }
  | { type: 'PLACE_BUG'; placement: BugPlacement }
  | { type: 'RESET_PLACEMENTS' }
  | { type: 'AUTO_PLACE_PLAYER' }
  | { type: 'START_GAME' }
  | { type: 'PLAYER_SHOT'; coord: Coord }
  | { type: 'AI_SHOT' }
  | { type: 'DISMISS_MODAL' }
  | { type: 'DISMISS_END_GAME' }
  | { type: 'NEW_GAME'; seed?: number };

const DEFAULT_SEED = 1;

const initialState = (seed: number): GameState => ({
  seed,
  phase: 'setup',
  currentTurn: 'player',
  playerBoard: emptyBoard(),
  aiBoard: emptyBoard(),
  aiMemory: emptyAIMemory(),
  log: [
    {
      id: 1,
      timestamp: Date.now(),
      side: 'player',
      kind: 'system',
      message: 'New incident opened. Place your agents on the System Architecture Map.',
    },
  ],
  modalQueue: [],
  selectedBugId: BUG_TYPES[0].id,
  setupOrientation: 'horizontal',
  aiTick: 0,
  winner: null,
  endGameDismissed: false,
  nextLogId: 2,
  nextModalId: 1,
});

interface RNGRefs {
  placement: RNG;
  ai: RNG;
}

function makeRngs(seed: number): RNGRefs {
  return {
    placement: createRNG(seed * 2654435761),
    ai: createRNG(seed * 40503 + 1),
  };
}

function appendLog(state: GameState, entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>): GameState {
  return {
    ...state,
    log: [
      ...state.log,
      { id: state.nextLogId, timestamp: Date.now(), ...entry },
    ],
    nextLogId: state.nextLogId + 1,
  };
}

function placeBugReducer(state: GameState, placement: BugPlacement): GameState {
  // Replace any existing placement for the same bug.
  const existing = state.playerBoard.placements.filter((p) => p.bugId !== placement.bugId);
  if (!isValidPlacement(placement, existing)) return state;

  const playerBoard: BoardState = {
    ...state.playerBoard,
    placements: [...existing, placement],
  };

  // Auto-advance selection to the next unplaced bug.
  const placedIds = new Set(playerBoard.placements.map((p) => p.bugId));
  const nextUnplaced = BUG_TYPES.find((b) => !placedIds.has(b.id));

  return {
    ...state,
    playerBoard,
    selectedBugId: nextUnplaced ? nextUnplaced.id : null,
  };
}

function applyShot(
  board: BoardState,
  coord: Coord,
): { board: BoardState; result: 'miss' | 'hit' | 'sunk'; bugId?: BugTypeId } {
  return resolveShot(board, coord);
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_SEED':
      return { ...state, seed: action.seed };

    case 'SELECT_BUG':
      return { ...state, selectedBugId: action.bugId };

    case 'TOGGLE_ORIENTATION':
      return {
        ...state,
        setupOrientation: state.setupOrientation === 'horizontal' ? 'vertical' : 'horizontal',
      };

    case 'PLACE_BUG':
      return placeBugReducer(state, action.placement);

    case 'RESET_PLACEMENTS':
      return appendLog(
        {
          ...state,
          playerBoard: emptyBoard(),
          selectedBugId: BUG_TYPES[0].id,
        },
        { side: 'player', kind: 'system', message: 'Cleared all placements.' },
      );

    case 'AUTO_PLACE_PLAYER': {
      const rng = makeRngs(state.seed + 7).placement;
      const placements = autoPlaceAll(rng);
      return appendLog(
        {
          ...state,
          playerBoard: { ...emptyBoard(), placements },
          selectedBugId: null,
        },
        { side: 'player', kind: 'system', message: 'Agents auto-deployed across the architecture map.' },
      );
    }

    case 'START_GAME': {
      if (state.playerBoard.placements.length !== BUG_TYPES.length) return state;
      const rng = makeRngs(state.seed).placement;
      const aiPlacements = autoPlaceAll(rng);
      const aiBoard: BoardState = { ...emptyBoard(), placements: aiPlacements };
      return appendLog(
        appendLog(
          {
            ...state,
            phase: 'playing',
            aiBoard,
            currentTurn: 'player',
          },
          { side: 'player', kind: 'phase', message: 'Mission commenced. You have control.' },
        ),
        { side: 'ai', kind: 'system', message: 'Legacy code is online and watching.' },
      );
    }

    case 'PLAYER_SHOT': {
      if (state.phase !== 'playing') return state;
      if (state.currentTurn !== 'player') return state;
      if (state.modalQueue.length > 0) return state;
      const key = coordKey(action.coord);
      if (state.aiBoard.shots[key]) return state;

      const { board: nextAI, result, bugId } = applyShot(state.aiBoard, action.coord);
      let next: GameState = { ...state, aiBoard: nextAI };

      const coordLabel = formatCoord(action.coord);
      if (result === 'miss') {
        next = appendLog(next, {
          side: 'player',
          kind: 'shot',
          message: `Scan at ${coordLabel}: Code Clean.`,
        });
      } else if (result === 'hit') {
        next = appendLog(next, {
          side: 'player',
          kind: 'shot',
          message: `Scan at ${coordLabel}: Bug Identified.`,
        });
      } else {
        const bug = bugId ? bugById(bugId) : null;
        next = appendLog(next, {
          side: 'player',
          kind: 'sink',
          message: `Bug Resolved at ${coordLabel}: ${bug?.name ?? 'unknown'}.`,
        });
        if (bugId) {
          next = {
            ...next,
            modalQueue: [
              ...next.modalQueue,
              { id: next.nextModalId, bugId, resolvedBy: 'player' },
            ],
            nextModalId: next.nextModalId + 1,
          };
        }
      }

      if (allBugsResolved(next.aiBoard)) {
        return appendLog(
          { ...next, phase: 'game_over', winner: 'player' },
          { side: 'player', kind: 'phase', message: 'All bugs resolved. Mission complete.' },
        );
      }

      if (!shouldContinueTurn(result)) {
        return { ...next, currentTurn: 'ai' };
      }
      return next;
    }

    case 'AI_SHOT': {
      if (state.phase !== 'playing') return state;
      if (state.currentTurn !== 'ai') return state;
      if (state.modalQueue.length > 0) return state;

      const rng = makeRngs(state.seed + state.aiTick + 13).ai;
      const coord = pickAIShot(state.playerBoard, state.aiMemory, rng);
      const { board: nextPlayer, result, bugId } = applyShot(state.playerBoard, coord);
      const memory = updateAIMemory(state.aiMemory, coord, result, nextPlayer);

      let next: GameState = {
        ...state,
        playerBoard: nextPlayer,
        aiMemory: memory,
        aiTick: state.aiTick + 1,
      };

      const coordLabel = formatCoord(coord);
      if (result === 'miss') {
        next = appendLog(next, {
          side: 'ai',
          kind: 'shot',
          message: `Legacy probe at ${coordLabel}: Code Clean.`,
        });
      } else if (result === 'hit') {
        next = appendLog(next, {
          side: 'ai',
          kind: 'shot',
          message: `Legacy probe at ${coordLabel}: Bug Identified.`,
        });
      } else {
        const bug = bugId ? bugById(bugId) : null;
        next = appendLog(next, {
          side: 'ai',
          kind: 'sink',
          message: `Bug Resolved at ${coordLabel}: ${bug?.name ?? 'unknown'}.`,
        });
        if (bugId) {
          next = {
            ...next,
            modalQueue: [
              ...next.modalQueue,
              { id: next.nextModalId, bugId, resolvedBy: 'ai' },
            ],
            nextModalId: next.nextModalId + 1,
          };
        }
      }

      if (allBugsResolved(next.playerBoard)) {
        return appendLog(
          { ...next, phase: 'game_over', winner: 'ai' },
          { side: 'ai', kind: 'phase', message: 'Production has been overrun by legacy code.' },
        );
      }

      if (!shouldContinueTurn(result)) {
        return { ...next, currentTurn: 'player' };
      }
      return next;
    }

    case 'DISMISS_MODAL': {
      if (state.modalQueue.length === 0) return state;
      const [, ...rest] = state.modalQueue;
      return { ...state, modalQueue: rest, aiTick: state.aiTick + 1 };
    }

    case 'DISMISS_END_GAME': {
      if (state.phase !== 'game_over') return state;
      return { ...state, endGameDismissed: true };
    }

    case 'NEW_GAME': {
      return initialState(action.seed ?? state.seed);
    }
  }
}

function formatCoord(c: Coord): string {
  const colLetter = String.fromCharCode(65 + c.col);
  return `${colLetter}${c.row + 1}`;
}

interface GameContextValue extends GameState {
  remainingPlayerBugs: BugTypeId[];
  selectBug: (id: BugTypeId | null) => void;
  toggleOrientation: () => void;
  placeBug: (origin: Coord) => boolean;
  resetPlacements: () => void;
  autoPlacePlayer: () => void;
  startGame: () => void;
  playerShoot: (coord: Coord) => void;
  dismissModal: () => void;
  dismissEndGame: () => void;
  newGame: (seed?: number) => void;
  setSeed: (seed: number) => void;
  /** True iff there is no pending modal blocking the current actor. */
  inputEnabledForPlayer: boolean;
  cellsForPlacementPreview: (origin: Coord) => Coord[];
}

const GameContext = createContext<GameContextValue | null>(null);

interface ProviderProps {
  children: ReactNode;
  seed?: number;
}

export function GameProvider({ children, seed = DEFAULT_SEED }: ProviderProps) {
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState(seed));

  const aiTimer = useRef<number | null>(null);

  // Schedule AI moves while it's the AI's turn and no modal is blocking.
  useEffect(() => {
    if (state.phase !== 'playing') return;
    if (state.currentTurn !== 'ai') return;
    if (state.modalQueue.length > 0) return;

    aiTimer.current = window.setTimeout(() => {
      dispatch({ type: 'AI_SHOT' });
    }, 650);

    return () => {
      if (aiTimer.current !== null) {
        window.clearTimeout(aiTimer.current);
        aiTimer.current = null;
      }
    };
  }, [state.phase, state.currentTurn, state.modalQueue.length, state.aiTick]);

  const selectBug = useCallback((id: BugTypeId | null) => dispatch({ type: 'SELECT_BUG', bugId: id }), []);
  const toggleOrientation = useCallback(() => dispatch({ type: 'TOGGLE_ORIENTATION' }), []);
  const resetPlacements = useCallback(() => dispatch({ type: 'RESET_PLACEMENTS' }), []);
  const autoPlacePlayer = useCallback(() => dispatch({ type: 'AUTO_PLACE_PLAYER' }), []);
  const startGame = useCallback(() => dispatch({ type: 'START_GAME' }), []);
  const playerShoot = useCallback((coord: Coord) => dispatch({ type: 'PLAYER_SHOT', coord }), []);
  const dismissModal = useCallback(() => dispatch({ type: 'DISMISS_MODAL' }), []);
  const dismissEndGame = useCallback(() => dispatch({ type: 'DISMISS_END_GAME' }), []);
  const newGame = useCallback((s?: number) => dispatch({ type: 'NEW_GAME', seed: s }), []);
  const setSeed = useCallback((s: number) => dispatch({ type: 'SET_SEED', seed: s }), []);

  const placeBug = useCallback(
    (origin: Coord): boolean => {
      if (!state.selectedBugId) return false;
      const placement: BugPlacement = {
        bugId: state.selectedBugId,
        origin,
        orientation: state.setupOrientation,
      };
      const existing = state.playerBoard.placements.filter((p) => p.bugId !== state.selectedBugId);
      if (!isValidPlacement(placement, existing)) return false;
      dispatch({ type: 'PLACE_BUG', placement });
      return true;
    },
    [state.selectedBugId, state.setupOrientation, state.playerBoard.placements],
  );

  const cellsForPlacementPreview = useCallback(
    (origin: Coord): Coord[] => {
      if (!state.selectedBugId) return [];
      return cellsForPlacement({
        bugId: state.selectedBugId,
        origin,
        orientation: state.setupOrientation,
      });
    },
    [state.selectedBugId, state.setupOrientation],
  );

  const remainingPlayerBugs = useMemo(() => {
    const placed = new Set(state.playerBoard.placements.map((p) => p.bugId));
    return BUG_TYPES.filter((b) => !placed.has(b.id)).map((b) => b.id);
  }, [state.playerBoard.placements]);

  const inputEnabledForPlayer =
    state.phase === 'playing' &&
    state.currentTurn === 'player' &&
    state.modalQueue.length === 0;

  const value: GameContextValue = {
    ...state,
    remainingPlayerBugs,
    selectBug,
    toggleOrientation,
    placeBug,
    resetPlacements,
    autoPlacePlayer,
    startGame,
    playerShoot,
    dismissModal,
    dismissEndGame,
    newGame,
    setSeed,
    inputEnabledForPlayer,
    cellsForPlacementPreview,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>.');
  return ctx;
}
