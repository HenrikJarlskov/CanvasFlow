import { describe, it, expect } from 'vitest';
import {
  detectShape,
  dist,
  pathLength,
  getBounds,
  polygonArea,
} from '../utils/shapeDetection';
import { Point } from '../types/whiteboard';

describe('Shape Detection Algorithms', () => {
  it('correctly calculates distance and path length', () => {
    const p1: Point = { x: 0, y: 0 };
    const p2: Point = { x: 3, y: 4 };
    expect(dist(p1, p2)).toBe(5);

    const points: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ];
    expect(pathLength(points)).toBe(20);
  });

  it('correctly computes bounding box and polygon area', () => {
    const squarePoints: Point[] = [
      { x: 10, y: 10 },
      { x: 110, y: 10 },
      { x: 110, y: 110 },
      { x: 10, y: 110 },
    ];
    const bounds = getBounds(squarePoints);
    expect(bounds.width).toBe(100);
    expect(bounds.height).toBe(100);
    expect(polygonArea(squarePoints)).toBe(10000);
  });

  it('detects a straight line', () => {
    const linePoints: Point[] = [];
    for (let i = 0; i <= 20; i++) {
      linePoints.push({ x: 50 + i * 10, y: 100 + (Math.sin(i) * 0.5) });
    }
    const detected = detectShape(linePoints);
    expect(detected).not.toBeNull();
    expect(detected?.shapeType).toBe('line');
    expect(detected?.x).toBe(50);
    expect(detected?.x2).toBe(250);
  });

  it('detects an arrow with a hook at the tip', () => {
    const arrowPoints: Point[] = [];
    // Shaft: (0, 100) -> (200, 100)
    for (let i = 0; i <= 20; i++) {
      arrowPoints.push({ x: i * 10, y: 100 });
    }
    // Tip hook backwards: (200, 100) -> (170, 80)
    for (let i = 1; i <= 7; i++) {
      arrowPoints.push({ x: 200 - i * 4, y: 100 - i * 3 });
    }
    const detected = detectShape(arrowPoints);
    expect(detected).not.toBeNull();
    expect(detected?.shapeType).toBe('arrow');
  });

  it('detects a square and snaps to 1:1 aspect ratio', () => {
    // Generate square points with slight hand-drawn noise
    const squarePoints: Point[] = [];
    const size = 120;
    const startX = 50, startY = 50;

    // Top edge
    for (let i = 0; i <= 10; i++) squarePoints.push({ x: startX + (size * i) / 10, y: startY + (i % 2) });
    // Right edge
    for (let i = 1; i <= 10; i++) squarePoints.push({ x: startX + size + (i % 2), y: startY + (size * i) / 10 });
    // Bottom edge
    for (let i = 1; i <= 10; i++) squarePoints.push({ x: startX + size - (size * i) / 10, y: startY + size + (i % 2) });
    // Left edge
    for (let i = 1; i <= 10; i++) squarePoints.push({ x: startX + (i % 2), y: startY + size - (size * i) / 10 });

    const detected = detectShape(squarePoints);
    expect(detected).not.toBeNull();
    expect(detected?.shapeType).toBe('rectangle');
    // For square, width and height should be equal!
    expect(detected?.width).toBeCloseTo(detected?.height || 0, 1);
  });

  it('detects a rectangle with unequal sides', () => {
    const rectPoints: Point[] = [];
    const width = 200, height = 80;
    const startX = 30, startY = 30;

    // Top edge
    for (let i = 0; i <= 10; i++) rectPoints.push({ x: startX + (width * i) / 10, y: startY });
    // Right edge
    for (let i = 1; i <= 10; i++) rectPoints.push({ x: startX + width, y: startY + (height * i) / 10 });
    // Bottom edge
    for (let i = 1; i <= 10; i++) rectPoints.push({ x: startX + width - (width * i) / 10, y: startY + height });
    // Left edge
    for (let i = 1; i <= 10; i++) rectPoints.push({ x: startX, y: startY + height - (height * i) / 10 });

    const detected = detectShape(rectPoints);
    expect(detected).not.toBeNull();
    expect(detected?.shapeType).toBe('rectangle');
    expect(detected?.width).toBeGreaterThan(detected?.height || 0);
  });

  it('detects a circle', () => {
    const circlePoints: Point[] = [];
    const radius = 60;
    const cx = 150, cy = 150;
    const numPoints = 36;

    for (let i = 0; i <= numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      circlePoints.push({
        x: cx + radius * Math.cos(angle) + (Math.sin(i) * 1.5),
        y: cy + radius * Math.sin(angle) + (Math.cos(i) * 1.5),
      });
    }

    const detected = detectShape(circlePoints);
    expect(detected).not.toBeNull();
    expect(detected?.shapeType).toBe('circle');
    expect(detected?.width).toBeCloseTo(detected?.height || 0, 1);
  });

  it('detects a hand-drawn wavy circle and does not misclassify as square', () => {
    const wavyCirclePoints: Point[] = [];
    const r = 50;
    const cx = 200, cy = 200;
    const numPoints = 28;

    for (let i = 0; i <= numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      // Add hand wobble
      const wobble = ((i % 3) - 1) * 3;
      wavyCirclePoints.push({
        x: cx + (r + wobble) * Math.cos(angle),
        y: cy + (r + wobble) * Math.sin(angle),
      });
    }

    const detected = detectShape(wavyCirclePoints);
    expect(detected).not.toBeNull();
    expect(detected?.shapeType).toBe('circle');
  });

  it('detects a triangle', () => {
    const trianglePoints: Point[] = [];
    // Vertex 1: (150, 50)
    // Vertex 2: (250, 200)
    // Vertex 3: (50, 200)
    for (let i = 0; i <= 10; i++) {
      trianglePoints.push({ x: 150 + 10 * i, y: 50 + 15 * i });
    }
    for (let i = 1; i <= 10; i++) {
      trianglePoints.push({ x: 250 - 20 * i, y: 200 });
    }
    for (let i = 1; i <= 10; i++) {
      trianglePoints.push({ x: 50 + 10 * i, y: 200 - 15 * i });
    }

    const detected = detectShape(trianglePoints);
    expect(detected).not.toBeNull();
    expect(detected?.shapeType).toBe('triangle');
  });

  it('rejects too small strokes or random squiggles', () => {
    const tinyPoints: Point[] = [
      { x: 10, y: 10 },
      { x: 12, y: 12 },
      { x: 14, y: 11 },
    ];
    expect(detectShape(tinyPoints)).toBeNull();
  });
});
