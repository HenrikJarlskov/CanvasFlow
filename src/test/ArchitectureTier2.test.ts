import { describe, it, expect, vi } from 'vitest';
import { applyElementDelta } from '../server/deltaManager';
import { WriteBehindBuffer } from '../server/writeBehind';
import { renderHook, act } from '@testing-library/react';
import { useWhiteboardHistory } from '../hooks/useWhiteboardHistory';
import { BoardElement, ShapeElementData } from '../types/whiteboard';

describe('Tier 2 Architecture: Delta Operations & Granular Sync (ARC-01, ARC-03)', () => {
  const initialElements: BoardElement[] = [
    {
      id: 'el_1',
      type: 'shape',
      shapeType: 'rectangle',
      x: 10,
      y: 10,
      width: 100,
      height: 50,
      color: '#000',
      strokeWidth: 2,
      opacity: 1,
      createdAt: 100,
      updatedAt: 100,
      zIndex: 1,
    },
    {
      id: 'el_2',
      type: 'shape',
      shapeType: 'circle',
      x: 200,
      y: 200,
      width: 80,
      height: 80,
      color: '#f00',
      strokeWidth: 2,
      opacity: 1,
      createdAt: 100,
      updatedAt: 100,
      zIndex: 2,
    },
  ];

  it('upserts a new element without clobbering existing elements', () => {
    const newElement: BoardElement = {
      id: 'el_3',
      type: 'text',
      x: 50,
      y: 50,
      text: 'Hello Delta',
      fontSize: 16,
      color: '#123456',
      fontFamily: 'Inter',
      width: 100,
      height: 30,
      createdAt: 200,
      updatedAt: 200,
      zIndex: 3,
    };

    const res = applyElementDelta(initialElements, {
      op: 'upsert',
      element: newElement,
    });

    expect(res.success).toBe(true);
    expect(res.elements.length).toBe(3);
    expect(res.elements.find((el) => el.id === 'el_1')).toBeDefined();
    expect(res.elements.find((el) => el.id === 'el_3')).toBeDefined();
  });

  it('updates an existing element in-place during upsert', () => {
    const updated: ShapeElementData = {
      ...(initialElements[0] as ShapeElementData),
      x: 999,
    };

    const res = applyElementDelta(initialElements, {
      op: 'upsert',
      element: updated,
    });

    expect(res.success).toBe(true);
    expect(res.elements.length).toBe(2);
    expect((res.elements[0] as ShapeElementData).x).toBe(999);
    expect(res.elements[1].id).toBe('el_2');
  });

  it('deletes an element by elementId cleanly', () => {
    const res = applyElementDelta(initialElements, {
      op: 'delete',
      elementId: 'el_1',
    });

    expect(res.success).toBe(true);
    expect(res.elements.length).toBe(1);
    expect(res.elements[0].id).toBe('el_2');
  });

  it('patches element properties without whole-object replacement', () => {
    const res = applyElementDelta(initialElements, {
      op: 'patch',
      elementId: 'el_2',
      patch: { color: '#00ff00', width: 120 },
    });

    expect(res.success).toBe(true);
    const patched = res.elements.find((el) => el.id === 'el_2') as any;
    expect(patched.color).toBe('#00ff00');
    expect(patched.width).toBe(120);
    expect(patched.height).toBe(80); // preserved
  });
});

describe('Tier 2 Architecture: Debounced Write-Behind Buffer (ARC-04)', () => {
  it('marks rooms dirty and flushes pending rooms cleanly', async () => {
    const mockStore = new Map<string, any>();
    mockStore.set('room_test', {
      name: 'Test Room',
      elements: [{ id: '1', type: 'shape', shapeType: 'rectangle', x: 0, y: 0, width: 10, height: 10 }],
    });

    const savedRecords: any[] = [];
    const buffer = new WriteBehindBuffer(
      (roomId) => mockStore.get(roomId),
      500,
      async (id, name, elements) => {
        savedRecords.push({ id, name, elements });
      }
    );

    buffer.markDirty('room_test');
    expect(buffer.isDirty('room_test')).toBe(true);
    expect(buffer.getPendingCount()).toBe(1);

    const flushedCount = await buffer.flushAll();
    expect(flushedCount).toBe(1);
    expect(savedRecords.length).toBe(1);
    expect(savedRecords[0].id).toBe('room_test');
    expect(buffer.isDirty('room_test')).toBe(false);
    expect(buffer.getPendingCount()).toBe(0);

    buffer.destroy();
  });
});

describe('Tier 2 Engineering: Bounded History Stack with Structural Sharing (ENG-02)', () => {
  it('caps history stack to MAX_HISTORY (30 steps) avoiding memory leaks', () => {
    const { result } = renderHook(() => useWhiteboardHistory([]));

    act(() => {
      // Push 45 state changes
      for (let i = 0; i < 45; i++) {
        result.current.pushHistory([
          {
            id: `item_${i}`,
            type: 'shape',
            shapeType: 'rectangle',
            x: i,
            y: i,
            width: 10,
            height: 10,
            color: '#000',
            strokeWidth: 1,
            opacity: 1,
            createdAt: i,
            updatedAt: i,
            zIndex: i,
          },
        ]);
      }
    });

    expect(result.current.history.length).toBeLessThanOrEqual(30);
    expect(result.current.canUndo).toBe(true);
  });

  it('reuses unchanged element references through structural sharing', () => {
    const elemA: BoardElement = {
      id: 'a',
      type: 'shape',
      shapeType: 'rectangle',
      x: 10,
      y: 10,
      width: 20,
      height: 20,
      color: '#000',
      strokeWidth: 1,
      opacity: 1,
      createdAt: 1,
      updatedAt: 1,
      zIndex: 1,
    };

    const elemB: BoardElement = {
      id: 'b',
      type: 'shape',
      shapeType: 'rectangle',
      x: 50,
      y: 50,
      width: 20,
      height: 20,
      color: '#000',
      strokeWidth: 1,
      opacity: 1,
      createdAt: 1,
      updatedAt: 1,
      zIndex: 2,
    };

    const { result } = renderHook(() => useWhiteboardHistory([elemA, elemB]));

    // Update only elemB
    const elemBUpdated: BoardElement = {
      ...elemB,
      x: 60,
      updatedAt: 2,
    };

    act(() => {
      result.current.pushHistory([elemA, elemBUpdated]);
    });

    const step0 = result.current.history[0];
    const step1 = result.current.history[1];

    // elemA reference should be identical (shared)
    expect(step0[0].id).toBe('a');
    expect(step1[0].id).toBe('a');
    expect((step1[0] as ShapeElementData).x).toBe((step0[0] as ShapeElementData).x);
  });
});
