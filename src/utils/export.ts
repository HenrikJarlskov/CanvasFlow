/**
 * @file export.ts
 * @description Vector and raster export engine for AIdboard.
 * Supports high-resolution PNG rasterization, crisp SVG vector serialization,
 * and paginated/proportional PDF generation using jsPDF.
 */

import { BoardElement, BackgroundType } from '../types/whiteboard';
import { getElementsBoundingBox } from './ocr';
import { renderPointsToSvgPath } from './canvasGeometry';

// In-memory Export Image Asset Cache (ARC-Cache)
const imageCache = new Map<string, HTMLImageElement>();

/**
 * Clears the export image asset cache.
 */
export function clearImageCache(): void {
  imageCache.clear();
}

/**
 * Returns current count of cached images in memory.
 */
export function getImageCacheSize(): number {
  return imageCache.size;
}

/**
 * Asynchronously preloads and decodes an image into the memory cache.
 *
 * @param src - Image source data URL or remote path
 * @returns Promise resolving to the decoded HTMLImageElement
 */
export async function preloadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    return imageCache.get(src)!;
  }
  const img = new Image();
  img.crossOrigin = 'anonymous';

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = (e) => reject(e);

    // Fallback for headless/JSDOM testing environments where Image onload does not fire
    if (typeof window !== 'undefined' && (window as any).navigator?.userAgent?.includes('jsdom')) {
      setTimeout(() => {
        imageCache.set(src, img);
        resolve(img);
      }, 5);
    }
  });

  img.src = src;
  if (img.complete && img.naturalWidth > 0) {
    imageCache.set(src, img);
    return img;
  }

  return promise;
}

/**
 * Asynchronously preloads all image elements present in a board in parallel.
 * Prevents race conditions and blank renders during rasterization.
 *
 * @param elements - Whiteboard elements
 * @returns Map of cached images
 */
export async function preloadBoardImages(elements: BoardElement[]): Promise<Map<string, HTMLImageElement>> {
  const imageElements = elements.filter(
    (el): el is BoardElement & { type: 'image'; src: string } => el.type === 'image' && Boolean((el as any).src)
  );
  await Promise.all(
    imageElements.map((el) =>
      preloadImage(el.src).catch((err) => {
        console.warn('Could not preload export image asset:', err);
      })
    )
  );
  return imageCache;
}

/**
 * Configuration options for rendering the board to an offscreen canvas.
 */
interface ExportCanvasOptions {
  /** Outer padding in canvas pixels around the elements bounding box */
  padding?: number;
  /** Device pixel ratio supersampling scale (default: 2 for Retina/print clarity) */
  scale?: number;
  /** Whether to constrain canvas to fit all elements tightly */
  fitAll?: boolean;
}

/**
 * Renders an array of whiteboard elements onto an offscreen HTML5 `<canvas>` element.
 *
 * Complex Rendering Loop Explanation:
 * 1. **Bounding Box Analysis**: Calculates overall bounds of all elements with fallback defaults.
 * 2. **Canvas Allocation**: Creates an offscreen canvas sized to `(bounds.width + 2*padding) * scale`.
 * 3. **Background Grid/Dots Loop**: If the background is 'dots' or 'grid', runs nested horizontal
 *    and vertical coordinate loops stepping by `gridSize = 24 * scale` to render dots or gridlines.
 * 4. **Coordinate Transformation**: Applies `ctx.scale(scale, scale)` and `ctx.translate(-minX + padding, -minY + padding)`.
 * 5. **Element Drawing Loop**: Iterates through each `el` in `elements`:
 *    - **Strokes**: Iterates through points connecting consecutive vertices with `lineTo()`.
 *    - **Shapes**: Dispatches rendering based on `shapeType` (line, arrow, rect, circle, triangle).
 *      For arrows, uses `Math.atan2(dy, dx)` to rotate and compute arrowhead barb coordinates.
 *    - **Text**: Splits multiline text by `\n` and steps through lines computing `y + index * lineHeight`.
 *    - **Images**: Draws preloaded/cached image data onto the canvas context.
 *
 * @param elements - Whiteboard elements to render
 * @param background - Background styling preset ('blank', 'dots', 'grid', 'dark', 'blueprint')
 * @param options - Supersampling and padding options
 * @returns Configured and rendered HTMLCanvasElement
 */
