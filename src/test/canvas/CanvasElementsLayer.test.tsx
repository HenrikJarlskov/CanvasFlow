import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CanvasElementsLayer } from '../../components/canvas/CanvasElementsLayer';
import { BoardElement } from '../../types/whiteboard';

describe('CanvasElementsLayer Component', () => {
  it('renders stroke elements with selection styling', () => {
    const elements: BoardElement[] = [
      {
        id: 'stroke-1',
        type: 'stroke',
        points: [{ x: 10, y: 10 }, { x: 20, y: 20 }, { x: 30, y: 30 }],
        color: '#dc2626',
        strokeWidth: 4,
        opacity: 0.8,
        createdAt: 1000,
        updatedAt: 1000,
        zIndex: 1,
      },
      {
        id: 'stroke-2',
        type: 'stroke',
        points: [{ x: 50, y: 50 }, { x: 60, y: 60 }],
        color: '#2563eb',
        strokeWidth: 2,
        opacity: 1,
        createdAt: 1000,
        updatedAt: 1000,
        zIndex: 2,
      },
    ];

    render(
      <svg>
        <CanvasElementsLayer
          elements={elements}
          selectedIds={['stroke-1']}
          editingTextId={null}
        />
      </svg>
    );

    const el1 = screen.getByTestId('element-stroke-1');
    const el2 = screen.getByTestId('element-stroke-2');
    expect(el1).toBeInTheDocument();
    expect(el1).toHaveClass('filter drop-shadow-xs');
    expect(el2).toBeInTheDocument();
    expect(el2).not.toHaveClass('filter drop-shadow-xs');
  });

  it('renders all shape variants (line, arrow, rectangle, circle, triangle)', () => {
    const elements: BoardElement[] = [
      {
        id: 'shape-line',
        type: 'shape',
        shapeType: 'line',
        x: 0,
        y: 0,
        x2: 100,
        y2: 100,
        width: 100,
        height: 100,
        color: '#18181b',
        strokeWidth: 2,
        opacity: 1,
        createdAt: 1000,
        updatedAt: 1000,
        zIndex: 1,
      },
      {
        id: 'shape-arrow',
        type: 'shape',
        shapeType: 'arrow',
        x: 10,
        y: 10,
        x2: 110,
        y2: 110,
        width: 100,
        height: 100,
        color: '#2563eb',
        strokeWidth: 4,
        opacity: 1,
        createdAt: 1000,
        updatedAt: 1000,
        zIndex: 2,
      },
      {
        id: 'shape-rect',
        type: 'shape',
        shapeType: 'rectangle',
        x: 20,
        y: 20,
        width: 80,
        height: 60,
        color: '#059669',
        fillColor: '#d1fae5',
        strokeWidth: 2,
        opacity: 1,
        createdAt: 1000,
        updatedAt: 1000,
        zIndex: 3,
      },
      {
        id: 'shape-circle',
        type: 'shape',
        shapeType: 'circle',
        x: 30,
        y: 30,
        width: 50,
        height: 50,
        color: '#7c3aed',
        strokeWidth: 3,
        opacity: 1,
        createdAt: 1000,
        updatedAt: 1000,
        zIndex: 4,
      },
      {
        id: 'shape-triangle',
        type: 'shape',
        shapeType: 'triangle',
        x: 40,
        y: 40,
        width: 60,
        height: 70,
        color: '#d97706',
        strokeWidth: 2,
        opacity: 1,
        createdAt: 1000,
        updatedAt: 1000,
        zIndex: 5,
      },
    ];

    render(
      <svg>
        <CanvasElementsLayer
          elements={elements}
          selectedIds={[]}
          editingTextId={null}
        />
      </svg>
    );

    expect(screen.getByTestId('element-shape-line')).toBeInTheDocument();
    expect(screen.getByTestId('element-shape-arrow')).toBeInTheDocument();
    expect(screen.getByTestId('element-shape-rect')).toBeInTheDocument();
    expect(screen.getByTestId('element-shape-circle')).toBeInTheDocument();
    expect(screen.getByTestId('element-shape-triangle')).toBeInTheDocument();
  });

  it('renders text elements and hides currently editing text element', () => {
    const elements: BoardElement[] = [
      {
        id: 'text-1',
        type: 'text',
        x: 100,
        y: 100,
        width: 100,
        height: 40,
        text: 'Line 1\nLine 2',
        color: '#000000',
        fontSize: 16,
        fontFamily: 'sans-serif',
        createdAt: 1000,
        updatedAt: 1000,
        zIndex: 1,
      },
      {
        id: 'text-editing',
        type: 'text',
        x: 200,
        y: 200,
        width: 100,
        height: 40,
        text: 'Being edited',
        color: '#000000',
        fontSize: 16,
        fontFamily: 'sans-serif',
        createdAt: 1000,
        updatedAt: 1000,
        zIndex: 2,
      },
    ];

    render(
      <svg>
        <CanvasElementsLayer
          elements={elements}
          selectedIds={[]}
          editingTextId="text-editing"
        />
      </svg>
    );

    expect(screen.getByTestId('element-text-1')).toBeInTheDocument();
    expect(screen.getByText('Line 1')).toBeInTheDocument();
    expect(screen.getByText('Line 2')).toBeInTheDocument();
    expect(screen.queryByTestId('element-text-editing')).not.toBeInTheDocument();
  });

  it('renders image elements and handles fallback unknown types', () => {
    const elements: BoardElement[] = [
      {
        id: 'img-1',
        type: 'image',
        x: 50,
        y: 50,
        width: 200,
        height: 150,
        src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      },
      {
        id: 'unknown-1',
        type: 'unknown' as any,
      } as any,
    ];

    render(
      <svg>
        <CanvasElementsLayer
          elements={elements}
          selectedIds={[]}
          editingTextId={null}
        />
      </svg>
    );

    expect(screen.getByTestId('element-img-1')).toBeInTheDocument();
    expect(screen.queryByTestId('element-unknown-1')).not.toBeInTheDocument();
  });
});
