import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SelectionOverlay, ResizeHandleType } from '../components/SelectionOverlay';
import { BoardElement } from '../types/whiteboard';

describe('SelectionOverlay Component', () => {
  const mockSelectedElements: BoardElement[] = [
    {
      id: 'el-1',
      type: 'shape',
      shapeType: 'rectangle',
      x: 100,
      y: 100,
      width: 150,
      height: 80,
      color: '#18181b',
      strokeWidth: 4,
      opacity: 1,
      createdAt: 1000,
      updatedAt: 1000,
      zIndex: 1,
    },
  ];

  const defaultProps = {
    selectedElements: mockSelectedElements,
    zoom: 1,
    pan: { x: 0, y: 0 },
    onMoveSelection: vi.fn(),
    onMoveEnd: vi.fn(),
    onScaleSelection: vi.fn(),
    onScaleEnd: vi.fn(),
    onDeleteSelection: vi.fn(),
    onDuplicateSelection: vi.fn(),
    onChangeColor: vi.fn(),
    onTriggerOcr: vi.fn(),
    onDeselect: vi.fn(),
  };

  it('returns null when selectedElements is empty', () => {
    const { container } = render(<SelectionOverlay {...defaultProps} selectedElements={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders selection overlay and action toolbar', () => {
    render(<SelectionOverlay {...defaultProps} />);
    expect(screen.getByTestId('selection-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('selection-drag-handle')).toBeInTheDocument();
    expect(screen.getByTestId('selection-toolbar')).toBeInTheDocument();
  });

  it('handles drag and drop to move selected elements', () => {
    const onMoveSelection = vi.fn();
    const onMoveEnd = vi.fn();
    render(<SelectionOverlay {...defaultProps} onMoveSelection={onMoveSelection} onMoveEnd={onMoveEnd} />);

    const dragHandle = screen.getByTestId('selection-drag-handle');

    // Right-click or middle-click should not trigger drag
    fireEvent.pointerDown(dragHandle, { clientX: 120, clientY: 120, button: 1 });
    expect(onMoveSelection).not.toHaveBeenCalled();

    // Pointer down on drag handle (button 0)
    act(() => {
      fireEvent.pointerDown(dragHandle, { clientX: 120, clientY: 120, button: 0 });
    });

    // Pointer move across window
    act(() => {
      const moveEvent = new PointerEvent('pointermove', { clientX: 160, clientY: 170 });
      window.dispatchEvent(moveEvent);
    });

    expect(onMoveSelection).toHaveBeenCalledWith(40, 50);

    // Pointer up to complete drag
    act(() => {
      const upEvent = new PointerEvent('pointerup');
      window.dispatchEvent(upEvent);
    });

    expect(onMoveEnd).toHaveBeenCalledTimes(1);
  });

  it('triggers OCR when clicking Recognize Text button', () => {
    const onTriggerOcr = vi.fn();
    render(<SelectionOverlay {...defaultProps} onTriggerOcr={onTriggerOcr} />);

    const ocrBtn = screen.getByText('Recognize Text (OCR)');
    fireEvent.click(ocrBtn);
    expect(onTriggerOcr).toHaveBeenCalledTimes(1);
  });

  it('toggles color popover and selects a quick color', () => {
    const onChangeColor = vi.fn();
    render(<SelectionOverlay {...defaultProps} onChangeColor={onChangeColor} />);

    const paletteBtn = screen.getByTitle('Change color of selected elements');
    fireEvent.click(paletteBtn);

    // Click blue color swatch
    const blueSwatch = document.querySelector('button[style*="background-color: rgb(37, 99, 235)"]') as HTMLElement;
    expect(blueSwatch).toBeInTheDocument();

    fireEvent.click(blueSwatch);
    expect(onChangeColor).toHaveBeenCalledWith('#2563eb');
  });

  it('triggers duplicate, delete, and deselect', () => {
    const onDuplicateSelection = vi.fn();
    const onDeleteSelection = vi.fn();
    const onDeselect = vi.fn();

    render(
      <SelectionOverlay
        {...defaultProps}
        onDuplicateSelection={onDuplicateSelection}
        onDeleteSelection={onDeleteSelection}
        onDeselect={onDeselect}
      />
    );

    fireEvent.click(screen.getByTitle('Duplicate selected (Ctrl+D)'));
    expect(onDuplicateSelection).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTitle('Delete selected (Delete / Backspace)'));
    expect(onDeleteSelection).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTitle('Deselect (Escape)'));
    expect(onDeselect).toHaveBeenCalledTimes(1);
  });

  it('exercises scaling on each of the 8 resize handles', () => {
    const onScaleSelection = vi.fn();
    const onScaleEnd = vi.fn();

    render(
      <SelectionOverlay
        {...defaultProps}
        onScaleSelection={onScaleSelection}
        onScaleEnd={onScaleEnd}
      />
    );

    const handles: ResizeHandleType[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

    handles.forEach((h) => {
      const el = screen.getByTestId(`resize-handle-${h}`);

      // Ignored with button: 2
      fireEvent.pointerDown(el, { clientX: 200, clientY: 200, button: 2 });

      act(() => {
        fireEvent.pointerDown(el, { clientX: 200, clientY: 200, button: 0 });
        const move = new PointerEvent('pointermove', { clientX: 220, clientY: 220 });
        window.dispatchEvent(move);
        const up = new PointerEvent('pointerup');
        window.dispatchEvent(up);
      });
    });

    expect(onScaleSelection).toHaveBeenCalled();
    expect(onScaleEnd).toHaveBeenCalledTimes(8);
  });
});
