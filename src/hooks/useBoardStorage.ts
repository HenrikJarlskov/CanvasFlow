/**
 * @file useBoardStorage.ts
 * @description React hook for board persistence, metadata tracking, and workspace synchronization.
 * Integrates high-capacity IndexedDB for element serialization with server-side SQLite room listings
 * and localStorage catalog synchronization, debounced to avoid main-thread UI locks.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { BoardElement, BoardMetadata } from '../types/whiteboard';
import { cloneElements } from '../utils/canvasGeometry';
import { setBoardStorage, deleteBoardStorage } from '../utils/idbStorage';

/** Debounce latency in milliseconds to prevent storage IO thrashing during continuous drawing */
const SAVE_DEBOUNCE_MS = 350;

/**
 * Manages board persistence lifecycle, multi-board listings, and storage sync.
 *
 * @param roomId Current active board/room UUID
 * @param boardName Current board human-readable title
 * @param elementCount Current number of elements on canvas
 * @returns Object providing `savedBoards`, `saveBoard`, `deleteBoard`, `flushPendingSave`, and `loadSavedBoards`
 */
export function useBoardStorage(roomId: string, boardName: string, elementCount: number) {
  const [savedBoards, setSavedBoards] = useState<BoardMetadata[]>([]);
  const saveTimerRef = useRef<any>(null);
  const pendingDataRef = useRef<{ elements: BoardElement[]; name: string } | null>(null);

  const loadSavedBoards = useCallback(async () => {
    try {
      const local = localStorage.getItem('aidboard_saved_boards');
      let localList: BoardMetadata[] = local ? JSON.parse(local) : [];

      const res = await fetch('/api/boards');
      if (res.ok) {
        const data = await res.json();
        if (data.boards && Array.isArray(data.boards)) {
          const map = new Map<string, BoardMetadata>();
          for (const b of localList) map.set(b.id, b);
          for (const b of data.boards) map.set(b.id, b);
          localList = Array.from(map.values());
        }
      }

      if (!localList.some((b) => b.id === roomId)) {
        localList.unshift({
          id: roomId,
          name: boardName,
          elementCount,
          updatedAt: Date.now(),
        });
      }

      setSavedBoards(localList);
      localStorage.setItem('aidboard_saved_boards', JSON.stringify(localList));
    } catch (e) {
      console.warn('Could not load boards:', e);
    }
  }, [roomId, boardName, elementCount]);

  /**
   * Internal routine executing physical IndexedDB persistence, metadata update, and REST sync.
   */
  const executeSave = useCallback(
    async (safeElems: BoardElement[], name: string) => {
      try {
        await setBoardStorage(roomId, { name, elements: safeElems, updatedAt: Date.now() });

        const local = localStorage.getItem('aidboard_saved_boards');
        let list: BoardMetadata[] = local ? JSON.parse(local) : [];
        const idx = list.findIndex((b) => b.id === roomId);
        const meta: BoardMetadata = {
          id: roomId,
          name,
          elementCount: safeElems.length,
          updatedAt: Date.now(),
        };
        if (idx >= 0) {
          list[idx] = meta;
        } else {
          list.unshift(meta);
        }
        localStorage.setItem('aidboard_saved_boards', JSON.stringify(list));
        setSavedBoards(list);

        fetch(`/api/boards/${roomId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, elements: safeElems }),
        }).catch(() => {});
      } catch (e) {
        console.warn('Failed saving board:', e);
      }
    },
    [roomId]
  );

  /**
   * Flushes any pending debounced save immediately.
   */
  const flushPendingSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (pendingDataRef.current) {
      const { elements: safeElems, name } = pendingDataRef.current;
      pendingDataRef.current = null;
      executeSave(safeElems, name);
    }
  }, [executeSave]);

  /**
   * Schedules a debounced board save.
   * If immediate is true, cancels pending timers and persists synchronously.
   */
  const saveBoard = useCallback(
    (currentElems: BoardElement[], name = boardName, immediate = false) => {
      const safeElems = cloneElements(currentElems);
      pendingDataRef.current = { elements: safeElems, name };

      if (immediate) {
        flushPendingSave();
        return;
      }

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null;
        if (pendingDataRef.current) {
          const toSave = pendingDataRef.current;
          pendingDataRef.current = null;
          executeSave(toSave.elements, toSave.name);
        }
      }, SAVE_DEBOUNCE_MS);
    },
    [boardName, executeSave, flushPendingSave]
  );

  const deleteBoard = useCallback(
    (targetBoardId: string) => {
      deleteBoardStorage(targetBoardId);
      setSavedBoards((prev) => {
        const updated = prev.filter((b) => b.id !== targetBoardId);
        localStorage.setItem('aidboard_saved_boards', JSON.stringify(updated));
        return updated;
      });
      fetch(`/api/boards/${targetBoardId}`, { method: 'DELETE' }).catch(() => {});
    },
    []
  );

  useEffect(() => {
    loadSavedBoards();
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      if (pendingDataRef.current) {
        const toSave = pendingDataRef.current;
        pendingDataRef.current = null;
        executeSave(toSave.elements, toSave.name);
      }
    };
  }, [loadSavedBoards, executeSave]);

  return {
    savedBoards,
    setSavedBoards,
    loadSavedBoards,
    saveBoard,
    flushPendingSave,
    deleteBoard,
  };
}
