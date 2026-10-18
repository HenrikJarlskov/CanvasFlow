import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ColorPickerPopover, COLOR_PALETTE } from '../../components/toolbar/ColorPickerPopover';

describe('ColorPickerPopover Component', () => {
  it('renders current color dot and opens popover on click', () => {
    const onChangeColor = vi.fn();
    render(<ColorPickerPopover color="#2563eb" onChangeColor={onChangeColor} />);

    const button = screen.getByTestId('color-picker-btn');
    expect(button).toBeInTheDocument();
    expect(screen.queryByTestId('color-picker-popover')).not.toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.getByTestId('color-picker-popover')).toBeInTheDocument();
    expect(screen.getByText('Color Palette')).toBeInTheDocument();
  });

  it('selects a palette color swatch, invokes callback and closes popover', () => {
    const onChangeColor = vi.fn();
    render(<ColorPickerPopover color="#18181b" onChangeColor={onChangeColor} />);

    fireEvent.click(screen.getByTestId('color-picker-btn'));

    const emeraldSwatch = screen.getByTestId(`color-swatch-#059669`);
    expect(emeraldSwatch).toBeInTheDocument();

    fireEvent.click(emeraldSwatch);
    expect(onChangeColor).toHaveBeenCalledWith('#059669');
    expect(screen.queryByTestId('color-picker-popover')).not.toBeInTheDocument();
  });

  it('allows custom color input selection', () => {
    const onChangeColor = vi.fn();
    render(<ColorPickerPopover color="#18181b" onChangeColor={onChangeColor} />);

    fireEvent.click(screen.getByTestId('color-picker-btn'));

    const customInput = screen.getByTestId('custom-color-input');
    expect(customInput).toBeInTheDocument();

    fireEvent.change(customInput, { target: { value: '#ff00ff' } });
    expect(onChangeColor).toHaveBeenCalledWith('#ff00ff');
  });

  it('closes popover on outside click', () => {
    render(
      <div>
        <div data-testid="outside-area">Outside</div>
        <ColorPickerPopover color="#18181b" onChangeColor={vi.fn()} />
      </div>
    );

    fireEvent.click(screen.getByTestId('color-picker-btn'));
    expect(screen.getByTestId('color-picker-popover')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside-area'));
    expect(screen.queryByTestId('color-picker-popover')).not.toBeInTheDocument();
  });
});
