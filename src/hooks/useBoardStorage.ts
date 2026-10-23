/**
 * @file useBoardStorage.ts
 * @description React hook for board persistence, metadata tracking, and workspace synchronization.
 * Integrates Firebase Firestore with strict per-user data isolation under /users/{userId}/boards/{boardId},
 * backed by high-capacity IndexedDB for client-side offline and debounced caching.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { BoardElement, BoardMetadata } from '../types/whiteboard';
import { cloneElements } from '../utils/canvasGeometry';
import { setBoardStorage, deleteBoardStorage } from '../utils/idbStorage';
import { getUserBoards, saveUserBoard, deleteUserBoard } from '../services/boardService';

/** Debounce latency in milliseconds to prevent storage IO thrashing during continuous drawing */
const SAVE_DEBOUNCE_MS = 350;

/**
 * Manages board persistence lifecycle, multi-board listings, and storage sync.
 *
 * @param roomId Current active board/room UUID
 * @param boardName Current board human-readable title
 * @param elementCount Current number of elements on canvas
 * @param user Authenticated Firebase user, or null if guest
 * @param background Active canvas background pattern (e.g. 'dots', 'grid')
 * @returns Object providing `savedBoards`, `saveBoard`, `deleteBoard`, `flushPendingSave`, and `loadSavedBoards`
 */
export function useBoardStorage(
  roomId: string,
  boardName: string,
  elementCount: number,
  user: User | null = null,
  background = 'dots'
) {
  const [savedBoards, setSavedBoards] = useState<BoardMetadata[]>([]);
  const [isLoadingBoards, setIsLoadingBoards] = useState<boolean>(false);
  const saveTimerRef = useRef<any>(null);
  const pendingDataRef = useRef<{ elements: BoardElement[]; name: string } | null>(null);

  const getStorageKey = useCallback(() => {
    return user ? `aidboard_boards_${user.uid}` : 'aidboard_guest_boards';
  }, [user]);

  const loadSavedBoards = useCallback(async () => {
    setIsLoadingBoards(true);
    try {
      const storageKey = getStorageKey();
      const local = localStorage.getItem(storageKey);
      let localList: BoardMetadata[] = local ? JSON.parse(local) : [];

      if (user) {
        // Fetch strictly isolated cloud boards belonging to this authenticated user
        try {
          const cloudBoards = await getUserBoards(user.uid);
          if (cloudBoards && Array.isArray(cloudBoards)) {
            const map = new Map<string, BoardMetadata>();
            for (const b of localList) map.set(b.id, b);
            for (const b of cloudBoards) map.set(b.id, b);
            localList = Array.from(map.values());
          }
        } catch (cloudErr) {
          console.warn('Could not load cloud boards:', cloudErr);
        }
      }

      // Ensure the current active board is always represented in the user's workspace
      if (!localList.some((b) => b.id === roomId)) {
        localList.unshift({
          id: roomId,
          name: boardName,
          elementCount,
          updatedAt: Date.now(),
        });
      }

      localList.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setSavedBoards(localList);
      localStorage.setItem(storageKey, JSON.stringify(localList));
    } catch (e) {
      console.warn('Could not load boards:', e);
    } finally {
      setIsLoadingBoards(false);
    }
  }, [user, getStorageKey, roomId, boardName, elementCount]);

  /**
   * Internal routine executing physical persistence to user-isolated Firestore and IndexedDB.
   */
  const executeSave = useCallback(
    async (safeElems: BoardElement[], name: string) => {
      try {
        // 1. Local high-speed caching in IndexedDB
        await setBoardStorage(roomId, { name, elements: safeElems, updatedAt: Date.now() });

        // 2. Update local state catalog
        const storageKey = getStorageKey();
        const local = localStorage.getItem(storageKey);
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
        list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        localStorage.setItem(storageKey, JSON.stringify(list));
        setSavedBoards(list);

        // 3. User-isolated cloud storage if signed in
        if (user) {
          saveUserBoard(user.uid, roomId, name, safeElems, background).catch((err) => {
            console.warn('Failed cloud save to user Firestore subcollection:', err);
          });
        }
      } catch (e) {
        console.warn('Failed saving board:', e);
      }
    },
    [roomId, user, getStorageKey, background]
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
      const storageKey = getStorageKey();
      setSavedBoards((prev) => {
        const updated = prev.filter((b) => b.id !== targetBoardId);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });

      if (user) {
        deleteUserBoard(user.uid, targetBoardId).catch((err) => {
          console.warn('Failed deleting board from Firestore:', err);
        });
      }
    },
    [user, getStorageKey]
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
    isLoadingBoards,
    setSavedBoards,
    loadSavedBoards,
    saveBoard,
    flushPendingSave,
    deleteBoard,
  };
}
