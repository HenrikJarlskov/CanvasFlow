import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { CanvasBackground } from '../../components/canvas/CanvasBackground';
import { BackgroundType } from '../../types/whiteboard';

describe('CanvasBackground Component', () => {
  it('renders null when background is blank', () => {
    const { container } = render(
      <CanvasBackground background="blank" zoom={1} pan={{ x: 0, y: 0 }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders dots pattern SVG', () => {
    const { container } = render(
      <CanvasBackground background="dots" zoom={1.5} pan={{ x: 10, y: 20 }} />
    );
    const pattern = container.querySelector('#dot-pattern');
    expect(pattern).toBeInTheDocument();
  });

  it('renders grid pattern SVG', () => {
    const { container } = render(
      <CanvasBackground background="grid" zoom={1} pan={{ x: 0, y: 0 }} />
    );
    const pattern = container.querySelector('#grid-pattern');
    expect(pattern).toBeInTheDocument();
  });

  it('renders blueprint pattern SVG', () => {
    const { container } = render(
      <CanvasBackground background="blueprint" zoom={2} pan={{ x: 50, y: 50 }} />
    );
    const pattern = container.querySelector('#blueprint-pattern');
    expect(pattern).toBeInTheDocument();
  });

  it('renders nothing for dark canvas background (styled via container)', () => {
    const { container } = render(
      <CanvasBackground background="dark" zoom={1} pan={{ x: 0, y: 0 }} />
    );
    expect(container.querySelector('svg')).toBeNull();
  });
});
