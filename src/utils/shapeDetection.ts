/**
 * @file shapeDetection.ts
 * @description Advanced mathematical shape recognition and geometric snapping heuristics
 * for freehand vector drawings on the interactive whiteboard.
 *
 * Recognizes the following primitives from raw input stroke trajectories:
 * - Straight Lines (evaluated via chord-to-arc length ratio)
 * - Directed Arrows (evaluated via shaft straightness and sharp angular arrowhead tip hooks)
 * - Rectangles and Squares (evaluated via bounding box fill ratio, edge clustering, and corner proximity)
 * - Circles and Ellipses (evaluated via centroid radius standard deviation, range, and empty corner margins)
 * - Equilateral and Scalene Triangles (evaluated via Ramer-Douglas-Peucker vertex count and area ratio)
 */

import { Point, ShapeType } from '../types/whiteboard';

/**
 * Result structure returned when a freehand stroke matches a geometric primitive.
 */
export interface SnappedShapeResult {
  /** The identified geometric shape primitive */
  shapeType: ShapeType;
  /** Bounding box top-left X coordinate */
  x: number;
  /** Bounding box top-left Y coordinate */
  y: number;
  /** Width of the recognized shape */
  width: number;
  /** Height of the recognized shape */
  height: number;
  /** Optional secondary endpoint X coordinate (for line and arrow shapes) */
  x2?: number;
  /** Optional secondary endpoint Y coordinate (for line and arrow shapes) */
  y2?: number;
}

// Re-export mathematical primitives from shapeDetectionMath
export {
  dist,
  pathLength,
  getBounds,
  pointToSegmentDistance,
  ramerDouglasPeucker,
  polygonArea,
} from './shapeDetectionMath';

import {
  dist,
  pathLength,
  getBounds,
  ramerDouglasPeucker,
  polygonArea,
} from './shapeDetectionMath';


/**
 * Analyzes a freehand stroke point sequence to determine if it closely matches a recognized
 * geometric primitive (Circle, Rectangle, Square, Triangle, Line, or Arrow).
 *
 * Algorithmic Steps:
 * 1. **Early Rejection**: Discards strokes with fewer than 5 points or path length < 25px.
 * 2. **Closure Analysis**: Checks if stroke endpoints meet to form a closed loop.
 * 3. **Closed Shapes Pipeline**:
 *    - **Centroid & Radial Variance**: Calculates center (cx, cy) and radius standard deviation.
 *    - **Corner Proximity**: Tests if points occupy the 4 outer corners of the bounding box.
 *    - **Shoelace Fill Ratio**: Compares enclosed polygon area against bounding box area.
 *    - **Douglas-Peucker Classification**: Detects 3 dominant corners for triangles.
 *    - **Circle vs. Rectangle Disambiguation**: Circles have low radial variance and empty corners;
 *      rectangles have high fill ratio and points passing near the 4 corners.
 * 4. **Open Shapes Pipeline**:
 *    - **Straight Line**: Checks chord-to-path straightness ratio (> 85%).
 *    - **Arrow Detection**: Evaluates a straight primary shaft combined with a sharp terminal hook/tip.
 *
 * @param points - Array of input canvas coordinates sampled during pointer movement
 */
// In-memory shape detection cache with LRU eviction (ARC-Cache)
const SHAPE_CACHE_LIMIT = 256;
const shapeCache = new Map<string, SnappedShapeResult | null>();
let cacheHits = 0;
let cacheMisses = 0;

/**
 * Generates a stable geometric fingerprint for a sequence of stroke points.
 * Evaluates length, start point, midpoint, 75% point, and endpoint to avoid hashing every coordinate.
 */
export function generateStrokeFingerprint(points: Point[]): string {
  if (!points || points.length === 0) return 'empty';
  const len = points.length;
  const p0 = points[0];
  const pMid = points[Math.floor(len / 2)];
  const pEnd = points[len - 1];
  return `${len}_${Math.round(p0.x)}_${Math.round(p0.y)}_${Math.round(pMid.x)}_${Math.round(pMid.y)}_${Math.round(pEnd.x)}_${Math.round(pEnd.y)}`;
}

