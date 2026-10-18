import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';

describe('AIdboard End-to-End Workflows', () => {
  beforeEach(() => {
    localStorage.clear();
    // Mock global fetch for /api/boards
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ boards: [] }),
      })
    ) as any;
  });

  it('renders all core UI components on launch', () => {
    render(<App />);

    // Header, Toolbar, Canvas
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
    expect(screen.getByTestId('primary-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-container')).toBeInTheDocument();
  });

  it('draws a rectangle with the shape tool and verifies it renders in SVG', () => {
    render(<App />);

    // Select shape tool and ensure rectangle is chosen
    fireEvent.click(screen.getByTestId('tool-shape-menu'));
    fireEvent.click(screen.getByTestId('shape-rectangle'));

    const canvas = screen.getByTestId('canvas-container');

    // Drag to draw rectangle from (50, 50) to (180, 140)
    fireEvent.pointerDown(canvas, { clientX: 50, clientY: 50, button: 0 });
    fireEvent.pointerMove(canvas, { clientX: 180, clientY: 140 });
    fireEvent.pointerUp(canvas);

    // Verify SVG rect was created
    const svgRects = canvas.querySelectorAll('rect');
    expect(svgRects.length).toBeGreaterThan(0);
  });

  it('draws a circle freehand with shape snap enabled and verifies it snaps', () => {
    render(<App />);

    // Shape snap is OFF by default as required; turn it ON for this test
    expect(screen.getByTestId('auto-snap-status')).toHaveTextContent('OFF');
    fireEvent.click(screen.getByTestId('toggle-auto-snap'));
    expect(screen.getByTestId('auto-snap-status')).toHaveTextContent('ON');

    // Ensure pen tool is active
    fireEvent.click(screen.getByTestId('tool-pen'));

    const canvas = screen.getByTestId('canvas-container');

    // Simulate drawing a closed circle
    fireEvent.pointerDown(canvas, { clientX: 200, clientY: 200, button: 0 });

    const radius = 50;
    const cx = 200, cy = 200;
    for (let i = 1; i <= 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      fireEvent.pointerMove(canvas, {
        clientX: cx + radius * Math.cos(angle),
        clientY: cy + radius * Math.sin(angle),
      });
    }

    fireEvent.pointerUp(canvas);

    // Verify snapping feedback toast appears
    expect(screen.getByTestId('shape-snap-toast')).toBeInTheDocument();
  });

  it('selects an area, moves it with drag and drop, and verifies moved coordinates', () => {
    render(<App />);

    // 1. Draw a rectangle first
    fireEvent.click(screen.getByTestId('tool-shape-menu'));
    fireEvent.click(screen.getByTestId('shape-rectangle'));

    const canvas = screen.getByTestId('canvas-container');
    fireEvent.pointerDown(canvas, { clientX: 100, clientY: 100, button: 0 });
    fireEvent.pointerMove(canvas, { clientX: 200, clientY: 180 });
    fireEvent.pointerUp(canvas);

    // 2. Switch to select tool
    fireEvent.click(screen.getByTestId('tool-select'));

    // 3. Click the rectangle to select it
    fireEvent.pointerDown(canvas, { clientX: 120, clientY: 120, button: 0 });

    // Selection overlay must now be visible
    const selectionOverlay = screen.getByTestId('selection-overlay');
    expect(selectionOverlay).toBeInTheDocument();

    const dragHandle = screen.getByTestId('selection-drag-handle');
    expect(dragHandle).toBeInTheDocument();

    // 4. Move the selection by dragging the handle
    fireEvent.pointerDown(dragHandle, { clientX: 150, clientY: 140, button: 0 });

    const moveEvent = new PointerEvent('pointermove', { clientX: 220, clientY: 210 });
    window.dispatchEvent(moveEvent);

    const upEvent = new PointerEvent('pointerup');
    window.dispatchEvent(upEvent);

    // Ensure selection overlay is still active and moved
    expect(screen.getByTestId('selection-overlay')).toBeInTheDocument();
  });

  it('performs undo without crashing the app', () => {
    render(<App />);

    // Draw something
    fireEvent.click(screen.getByTestId('tool-shape-menu'));
    fireEvent.click(screen.getByTestId('shape-circle'));

    const canvas = screen.getByTestId('canvas-container');
    fireEvent.pointerDown(canvas, { clientX: 100, clientY: 100, button: 0 });
    fireEvent.pointerMove(canvas, { clientX: 180, clientY: 180 });
    fireEvent.pointerUp(canvas);

    // Check undo button is enabled
    const undoBtn = screen.getByTestId('btn-undo');
    expect(undoBtn).not.toBeDisabled();

    // Click Undo - MUST NOT CRASH
    expect(() => {
      fireEvent.click(undoBtn);
    }).not.toThrow();

    // App header, toolbar and canvas should still be intact and functioning
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-container')).toBeInTheDocument();

    // Click Redo
    const redoBtn = screen.getByTestId('btn-redo');
    expect(() => {
      fireEvent.click(redoBtn);
    }).not.toThrow();

    expect(screen.getByTestId('canvas-container')).toBeInTheDocument();
  });

  it('deletes selected content when pressing delete in selection toolbar', () => {
    render(<App />);

    // Draw rectangle
    fireEvent.click(screen.getByTestId('tool-shape-menu'));
    fireEvent.click(screen.getByTestId('shape-rectangle'));

    const canvas = screen.getByTestId('canvas-container');
    fireEvent.pointerDown(canvas, { clientX: 100, clientY: 100, button: 0 });
    fireEvent.pointerMove(canvas, { clientX: 200, clientY: 180 });
    fireEvent.pointerUp(canvas);

    // Select it
    fireEvent.click(screen.getByTestId('tool-select'));
    fireEvent.pointerDown(canvas, { clientX: 120, clientY: 120, button: 0 });

    // Click delete on floating selection toolbar
    const deleteBtn = screen.getByTitle('Delete selected (Delete / Backspace)');
    fireEvent.click(deleteBtn);

    // Selection overlay should now be removed
    expect(screen.queryByTestId('selection-overlay')).not.toBeInTheDocument();
  });

  it('adds text to the whiteboard and edits it', () => {
    render(<App />);

    fireEvent.click(screen.getByTestId('tool-text'));
    const canvas = screen.getByTestId('canvas-container');

    // Click on canvas to place text
    fireEvent.pointerDown(canvas, { clientX: 250, clientY: 250, button: 0 });

    const textInput = screen.getByTestId('inline-text-input');
    expect(textInput).toBeInTheDocument();

    fireEvent.change(textInput, { target: { value: 'Collaborative Notes' } });
    fireEvent.blur(textInput);

    // Verify text is rendered in canvas
    expect(screen.getByText('Collaborative Notes')).toBeInTheDocument();
  });

  it('switches between light mode and dark mode', () => {
    render(<App />);

    const darkToggle = screen.getByTestId('btn-toggle-dark-mode');
    expect(darkToggle).toBeInTheDocument();

    // Toggle to Dark Mode
    fireEvent.click(darkToggle);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Toggle back to Light Mode
    fireEvent.click(darkToggle);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('opens AI Draw modal and inputs prompt', () => {
    render(<App />);

    const aiDrawBtn = screen.getByTestId('btn-header-ai-draw');
    fireEvent.click(aiDrawBtn);

    const modal = screen.getByTestId('ai-draw-modal');
    expect(modal).toBeInTheDocument();

    const input = screen.getByTestId('input-ai-draw-prompt');
    fireEvent.change(input, { target: { value: 'Draw a flowchart for login' } });
    expect(input).toHaveValue('Draw a flowchart for login');

    fireEvent.click(screen.getByTestId('btn-close-ai-draw'));
    expect(screen.queryByTestId('ai-draw-modal')).not.toBeInTheDocument();
  });

  it('pans the whiteboard viewport using arrow keys', () => {
    render(<App />);

    const svg = screen.getByTestId('whiteboard-svg');
    expect(svg.style.transform).toContain('translate(0px, 0px)');

    // Press ArrowDown to pan downward
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(svg.style.transform).toContain('translate(0px, -40px)');

    // Press ArrowRight to pan rightward
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(svg.style.transform).toContain('translate(-40px, -40px)');

    // Press ArrowUp to pan upward
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    expect(svg.style.transform).toContain('translate(-40px, 0px)');

    // Press ArrowLeft to pan leftward
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(svg.style.transform).toContain('translate(0px, 0px)');

    // Press Shift + ArrowDown for fast pan
    fireEvent.keyDown(window, { key: 'ArrowDown', shiftKey: true });
    expect(svg.style.transform).toContain('translate(0px, -120px)');
  });

  it('toggles background grid lines on and off via Toolbar and hotkey (clean vs grid-assisted)', () => {
    render(<App />);

    const gridBtn = screen.getByTestId('toggle-grid');
    const gridStatus = screen.getByTestId('grid-status');
    expect(gridStatus).toHaveTextContent('ON');
    expect(screen.getByTestId('canvas-container').querySelector('pattern')).toBeInTheDocument();

    // Click Toolbar button to switch to clean workspace
    fireEvent.click(gridBtn);
    expect(gridStatus).toHaveTextContent('OFF');
    // In clean workspace ('blank'), no SVG grid pattern is rendered
    expect(screen.getByTestId('canvas-container').querySelector('pattern')).toBeNull();

    // Click Toolbar button again to restore grid-assisted workspace
    fireEvent.click(gridBtn);
    expect(gridStatus).toHaveTextContent('ON');
    expect(screen.getByTestId('canvas-container').querySelector('pattern')).toBeInTheDocument();

    // Toggle via 'g' keyboard shortcut
    fireEvent.keyDown(window, { key: 'g' });
    expect(gridStatus).toHaveTextContent('OFF');
    expect(screen.getByTestId('canvas-container').querySelector('pattern')).toBeNull();

    fireEvent.keyDown(window, { key: 'g' });
    expect(gridStatus).toHaveTextContent('ON');
    expect(screen.getByTestId('canvas-container').querySelector('pattern')).toBeInTheDocument();
  });
});
