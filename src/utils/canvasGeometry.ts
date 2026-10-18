/**
 * @file canvasGeometry.ts
 * @description Shared 2D geometry calculations, SVG path rendering, hit-testing,
 * bounding box collision algorithms, and element manipulation utilities.
 */

import { BoardElement, Point } from '../types/whiteboard';

/**
 * Clones a single whiteboard element efficiently without array overhead.
 *
 * @param el - The whiteboard element to clone
 * @returns Deeply cloned element
 */
export function cloneElement(el: BoardElement): BoardElement {
  if (!el) return el;
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(el);
    } catch (e) {}
  }
  if (el.type === 'stroke') {
    return {
      ...el,
      points: (el.points || []).map((p: Point) => ({ ...p })),
    };
  }
  return { ...el };
}

/**
 * Deep clones elements safely to break reference equality and prevent unintentional mutations.
 * Prefers native structuredClone for high performance, with a fast fallback.
 *
 * @param els - Array of whiteboard elements to clone
 * @returns Deeply cloned array of elements
 */
export function cloneElements(els: BoardElement[]): BoardElement[] {
  if (!els || !Array.isArray(els)) return [];
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(els);
    } catch (e) {}
  }
  try {
    return JSON.parse(JSON.stringify(els));
  } catch (e) {
    return els.map(cloneElement);
  }
}

/**
 * Converts a sequence of raw 2D stroke points into a smooth SVG Quadratic Bezier path string (`M ... Q ...`).
 *
 * Complex Loop Explanation:
 * For every consecutive pair of points from `i = 1` to `points.length - 2`, computes the midpoint
 * `(xc, yc) = ((x[i] + x[i+1])/2, (y[i] + y[i+1])/2)`.
 * It generates a quadratic curve instruction `Q x[i] y[i], xc yc` using the current point as control handle
 * and the midpoint as the curve endpoint. This smooths out hand tremors and raw pointer jitter.
 *
 * @param points - Array of input canvas coordinates
 * @returns An SVG path definition string (`d` attribute format)
 */