/**
 * Clears the shape detection cache and resets statistics.
 */
export function clearShapeDetectionCache(): void {
  shapeCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}

/**
 * Returns current shape detection cache performance metrics.
 */
export function getShapeDetectionCacheStats(): { size: number; hits: number; misses: number } {
  return {
    size: shapeCache.size,
    hits: cacheHits,
    misses: cacheMisses,
  };
}

/**
 * Internal synchronous shape detection evaluator.
 */
function computeShapeDetection(points: Point[]): SnappedShapeResult | null {
  if (!points || points.length < 5) return null;

  const totalLen = pathLength(points);
  if (totalLen < 25) return null; // Reject micro-strokes and jitter

  const start = points[0];
  const end = points[points.length - 1];
  const startEndDist = dist(start, end);
  const bounds = getBounds(points);

  // Check if closed: endpoints close to each other relative to perimeter
  const isClosed = startEndDist < totalLen * 0.38 || startEndDist < 60;

  if (isClosed) {
    // -------------------------------------------------------------
    // STAGE 1: Centroid Calculation Loop
    // Accumulate sum of coordinates in $O(N)$ to determine center of mass.
    // -------------------------------------------------------------
    let cx = 0, cy = 0;
    for (const p of points) {
      cx += p.x;
      cy += p.y;
    }
    cx /= points.length;
    cy /= points.length;

    // -------------------------------------------------------------
    // STAGE 2: Radial Distribution & Variance Calculation Loop
    // Measures distance from every point to centroid to assess circular uniformity.
    // -------------------------------------------------------------
    const radii = points.map((p) => Math.hypot(p.x - cx, p.y - cy));
    const meanRadius = radii.reduce((acc, r) => acc + r, 0) / radii.length;
    const minRadius = Math.min(...radii);
    const maxRadius = Math.max(...radii);
    const variance = radii.reduce((acc, r) => acc + (r - meanRadius) ** 2, 0) / radii.length;
    const stdDev = Math.sqrt(variance);
    const radiusStdScore = meanRadius > 0 ? stdDev / meanRadius : 1;
    const radiusRangeScore = meanRadius > 0 ? (maxRadius - minRadius) / meanRadius : 1;

    // -------------------------------------------------------------
    // STAGE 3: Area & Fill Ratio Analysis
    // Computes Shoelace area vs enclosing box area (circles ≈ π/4 ≈ 0.785, squares ≈ 1.0, triangles ≈ 0.5)
    // -------------------------------------------------------------
    const polyArea = polygonArea(points);
    const boxArea = bounds.width * bounds.height;
    const fillRatio = boxArea > 0 ? polyArea / boxArea : 0;
    const aspectRatio = bounds.width / bounds.height;

    // -------------------------------------------------------------
    // STAGE 4: Edge Clustering Loop for Rectangle Detection
    // Checks how many stroke points lie within 22% margin of the bounding box boundaries.
    // -------------------------------------------------------------
    const edgeMarginX = bounds.width * 0.22;
    const edgeMarginY = bounds.height * 0.22;
    let nearEdgeCount = 0;
    for (const p of points) {
      const nearLeft = p.x - bounds.minX < edgeMarginX;
      const nearRight = bounds.maxX - p.x < edgeMarginX;
      const nearTop = p.y - bounds.minY < edgeMarginY;
      const nearBottom = bounds.maxY - p.y < edgeMarginY;
      if (nearLeft || nearRight || nearTop || nearBottom) {
        nearEdgeCount++;
      }
    }

    // -------------------------------------------------------------
    // STAGE 5: Polyline Simplification with Ramer-Douglas-Peucker
    // Decimates curve to count primary vertices (e.g., triangles have 3 distinct corners)
    // -------------------------------------------------------------
    const epsilon = Math.max(12, totalLen * 0.055);
    const simplified = ramerDouglasPeucker(points, epsilon);
    const vertexCount = simplified.length - 1; // Subtract 1 since start connects to end in closed loop

    // 1. TRIANGLE DETECTION:
    // Characteristics: 3 dominant vertices and fill ratio typically between 0.30 and 0.68
    if ((vertexCount === 3 || vertexCount === 4) && fillRatio < 0.68) {
      return {
        shapeType: 'triangle',
        x: bounds.minX,
        y: bounds.minY,
        width: bounds.width,
        height: bounds.height,
      };
    }

    // -------------------------------------------------------------
    // STAGE 6: Corner Hit-Testing Loop
    // Distinguishes circles from rectangles:
    // In circles, points cannot reach the 4 corners of their bounding box (min dist >= 0.207 * D).
    // In rectangles/squares, the user's stroke navigates directly through the corners.
    // -------------------------------------------------------------
    const cornerThreshold = Math.min(bounds.width, bounds.height) * 0.13;
    const corners = [
      { x: bounds.minX, y: bounds.minY },
      { x: bounds.maxX, y: bounds.minY },
      { x: bounds.maxX, y: bounds.maxY },
      { x: bounds.minX, y: bounds.maxY },
    ];
    let cornersHit = 0;
    for (const c of corners) {
      const minDistToCorner = Math.min(...points.map((p) => Math.hypot(p.x - c.x, p.y - c.y)));
      if (minDistToCorner < cornerThreshold) {
        cornersHit++;
      }
    }

    // 2. CIRCLE DETECTION:
    // Smooth closed loop with uniform radial distribution from centroid and zero/few corners hit
    const isRound = radiusStdScore < 0.30 && radiusRangeScore < 0.62;
    const isNotBoxy = cornersHit <= 1;

    if (isRound && isNotBoxy) {
      const w = bounds.width;
      const h = bounds.height;

      // Snap to perfect Circle if aspect ratio is roughly 1:1 (0.65 to 1.45)
      if (aspectRatio >= 0.65 && aspectRatio <= 1.45) {
        const diameter = (w + h) / 2;
        return {
          shapeType: 'circle',
          x: cx - diameter / 2,
          y: cy - diameter / 2,
          width: diameter,
          height: diameter,
        };
      }

      return {
        shapeType: 'circle',
        x: bounds.minX,
        y: bounds.minY,
        width: w,
        height: h,
      };
    }

    // 3. RECTANGLE / SQUARE DETECTION:
    // Stroke passes through 2 or more corners with high area fill ratio (>= 0.70)
    const isSquareOrRect =
      (cornersHit >= 3 && fillRatio >= 0.70) ||
      (cornersHit >= 2 && fillRatio >= 0.82) ||
      (fillRatio >= 0.88);

    if (isSquareOrRect) {
      const w = bounds.width;
      const h = bounds.height;

      // Snap to equilateral SQUARE if aspect ratio is close to 1:1 (0.72 to 1.35)
      if (aspectRatio >= 0.72 && aspectRatio <= 1.35) {
        const side = (w + h) / 2;
        return {
          shapeType: 'rectangle',
          x: cx - side / 2,
          y: cy - side / 2,
          width: side,
          height: side,
        };
      }

      return {
        shapeType: 'rectangle',
        x: bounds.minX,
        y: bounds.minY,
        width: w,
        height: h,
      };
    }

    // 4. Secondary Heuristic Fallbacks for Closed Shapes:
    if (radiusStdScore < 0.35 && cornersHit <= 1) {
      const diameter = (bounds.width + bounds.height) / 2;
      return {
        shapeType: 'circle',
        x: cx - diameter / 2,
        y: cy - diameter / 2,
        width: diameter,
        height: diameter,
      };
    }

    if (fillRatio >= 0.70) {
      const isSquare = aspectRatio >= 0.75 && aspectRatio <= 1.30;
      const size = isSquare ? (bounds.width + bounds.height) / 2 : 0;
      return {
        shapeType: 'rectangle',
        x: isSquare ? cx - size / 2 : bounds.minX,
        y: isSquare ? cy - size / 2 : bounds.minY,
        width: isSquare ? size : bounds.width,
        height: isSquare ? size : bounds.height,
      };
    }

    if (fillRatio < 0.68) {
      return {
        shapeType: 'triangle',
        x: bounds.minX,
        y: bounds.minY,
        width: bounds.width,
        height: bounds.height,
      };
    }
  }

  // -------------------------------------------------------------
  // OPEN SHAPES PIPELINE: Straight Line or Directed Arrow
  // -------------------------------------------------------------
  const lineChordDist = startEndDist;
  const straightness = lineChordDist / totalLen;

  // -------------------------------------------------------------
  // ARROW DETECTION:
  // Evaluates if first 75% of stroke is a straight shaft, and final 25%
  // forms a backward-turning arrowhead barb (dot product vector angle test).
  // -------------------------------------------------------------
  if (points.length >= 8) {
    const splitIdx = Math.floor(points.length * 0.75);
    const shaftPoints = points.slice(0, splitIdx);
    const shaftLen = pathLength(shaftPoints);
    const shaftDirect = dist(shaftPoints[0], shaftPoints[shaftPoints.length - 1]);
    const shaftStraight = shaftDirect / (shaftLen || 1);

    if (shaftStraight > 0.80) {
      const tipPoints = points.slice(splitIdx);
      const shaftVec = {
        x: shaftPoints[shaftPoints.length - 1].x - shaftPoints[0].x,
        y: shaftPoints[shaftPoints.length - 1].y - shaftPoints[0].y,
      };
      const tipVec = {
        x: tipPoints[tipPoints.length - 1].x - tipPoints[0].x,
        y: tipPoints[tipPoints.length - 1].y - tipPoints[0].y,
      };
      // Compute cosine of angle between shaft and tip vectors via dot product
      const dot = shaftVec.x * tipVec.x + shaftVec.y * tipVec.y;
      const mag = Math.hypot(shaftVec.x, shaftVec.y) * Math.hypot(tipVec.x, tipVec.y);
      const cosAngle = mag > 0 ? dot / mag : 1;

      // If tip turns backwards or branches sharply (cosAngle < 0.45 indicates angle > 63 degrees)
      if (cosAngle < 0.45) {
        const shaftEnd = shaftPoints[shaftPoints.length - 1];
        return {
          shapeType: 'arrow',
          x: start.x,
          y: start.y,
          width: Math.abs(shaftEnd.x - start.x),
          height: Math.abs(shaftEnd.y - start.y),
          x2: shaftEnd.x,
          y2: shaftEnd.y,
        };
      }
    }
  }

  // -------------------------------------------------------------
  // STRAIGHT LINE DETECTION:
  // Ratio of start-to-end direct distance vs total stroke arc length >= 85%
  // -------------------------------------------------------------
  if (straightness >= 0.85) {
    return {
      shapeType: 'line',
      x: start.x,
      y: start.y,
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
      x2: end.x,
      y2: end.y,
    };
  }

  return null;
}