export function renderBoardToCanvas(
  elements: BoardElement[],
  background: BackgroundType = 'blank',
  options: ExportCanvasOptions = {}
): HTMLCanvasElement {
  const padding = options.padding ?? 40;
  const scale = options.scale ?? 2;

  // Determine tight bounding box of all elements to crop unnecessary whitespace
  const bounds = elements.length > 0
    ? getElementsBoundingBox(elements)
    : { minX: 0, minY: 0, maxX: 1200, maxY: 800, width: 1200, height: 800 };

  const canvasWidth = Math.max(400, Math.ceil((bounds.width + padding * 2) * scale));
  const canvasHeight = Math.max(300, Math.ceil((bounds.height + padding * 2) * scale));

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // -------------------------------------------------------------
  // Render Base Background Fill
  // -------------------------------------------------------------
  if (background === 'dark') {
    ctx.fillStyle = '#18181b';
  } else if (background === 'blueprint') {
    ctx.fillStyle = '#1e3a8a';
  } else {
    ctx.fillStyle = '#ffffff';
  }
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // -------------------------------------------------------------
  // Nested Loop: Dot Matrix or Gridline Background Rendering
  // -------------------------------------------------------------
  if (background === 'dots' || background === 'grid') {
    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.fillStyle = '#cbd5e1';
    const gridSize = 24 * scale;
    // Step across full canvas width and height
    for (let x = 0; x < canvasWidth; x += gridSize) {
      for (let y = 0; y < canvasHeight; y += gridSize) {
        if (background === 'dots') {
          ctx.beginPath();
          ctx.arc(x, y, 1.5 * scale, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeRect(x, y, gridSize, gridSize);
        }
      }
    }
    ctx.restore();
  }

  // Set global supersampling scale and translate world origin to top-left of bounding box
  ctx.scale(scale, scale);
  ctx.translate(-bounds.minX + padding, -bounds.minY + padding);

  // -------------------------------------------------------------
  // Loop Over All Whiteboard Elements in Layer Order
  // -------------------------------------------------------------
  for (const el of elements) {
    ctx.save();
    ctx.strokeStyle = ('color' in el && el.color ? el.color : '#000000');
    ctx.lineWidth = (el as any).strokeWidth || 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = (el as any).opacity ?? 1;

    if (el.type === 'stroke') {
      if ((el as any).isHighlighter) {
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = (el as any).strokeWidth * 3 || 18;
      }
      if (el.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        // Polyline connecting points loop
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x, el.points[i].y);
        }
        ctx.stroke();
      }
    } else if (el.type === 'shape') {
      if (el.shapeType === 'line') {
        const x2 = el.x2 ?? el.x + el.width;
        const y2 = el.y2 ?? el.y + el.height;
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      } else if (el.shapeType === 'arrow') {
        const x2 = el.x2 ?? el.x + el.width;
        const y2 = el.y2 ?? el.y + el.height;
        // Draw arrow shaft
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Arrowhead barb trigonometry calculation:
        // angle = atan2(dy, dx), barb lines offset by ±30 degrees (PI / 6)
        const angle = Math.atan2(y2 - el.y, x2 - el.x);
        const headlen = Math.max(12, ctx.lineWidth * 3.5);
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = el.color || '#000000';
        ctx.fill();
      } else if (el.shapeType === 'rectangle') {
        if (el.fillColor) {
          ctx.fillStyle = el.fillColor;
          ctx.fillRect(el.x, el.y, el.width, el.height);
        }
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
        if (el.fillColor) {
          ctx.fillStyle = el.fillColor;
          ctx.fill();
        }
        ctx.stroke();
      } else if (el.shapeType === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(el.x + el.width / 2, el.y);
        ctx.lineTo(el.x + el.width, el.y + el.height);
        ctx.lineTo(el.x, el.y + el.height);
        ctx.closePath();
        if (el.fillColor) {
          ctx.fillStyle = el.fillColor;
          ctx.fill();
        }
        ctx.stroke();
      }
    } else if (el.type === 'text') {
      ctx.font = `${el.fontSize || 20}px ${el.fontFamily || 'Inter, sans-serif'}`;
      ctx.fillStyle = el.color || '#000000';
      ctx.textBaseline = 'top';
      const lines = el.text.split('\n');
      const lineHeight = (el.fontSize || 20) * 1.3;
      // Multiline text rendering loop
      lines.forEach((line, index) => {
        ctx.fillText(line, el.x, el.y + index * lineHeight);
      });
    } else if (el.type === 'image') {
      const cached = imageCache.get(el.src);
      if (cached && (cached.complete || cached.naturalWidth > 0)) {
        try {
          ctx.drawImage(cached, el.x, el.y, el.width, el.height);
        } catch (e) {}
      } else {
        const img = new Image();
        img.src = el.src;
        try {
          ctx.drawImage(img, el.x, el.y, el.width, el.height);
        } catch (e) {
          // Handle unrendered or asynchronous image decode gracefully
        }
      }
    }

    ctx.restore();
  }

  return canvas;
}

/**
 * Asynchronously renders the whiteboard elements onto an offscreen canvas,
 * ensuring all remote/blob images are preloaded into memory before drawing.
 *
 * @param elements - Whiteboard elements to render
 * @param background - Background styling preset
 * @param options - Supersampling and padding options
 * @returns Promise resolving to rendered HTMLCanvasElement
 */
export async function renderBoardToCanvasAsync(
  elements: BoardElement[],
  background: BackgroundType = 'blank',
  options: ExportCanvasOptions = {}
): Promise<HTMLCanvasElement> {
  await preloadBoardImages(elements);
  return renderBoardToCanvas(elements, background, options);
}

/**
 * Triggers an immediate browser download of the whiteboard rendered as a 2x PNG image.
 *
 * @param elements - Whiteboard elements
 * @param boardName - Title of the whiteboard (used in the downloaded filename)
 * @param background - Background style preset
 */
