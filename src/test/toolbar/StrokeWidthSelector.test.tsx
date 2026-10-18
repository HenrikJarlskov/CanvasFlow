import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { StrokeWidthSelector, STROKE_WIDTHS } from '../../components/toolbar/StrokeWidthSelector';

describe('StrokeWidthSelector Component', () => {
  it('renders all stroke width options and marks the active one', () => {
    const onChangeStrokeWidth = vi.fn();
    render(
      <StrokeWidthSelector strokeWidth={4} onChangeStrokeWidth={onChangeStrokeWidth} />
    );

    STROKE_WIDTHS.forEach((sw) => {
      const btn = screen.getByTestId(`stroke-width-${sw.value}`);
      expect(btn).toBeInTheDocument();
      if (sw.value === 4) {
        expect(btn).toHaveAttribute('aria-pressed', 'true');
      } else {
        expect(btn).toHaveAttribute('aria-pressed', 'false');
      }
    });
  });

  it('triggers onChangeStrokeWidth when clicking an option', () => {
    const onChangeStrokeWidth = vi.fn();
    render(
      <StrokeWidthSelector strokeWidth={2} onChangeStrokeWidth={onChangeStrokeWidth} />
    );

    fireEvent.click(screen.getByTestId('stroke-width-8'));
    expect(onChangeStrokeWidth).toHaveBeenCalledWith(8);
  });
});