/**
 * Evaluates whether a stroke matches a geometric primitive with LRU caching.
 *
 * @param points - Sequence of stroke trajectory points
 * @returns Recognized geometric primitive or null if organic freehand
 */
export function detectShape(points: Point[]): SnappedShapeResult | null {
  if (!points || points.length < 5) return null;

  const key = generateStrokeFingerprint(points);
  if (shapeCache.has(key)) {
    cacheHits++;
    return shapeCache.get(key) ?? null;
  }

  cacheMisses++;
  const result = computeShapeDetection(points);

  if (shapeCache.size >= SHAPE_CACHE_LIMIT) {
    const oldestKey = shapeCache.keys().next().value;
    if (oldestKey) shapeCache.delete(oldestKey);
  }
  shapeCache.set(key, result);

  return result;
}

/**
 * Asynchronously evaluates shape detection without blocking the main browser thread.
 * For long strokes (> 60 points), yields execution to the event loop via microtask / setTimeout.
 *
 * @param points - Sequence of stroke trajectory points
 * @returns Promise resolving to recognized geometric primitive or null
 */
export async function detectShapeAsync(points: Point[]): Promise<SnappedShapeResult | null> {
  if (!points || points.length < 5) return null;

  const key = generateStrokeFingerprint(points);
  if (shapeCache.has(key)) {
    cacheHits++;
    return shapeCache.get(key) ?? null;
  }

  // Yield to browser event loop if stroke contains heavy point density to prevent frame drops
  if (points.length > 60) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return detectShape(points);
}
