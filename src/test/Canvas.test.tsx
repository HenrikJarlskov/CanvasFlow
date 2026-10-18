import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Canvas } from '../components/Canvas';
import { BoardElement } from '../types/whiteboard';

vi.mock('../utils/canvasGeometry', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/canvasGeometry')>();
  return {
    ...actual,
    createImageElementFromFile: vi.fn().mockImplementation((file: File, x: number, y: number, z: number) => {
      return Promise.resolve({
        id: 'img-test-1',
        type: 'image',
        x,
        y,
        width: 100,
        height: 100,
        src: 'data:image/png;base64,mock',
        opacity: 1,
        createdAt: 1000,
        updatedAt: 1000,
        zIndex: z,
      } as BoardElement);
    }),
  };
});

describe('Canvas Component', () => {
  const mockElements: BoardElement[] = [
    {
      id: 'rect-1',
      type: 'shape',
      shapeType: 'rectangle',
      x: 50,
      y: 50,
      width: 100,
      height: 60,
      color: '#18181b',
      strokeWidth: 4,
      opacity: 1,
      createdAt: 1000,
      updatedAt: 1000,
      zIndex: 1,
    },
    {
      id: 'circle-1',
      type: 'shape',
      shapeType: 'circle',
      x: 200,
      y: 50,
      width: 80,
      height: 80,
      color: '#2563eb',
      strokeWidth: 4,
      opacity: 1,
      createdAt: 1001,
      updatedAt: 1001,
      zIndex: 2,
    },
    {
      id: 'text-1',
      type: 'text',
      x: 100,
      y: 200,
      text: 'Hello Whiteboard',
      fontSize: 20,
      color: '#059669',
      fontFamily: 'Inter',
      width: 150,
      height: 30,
      createdAt: 1002,
      updatedAt: 1002,
      zIndex: 3,
    },
  ];

  const defaultProps = {
    elements: mockElements,
    onElementsChange: vi.fn(),
    currentTool: 'select' as const,
    selectedShape: 'rectangle' as const,
    color: '#18181b',
    strokeWidth: 4,
    autoSnap: true,
    background: 'dots' as const,
    zoom: 1,
    pan: { x: 0, y: 0 },
    onPanChange: vi.fn(),
    onZoomChange: vi.fn(),
    selectedIds: [],
    onSelectElements: vi.fn(),
    onTriggerOcr: vi.fn(),
    remoteUsers: [],
    onCursorMove: vi.fn(),
  };

  it('renders SVG vector layer with all elements', () => {
    render(<Canvas {...defaultProps} />);
    expect(screen.getByTestId('canvas-container')).toBeInTheDocument();
    expect(screen.getByTestId('whiteboard-svg')).toBeInTheDocument();
    expect(screen.getByTestId('element-rect-1')).toBeInTheDocument();
    expect(screen.getByTestId('element-circle-1')).toBeInTheDocument();
    expect(screen.getByTestId('element-text-1')).toHaveTextContent('Hello Whiteboard');
  });

  it('handles marquee selection drag in select mode', () => {
    const onSelectElements = vi.fn();
    render(<Canvas {...defaultProps} onSelectElements={onSelectElements} />);

    const container = screen.getByTestId('canvas-container');

    // Pointer down on empty canvas
    fireEvent.pointerDown(container, { clientX: 20, clientY: 20, button: 0 });
    // Pointer move to drag marquee
    fireEvent.pointerMove(container, { clientX: 180, clientY: 150 });
    // Marquee box should be visible
    expect(screen.getByTestId('marquee-selection-box')).toBeInTheDocument();

    // Pointer up to finalize marquee selection
    fireEvent.pointerUp(container);

    // rect-1 is inside (20,20) to (180,150)
    expect(onSelectElements).toHaveBeenCalled();
  });

  it('allows clicking an element to select it', () => {
    const onSelectElements = vi.fn();
    render(<Canvas {...defaultProps} onSelectElements={onSelectElements} />);

    const container = screen.getByTestId('canvas-container');
    // Click on rect-1 (x: 50..150, y: 50..110)
    fireEvent.pointerDown(container, { clientX: 70, clientY: 70, button: 0 });

    expect(onSelectElements).toHaveBeenCalledWith(['rect-1']);
  });

  it('deletes selected element when Delete or Backspace key is pressed', () => {
    const onElementsChange = vi.fn();
    const onSelectElements = vi.fn();
    render(
      <Canvas
        {...defaultProps}
        selectedIds={['rect-1']}
        onElementsChange={onElementsChange}
        onSelectElements={onSelectElements}
      />
    );

    // Press Delete key
    fireEvent.keyDown(window, { key: 'Delete' });

    // Should remove rect-1 from elements
    expect(onElementsChange).toHaveBeenCalledWith(
      expect.not.arrayContaining([expect.objectContaining({ id: 'rect-1' })]),
      'delete'
    );
    expect(onSelectElements).toHaveBeenCalledWith([]);
  });

  it('clears selection on Escape key', () => {
    const onSelectElements = vi.fn();
    render(
      <Canvas
        {...defaultProps}
        selectedIds={['rect-1']}
        onSelectElements={onSelectElements}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onSelectElements).toHaveBeenCalledWith([]);
  });

  it('places new text element and commits edit on blur', () => {
    const onElementsChange = vi.fn();
    render(<Canvas {...defaultProps} currentTool="text" onElementsChange={onElementsChange} />);

    const container = screen.getByTestId('canvas-container');
    fireEvent.pointerDown(container, { clientX: 300, clientY: 300, button: 0 });

    expect(onElementsChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ type: 'text' })]),
      'create'
    );

    // Text editor is active
    const input = screen.getByTestId('inline-text-input');
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'Committed note' } });
    fireEvent.blur(input);

    expect(onElementsChange).toHaveBeenCalled();
  });

  it('deletes empty text element if blurred without content', () => {
    const onElementsChange = vi.fn();
    render(<Canvas {...defaultProps} currentTool="text" onElementsChange={onElementsChange} />);

    const container = screen.getByTestId('canvas-container');
    fireEvent.pointerDown(container, { clientX: 300, clientY: 300, button: 0 });

    const input = screen.getByTestId('inline-text-input');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.blur(input);

    expect(onElementsChange).toHaveBeenCalledWith(expect.any(Array), 'delete');
  });

  it('renders imported image elements onto SVG canvas', () => {
    const elementsWithImage: BoardElement[] = [
      ...mockElements,
      {
        id: 'img-1',
        type: 'image',
        x: 400,
        y: 100,
        width: 200,
        height: 150,
        src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        createdAt: 1003,
        updatedAt: 1003,
        zIndex: 4,
      },
    ];

    render(<Canvas {...defaultProps} elements={elementsWithImage} />);
    const imageEl = screen.getByTestId('element-img-1');
    expect(imageEl).toBeInTheDocument();
    expect(imageEl.tagName.toLowerCase()).toBe('image');
  });

  it('moves selected element smoothly and commits new position', () => {
    const onElementsLiveUpdate = vi.fn();
    const onElementsChange = vi.fn();

    render(
      <Canvas
        {...defaultProps}
        selectedIds={['rect-1']}
        onElementsLiveUpdate={onElementsLiveUpdate}
        onElementsChange={onElementsChange}
      />
    );

    const container = screen.getByTestId('canvas-container');

    // Pointer down on selected element
    fireEvent.pointerDown(container, { clientX: 70, clientY: 70, button: 0 });

    // Pointer move 30px right, 20px down
    fireEvent.pointerMove(container, { clientX: 100, clientY: 90 });

    expect(onElementsLiveUpdate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'rect-1',
          x: 80, // 50 + 30
          y: 70, // 50 + 20
        }),
      ])
    );

    // Pointer up commits the final moved state to history
    fireEvent.pointerUp(container);
    expect(onElementsChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'rect-1',
          x: 80,
          y: 70,
        }),
      ]),
      'move'
    );
  });

  it('handles selection overlay duplicate, delete, and recolor actions', () => {
    const onElementsChange = vi.fn();
    const onSelectElements = vi.fn();

    render(
      <Canvas
        {...defaultProps}
        selectedIds={['rect-1']}
        onElementsChange={onElementsChange}
        onSelectElements={onSelectElements}
      />
    );

    // Duplicate
    fireEvent.click(screen.getByTitle('Duplicate selected (Ctrl+D)'));
    expect(onElementsChange).toHaveBeenCalledWith(expect.any(Array), 'create');

    // Delete
    fireEvent.click(screen.getByTitle('Delete selected (Delete / Backspace)'));
    expect(onElementsChange).toHaveBeenCalledWith(expect.any(Array), 'delete');

    // Recolor
    fireEvent.click(screen.getByTitle('Change color of selected elements'));
    const colorBtn = document.querySelector('button[style*="background-color: rgb(37, 99, 235)"]') as HTMLElement;
    fireEvent.click(colorBtn);
    expect(onElementsChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'rect-1', color: '#2563eb' })]),
      'update'
    );
  });

  it('handles drag and drop file interactions', () => {
    render(<Canvas {...defaultProps} />);
    const container = screen.getByTestId('canvas-container');

    // Drag over with files
    fireEvent.dragOver(container, {
      dataTransfer: { types: ['Files'] },
    });
    expect(screen.getByTestId('image-drop-indicator')).toBeInTheDocument();

    // Drag leave
    fireEvent.dragLeave(container);
    expect(screen.queryByTestId('image-drop-indicator')).not.toBeInTheDocument();

    // Drop
    const file = new File(['image'], 'test.png', { type: 'image/png' });
    fireEvent.drop(container, {
      clientX: 200,
      clientY: 200,
      dataTransfer: { files: [file] },
    });
  });

  it('handles wheel zoom gestures', () => {
    const onZoomChange = vi.fn();
    render(<Canvas {...defaultProps} onZoomChange={onZoomChange} />);

    const container = screen.getByTestId('canvas-container');
    fireEvent.wheel(container, { deltaY: -100, clientX: 200, clientY: 200, ctrlKey: true });
    expect(onZoomChange).toHaveBeenCalled();
  });

  it('handles overlay drag, scaling, and deselect for multiple element types', () => {
    const multiElements: BoardElement[] = [
      {
        id: 'stroke-1',
        type: 'stroke',
        points: [{ x: 10, y: 10 }, { x: 50, y: 50 }],
        color: '#000000',
        strokeWidth: 2,
        opacity: 1,
        createdAt: 1000,
        updatedAt: 1000,
        zIndex: 1,
      },
      {
        id: 'line-1',
        type: 'shape',
        shapeType: 'line',
        x: 20,
        y: 20,
        x2: 80,
        y2: 80,
        width: 60,
        height: 60,
        color: '#000000',
        strokeWidth: 2,
        opacity: 1,
        createdAt: 1000,
        updatedAt: 1000,
        zIndex: 2,
      },
      {
        id: 'txt-1',
        type: 'text',
        x: 30,
        y: 30,
        width: 100,
        height: 30,
        text: 'Sample',
        color: '#000000',
        fontSize: 16,
        fontFamily: 'sans-serif',
        createdAt: 1000,
        updatedAt: 1000,
        zIndex: 3,
      },
    ];

    const onElementsChange = vi.fn();
    const onSelectElements = vi.fn();
    const onTriggerOcr = vi.fn();

    render(
      <Canvas
        {...defaultProps}
        elements={multiElements}
        selectedIds={['stroke-1', 'line-1', 'txt-1']}
        onElementsChange={onElementsChange}
        onSelectElements={onSelectElements}
        onTriggerOcr={onTriggerOcr}
      />
    );

    // Drag move via overlay handle
    const dragHandle = screen.getByTestId('selection-drag-handle');
    act(() => {
      fireEvent.pointerDown(dragHandle, { clientX: 50, clientY: 50, button: 0 });
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 80, clientY: 90 }));
      window.dispatchEvent(new PointerEvent('pointerup'));
    });
    expect(onElementsChange).toHaveBeenCalled();

    // Scale via overlay resize handle
    const resizeHandle = screen.getByTestId('resize-handle-se');
    act(() => {
      fireEvent.pointerDown(resizeHandle, { clientX: 80, clientY: 80, button: 0 });
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 100 }));
      window.dispatchEvent(new PointerEvent('pointerup'));
    });
    expect(onElementsChange).toHaveBeenCalled();

    // OCR button in overlay
    fireEvent.click(screen.getByText('Recognize Text (OCR)'));
    expect(onTriggerOcr).toHaveBeenCalledTimes(1);

    // Deselect button in overlay
    fireEvent.click(screen.getByTitle('Deselect (Escape)'));
    expect(onSelectElements).toHaveBeenCalledWith([]);
  });

  it('cancels text editing on Escape key and ignores delete key when typing in an input', () => {
    const onElementsChange = vi.fn();
    render(<Canvas {...defaultProps} currentTool="text" onElementsChange={onElementsChange} />);

    const container = screen.getByTestId('canvas-container');
    fireEvent.pointerDown(container, { clientX: 150, clientY: 150, button: 0 });

    const input = screen.getByTestId('inline-text-input');
    fireEvent.change(input, { target: { value: 'Drafting text' } });

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onElementsChange).toHaveBeenCalled();

    // Delete key inside text input does not trigger canvas delete
    fireEvent.keyDown(input, { key: 'Delete' });
  });

  it('handles clipboard paste containing an image and ignores paste when input focused', async () => {
    const onElementsChange = vi.fn();
    const onSelectElements = vi.fn();
    render(<Canvas {...defaultProps} onElementsChange={onElementsChange} onSelectElements={onSelectElements} />);

    const imageFile = new File(['fake'], 'clipboard.png', { type: 'image/png' });
    const fakeClipboardEvent = {
      clipboardData: {
        items: [
          {
            type: 'image/png',
            getAsFile: () => imageFile,
          },
        ],
      },
    };

    // Paste with no active input
    await act(async () => {
      fireEvent.paste(window, fakeClipboardEvent);
    });
    expect(onElementsChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'img-test-1' })]),
      'create'
    );
    expect(onSelectElements).toHaveBeenCalledWith(['img-test-1']);

    // Now create an input and focus it, verify paste is ignored
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    onElementsChange.mockClear();

    await act(async () => {
      fireEvent.paste(window, fakeClipboardEvent);
    });
    expect(onElementsChange).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('handles drag over, drag leave, and drop with image files', async () => {
    const onElementsChange = vi.fn();
    render(<Canvas {...defaultProps} onElementsChange={onElementsChange} />);

    const container = screen.getByTestId('canvas-container');

    // Drag over with Files
    fireEvent.dragOver(container, {
      dataTransfer: {
        types: ['Files'],
      },
    });

    // Drag leave
    fireEvent.dragLeave(container);

    // Drop with image file
    const imageFile = new File(['image-bytes'], 'drop.png', { type: 'image/png' });
    await act(async () => {
      fireEvent.drop(container, {
        clientX: 200,
        clientY: 200,
        dataTransfer: {
          files: [imageFile],
        },
      });
    });

    expect(onElementsChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'img-test-1' })]),
      'create'
    );
  });

  it('sets cursor styles for pan tool and spacebar gestures', () => {
    const { rerender } = render(<Canvas {...defaultProps} currentTool="pan" />);
    const container = screen.getByTestId('canvas-container');
    expect(container.className).toContain('cursor-grab');

    // Space down
    fireEvent.keyDown(window, { code: 'Space' });
    expect(container.className).toContain('cursor-grab');
    fireEvent.keyUp(window, { code: 'Space' });

    // Select tool
    rerender(<Canvas {...defaultProps} currentTool="select" />);
    expect(container.className).toContain('cursor-default');

    // Pointer move when space is held pans
    fireEvent.pointerDown(container, { clientX: 100, clientY: 100, button: 0 });
    expect(container.className).toContain('cursor-grabbing');
    fireEvent.keyUp(window, { code: 'Space' });
  });
});
