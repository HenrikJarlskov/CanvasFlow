import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Toolbar, COLOR_PALETTE, STROKE_WIDTHS } from '../components/Toolbar';

describe('Toolbar Component', () => {
  const defaultProps = {
    currentTool: 'pen' as const,
    onSelectTool: vi.fn(),
    selectedShape: 'rectangle' as const,
    onSelectShape: vi.fn(),
    color: '#18181b',
    onChangeColor: vi.fn(),
    strokeWidth: 4,
    onChangeStrokeWidth: vi.fn(),
    autoSnap: true,
    onToggleAutoSnap: vi.fn(),
    canUndo: true,
    canRedo: false,
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    zoom: 1,
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onResetZoom: vi.fn(),
  };

  it('renders primary toolbar and zoom controls', () => {
    render(<Toolbar {...defaultProps} />);
    expect(screen.getByTestId('primary-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('zoom-controls')).toBeInTheDocument();
  });

  it('switches between all drawing and editing tools', () => {
    const onSelectTool = vi.fn();
    render(<Toolbar {...defaultProps} onSelectTool={onSelectTool} />);

    // Select tool
    fireEvent.click(screen.getByTestId('tool-select'));
    expect(onSelectTool).toHaveBeenCalledWith('select');

    // Pen tool
    fireEvent.click(screen.getByTestId('tool-pen'));
    expect(onSelectTool).toHaveBeenCalledWith('pen');

    // Highlighter tool
    fireEvent.click(screen.getByTestId('tool-highlighter'));
    expect(onSelectTool).toHaveBeenCalledWith('highlighter');

    // Eraser tool
    fireEvent.click(screen.getByTestId('tool-eraser'));
    expect(onSelectTool).toHaveBeenCalledWith('eraser');

    // Text tool
    fireEvent.click(screen.getByTestId('tool-text'));
    expect(onSelectTool).toHaveBeenCalledWith('text');

    // Pan tool
    fireEvent.click(screen.getByTestId('tool-pan'));
    expect(onSelectTool).toHaveBeenCalledWith('pan');
  });

  it('opens shapes menu and selects shapes (rectangle, circle, triangle, arrow, line)', () => {
    const onSelectShape = vi.fn();
    const onSelectTool = vi.fn();
    render(<Toolbar {...defaultProps} onSelectShape={onSelectShape} onSelectTool={onSelectTool} />);

    // Open shape menu
    fireEvent.click(screen.getByTestId('tool-shape-menu'));
    expect(screen.getByTestId('shape-dropdown-menu')).toBeInTheDocument();

    // Select circle
    fireEvent.click(screen.getByTestId('shape-circle'));
    expect(onSelectShape).toHaveBeenCalledWith('circle');
    expect(onSelectTool).toHaveBeenCalledWith('shape');

    // Reopen menu and select triangle
    fireEvent.click(screen.getByTestId('tool-shape-menu'));
    fireEvent.click(screen.getByTestId('shape-triangle'));
    expect(onSelectShape).toHaveBeenCalledWith('triangle');

    // Reopen menu and select arrow
    fireEvent.click(screen.getByTestId('tool-shape-menu'));
    fireEvent.click(screen.getByTestId('shape-arrow'));
    expect(onSelectShape).toHaveBeenCalledWith('arrow');

    // Reopen menu and select line
    fireEvent.click(screen.getByTestId('tool-shape-menu'));
    fireEvent.click(screen.getByTestId('shape-line'));
    expect(onSelectShape).toHaveBeenCalledWith('line');
  });

  it('toggles Auto-Shape Snapping on and off', () => {
    const onToggleAutoSnap = vi.fn();
    const { rerender } = render(<Toolbar {...defaultProps} autoSnap={true} onToggleAutoSnap={onToggleAutoSnap} />);

    expect(screen.getByTestId('auto-snap-status')).toHaveTextContent('ON');
    fireEvent.click(screen.getByTestId('toggle-auto-snap'));
    expect(onToggleAutoSnap).toHaveBeenCalledTimes(1);

    rerender(<Toolbar {...defaultProps} autoSnap={false} onToggleAutoSnap={onToggleAutoSnap} />);
    expect(screen.getByTestId('auto-snap-status')).toHaveTextContent('OFF');
  });

  it('toggles background grid lines on and off between clean and grid-assisted workspace', () => {
    const onToggleGrid = vi.fn();
    const { rerender } = render(<Toolbar {...defaultProps} background="dots" onToggleGrid={onToggleGrid} />);

    const gridBtn = screen.getByTestId('toggle-grid');
    expect(gridBtn).toBeInTheDocument();
    expect(screen.getByTestId('grid-status')).toHaveTextContent('ON');
    expect(gridBtn).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(gridBtn);
    expect(onToggleGrid).toHaveBeenCalledTimes(1);

    // Switch to clean workspace ('blank')
    rerender(<Toolbar {...defaultProps} background="blank" onToggleGrid={onToggleGrid} />);
    expect(screen.getByTestId('grid-status')).toHaveTextContent('OFF');
    expect(gridBtn).toHaveAttribute('aria-pressed', 'false');

    // Switch to engineering grid ('grid')
    rerender(<Toolbar {...defaultProps} background="grid" onToggleGrid={onToggleGrid} />);
    expect(screen.getByTestId('grid-status')).toHaveTextContent('ON');
    expect(gridBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('falls back to onChangeBackground when onToggleGrid is not provided', () => {
    const onChangeBackground = vi.fn();
    render(<Toolbar {...defaultProps} background="grid" onChangeBackground={onChangeBackground} />);

    fireEvent.click(screen.getByTestId('toggle-grid'));
    expect(onChangeBackground).toHaveBeenCalledWith('blank');
  });

  it('opens color picker popover and selects swatches and custom hex', () => {
    const onChangeColor = vi.fn();
    render(<Toolbar {...defaultProps} onChangeColor={onChangeColor} />);

    // Open color picker
    fireEvent.click(screen.getByTestId('color-picker-btn'));
    expect(screen.getByTestId('color-picker-popover')).toBeInTheDocument();

    // Select a color swatch (e.g. blue)
    const blueColor = COLOR_PALETTE.find((c) => c.name === 'Blue')?.hex || '#2563eb';
    fireEvent.click(screen.getByTestId(`color-swatch-${blueColor}`));
    expect(onChangeColor).toHaveBeenCalledWith(blueColor);

    // Open again and test custom color input
    fireEvent.click(screen.getByTestId('color-picker-btn'));
    const customInput = screen.getByTestId('custom-color-input');
    fireEvent.change(customInput, { target: { value: '#ff00aa' } });
    expect(onChangeColor).toHaveBeenCalledWith('#ff00aa');
  });

  it('selects stroke widths (Fine 2, Medium 4, Thick 8, Chunky 16)', () => {
    const onChangeStrokeWidth = vi.fn();
    render(<Toolbar {...defaultProps} onChangeStrokeWidth={onChangeStrokeWidth} />);

    for (const sw of STROKE_WIDTHS) {
      fireEvent.click(screen.getByTestId(`stroke-width-${sw.value}`));
      expect(onChangeStrokeWidth).toHaveBeenCalledWith(sw.value);
    }
  });

  it('handles undo and redo with proper enabled/disabled states', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    const { rerender } = render(
      <Toolbar {...defaultProps} canUndo={true} canRedo={false} onUndo={onUndo} onRedo={onRedo} />
    );

    const undoBtn = screen.getByTestId('btn-undo');
    const redoBtn = screen.getByTestId('btn-redo');

    expect(undoBtn).not.toBeDisabled();
    expect(redoBtn).toBeDisabled();

    fireEvent.click(undoBtn);
    expect(onUndo).toHaveBeenCalledTimes(1);

    // Rerender with canRedo = true
    rerender(<Toolbar {...defaultProps} canUndo={false} canRedo={true} onUndo={onUndo} onRedo={onRedo} />);
    expect(undoBtn).toBeDisabled();
    expect(redoBtn).not.toBeDisabled();

    fireEvent.click(redoBtn);
    expect(onRedo).toHaveBeenCalledTimes(1);
  });

  it('triggers zoom in, zoom out, and reset zoom', () => {
    const onZoomIn = vi.fn();
    const onZoomOut = vi.fn();
    const onResetZoom = vi.fn();
    render(
      <Toolbar
        {...defaultProps}
        zoom={1.5}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onResetZoom={onResetZoom}
      />
    );

    expect(screen.getByTestId('btn-zoom-reset')).toHaveTextContent('150%');

    fireEvent.click(screen.getByTestId('btn-zoom-in'));
    expect(onZoomIn).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('btn-zoom-out'));
    expect(onZoomOut).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('btn-zoom-reset'));
    expect(onResetZoom).toHaveBeenCalledTimes(1);
  });

  it('triggers image import and AI draw assistant from toolbar', () => {
    const onOpenAiDraw = vi.fn();
    const onImportImageFile = vi.fn();
    render(
      <Toolbar
        {...defaultProps}
        onOpenAiDraw={onOpenAiDraw}
        onImportImageFile={onImportImageFile}
      />
    );

    // AI Draw button
    const aiDrawBtn = screen.getByTestId('tool-ai-draw');
    expect(aiDrawBtn).toBeInTheDocument();
    fireEvent.click(aiDrawBtn);
    expect(onOpenAiDraw).toHaveBeenCalledTimes(1);

    // Import button
    const importBtn = screen.getByTestId('tool-import');
    expect(importBtn).toBeInTheDocument();
    fireEvent.click(importBtn);

    const fileInput = screen.getByTestId('toolbar-image-file-input') as HTMLInputElement;
    const testFile = new File(['fake image content'], 'diagram.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [testFile] } });
    expect(onImportImageFile).toHaveBeenCalledWith(testFile);
  });

  it('triggers onOpenImportModal when Import tool button is clicked', () => {
    const onOpenImportModal = vi.fn();
    render(<Toolbar {...defaultProps} onOpenImportModal={onOpenImportModal} />);

    fireEvent.click(screen.getByTestId('tool-import'));
    expect(onOpenImportModal).toHaveBeenCalledTimes(1);
  });
});
