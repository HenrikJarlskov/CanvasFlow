/**
 * @file CanvasBackground.tsx
 * @description Dynamic infinite grid background renderer.
 * Computes SVG repetitive pattern offsets aligned with current camera pan and zoom:
 * - 'dots': Regular isometric stippled dot grid
 * - 'grid': Engineering graph paper grid
 * - 'blueprint': Architectural cross-hatched blueprint grid
 * - 'blank': Clean transparent slate
 */

import React from 'react';
import { BackgroundType } from '../../types/whiteboard';

/**
 * Props for the CanvasBackground component.
 */
interface CanvasBackgroundProps {
  /** Background pattern theme ('dots' | 'grid' | 'blueprint' | 'blank') */
  background: BackgroundType;
  /** Viewport zoom factor */
  zoom: number;
  /** Viewport 2D pan translation */
  pan: { x: number; y: number };
}

/**
 * Infinite SVG pattern layer pinned underneath the interactive whiteboard canvas.
 */
export const CanvasBackground: React.FC<CanvasBackgroundProps> = ({
  background,
  zoom,
  pan,
}) => {
  if (background === 'blank') return null;

  return (
    <>
      {background === 'dots' && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
          <defs>
            <pattern
              id="dot-pattern"
              x={pan.x % (24 * zoom)}
              y={pan.y % (24 * zoom)}
              width={24 * zoom}
              height={24 * zoom}
              patternUnits="userSpaceOnUse"
            >
              <circle cx={12 * zoom} cy={12 * zoom} r={1.5 * Math.min(1.5, zoom)} fill="#94a3b8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-pattern)" />
        </svg>
      )}

      {background === 'grid' && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25">
          <defs>
            <pattern
              id="grid-pattern"
              x={pan.x % (28 * zoom)}
              y={pan.y % (28 * zoom)}
              width={28 * zoom}
              height={28 * zoom}
              patternUnits="userSpaceOnUse"
            >
              <path d={`M ${28 * zoom} 0 L 0 0 0 ${28 * zoom}`} fill="none" stroke="#64748b" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      )}

      {background === 'blueprint' && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          <defs>
            <pattern
              id="blueprint-pattern"
              x={pan.x % (30 * zoom)}
              y={pan.y % (30 * zoom)}
              width={30 * zoom}
              height={30 * zoom}
              patternUnits="userSpaceOnUse"
            >
              <path d={`M ${30 * zoom} 0 L 0 0 0 ${30 * zoom}`} fill="none" stroke="#60a5fa" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#blueprint-pattern)" />
        </svg>
      )}
    </>
  );
};