export function renderPointsToSvgPath(points: Point[]): string {
  if (!points || points.length === 0) return '';
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

// In-memory Spatial Bounds Cache (ARC-Cache)
const spatialBoundsCache = new Map<string, { bounds: BoundingBox; updatedAt: number }>();

/**
 * Clears the spatial bounds cache.
 */
export function clearSpatialBoundsCache(): void {
  spatialBoundsCache.clear();
}

/**
 * Computes or retrieves the cached axis-aligned bounding box (AABB) of an element.
 *
 * @param el - Target whiteboard element
 * @returns BoundingBox dimensions
 */
export function getElementBounds(el: BoardElement): BoundingBox {
  if (!el) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  const cached = spatialBoundsCache.get(el.id);
  if (cached && cached.updatedAt === (el.updatedAt || 0)) {
    return cached.bounds;
  }

  let bounds: BoundingBox;

  if (el.type === 'stroke') {
    const pts = el.points || [];
    if (pts.length === 0) {
      bounds = { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    } else {
      let minX = pts[0].x;
      let minY = pts[0].y;
      let maxX = pts[0].x;
      let maxY = pts[0].y;
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
      bounds = {
        minX,
        minY,
        maxX,
        maxY,
        width: Math.max(1, maxX - minX),
        height: Math.max(1, maxY - minY),
      };
    }
  } else if (el.type === 'shape') {
    const x1 = Math.min(el.x, el.x2 ?? el.x + el.width);
    const y1 = Math.min(el.y, el.y2 ?? el.y + el.height);
    const x2 = Math.max(el.x, el.x2 ?? el.x + el.width);
    const y2 = Math.max(el.y, el.y2 ?? el.y + el.height);
    bounds = {
      minX: x1,
      minY: y1,
      maxX: x2,
      maxY: y2,
      width: Math.max(1, x2 - x1),
      height: Math.max(1, y2 - y1),
    };
  } else if (el.type === 'text') {
    const w = el.width || 120;
    const h = el.height || 40;
    bounds = {
      minX: el.x,
      minY: el.y,
      maxX: el.x + w,
      maxY: el.y + h,
      width: w,
      height: h,
    };
  } else {
    // Image or other rectangular element
    bounds = {
      minX: el.x,
      minY: el.y,
      maxX: el.x + el.width,
      maxY: el.y + el.height,
      width: el.width,
      height: el.height,
    };
  }

  spatialBoundsCache.set(el.id, { bounds, updatedAt: el.updatedAt || 0 });
  return bounds;
}

/**
 * Determines whether a test point `pt` is within proximity of a board element.
 * Uses O(1) Axis-Aligned Bounding Box (AABB) fast-rejection before scanning stroke vertices,
 * vastly improving eraser and selection performance on dense whiteboards.
 *
 * @param pt - Target canvas coordinate being queried
 * @param el - Candidate whiteboard element
 * @param threshold - Distance tolerance buffer in pixels (default: 12)
 * @returns True if the point is within the threshold distance of the element
 */
export function isPointNearElement(pt: Point, el: BoardElement, threshold = 12): boolean {
  if (!el) return false;

  const strokeW = el.type === 'stroke' ? el.strokeWidth || 3 : 0;
  const effectiveThreshold = threshold + strokeW / 2;

  // Spatial Fast-Reject: Check if pt is outside the padded bounding box in O(1)
  const bounds = getElementBounds(el);
  if (
    pt.x < bounds.minX - effectiveThreshold ||
    pt.x > bounds.maxX + effectiveThreshold ||
    pt.y < bounds.minY - effectiveThreshold ||
    pt.y > bounds.maxY + effectiveThreshold
  ) {
    return false;
  }

  // If inside the bounding box, perform detailed collision testing
  if (el.type === 'stroke') {
    return (el.points || []).some(
      (p) => Math.hypot(p.x - pt.x, p.y - pt.y) <= effectiveThreshold
    );
  }

  // Shapes, text, and images match within the padded bounding box
  return true;
}

/**
 * Duplicates a selected subset of elements with a spatial offset and refreshed IDs.
 * Centralizes duplication across shortcuts and toolbar actions to eliminate code duplication.
 *
 * @param elements - Full elements list
 * @param selectedIds - IDs of elements to clone
 * @param offset - Coordinate offset in canvas units (default: 20)
 * @returns Array of newly duplicated elements
 */
export function duplicateElements(
  elements: BoardElement[],
  selectedIds: string[],
  offset = 20
): BoardElement[] {
  if (!elements || selectedIds.length === 0) return [];
  const selected = elements.filter((el) => selectedIds.includes(el.id));
  const now = Date.now();

  return selected.map((el, i) => {
    const newId = `${el.type}_${now}_${i}_${Math.random().toString(36).slice(2, 6)}`;
    if (el.type === 'stroke') {
      return {
        ...el,
        id: newId,
        points: (el.points || []).map((p) => ({ x: p.x + offset, y: p.y + offset })),
        createdAt: now,
        updatedAt: now,
      };
    }
    if (el.type === 'shape') {
      return {
        ...el,
        id: newId,
        x: el.x + offset,
        y: el.y + offset,
        x2: typeof el.x2 === 'number' ? el.x2 + offset : undefined,
        y2: typeof el.y2 === 'number' ? el.y2 + offset : undefined,
        createdAt: now,
        updatedAt: now,
      };
    }
    return {
      ...el,
      id: newId,
      x: el.x + offset,
      y: el.y + offset,
      createdAt: now,
      updatedAt: now,
    };
  });
}

/**
 * Checks whether an element intersects with a rectangular marquee selection box.
 * Used for drag-to-select multiple items on the canvas.
 *
 * Collision Algorithms:
 * - **Stroke**: Checks whether any point in the stroke lies within [minX..maxX, minY..maxY].
 * - **Shape / Text / Image**: Employs Separating Axis Theorem (AABB vs AABB overlap rejection):
 *   Two boxes overlap if and only if neither is strictly to the left, right, above, or below the other.
 *
 * @param el - Board element being checked
 * @param minX - Left edge of selection box
 * @param minY - Top edge of selection box
 * @param maxX - Right edge of selection box
 * @param maxY - Bottom edge of selection box
 * @returns True if the element intersects or is enclosed by the bounding box
 */
export function elementIntersectsBox(
  el: BoardElement,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): boolean {
  if (!el) return false;

  if (el.type === 'stroke') {
    return (el.points || []).some((p) => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY);
  }
  
  if (el.type === 'shape') {
    const elMinX = Math.min(el.x, el.x2 ?? el.x + el.width);
    const elMinY = Math.min(el.y, el.y2 ?? el.y + el.height);
    const elMaxX = Math.max(el.x, el.x2 ?? el.x + el.width);
    const elMaxY = Math.max(el.y, el.y2 ?? el.y + el.height);
    // Standard AABB non-overlap test inverted
    return !(elMaxX < minX || elMinX > maxX || elMaxY < minY || elMinY > maxY);
  }

  if (el.type === 'text') {
    const w = el.width || 120;
    const h = el.height || 40;
    return !(el.x + w < minX || el.x > maxX || el.y + h < minY || el.y > maxY);
  }

  if (el.type === 'image') {
    return !(el.x + el.width < minX || el.x > maxX || el.y + el.height < minY || el.y > maxY);
  }

  return false;
}

/**
 * Ingests an image file from disk or clipboard, calculates proportional aspect-ratio scaling,
 * and creates an initialized Image BoardElement ready to place on the canvas.
 *
 * Constraints:
 * Clamps large dimensions to `maxDim` (default: 450px) while maintaining the original aspect ratio
 * to prevent DOM memory bloat and canvas stutter.
 *
 * @param file - Image file instance from file input or drop event
 * @param targetX - Intended placement X coordinate on canvas
 * @param targetY - Intended placement Y coordinate on canvas
 * @param zIndex - Layer stack order
 * @param maxDim - Maximum allowed dimension constraint (width or height)
 * @returns Promise resolving to a fully populated Image BoardElement
 */
export function createImageElementFromFile(
  file: File,
  targetX: number,
  targetY: number,
  zIndex: number,
  maxDim = 450
): Promise<BoardElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed reading image file'));
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) {
        return reject(new Error('Empty image payload'));
      }
      const img = new Image();
      img.onerror = () => reject(new Error('Failed loading image asset'));
      img.onload = () => {
        let w = img.naturalWidth || 300;
        let h = img.naturalHeight || 200;

        // Proportional dimension scaling clamp loop
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        const newImgEl: BoardElement = {
          id: 'image_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          type: 'image',
          x: Math.round(targetX),
          y: Math.round(targetY),
          width: Math.max(60, w),
          height: Math.max(60, h),
          src,
          opacity: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          zIndex,
        };
        resolve(newImgEl);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Performs an affine scale transformation on a selected set of elements anchored at `(anchorX, anchorY)`.
 * Supports multi-element interactive resizing using bounding box handles.
 *
 * Complex Loop Explanation:
 * Iterates over every element in `baseElements`:
 * - If not in `selectedIds`, returns it unchanged.
 * - For shapes, images, and text: transforms coordinates via `newPos = anchor + (origPos - anchor) * scale`.
 * - For strokes: maps each point `p` in `points` through the affine transformation matrix:
 *   `x' = anchorX + (p.x - anchorX) * scaleX`
 *   `y' = anchorY + (p.y - anchorY) * scaleY`
 *
 * @param baseElements - Snapshot of all elements prior to the transform
 * @param selectedIds - IDs of the elements being resized
 * @param scaleX - Horizontal scaling multiplier
 * @param scaleY - Vertical scaling multiplier
 * @param anchorX - Center/opposite handle anchor point X
 * @param anchorY - Center/opposite handle anchor point Y
 * @returns Transformed copy of elements array
 */
export function scaleSelectedElements(
  baseElements: BoardElement[],
  selectedIds: string[],
  scaleX: number,
  scaleY: number,
  anchorX: number,
  anchorY: number
): BoardElement[] {
  return baseElements.map((el) => {
    if (!selectedIds.includes(el.id)) return el;

    if (el.type === 'shape') {
      const newX = anchorX + (el.x - anchorX) * scaleX;
      const newY = anchorY + (el.y - anchorY) * scaleY;
      const newW = Math.max(10, el.width * Math.abs(scaleX));
      const newH = Math.max(10, el.height * Math.abs(scaleY));
      let x2 = el.x2;
      let y2 = el.y2;
      if (typeof x2 === 'number') x2 = anchorX + (x2 - anchorX) * scaleX;
      if (typeof y2 === 'number') y2 = anchorY + (y2 - anchorY) * scaleY;
      return {
        ...el,
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newW),
        height: Math.round(newH),
        x2: typeof x2 === 'number' ? Math.round(x2) : undefined,
        y2: typeof y2 === 'number' ? Math.round(y2) : undefined,
        updatedAt: Date.now(),
      };
    }
    
    if (el.type === 'image') {
      const newX = anchorX + (el.x - anchorX) * scaleX;
      const newY = anchorY + (el.y - anchorY) * scaleY;
      const newW = Math.max(15, el.width * Math.abs(scaleX));
      const newH = Math.max(15, el.height * Math.abs(scaleY));
      return {
        ...el,
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newW),
        height: Math.round(newH),
        updatedAt: Date.now(),
      };
    }
    
    if (el.type === 'text') {
      const newX = anchorX + (el.x - anchorX) * scaleX;
      const newY = anchorY + (el.y - anchorY) * scaleY;
      const scaleAvg = (Math.abs(scaleX) + Math.abs(scaleY)) / 2;
      const newFontSize = Math.max(10, Math.min(100, Math.round(el.fontSize * scaleAvg)));
      return {
        ...el,
        x: Math.round(newX),
        y: Math.round(newY),
        fontSize: newFontSize,
        updatedAt: Date.now(),
      };
    }
    if (el.type === 'stroke') {
      // Loop over stroke points and apply scaling relative to anchor
      return {
        ...el,
        points: el.points.map((p) => ({
          x: Math.round(anchorX + (p.x - anchorX) * scaleX),
          y: Math.round(anchorY + (p.y - anchorY) * scaleY),
        })),
        updatedAt: Date.now(),
      };
    }
    return el;
  });
}

/**
 * Returns Tailwind CSS background and foreground utility classes corresponding
 * to the selected canvas background style.
 *
 * @param background - Current background style preset ('blank', 'dots', 'grid', 'dark', 'blueprint')
 * @returns CSS class string
 */
export function getCanvasBackgroundThemeClass(background: string): string {
  if (background === 'dark') return 'bg-zinc-900 text-white';
  if (background === 'blueprint') return 'bg-blue-900 text-white';
  return 'bg-slate-50 text-slate-900';
}
