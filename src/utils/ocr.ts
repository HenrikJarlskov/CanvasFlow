/**
 * @file ocr.ts
 * @description Optical Character Recognition (OCR) pipeline for handwriting and diagram text.
 * Integrates client-side Tesseract.js with high-contrast canvas rasterization to transcribe
 * hand-drawn notes, labels, mathematical formulas, and sketches into digital text.
 */

import { BoardElement, BoundingBox } from '../types/whiteboard';

/**
 * Result structure returned upon completing OCR transcription.
 */
export interface OcrResult {
  /** Transcribed plaintext string extracted from the drawing */
  text: string;
  /** Estimated accuracy confidence percentage (0 to 100) */
  confidence: number;
  /** Canvas bounding box coordinates of the analyzed elements */
  boundingBox: BoundingBox;
}

/**
 * Calculates the bounding box enclosing a collection of heterogeneous board elements.
 *
 * Complex Loop Explanation:
 * Scans each element in $O(N)$ time:
 * - For strokes: examines every vertex in `el.points` updating `[minX, minY, maxX, maxY]`.
 * - For shapes: checks start `(x, y)` and end `(x2, y2)` coordinates.
 * - For text & images: accounts for width, height, and font-metrics.
 * Returns default dimensions if the input list is empty.
 *
 * @param elements - Whiteboard elements to measure
 * @returns Bounding box with min/max coordinates and dimensions
 */
export function getElementsBoundingBox(elements: BoardElement[]): BoundingBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    if (el.type === 'stroke') {
      // Loop over stroke points to find extrema
      for (const p of el.points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
    } else if (el.type === 'shape') {
      const x1 = Math.min(el.x, el.x2 ?? el.x + el.width);
      const y1 = Math.min(el.y, el.y2 ?? el.y + el.height);
      const x2 = Math.max(el.x, el.x2 ?? el.x + el.width);
      const y2 = Math.max(el.y, el.y2 ?? el.y + el.height);
      if (x1 < minX) minX = x1;
      if (y1 < minY) minY = y1;
      if (x2 > maxX) maxX = x2;
      if (y2 > maxY) maxY = y2;
    } else if (el.type === 'text') {
      const w = el.width || el.text.length * (el.fontSize * 0.6) || 100;
      const h = el.height || el.fontSize * 1.3 || 30;
      if (el.x < minX) minX = el.x;
      if (el.y < minY) minY = el.y;
      if (el.x + w > maxX) maxX = el.x + w;
      if (el.y + h > maxY) maxY = el.y + h;
    } else if (el.type === 'image') {
      if (el.x < minX) minX = el.x;
      if (el.y < minY) minY = el.y;
      if (el.x + el.width > maxX) maxX = el.x + el.width;
      if (el.y + el.height > maxY) maxY = el.y + el.height;
    }
  }

  if (minX === Infinity) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Renders selected board elements onto a high-contrast offscreen canvas,
 * and performs OCR using Tesseract.js.
 *
 * Algorithmic Pipeline:
 * 1. Measures tight bounds of the selected elements.
 * 2. Allocates a temporary offscreen `<canvas>` at 2x supersampling with high-contrast pure white background.
 * 3. Draws strokes and shape outlines in crisp black `#000000` to maximize OCR engine thresholding accuracy.
 * 4. Dynamically imports `tesseract.js` to avoid bundle bloat.
 * 5. Runs Tesseract worker logging progress percentage to the `onProgress` callback.
 * 6. Returns recognized text string, confidence score, and bounding coordinates.
 *
 * @param elements - Selected whiteboard elements to recognize
 * @param onProgress - Optional progress handler (fraction 0..1, status label)
 * @returns Promise resolving to the recognized text and confidence metrics
 */
export async function recognizeBoardContent(
  elements: BoardElement[],
  onProgress?: (progress: number, status: string) => void
): Promise<OcrResult> {
  if (elements.length === 0) {
    throw new Error('No elements selected for text recognition.');
  }

  const bounds = getElementsBoundingBox(elements);
  const padding = 30;
  const scale = 2; // Upscale for crisp OCR recognition

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(100, Math.ceil((bounds.width + padding * 2) * scale));
  canvas.height = Math.max(60, Math.ceil((bounds.height + padding * 2) * scale));

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize canvas context for OCR.');
  }

  // Pure white background for max OCR contrast
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.scale(scale, scale);
  ctx.translate(-bounds.minX + padding, -bounds.minY + padding);

  // High-contrast element drawing loop: forces black strokes and text for optimal binarization
  for (const el of elements) {
    ctx.save();
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#000000';
    ctx.lineWidth = Math.max(3, (el as any).strokeWidth || 3);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (el.type === 'stroke') {
      if (el.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x, el.points[i].y);
        }
        ctx.stroke();
      }
    } else if (el.type === 'shape') {
      if (el.shapeType === 'line' || el.shapeType === 'arrow') {
        const x2 = el.x2 ?? el.x + el.width;
        const y2 = el.y2 ?? el.y + el.height;
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      } else if (el.shapeType === 'rectangle') {
        ctx.strokeRect(el.x, el.y, el.width, el.height);
      } else if (el.shapeType === 'circle') {
        ctx.beginPath();
        ctx.ellipse(
          el.x + el.width / 2,
          el.y + el.height / 2,
          Math.abs(el.width / 2),
          Math.abs(el.height / 2),
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      } else if (el.shapeType === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(el.x + el.width / 2, el.y);
        ctx.lineTo(el.x + el.width, el.y + el.height);
        ctx.lineTo(el.x, el.y + el.height);
        ctx.closePath();
        ctx.stroke();
      }
    } else if (el.type === 'text') {
      ctx.font = `${el.fontSize || 20}px ${el.fontFamily || 'sans-serif'}`;
      ctx.textBaseline = 'top';
      ctx.fillText(el.text, el.x, el.y);
    }

    ctx.restore();
  }

  onProgress?.(0.1, 'Initializing OCR worker...');

  const { default: Tesseract } = await import('tesseract.js');

  const result = await Tesseract.recognize(canvas, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress?.(m.progress, 'Reading handwriting and text...');
      } else if (m.status) {
        onProgress?.(0.3, m.status);
      }
    },
  });

  const rawText = result.data.text.trim();
  const confidence = result.data.confidence;

  return {
    text: rawText,
    confidence,
    boundingBox: bounds,
  };
}