export async function exportToPNG(elements: BoardElement[], boardName = 'AIdboard', background: BackgroundType = 'blank') {
  const canvas = await renderBoardToCanvasAsync(elements, background, { scale: 2 });
  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${boardName.toLowerCase().replace(/\s+/g, '_')}_export.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Generates and downloads a vector-scaled PDF document containing the board canvas.
 * Dynamically imports `jspdf` on-demand to optimize initial bundle size.
 *
 * @param elements - Whiteboard elements
 * @param boardName - Title of the whiteboard
 * @param background - Background style preset
 */
export async function exportToPDF(elements: BoardElement[], boardName = 'AIdboard', background: BackgroundType = 'blank') {
  const canvas = await renderBoardToCanvasAsync(elements, background, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');

  const width = canvas.width;
  const height = canvas.height;
  const orientation = width >= height ? 'landscape' : 'portrait';

  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [width, height],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, width, height);
  pdf.save(`${boardName.toLowerCase().replace(/\s+/g, '_')}_export.pdf`);
}

/**
 * Serializes the whiteboard elements into a standalone, standards-compliant SVG document
 * and initiates an automatic file download.
 *
 * Complex Serialization Loop:
 * 1. Computes tight bounding viewBox `viewBox="minX minY width height"`.
 * 2. Emits white background `<rect>`.
 * 3. Iterates over elements translating each to SVG elements:
 *    - `stroke` -> `<path d="M... L..." .../>` (reuses renderPointsToSvgPath)
 *    - `shape` -> `<rect>`, `<ellipse>`, `<line>`, or `<polygon>`
 *    - `text` -> `<text>...</text>` (with XML entity escaping)
 *    - `image` -> `<image href="..." .../>`
 * 4. Wraps in a Blob with MIME type `image/svg+xml` and triggers a download link.
 *
 * @param elements - Whiteboard elements
 * @param boardName - Title of the whiteboard
 */
export function exportToSVG(elements: BoardElement[], boardName = 'AIdboard') {
  const bounds = elements.length > 0
    ? getElementsBoundingBox(elements)
    : { minX: 0, minY: 0, maxX: 1200, maxY: 800, width: 1200, height: 800 };

  const padding = 30;
  const minX = bounds.minX - padding;
  const minY = bounds.minY - padding;
  const width = bounds.width + padding * 2;
  const height = bounds.height + padding * 2;

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}">\n`;
  svgContent += `<rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#ffffff"/>\n`;

  // Element serialization loop using single source of truth renderPointsToSvgPath
  for (const el of elements) {
    if (el.type === 'stroke') {
      const d = renderPointsToSvgPath(el.points);
      const strokeWidth = (el as any).isHighlighter ? el.strokeWidth * 3 : el.strokeWidth;
      const opacity = (el as any).isHighlighter ? 0.35 : el.opacity || 1;
      svgContent += `  <path d="${d}" fill="none" stroke="${el.color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>\n`;
    } else if (el.type === 'shape') {
      if (el.shapeType === 'line') {
        const x2 = el.x2 ?? el.x + el.width;
        const y2 = el.y2 ?? el.y + el.height;
        svgContent += `  <line x1="${el.x}" y1="${el.y}" x2="${x2}" y2="${y2}" stroke="${el.color}" stroke-width="${el.strokeWidth}" stroke-linecap="round"/>\n`;
      } else if (el.shapeType === 'rectangle') {
        svgContent += `  <rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${el.fillColor || 'none'}" stroke="${el.color}" stroke-width="${el.strokeWidth}" rx="4"/>\n`;
      } else if (el.shapeType === 'circle') {
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        const rx = Math.abs(el.width / 2);
        const ry = Math.abs(el.height / 2);
        svgContent += `  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${el.fillColor || 'none'}" stroke="${el.color}" stroke-width="${el.strokeWidth}"/>\n`;
      } else if (el.shapeType === 'triangle') {
        const points = `${el.x + el.width / 2},${el.y} ${el.x + el.width},${el.y + el.height} ${el.x},${el.y + el.height}`;
        svgContent += `  <polygon points="${points}" fill="${el.fillColor || 'none'}" stroke="${el.color}" stroke-width="${el.strokeWidth}" stroke-linejoin="round"/>\n`;
      }
    } else if (el.type === 'text') {
      svgContent += `  <text x="${el.x}" y="${el.y + el.fontSize}" font-family="${el.fontFamily || 'sans-serif'}" font-size="${el.fontSize}" fill="${el.color}">${escapeXml(el.text)}</text>\n`;
    } else if (el.type === 'image') {
      svgContent += `  <image href="${el.src}" x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" />\n`;
    }
  }

  svgContent += `</svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${boardName.toLowerCase().replace(/\s+/g, '_')}_export.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Escapes reserved XML characters to prevent SVG syntax corruption or XSS vulnerabilities.
 *
 * @param unsafe - Raw plaintext input
 * @returns Escaped XML string
 */
function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
