import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CanvasPreviewsLayer } from '../../components/canvas/CanvasPreviewsLayer';
import { SnappedShapeResult } from '../../utils/shapeDetection';

describe('CanvasPreviewsLayer Component', () => {
  it('returns null when isDrawing is false', () => {
    const { container } = render(
      <svg>
        <CanvasPreviewsLayer
          isDrawing={false}
          currentStroke={[{ x: 0, y: 0 }, { x: 10, y: 10 }]}
          currentShapePreview={null}
          currentTool="pen"
          color="#000000"
          strokeWidth={2}
        />
      </svg>
    );

    expect(screen.queryByTestId('drawing-stroke-preview')).not.toBeInTheDocument();
    expect(screen.queryByTestId('shape-preview')).not.toBeInTheDocument();
  });

  it('renders stroke preview for pen and highlighter', () => {
    const { rerender } = render(
      <svg>
        <CanvasPreviewsLayer
          isDrawing={true}
          currentStroke={[{ x: 0, y: 0 }, { x: 50, y: 50 }]}
          currentShapePreview={null}
          currentTool="pen"
          color="#2563eb"
          strokeWidth={4}
        />
      </svg>
    );

    const penStroke = screen.getByTestId('drawing-stroke-preview');
    expect(penStroke).toBeInTheDocument();
    expect(penStroke).toHaveAttribute('stroke', '#2563eb');
    expect(penStroke).toHaveAttribute('opacity', '1');

    rerender(
      <svg>
        <CanvasPreviewsLayer
          isDrawing={true}
          currentStroke={[{ x: 0, y: 0 }, { x: 50, y: 50 }]}
          currentShapePreview={null}
          currentTool="highlighter"
          color="#dc2626"
          strokeWidth={4}
        />
      </svg>
    );

    const highStroke = screen.getByTestId('drawing-stroke-preview');
    expect(highStroke).toBeInTheDocument();
    expect(highStroke).toHaveAttribute('opacity', '0.35');
  });

  it('renders all shape preview types (line, arrow, rectangle, circle, triangle)', () => {
    const shapePreviews: SnappedShapeResult[] = [
      {
        shapeType: 'line',
        x: 0,
        y: 0,
        x2: 100,
        y2: 100,
        width: 100,
        height: 100,
      },
      {
        shapeType: 'arrow',
        x: 0,
        y: 0,
        x2: 100,
        y2: 100,
        width: 100,
        height: 100,
      },
      {
        shapeType: 'rectangle',
        x: 10,
        y: 10,
        width: 80,
        height: 50,
      },
      {
        shapeType: 'circle',
        x: 20,
        y: 20,
        width: 60,
        height: 60,
      },
      {
        shapeType: 'triangle',
        x: 30,
        y: 30,
        width: 70,
        height: 70,
      },
    ];

    shapePreviews.forEach((preview) => {
      const { unmount } = render(
        <svg>
          <CanvasPreviewsLayer
            isDrawing={true}
            currentStroke={[]}
            currentShapePreview={preview}
            currentTool="shape"
            color="#059669"
            strokeWidth={2}
          />
        </svg>
      );

      expect(screen.getByTestId('shape-preview')).toBeInTheDocument();
      unmount();
    });
  });
});
