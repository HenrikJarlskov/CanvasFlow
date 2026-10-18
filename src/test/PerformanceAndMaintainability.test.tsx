import { describe, it, expect, beforeEach } from 'vitest';
import {
  detectShape,
  detectShapeAsync,
  clearShapeDetectionCache,
  getShapeDetectionCacheStats,
  generateStrokeFingerprint,
} from '../utils/shapeDetection';
import {
  getElementBounds,
  isPointNearElement,
  clearSpatialBoundsCache,
  duplicateElements,
  renderPointsToSvgPath,
} from '../utils/canvasGeometry';
import {
  preloadImage,
  preloadBoardImages,
  clearImageCache,
  getImageCacheSize,
  renderBoardToCanvasAsync,
} from '../utils/export';
import { BoardElement, Point } from '../types/whiteboard';
import { render, screen } from '@testing-library/react';
import { WhiteboardNotifications } from '../components/WhiteboardNotifications';

describe('Performance, Async Execution & Maintainability Improvements', () => {
  beforeEach(() => {
    clearShapeDetectionCache();
    clearSpatialBoundsCache();
    clearImageCache();
  });

  describe('Suggestion 1: Shape Detection Caching & Async Non-Blocking Execution', () => {
    it('caches shape detection results and records cache hits', () => {
      // 100x100 square stroke points
      const squarePoints: Point[] = [
        { x: 100, y: 100 },
        { x: 200, y: 100 },
        { x: 200, y: 200 },
        { x: 100, y: 200 },
        { x: 100, y: 100 },
      ];

      const initialStats = getShapeDetectionCacheStats();
      expect(initialStats.size).toBe(0);
      expect(initialStats.hits).toBe(0);

      // First run: Cache miss
      const firstRun = detectShape(squarePoints);
      expect(firstRun).not.toBeNull();
      expect(firstRun?.shapeType).toBe('rectangle');

      const afterFirstStats = getShapeDetectionCacheStats();
      expect(afterFirstStats.size).toBe(1);
      expect(afterFirstStats.misses).toBe(1);
      expect(afterFirstStats.hits).toBe(0);

      // Second run with identical points: Cache hit!
      const secondRun = detectShape(squarePoints);
      expect(secondRun).toEqual(firstRun);

      const afterSecondStats = getShapeDetectionCacheStats();
      expect(afterSecondStats.hits).toBe(1);
    });

    it('asynchronously detects shapes without blocking using detectShapeAsync', async () => {
      const linePoints: Point[] = [
        { x: 10, y: 10 },
        { x: 50, y: 10 },
        { x: 100, y: 10 },
        { x: 150, y: 10 },
        { x: 200, y: 10 },
      ];

      const promise = detectShapeAsync(linePoints);
      expect(promise).toBeInstanceOf(Promise);

      const result = await promise;
      expect(result).not.toBeNull();
      expect(result?.shapeType).toBe('line');

      // Second async call hits cache immediately
      const cachedResult = await detectShapeAsync(linePoints);
      expect(cachedResult).toEqual(result);
      expect(getShapeDetectionCacheStats().hits).toBeGreaterThan(0);
    });

    it('generates a stable stroke fingerprint', () => {
      const points: Point[] = [
        { x: 10, y: 20 },
        { x: 30, y: 40 },
        { x: 50, y: 60 },
      ];
      const fp1 = generateStrokeFingerprint(points);
      const fp2 = generateStrokeFingerprint(points);
      expect(fp1).toBe(fp2);
      expect(fp1).toContain('3_10_20');
    });
  });

  describe('Suggestion 2: Image Asset Caching & Preloading for Fast Export', () => {
    it('caches preloaded image instances', async () => {
      const testDataUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>';

      expect(getImageCacheSize()).toBe(0);

      // Preload image
      const img1 = await preloadImage(testDataUrl);
      expect(img1).toBeDefined();
      expect(getImageCacheSize()).toBe(1);

      // Subsequent preload should retrieve from cache
      const img2 = await preloadImage(testDataUrl);
      expect(img2).toBe(img1);
      expect(getImageCacheSize()).toBe(1);
    });

    it('preloads multiple board images in parallel via preloadBoardImages', async () => {
      const elements: BoardElement[] = [
        {
          id: 'img_1',
          type: 'image',
          x: 10,
          y: 10,
          width: 50,
          height: 50,
          src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" id="1"></svg>',
          opacity: 1,
          zIndex: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'stroke_1',
          type: 'stroke',
          points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
          color: '#000',
          strokeWidth: 2,
          opacity: 1,
          zIndex: 2,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'img_2',
          type: 'image',
          x: 100,
          y: 100,
          width: 50,
          height: 50,
          src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" id="2"></svg>',
          opacity: 1,
          zIndex: 3,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const cache = await preloadBoardImages(elements);
      expect(cache.size).toBeGreaterThanOrEqual(2);
    });

    it('renders board to canvas asynchronously without errors', async () => {
      const elements: BoardElement[] = [
        {
          id: 'shape_rect',
          type: 'shape',
          shapeType: 'rectangle',
          x: 50,
          y: 50,
          width: 100,
          height: 80,
          color: '#ff0000',
          strokeWidth: 2,
          opacity: 1,
          zIndex: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const canvas = await renderBoardToCanvasAsync(elements, 'blank');
      expect(canvas).toBeDefined();
      expect(canvas.width).toBeGreaterThan(0);
      expect(canvas.height).toBeGreaterThan(0);
    });

    it('reuses renderPointsToSvgPath as single source of truth for SVG export paths', () => {
      const points: Point[] = [
        { x: 10, y: 10 },
        { x: 50, y: 30 },
        { x: 90, y: 10 },
      ];
      const svgPath = renderPointsToSvgPath(points);
      expect(svgPath).toContain('M 10 10');
      expect(svgPath).toContain('Q 50 30');
    });
  });

  describe('Suggestion 3: Spatial Indexing & Viewport AABB Fast-Rejection', () => {
    it('computes and caches element bounding box accurately', () => {
      const strokeEl: BoardElement = {
        id: 'stroke_box',
        type: 'stroke',
        points: [
          { x: 100, y: 150 },
          { x: 300, y: 250 },
          { x: 200, y: 400 },
        ],
        color: '#000',
        strokeWidth: 4,
        opacity: 1,
        zIndex: 1,
        createdAt: 1000,
        updatedAt: 1000,
      };

      const bounds1 = getElementBounds(strokeEl);
      expect(bounds1.minX).toBe(100);
      expect(bounds1.minY).toBe(150);
      expect(bounds1.maxX).toBe(300);
      expect(bounds1.maxY).toBe(400);
      expect(bounds1.width).toBe(200);
      expect(bounds1.height).toBe(250);

      // Cache hit test
      const bounds2 = getElementBounds(strokeEl);
      expect(bounds2).toBe(bounds1); // Reference equality from cache
    });

    it('rejects points far outside element bounding box in O(1) via AABB pre-check', () => {
      const complexStroke: BoardElement = {
        id: 'complex_stroke',
        type: 'stroke',
        // 50 points in a localized 100x100 box
        points: Array.from({ length: 50 }, (_, i) => ({ x: 100 + i, y: 100 + (i % 5) * 10 })),
        color: '#000',
        strokeWidth: 2,
        opacity: 1,
        zIndex: 1,
        createdAt: 1,
        updatedAt: 1,
      };

      // Point at (900, 900) is far away and should reject immediately
      const farPoint: Point = { x: 900, y: 900 };
      expect(isPointNearElement(farPoint, complexStroke, 12)).toBe(false);

      // Point directly on stroke should match
      const closePoint: Point = { x: 120, y: 100 };
      expect(isPointNearElement(closePoint, complexStroke, 12)).toBe(true);
    });
  });

  describe('Suggestion 4: Centralized Element Duplication & Code Reuse', () => {
    it('duplicates strokes, shapes, and text with specified offset and unique IDs', () => {
      const elements: BoardElement[] = [
        {
          id: 'stroke_1',
          type: 'stroke',
          points: [{ x: 10, y: 20 }, { x: 30, y: 40 }],
          color: '#18181b',
          strokeWidth: 4,
          opacity: 1,
          zIndex: 1,
          createdAt: 1000,
          updatedAt: 1000,
        },
        {
          id: 'rect_1',
          type: 'shape',
          shapeType: 'rectangle',
          x: 100,
          y: 200,
          width: 50,
          height: 60,
          color: '#18181b',
          strokeWidth: 2,
          opacity: 1,
          zIndex: 2,
          createdAt: 1000,
          updatedAt: 1000,
        },
      ];

      const duplicated = duplicateElements(elements, ['stroke_1', 'rect_1'], 25);
      expect(duplicated).toHaveLength(2);

      // Verify stroke offset
      const dupStroke = duplicated.find((el) => el.type === 'stroke') as any;
      expect(dupStroke.id).not.toBe('stroke_1');
      expect(dupStroke.points[0]).toEqual({ x: 35, y: 45 });

      // Verify rectangle offset
      const dupRect = duplicated.find((el) => el.type === 'shape') as any;
      expect(dupRect.id).not.toBe('rect_1');
      expect(dupRect.x).toBe(125);
      expect(dupRect.y).toBe(225);
    });

    it('returns empty array when no elements are selected for duplication', () => {
      const elements: BoardElement[] = [
        {
          id: 'el_1',
          type: 'text',
          x: 10,
          y: 10,
          width: 100,
          height: 30,
          text: 'Hello',
          color: '#000',
          fontSize: 16,
          fontFamily: 'Inter',
          zIndex: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      ];
      expect(duplicateElements(elements, [])).toEqual([]);
    });
  });

  describe('Suggestion 5: Subcomponent Extraction & Notifications', () => {
    it('renders snap toast notification when snapToast is present', () => {
      const { unmount } = render(
        <WhiteboardNotifications snapToast="Snapped to Rectangle" aiDrawLoading={false} />
      );

      const toast = screen.getByTestId('shape-snap-toast');
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveTextContent('Snapped to Rectangle');
      unmount();
    });

    it('renders AI draw loading indicator when aiDrawLoading is true', () => {
      const { unmount } = render(
        <WhiteboardNotifications snapToast={null} aiDrawLoading={true} />
      );

      const indicator = screen.getByTestId('ai-draw-canvas-indicator');
      expect(indicator).toBeInTheDocument();
      unmount();
    });

    it('renders nothing when there are no active notifications', () => {
      const { container } = render(
        <WhiteboardNotifications snapToast={null} aiDrawLoading={false} />
      );
      expect(container.firstChild).toBeNull();
    });
  });
});
