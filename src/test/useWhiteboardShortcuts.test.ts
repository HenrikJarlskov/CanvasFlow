import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWhiteboardShortcuts } from '../hooks/useWhiteboardShortcuts';
import { DEFAULT_SHORTCUTS } from '../utils/shortcuts';

describe('useWhiteboardShortcuts - Arrow Keys Viewport Panning', () => {
  const baseOptions = {
    shortcuts: DEFAULT_SHORTCUTS,
    elements: [],
    selectedIds: [],
    setCurrentTool: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onDeleteSelected: vi.fn(),
    onSelectAll: vi.fn(),
    onDuplicateSelected: vi.fn(),
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onResetZoom: vi.fn(),
    onToggleSnap: vi.fn(),
    onOpenAiDraw: vi.fn(),
    onOpenBoards: vi.fn(),
    onOpenHelp: vi.fn(),
  };

  it('pans viewport up, down, left, and right on arrow key presses', () => {
    const onPan = vi.fn();
    renderHook(() =>
      useWhiteboardShortcuts({
        ...baseOptions,
        onPan,
      })
    );

    // ArrowUp -> dy = +40
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(onPan).toHaveBeenCalledWith(0, 40);

    // ArrowDown -> dy = -40
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(onPan).toHaveBeenCalledWith(0, -40);

    // ArrowLeft -> dx = +40
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(onPan).toHaveBeenCalledWith(40, 0);

    // ArrowRight -> dx = -40
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(onPan).toHaveBeenCalledWith(-40, 0);
  });

  it('pans with larger step when Shift key is held', () => {
    const onPan = vi.fn();
    renderHook(() =>
      useWhiteboardShortcuts({
        ...baseOptions,
        onPan,
      })
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', shiftKey: true }));
    expect(onPan).toHaveBeenCalledWith(0, 120);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true }));
    expect(onPan).toHaveBeenCalledWith(-120, 0);
  });

  it('supports onPanViewport prop as alternative to onPan', () => {
    const onPanViewport = vi.fn();
    renderHook(() =>
      useWhiteboardShortcuts({
        ...baseOptions,
        onPanViewport,
      })
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(onPanViewport).toHaveBeenCalledWith(0, -40);
  });

  it('supports single object argument callback { x, y }', () => {
    const onPanObject = vi.fn((_delta: { x: number; y: number }) => {});
    renderHook(() =>
      useWhiteboardShortcuts({
        ...baseOptions,
        onPan: onPanObject,
      })
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(onPanObject).toHaveBeenCalledWith({ x: 40, y: 0 });
  });

  it('does not pan when typing inside input or textarea', () => {
    const onPan = vi.fn();
    renderHook(() =>
      useWhiteboardShortcuts({
        ...baseOptions,
        onPan,
      })
    );

    const input = document.createElement('input');
    document.body.appendChild(input);

    const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    Object.defineProperty(event, 'target', { value: input });
    window.dispatchEvent(event);

    expect(onPan).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('triggers onToggleGrid when pressing "g"', () => {
    const onToggleGrid = vi.fn();
    renderHook(() =>
      useWhiteboardShortcuts({
        ...baseOptions,
        onToggleGrid,
      })
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }));
    expect(onToggleGrid).toHaveBeenCalledTimes(1);
  });
});
