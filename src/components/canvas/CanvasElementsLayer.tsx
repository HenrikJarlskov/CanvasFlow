/**
 * @file CanvasElementsLayer.tsx
 * @description High-performance SVG elements layer for AIdboard.
 *
 * Performance Architecture (ENG-01):
 * Wrapped in `React.memo` to isolate element re-rendering. During high-frequency cursor
 * movement updates (60fps) or panning gestures, this layer avoids wasteful re-rendering
 * unless the elements array, selection IDs, or text editing state genuinely mutate.
 */

import React from 'react';
import { BoardElement } from '../../types/whiteboard';
import { renderPointsToSvgPath } from '../../utils/canvasGeometry';

/**
 * Properties for the CanvasElementsLayer component.
 */
interface CanvasElementsLayerProps {
  /** Array of whiteboard elements to render */
  elements: BoardElement[];
  /** IDs of currently selected elements */
  selectedIds: string[];
  /** ID of an element currently in inline text editing mode (hidden here to render HTML textarea) */
  editingTextId: string | null;
}

/**
 * CanvasElementsLayer renders the SVG scene graph:
 * - Freehand smooth quadratic bezier strokes (`<path>`)
 * - Geometric primitives: lines (`<line>`), arrows (`<line>` + `<polygon>` arrowhead),
 *   rectangles (`<rect>`), circles/ellipses (`<ellipse>`), and triangles (`<polygon>`)
 * - Multiline formatted text nodes (`<text>` with `<tspan>`)
 * - Embedded high-resolution images and SVG assets (`<image>`)
 */
export const CanvasElementsLayer: React.FC<CanvasElementsLayerProps> = React.memo(({
  elements,
  selectedIds,
  editingTextId,
}) => {
  return (
    <>
      {/* 
        Elements Iteration Loop:
        Maps each element in ascending z-index layer order to its respective SVG primitive
      */}
      {elements.map((el) => {
        const isSelected = selectedIds.includes(el.id);

        // -------------------------------------------------------------
        // Freehand Vector Stroke
        // -------------------------------------------------------------
        if (el.type === 'stroke') {
          const d = renderPointsToSvgPath(el.points || []);
          return (
            <path
              key={el.id}
              data-testid={`element-${el.id}`}
              d={d}
              fill="none"
              stroke={el.color}
              strokeWidth={el.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={el.opacity ?? 1}
              className={isSelected ? 'filter drop-shadow-xs' : ''}
            />
          );
        }

        // -------------------------------------------------------------
        // Geometric Shape Primitives
        // -------------------------------------------------------------
        if (el.type === 'shape') {
          if (el.shapeType === 'line') {
            const x2 = el.x2 !== undefined ? el.x2 : el.x + (el.width || 0);
            const y2 = el.y2 !== undefined ? el.y2 : (el.height > 0 && (!el.width || el.width === 0) ? el.y + el.height : el.y);
            return (
              <line
                key={el.id}
                data-testid={`element-${el.id}`}
                x1={el.x}
                y1={el.y}
                x2={x2}
                y2={y2}
                stroke={el.color}
                strokeWidth={el.strokeWidth}
                strokeLinecap="round"
              />
            );
          }

          if (el.shapeType === 'arrow') {
            const x2 = el.x2 !== undefined ? el.x2 : el.x + (el.width || 0);
            const y2 = el.y2 !== undefined ? el.y2 : (el.height > 0 && (!el.width || el.width === 0) ? el.y + el.height : el.y);
            // Angle calculation for arrowhead geometry
            const angle = Math.atan2(y2 - el.y, x2 - el.x);
            const headlen = Math.max(12, el.strokeWidth * 3.5);
            const a1X = x2 - headlen * Math.cos(angle - Math.PI / 6);
            const a1Y = y2 - headlen * Math.sin(angle - Math.PI / 6);
            const a2X = x2 - headlen * Math.cos(angle + Math.PI / 6);
            const a2Y = y2 - headlen * Math.sin(angle + Math.PI / 6);

            return (
              <g key={el.id} data-testid={`element-${el.id}`}>
                <line
                  x1={el.x}
                  y1={el.y}
                  x2={x2}
                  y2={y2}
                  stroke={el.color}
                  strokeWidth={el.strokeWidth}
                  strokeLinecap="round"
                />
                <polygon
                  points={`${x2},${y2} ${a1X},${a1Y} ${a2X},${a2Y}`}
                  fill={el.color}
                />
              </g>
            );
          }

          if (el.shapeType === 'rectangle') {
            return (
              <rect
                key={el.id}
                data-testid={`element-${el.id}`}
                x={el.x}
                y={el.y}
                width={el.width}
                height={el.height}
                fill={el.fillColor || 'transparent'}
                stroke={el.color}
                strokeWidth={el.strokeWidth}
                rx={4}
              />
            );
          }

          if (el.shapeType === 'circle') {
            const cx = el.x + el.width / 2;
            const cy = el.y + el.height / 2;
            const rx = Math.abs(el.width / 2);
            const ry = Math.abs(el.height / 2);
            return (
              <ellipse
                key={el.id}
                data-testid={`element-${el.id}`}
                cx={cx}
                cy={cy}
                rx={rx}
                ry={ry}
                fill={el.fillColor || 'transparent'}
                stroke={el.color}
                strokeWidth={el.strokeWidth}
              />
            );
          }

          if (el.shapeType === 'triangle') {
            const points = `${el.x + el.width / 2},${el.y} ${el.x + el.width},${el.y + el.height} ${el.x},${el.y + el.height}`;
            return (
              <polygon
                key={el.id}
                data-testid={`element-${el.id}`}
                points={points}
                fill={el.fillColor || 'transparent'}
                stroke={el.color}
                strokeWidth={el.strokeWidth}
                strokeLinejoin="round"
              />
            );
          }
        }

        // -------------------------------------------------------------
        // Text Label / Note Element
        // -------------------------------------------------------------
        if (el.type === 'text') {
          // If being actively edited, suppress SVG text to display HTML input overlay
          if (editingTextId === el.id) return null;
          const lines = (el.text || '').split('\n');
          const lineHeight = el.fontSize * 1.3;
          return (
            <text
              key={el.id}
              data-testid={`element-${el.id}`}
              x={el.x}
              y={el.y + el.fontSize * 0.85}
              fill={el.color}
              fontSize={el.fontSize}
              fontFamily={el.fontFamily || 'Inter, sans-serif'}
              fontWeight="500"
              className="select-none"
            >
              {/* Multiline text spans loop */}
              {lines.map((line, idx) => (
                <tspan key={idx} x={el.x} dy={idx === 0 ? 0 : lineHeight}>
                  {line}
                </tspan>
              ))}
            </text>
          );
        }

        // -------------------------------------------------------------
        // Embedded Bitmap / SVG Image
        // -------------------------------------------------------------
        if (el.type === 'image') {
          const src = el.src?.startsWith('data:image/svg+xml,PHN2')
            ? el.src.replace('data:image/svg+xml,', 'data:image/svg+xml;base64,')
            : el.src;
          return (
            <image
              key={el.id}
              data-testid={`element-${el.id}`}
              href={src}
              xlinkHref={src}
              x={el.x}
              y={el.y}
              width={el.width}
              height={el.height}
              opacity={el.opacity ?? 1}
              preserveAspectRatio="xMidYMid meet"
              style={{ pointerEvents: 'none' }}
            />
          );
        }

        return null;
      })}
    </>
  );
});
