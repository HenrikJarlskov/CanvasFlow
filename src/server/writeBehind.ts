/**
 * @file writeBehind.ts
 * @description Debounced Write-Behind persistence cache for real-time WebSocket state (ARC-04).
 *
 * Architectural Purpose:
 * When dozens of users draw simultaneously, emitting up to 60 stroke events per second per client,
 * writing every single micro-stroke immediately to SQLite or persistent storage causes severe disk I/O
 * thrashing, database lock contention, and event loop blocking.
 *
 * This WriteBehindBuffer:
 * 1. Maintains in-memory dirty room flags (`dirtyRooms`).
 * 2. Employs a sliding debounce window (default: 2000ms).
 * 3. Batches subsequent edits and asynchronously flushes the final room state to SQLite.
 * 4. Provides `flushAll()` for graceful server shutdown and data-loss prevention on SIGTERM/SIGINT.
 */

import { BoardElement } from '../types/whiteboard';

/**
 * Function signature to retrieve the current in-memory room state.
 */
export interface RoomDataProvider {
  (roomId: string): { name: string; elements: BoardElement[]; background?: string } | null | undefined;
}

/**
 * Optional custom saver function for unit testing and distributed drivers.
 */
export interface BoardSaver {
  (id: string, name: string, elements: BoardElement[], background?: string): Promise<any>;
}

/**
 * WriteBehindBuffer manages debounced asynchronous writes from in-memory WebSocket rooms to database storage.
 */
export class WriteBehindBuffer {
  private dirtyRooms = new Set<string>();
  private timers = new Map<string, NodeJS.Timeout>();
  private debounceMs: number;
  private getData: RoomDataProvider;
  private customSaver?: BoardSaver;

  /**
   * Initializes the write-behind buffer.
   *
   * @param getData - Callback to extract the latest room state from memory
   * @param debounceMs - Debounce quiet window in milliseconds before flushing (default: 2000ms)
   * @param saver - Optional custom save delegate for testing or non-SQLite backends
   */
  constructor(getData: RoomDataProvider, debounceMs = 2000, saver?: BoardSaver) {
    this.getData = getData;
    this.debounceMs = debounceMs;
    this.customSaver = saver;
  }

  /**
   * Marks a room as having unpersisted changes and schedules/resets a debounced flush timer.
   *
   * Method Explanation:
   * Adds `roomId` to the `dirtyRooms` set. If an existing timer for this room is active,
   * clears it and starts a new timeout so the database write occurs only after drawing ceases.
   *
   * @param roomId - ID of the mutated whiteboard room
   */
  public markDirty(roomId: string) {
    this.dirtyRooms.add(roomId);

    // Reset debounce timer on new mutations
    if (this.timers.has(roomId)) {
      clearTimeout(this.timers.get(roomId)!);
    }

    const timer = setTimeout(() => {
      this.flushRoom(roomId);
    }, this.debounceMs);

    if (timer.unref) {
      timer.unref(); // Ensure timer does not prevent process exit if idle
    }
    this.timers.set(roomId, timer);
  }

  /**
   * Flushes a specific dirty room immediately to persistent storage.
   *
   * @param roomId - Target room ID
   * @returns Promise resolving to true if successfully written, false otherwise
   */
  public async flushRoom(roomId: string): Promise<boolean> {
    if (!this.dirtyRooms.has(roomId)) return false;

    // Clear active timer
    if (this.timers.has(roomId)) {
      clearTimeout(this.timers.get(roomId)!);
      this.timers.delete(roomId);
    }

    this.dirtyRooms.delete(roomId);
    const data = this.getData(roomId);
    if (!data) return false;

    try {
      if (this.customSaver) {
        await this.customSaver(roomId, data.name, data.elements, data.background);
      } else {
        const { saveBoardRecord } = await import('../db/boards');
        await saveBoardRecord(roomId, data.name, data.elements, data.background);
      }
      return true;
    } catch (err) {
      console.error(`Failed to flush dirty room ${roomId} to database:`, err);
      // Re-add to dirty set if database write failed, ensuring eventual consistency
      this.dirtyRooms.add(roomId);
      return false;
    }
  }

  /**
   * Flushes all currently dirty rooms immediately in parallel or sequence.
   * Invoked during graceful process termination (`SIGINT`, `SIGTERM`).
   *
   * @returns Promise resolving to the number of rooms successfully persisted
   */
  public async flushAll(): Promise<number> {
    const roomsToFlush = Array.from(this.dirtyRooms);
    let flushedCount = 0;
    for (const roomId of roomsToFlush) {
      const ok = await this.flushRoom(roomId);
      if (ok) flushedCount++;
    }
    return flushedCount;
  }

  /**
   * Checks whether a room has uncommitted in-memory changes.
   *
   * @param roomId - Target room ID
   */
  public isDirty(roomId: string): boolean {
    return this.dirtyRooms.has(roomId);
  }

  /**
   * Returns total count of rooms currently awaiting persistence.
   */
  public getPendingCount(): number {
    return this.dirtyRooms.size;
  }

  /**
   * Cleans up all pending timers and resets buffer state.
   */
  public destroy() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.dirtyRooms.clear();
  }
}
