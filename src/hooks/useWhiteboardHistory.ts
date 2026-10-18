/**
 * @file useWhiteboardHistory.ts
 * @description High-performance undo/redo state management hook with structural sharing (ENG-02).
 *
 * Performance Architecture:
 * In a vector canvas containing thousands of stroke points and shapes, naively deep-cloning
 * the entire elements array on every stroke or modification causes severe V8 heap fragmentation
 * and memory exhaustion (GC thrashing).
 *
 * This hook employs:
 * 1. **Bounded History Stack**: Fixed maximum depth of 30 snapshots.
 * 2. **Structural Sharing**: Compares elements by ID and scalar attributes. Unmodified elements
 *    retain their existing object references, drastically lowering heap allocation.
 */

import { useState, useCallback, useRef } from 'react';
import { BoardElement } from '../types/whiteboard';
import { cloneElements, cloneElement } from '../utils/canvasGeometry';

/** Maximum depth of the undo/redo history stack (capped for bounded memory usage) */
const MAX_HISTORY = 30;

/**
 * Structural sharing algorithm:
 * Reuses existing element object references from the previous snapshot if their
 * properties (type, coordinates, dimensions, timestamp, color) have not changed.
 *
 * Complex Loop Explanation:
 * 1. Builds an $O(N)$ lookup map `prevMap` keyed by element ID from the previous state.
 * 2. Iterates through each `newEl` in `next`:
 *    - If the element didn't exist in `prev`, deep-clones it.
 *    - If all geometric and timestamp properties match identically, reuses the old reference `oldEl`.
 *    - If mutated, clones the updated version.
 *
 * @param next - Proposed new elements array
 * @param prev - Previous snapshot elements array
 * @returns Array with structurally shared element references
 */
function shareUnchangedElements(next: BoardElement[], prev: BoardElement[]): BoardElement[] {
  if (!prev || prev.length === 0) return cloneElements(next);
  const prevMap = new Map<string, BoardElement>();
  for (const el of prev) {
    prevMap.set(el.id, el);
  }

  // Iterate over proposed elements and reuse unmutated objects
  return next.map((newEl) => {
    const oldEl = prevMap.get(newEl.id);
    if (!oldEl) return cloneElement(newEl);

    // Fast scalar equality check across primary render properties
    if (
      oldEl.type === newEl.type &&
      (oldEl as any).updatedAt === (newEl as any).updatedAt &&
      (oldEl as any).x === (newEl as any).x &&
      (oldEl as any).y === (newEl as any).y &&
      (oldEl as any).width === (newEl as any).width &&
      (oldEl as any).height === (newEl as any).height &&
      (oldEl as any).color === (newEl as any).color
    ) {
      return oldEl; // Reuse existing reference
    }

    return cloneElement(newEl);
  });
}

/**
 * Custom React hook managing the whiteboard undo/redo stack.
 *
 * @param initialElements - Initial board elements
 * @returns State and controller methods: elements, setElements, pushHistory, resetState, undo, redo, canUndo, canRedo
 */
export function useWhiteboardHistory(initialElements: BoardElement[] = []) {
  const [elements, setElements] = useState<BoardElement[]>(() => cloneElements(initialElements));
  const [history, setHistory] = useState<BoardElement[][]>(() => [cloneElements(initialElements)]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const historyIndexRef = useRef(0);
  historyIndexRef.current = historyIndex;

  /**
   * Pushes a new snapshot onto the history stack, truncating any redo forward history
   * and applying structural sharing.
   */
  const pushHistory = useCallback((newElements: BoardElement[]) => {
    setHistory((prev) => {
      const validPointer = Math.min(Math.max(0, historyIndexRef.current), prev.length - 1);
      const currentSnapshot = prev[validPointer] || [];
      const optimizedSnapshot = shareUnchangedElements(newElements, currentSnapshot);

      // Discard future redo states past the current pointer
      const upToCurrent = prev.slice(0, validPointer + 1);
      const next = [...upToCurrent, optimizedSnapshot];

      // Enforce fixed maximum history boundary
      if (next.length > MAX_HISTORY) {
        return next.slice(next.length - MAX_HISTORY);
      }
      return next;
    });

    setHistoryIndex((prev) => {
      const nextIdx = Math.min(prev + 1, MAX_HISTORY - 1);
      historyIndexRef.current = nextIdx;
      return nextIdx;
    });
  }, []);

  /**
   * Resets the history stack and replaces current state with a new baseline snapshot
   * (e.g. after loading a saved board from storage or server).
   */
  const resetState = useCallback((newElements: BoardElement[]) => {
    const cloned = cloneElements(newElements);
    setElements(cloned);
    setHistory([cloned]);
    setHistoryIndex(0);
    historyIndexRef.current = 0;
  }, []);

  const canUndo = historyIndex > 0 && history.length > 1;
  const canRedo = historyIndex < history.length - 1;

  /**
   * Reverts to the previous historical snapshot.
   * @returns The restored elements array, or null if cannot undo
   */
  const undo = useCallback((): BoardElement[] | null => {
    if (historyIndex <= 0 || history.length === 0) return null;
    const targetIndex = historyIndex - 1;
    const targetState = history[targetIndex];
    if (!targetState || !Array.isArray(targetState)) return null;

    const cloned = cloneElements(targetState);
    setHistoryIndex(targetIndex);
    setElements(cloned);
    return cloned;
  }, [historyIndex, history]);

  /**
   * Advances forward to the next historical snapshot.
   * @returns The reapplied elements array, or null if cannot redo
   */
  const redo = useCallback((): BoardElement[] | null => {
    if (historyIndex >= history.length - 1) return null;
    const targetIndex = historyIndex + 1;
    const targetState = history[targetIndex];
    if (!targetState || !Array.isArray(targetState)) return null;

    const cloned = cloneElements(targetState);
    setHistoryIndex(targetIndex);
    setElements(cloned);
    return cloned;
  }, [historyIndex, history]);

  return {
    elements,
    setElements,
    pushHistory,
    resetState,
    undo,
    redo,
    canUndo,
    canRedo,
    history,
    historyLength: history.length,
    currentIndex: historyIndex,
  };
}
