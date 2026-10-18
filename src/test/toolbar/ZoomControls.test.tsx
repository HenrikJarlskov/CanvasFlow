import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ZoomControls } from '../../components/toolbar/ZoomControls';

describe('ZoomControls Component', () => {
  it('renders current zoom level percentage and controls', () => {
    const onZoomIn = vi.fn();
    const onZoomOut = vi.fn();
    const onResetZoom = vi.fn();

    render(
      <ZoomControls
        zoom={1.5}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onResetZoom={onResetZoom}
      />
    );

    expect(screen.getByTestId('zoom-controls')).toBeInTheDocument();
    expect(screen.getByTestId('btn-zoom-reset')).toHaveTextContent('150%');
  });

  it('triggers zoom in, zoom out, and reset zoom callbacks', () => {
    const onZoomIn = vi.fn();
    const onZoomOut = vi.fn();
    const onResetZoom = vi.fn();

    render(
      <ZoomControls
        zoom={1.0}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onResetZoom={onResetZoom}
      />
    );

    fireEvent.click(screen.getByTestId('btn-zoom-in'));
    expect(onZoomIn).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('btn-zoom-out'));
    expect(onZoomOut).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('btn-zoom-reset'));
    expect(onResetZoom).toHaveBeenCalledTimes(1);
  });
});
