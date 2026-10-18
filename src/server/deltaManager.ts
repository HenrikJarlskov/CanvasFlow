/**
 * @file deltaManager.ts
 * @description Fine-grained vector whiteboard element delta engine (ARC-01, ARC-03).
 *
 * Architectural Purpose:
 * In high-concurrency multi-user whiteboard sessions, sending whole-array snapshots on every stroke
 * creates quadratic $O(N^2)$ network bandwidth amplification and causes Last-Write-Wins (LWW) clobbering,
 * where simultaneous edits overwrite and destroy each other's work.
 *
 * This delta manager resolves and applies atomic element operations:
 * - `upsert`: Appends a new stroke/shape or updates an existing element in-place without altering other elements.
 * - `delete`: Removes a targeted element by ID.
 * - `patch`: Merges partial property changes (e.g. real-time drag position or color update).
 */

import { BoardElement } from '../types/whiteboard';
import { validateBoardElement } from './security';

/**
 * Supported atomic operation types.
 */
export type DeltaOperation = 'upsert' | 'delete' | 'patch';

/**
 * Payload envelope for fine-grained element delta operations.
 */
export interface ElementDeltaPayload {
  /** Operation type ('upsert' | 'delete' | 'patch') */
  op: DeltaOperation;
  /** Full element object (required for upsert) */
  element?: BoardElement;
  /** Target element ID (required for delete and patch) */
  elementId?: string;
  /** Partial properties to merge during a patch operation */
  patch?: Partial<BoardElement>;
  /** ID of the collaborator performing the mutation */
  userId?: string;
}

/**
 * Applies a fine-grained element delta operation to the server's in-memory elements array.
 * Validates payload schema and boundaries, maintaining z-index ordering and ensuring
 * concurrent edits from multiple users merge cleanly without overwriting adjacent items.
 *
 * Operational Logic:
 * 1. **Upsert**:
 *    - Validates element structure via `validateBoardElement()`.
 *    - Searches for existing index by `element.id`.
 *    - If found, replaces the element in-place; otherwise, appends to the end of the array.
 * 2. **Delete**:
 *    - Locates and filters out the target element by `elementId`.
 * 3. **Patch**:
 *    - Merges `patch` properties onto existing element in-place and re-validates.
 *
 * @param elements - Current in-memory room elements
 * @param delta - Delta payload received from the WebSocket client
 * @returns Result object with updated elements array and affected element descriptor
 */
export function applyElementDelta(
  elements: BoardElement[],
  delta: ElementDeltaPayload
): { success: boolean; elements: BoardElement[]; affectedElement?: BoardElement; error?: string } {
  const { op, element, elementId, patch } = delta;

  // -------------------------------------------------------------
  // UPSERT OPERATION: Insert new element or replace existing element
  // -------------------------------------------------------------
  if (op === 'upsert') {
    if (!element) {
      return { success: false, elements, error: 'Element payload required for upsert' };
    }
    const check = validateBoardElement(element);
    if (!check.valid) {
      return { success: false, elements, error: check.error };
    }

    const idx = elements.findIndex((el) => el.id === element.id);
    let nextElements: BoardElement[];
    if (idx >= 0) {
      nextElements = [...elements];
      nextElements[idx] = { ...element, updatedAt: Date.now() };
    } else {
      nextElements = [...elements, { ...element, updatedAt: Date.now() }];
    }
    return { success: true, elements: nextElements, affectedElement: element };
  }

  // -------------------------------------------------------------
  // DELETE OPERATION: Remove specific element by ID
  // -------------------------------------------------------------
  if (op === 'delete') {
    const targetId = elementId || element?.id;
    if (!targetId) {
      return { success: false, elements, error: 'Target elementId required for delete' };
    }
    const target = elements.find((el) => el.id === targetId);
    const nextElements = elements.filter((el) => el.id !== targetId);
    return { success: true, elements: nextElements, affectedElement: target };
  }

  // -------------------------------------------------------------
  // PATCH OPERATION: Merge partial scalar attributes
  // -------------------------------------------------------------
  if (op === 'patch') {
    const targetId = elementId || element?.id;
    if (!targetId) {
      return { success: false, elements, error: 'Target elementId required for patch' };
    }
    const idx = elements.findIndex((el) => el.id === targetId);
    if (idx >= 0) {
      const current = elements[idx];
      const merged = { ...current, ...(patch || {}), updatedAt: Date.now() } as BoardElement;
      const check = validateBoardElement(merged);
      if (!check.valid) {
        return { success: false, elements, error: check.error };
      }
      const nextElements = [...elements];
      nextElements[idx] = merged;
      return { success: true, elements: nextElements, affectedElement: merged };
    }
    return { success: false, elements, error: `Element not found for patch: ${targetId}` };
  }

  return { success: false, elements, error: `Unsupported delta operation: ${op}` };
}
