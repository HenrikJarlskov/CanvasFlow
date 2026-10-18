import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ShapesMenuPopover } from '../../components/toolbar/ShapesMenuPopover';
import { ShapeType } from '../../types/whiteboard';

describe('ShapesMenuPopover Component', () => {
  it('renders shape trigger button and opens popover on click', () => {
    const onSelectShape = vi.fn();
    const onActivate = vi.fn();

    render(
      <ShapesMenuPopover
        selectedShape="rectangle"
        onSelectShape={onSelectShape}
        isActive={false}
        onActivate={onActivate}
      />
    );

    const trigger = screen.getByTestId('tool-shape-menu');
    expect(trigger).toBeInTheDocument();
    expect(screen.queryByTestId('shape-dropdown-menu')).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('shape-dropdown-menu')).toBeInTheDocument();
    expect(screen.getByTestId('shape-rectangle')).toBeInTheDocument();
    expect(screen.getByTestId('shape-circle')).toBeInTheDocument();
    expect(screen.getByTestId('shape-triangle')).toBeInTheDocument();
    expect(screen.getByTestId('shape-line')).toBeInTheDocument();
    expect(screen.getByTestId('shape-arrow')).toBeInTheDocument();
  });

  it('selects circle and calls onSelectShape, onActivate, and closes menu', () => {
    const onSelectShape = vi.fn();
    const onActivate = vi.fn();

    render(
      <ShapesMenuPopover
        selectedShape="rectangle"
        onSelectShape={onSelectShape}
        isActive={true}
        onActivate={onActivate}
      />
    );

    fireEvent.click(screen.getByTestId('tool-shape-menu'));
    fireEvent.click(screen.getByTestId('shape-circle'));

    expect(onSelectShape).toHaveBeenCalledWith('circle');
    expect(onActivate).toHaveBeenCalled();
    expect(screen.queryByTestId('shape-dropdown-menu')).not.toBeInTheDocument();
  });

  it('selects triangle, line, and arrow shapes correctly', () => {
    const onSelectShape = vi.fn();
    const onActivate = vi.fn();

    const { rerender } = render(
      <ShapesMenuPopover
        selectedShape="circle"
        onSelectShape={onSelectShape}
        isActive={true}
        onActivate={onActivate}
      />
    );

    // Triangle
    fireEvent.click(screen.getByTestId('tool-shape-menu'));
    fireEvent.click(screen.getByTestId('shape-triangle'));
    expect(onSelectShape).toHaveBeenCalledWith('triangle');

    // Line
    rerender(
      <ShapesMenuPopover
        selectedShape="triangle"
        onSelectShape={onSelectShape}
        isActive={true}
        onActivate={onActivate}
      />
    );
    fireEvent.click(screen.getByTestId('tool-shape-menu'));
    fireEvent.click(screen.getByTestId('shape-line'));
    expect(onSelectShape).toHaveBeenCalledWith('line');

    // Arrow
    rerender(
      <ShapesMenuPopover
        selectedShape="line"
        onSelectShape={onSelectShape}
        isActive={true}
        onActivate={onActivate}
      />
    );
    fireEvent.click(screen.getByTestId('tool-shape-menu'));
    fireEvent.click(screen.getByTestId('shape-arrow'));
    expect(onSelectShape).toHaveBeenCalledWith('arrow');

    // Rectangle
    rerender(
      <ShapesMenuPopover
        selectedShape="arrow"
        onSelectShape={onSelectShape}
        isActive={true}
        onActivate={onActivate}
      />
    );
    fireEvent.click(screen.getByTestId('tool-shape-menu'));
    fireEvent.click(screen.getByTestId('shape-rectangle'));
    expect(onSelectShape).toHaveBeenCalledWith('rectangle');
  });

  it('closes dropdown when clicking outside', () => {
    render(
      <div>
        <div data-testid="outside-click-target">Outside</div>
        <ShapesMenuPopover
          selectedShape="rectangle"
          onSelectShape={vi.fn()}
          isActive={false}
          onActivate={vi.fn()}
        />
      </div>
    );

    fireEvent.click(screen.getByTestId('tool-shape-menu'));
    expect(screen.getByTestId('shape-dropdown-menu')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside-click-target'));
    expect(screen.queryByTestId('shape-dropdown-menu')).not.toBeInTheDocument();
  });
});
