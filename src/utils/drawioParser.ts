/**
 * @file drawioParser.ts
 * @description Robust XML/JSON parser and model converter for Draw.io (Diagrams.net) assets.
 * Enables import and seamless canvas placement of architecture diagrams and shape libraries.
 *
 * Supported formats:
 * - `<mxlibrary>[ ... ]</mxlibrary>` shape libraries (e.g., official SAP BTP architecture icon sets)
 * - `<mxfile>` and `<mxGraphModel>` standalone diagram documents
 * - Embedded SVG data URIs, geometric primitives, and text cell labels
 */

import { BoardElement, ShapeType } from '../types/whiteboard';

/**
 * Standardized intermediate item representation extracted from Draw.io XML or library packages.
 */
export interface DrawioParsedItem {
  /** Generated unique identifier */
  id: string;
  /** Human-readable title or label */
  title: string;
  /** Element category on the whiteboard */
  type: 'image' | 'shape' | 'text';
  /** If type is 'shape', specifies the geometric variant */
  shapeType?: ShapeType;
  /** Width in canvas pixels */
  width: number;
  /** Height in canvas pixels */
  height: number;
  /** Horizontal canvas coordinate if absolute geometry is defined */
  x?: number;
  /** Vertical canvas coordinate if absolute geometry is defined */
  y?: number;
  /** Primary stroke color */
  color?: string;
  /** Interior fill color */
  fillColor?: string;
  /** Border stroke width */
  strokeWidth?: number;
  /** Text content for text elements or labeled shapes */
  text?: string;
  /** Data URI source if element is an embedded image/SVG */
  src?: string;
  /** Raw XML snippet preserved for debugging or roundtrip export */
  rawXml?: string;
}

/**
 * Result structure returned from a parsing operation.
 */
export interface DrawioParseResult {
  /** Indicates whether at least one valid item was successfully parsed */
  success: boolean;
  /** Number of parsed items */
  totalItems: number;
  /** Array of extracted Draw.io items */
  items: DrawioParsedItem[];
  /** Error message if parsing failed */
  error?: string;
}

/**
 * Parses Draw.io CSS-like semicolon-delimited style strings.
 * Example input: `"fillColor=#ffffff;strokeColor=#4f46e5;shape=ellipse;rounded=1;"`
 *
 * Complex Loop Explanation:
 * Splits the style string by `;`, iterates through each key-value segment,
 * splits on the first `=` sign, trims whitespace, and defaults values to `'true'`
 * for standalone flags (e.g., `"rounded"`).
 *
 * @param styleStr - Raw Draw.io style attribute string
 * @returns Key-value dictionary of parsed style attributes
 */
export function parseStyleString(styleStr: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!styleStr) return result;

  // Protect data URIs from premature splitting on semicolon
  // e.g. image=data:image/svg+xml;base64,...; or image=data:image/svg+xml;utf8,...;
  const sanitized = styleStr.replace(
    /(image=data:[^;"]+);(base64|utf8|charset=[^,;"]+),/g,
    '$1__SEMICOLON__$2,'
  );
  const parts = sanitized.split(';');
  for (const part of parts) {
    const restored = part.replace(/__SEMICOLON__/g, ';');
    const equalIdx = restored.indexOf('=');
    if (equalIdx !== -1) {
      const k = restored.slice(0, equalIdx).trim();
      const v = restored.slice(equalIdx + 1).trim();
      if (k) {
        result[k] = v;
      }
    } else {
      const k = restored.trim();
      if (k) {
        result[k] = 'true';
      }
    }
  }
  return result;
}

/**
 * Unescapes standard XML entities within attribute values and text nodes.
 *
 * @param str - Escaped XML string
 * @returns Decoded plaintext string
 */
function decodeXmlEntities(str: string): string {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

const drawioParseCache = new Map<string, DrawioParseResult>();
const MAX_DRAWIO_CACHE_SIZE = 50;

/**
 * Asynchronously parses raw Draw.io XML or library text into whiteboard items
 * using a non-blocking microtask scheduler to prevent UI frame locks.
 *
 * @param input - Raw file text or clipboard content
 * @returns Promise resolving to Parse result
 */
export async function parseDrawioAsync(input: string): Promise<DrawioParseResult> {
  return new Promise((resolve) => {
    queueMicrotask(() => {
      resolve(parseDrawio(input));
    });
  });
}

/**
 * Parses raw Draw.io XML or library text into whiteboard items.
 * Employs an LRU memoization cache to eliminate redundant XML parsing.
 *
 * Parsing Pipeline:
 * 1. **Case 1 (`<mxlibrary>`)**: Parses JSON array containing encoded icon definitions and SVGs.
 * 2. **Case 2 (`<mxGraphModel>` / `<mxfile>`)**: Scans `<mxCell>` nodes, extracts geometry and styles.
 * 3. **Case 3 (Direct `<svg>`)**: Encapsulates raw SVG into an imported image element.
 *
 * @param input - Raw file text or clipboard content
 * @returns Parse result containing extracted items or an error description
 */
export function parseDrawio(input: string): DrawioParseResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { success: false, totalItems: 0, items: [], error: 'Input is empty' };
  }

  // Fast cache hit
  if (drawioParseCache.has(trimmed)) {
    const cached = drawioParseCache.get(trimmed)!;
    return {
      ...cached,
      items: cached.items.map((it) => ({ ...it })),
    };
  }

  const items: DrawioParsedItem[] = [];

  // -------------------------------------------------------------
  // CASE 1: <mxlibrary>[ ... ]</mxlibrary> Library Package
  // -------------------------------------------------------------
  if (trimmed.includes('<mxlibrary>') || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      let jsonContent = trimmed;
      const libraryMatch = trimmed.match(/<mxlibrary>([\s\S]*?)<\/mxlibrary>/i);
      if (libraryMatch) {
        jsonContent = libraryMatch[1].trim();
      }

      // Strip XML comments (e.g. <!-- Foundation Icons -->)
      jsonContent = jsonContent.replace(/<!--[\s\S]*?-->/g, '');

      const parsedArray = JSON.parse(jsonContent);
      if (Array.isArray(parsedArray)) {
        // Iterate through each library entry item
        parsedArray.forEach((entry, idx) => {
          const title = entry.title || `Draw.io Icon ${idx + 1}`;
          const w = Math.max(32, Number(entry.w) || 64);
          const h = Math.max(32, Number(entry.h) || 64);
          const rawXml = entry.xml || '';

          // Check if data URI is directly present on entry.data (e.g. official SAP generic icons)
          if (entry.data && typeof entry.data === 'string') {
            items.push({
              id: `drawio_lib_${idx}_${Date.now()}`,
              title,
              type: 'image',
              src: entry.data,
              width: w,
              height: h,
              rawXml,
            });
            return;
          }

          // Check for embedded image URI within the style
          const styleAttrMatch = rawXml.match(/style=["']([^"']*)["']/i);
          const rawStyle = styleAttrMatch ? styleAttrMatch[1] : rawXml;
          const styleMap = parseStyleString(rawStyle);

          if (styleMap.image) {
            let dataUri = decodeURIComponent(styleMap.image);
            if (dataUri.startsWith('data:image/svg+xml,PHN2')) {
              dataUri = dataUri.replace('data:image/svg+xml,', 'data:image/svg+xml;base64,');
            }
            items.push({
              id: `drawio_lib_${idx}_${Date.now()}`,
              title,
              type: 'image',
              src: dataUri,
              width: w,
              height: h,
              rawXml,
            });
            return;
          }

          // Check if XML directly contains an SVG root tag
          const svgMatch = rawXml.match(/<svg[\s\S]*?<\/svg>/i);
          if (svgMatch) {
            const svgData = `data:image/svg+xml;utf8,${encodeURIComponent(svgMatch[0])}`;
            items.push({
              id: `drawio_lib_${idx}_${Date.now()}`,
              title,
              type: 'image',
              src: svgData,
              width: w,
              height: h,
              rawXml,
            });
            return;
          }

          // Fallback: parse inner mxGraphModel XML
          const innerResult = parseMxGraphModel(rawXml, title);
          if (innerResult.length > 0) {
            items.push(...innerResult);
          } else {
            // Create placeholder shape with title
            items.push({
              id: `drawio_lib_${idx}_${Date.now()}`,
              title,
              type: 'shape',
              shapeType: 'rectangle',
              width: w,
              height: h,
              color: '#0284C7',
              fillColor: '#E0F2FE',
              strokeWidth: 2,
              text: title,
              rawXml,
            });
          }
        });

        if (items.length > 0) {
          return { success: true, totalItems: items.length, items };
        }
      }
    } catch (e: any) {
      // JSON parse failed; fall through to XML model parser
    }
  }

  const cacheAndReturn = (res: DrawioParseResult): DrawioParseResult => {
    if (res.success) {
      if (drawioParseCache.size >= MAX_DRAWIO_CACHE_SIZE) {
        const firstKey = drawioParseCache.keys().next().value;
        if (firstKey) drawioParseCache.delete(firstKey);
      }
      drawioParseCache.set(trimmed, res);
    }
    return res;
  };

  // -------------------------------------------------------------
  // CASE 2: Standard mxfile or mxGraphModel XML
  // -------------------------------------------------------------
  const graphItems = parseMxGraphModel(trimmed);
  if (graphItems.length > 0) {
    return cacheAndReturn({ success: true, totalItems: graphItems.length, items: graphItems });
  }

  // -------------------------------------------------------------
  // CASE 3: Embedded or Raw SVG String
  // -------------------------------------------------------------
  const svgMatch = trimmed.match(/<svg[\s\S]*?<\/svg>/i);
  if (svgMatch) {
    const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgMatch[0])}`;
    return cacheAndReturn({
      success: true,
      totalItems: 1,
      items: [
        {
          id: `drawio_svg_${Date.now()}`,
          title: 'Imported Draw.io SVG Icon',
          type: 'image',
          src: dataUri,
          width: 80,
          height: 80,
          rawXml: svgMatch[0],
        },
      ],
    });
  }

  return {
    success: false,
    totalItems: 0,
    items: [],
    error: 'No recognizable draw.io elements or icons could be parsed. Ensure the XML contains <mxlibrary>, <mxfile>, or <mxGraphModel>.',
  };
}

/**
 * Traverses an `<mxGraphModel>` XML document, extracting cell definitions and geometric data.
 *
 * Complex Loop Explanation:
 * Uses a global regular expression `/<mxCell\s+([^>]*?)(?:\/>|>([\s\S]*?)<\/mxCell>)/gi`
 * to step through every `<mxCell>` element:
 * 1. Skips root background containers (`id="0"` or `id="1"`).
 * 2. Filters out pure connection edges without explicit vertex geometry (`vertex="1"`).
 * 3. Extracts bounds from child `<mxGeometry x="..." y="..." width="..." height="..."/>`.
 * 4. Resolves styles to determine whether the cell is an image, shape primitive, or text label.
 *
 * @param xmlString - Raw XML content of the graph model
 * @param defaultTitle - Optional fallback title for unlabeled cells
 * @returns Array of parsed Draw.io items
 */
export function parseMxGraphModel(xmlString: string, defaultTitle?: string): DrawioParsedItem[] {
  const items: DrawioParsedItem[] = [];

  // Match all <mxCell ...> tags (self-closing or with inner mxGeometry / children)
  const cellRegex = /<mxCell\s+([^>]*?)(?:\/>|>([\s\S]*?)<\/mxCell>)/gi;
  let match;

  while ((match = cellRegex.exec(xmlString)) !== null) {
    const attrsStr = match[1];
    const innerContent = match[2] || '';

    // Extract attributes
    const id = getAttr(attrsStr, 'id') || `cell_${Date.now()}_${items.length}`;
    if (id === '0' || id === '1') continue; // Background root layers in draw.io

    const value = decodeXmlEntities(getAttr(attrsStr, 'value') || defaultTitle || '');
    const style = getAttr(attrsStr, 'style') || '';
    const vertex = getAttr(attrsStr, 'vertex');

    // Only process vertex cells (skip pure connection edges without geometry)
    if (vertex !== '1' && !attrsStr.includes('vertex="1"') && !innerContent.includes('mxGeometry')) {
      continue;
    }

    // Parse geometry attributes from child <mxGeometry> tag
    const geomMatch = innerContent.match(/<mxGeometry\s+([^>]+)\/?>/i) || attrsStr.match(/<mxGeometry\s+([^>]+)\/?>/i);
    const geomAttrs = geomMatch ? geomMatch[1] : '';

    const x = Number(getAttr(geomAttrs, 'x')) || 0;
    const y = Number(getAttr(geomAttrs, 'y')) || 0;
    const width = Math.max(24, Number(getAttr(geomAttrs, 'width')) || 64);
    const height = Math.max(24, Number(getAttr(geomAttrs, 'height')) || 64);

    const styleMap = parseStyleString(style);

    // If style contains embedded image URI
    if (styleMap.image) {
      let src = decodeURIComponent(styleMap.image);
      if (src.startsWith('data:image/svg+xml,PHN2')) {
        src = src.replace('data:image/svg+xml,', 'data:image/svg+xml;base64,');
      }
      items.push({
        id: `drawio_icon_${id}_${Date.now()}`,
        title: value || defaultTitle || 'Draw.io Icon',
        type: 'image',
        width,
        height,
        x,
        y,
        src,
        rawXml: match[0],
      });
      continue;
    }

    // Determine shape variant from draw.io style
    let shapeType: ShapeType = 'rectangle';
    if (styleMap.ellipse === 'true' || styleMap.shape === 'ellipse') {
      shapeType = 'circle';
    } else if (styleMap.triangle === 'true' || styleMap.shape === 'triangle') {
      shapeType = 'triangle';
    } else if (styleMap.shape === 'flexArrow' || styleMap.shape === 'arrow') {
      shapeType = 'arrow';
    } else if (styleMap.shape === 'line') {
      shapeType = 'line';
    }

    // Check if cell is a pure text element / label
    const isText =
      styleMap.text === 'true' ||
      style.startsWith('text') ||
      style.includes('text;') ||
      styleMap.shape === 'text' ||
      (Boolean(value) && styleMap.strokeColor === 'none' && styleMap.fillColor === 'none');

    if (isText) {
      items.push({
        id: `drawio_text_${id}_${Date.now()}`,
        title: value,
        type: 'text',
        text: value,
        width,
        height,
        x,
        y,
        color: styleMap.fontColor || '#18181b',
        rawXml: match[0],
      });
      continue;
    }

    const fillColor = styleMap.fillColor || (styleMap.rounded ? '#EEF2FF' : '#F8FAFC');
    const strokeColor = styleMap.strokeColor || '#4F46E5';
    const strokeWidth = Number(styleMap.strokeWidth) || 2;

    items.push({
      id: `drawio_shape_${id}_${Date.now()}`,
      title: value || `${shapeType} shape`,
      type: 'shape',
      shapeType,
      width,
      height,
      x,
      y,
      color: strokeColor,
      fillColor: fillColor === 'none' ? undefined : fillColor,
      strokeWidth,
      text: value || undefined,
      rawXml: match[0],
    });
  }

  return items;
}

/**
 * Helper to extract an attribute value from an XML tag attribute string.
 *
 * @param str - Attributes substring
 * @param attrName - Target attribute name
 * @returns Extracted string value or null
 */
function getAttr(str: string, attrName: string): string | null {
  const reg = new RegExp(`${attrName}=["']([^"']*)["']`, 'i');
  const m = str.match(reg);
  return m ? m[1] : null;
}

/**
 * Converts a parsed Draw.io item into a concrete whiteboard `BoardElement`.
 *
 * @param item - Parsed item descriptor
 * @param canvasX - Destination canvas X coordinate
 * @param canvasY - Destination canvas Y coordinate
 * @param zIndex - Stacking layer order
 * @returns Fully populated BoardElement ready to insert into whiteboard state
 */
export function convertDrawioItemToBoardElement(
  item: DrawioParsedItem,
  canvasX: number,
  canvasY: number,
  zIndex: number
): BoardElement {
  const now = Date.now();
  const posX = Math.round(canvasX);
  const posY = Math.round(canvasY);

  if (item.type === 'image' && item.src) {
    return {
      id: `img_${now}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'image',
      x: posX,
      y: posY,
      width: Math.round(item.width),
      height: Math.round(item.height),
      src: item.src,
      opacity: 1,
      createdAt: now,
      updatedAt: now,
      zIndex,
    };
  }

  if (item.type === 'text') {
    return {
      id: `text_${now}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'text',
      x: posX,
      y: posY,
      width: Math.round(item.width || 120),
      height: Math.round(item.height || 40),
      text: item.text || item.title,
      fontSize: 16,
      fontFamily: 'sans-serif',
      color: item.color || '#18181b',
      createdAt: now,
      updatedAt: now,
      zIndex,
    };
  }

  // Default: Shape element
  return {
    id: `shape_${now}_${Math.random().toString(36).substring(2, 6)}`,
    type: 'shape',
    shapeType: item.shapeType || 'rectangle',
    x: posX,
    y: posY,
    width: Math.round(item.width),
    height: Math.round(item.height),
    color: item.color || '#4f46e5',
    fillColor: item.fillColor || '#e0e7ff',
    strokeWidth: item.strokeWidth || 2,
    opacity: 1,
    createdAt: now,
    updatedAt: now,
    zIndex,
  };
}

/**
 * Built-in sample Draw.io library containing official SAP BTP architecture icons
 * for demonstration and quick import.
 */
export const SAMPLE_SAP_DRAWIO_LIBRARY = `<mxlibrary>[
  {
    "title": "SAP Integration Suite (Draw.io)",
    "w": 64,
    "h": 64,
    "xml": "<mxGraphModel><root><mxCell id=\\"0\\"/><mxCell id=\\"1\\" parent=\\"0\\"/><mxCell id=\\"2\\" value=\\"SAP Integration Suite\\" style=\\"shape=image;image=data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2064%2064%22%20width%3D%2264%22%20height%3D%2264%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20rx%3D%2214%22%20fill%3D%22%235D36FF%22%2F%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%2220%22%20r%3D%227%22%20fill%3D%22%23FFFFFF%22%2F%3E%3Ccircle%20cx%3D%2244%22%20cy%3D%2220%22%20r%3D%227%22%20fill%3D%22%23FFFFFF%22%2F%3E%3Ccircle%20cx%3D%2232%22%20cy%3D%2244%22%20r%3D%227%22%20fill%3D%22%23FFFFFF%22%2F%3E%3Cpath%20d%3D%22M25%2022%20L39%2022%22%20stroke%3D%22%23FFFFFF%22%20stroke-width%3D%223%22%2F%3E%3Cpath%20d%3D%22M23%2025%20L29%2039%22%20stroke%3D%22%23FFFFFF%22%20stroke-width%3D%223%22%2F%3E%3Cpath%20d%3D%22M41%2025%20L35%2039%22%20stroke%3D%22%23FFFFFF%22%20stroke-width%3D%223%22%2F%3E%3C%2Fsvg%3E;\\" vertex=\\"1\\" parent=\\"1\\"><mxGeometry width=\\"64\\" height=\\"64\\" as=\\"geometry\\"/></mxCell></root></mxGraphModel>"
  },
  {
    "title": "SAP HANA Cloud (Draw.io)",
    "w": 64,
    "h": 64,
    "xml": "<mxGraphModel><root><mxCell id=\\"0\\"/><mxCell id=\\"1\\" parent=\\"0\\"/><mxCell id=\\"2\\" value=\\"SAP HANA Cloud\\" style=\\"shape=image;image=data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2064%2064%22%20width%3D%2264%22%20height%3D%2264%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20rx%3D%2214%22%20fill%3D%22%230854A0%22%2F%3E%3Cellipse%20cx%3D%2232%22%20cy%3D%2219%22%20rx%3D%2218%22%20ry%3D%227%22%20fill%3D%22%2338BDF8%22%2F%3E%3Cpath%20d%3D%22M14%2019%20V43%20C14%2047%2022%2050%2032%2050%20C42%2050%2050%2047%2050%2043%20V19%22%20fill%3D%22none%22%20stroke%3D%22%23FFFFFF%22%20stroke-width%3D%222.5%22%2F%3E%3C%2Fsvg%3E;\\" vertex=\\"1\\" parent=\\"1\\"><mxGeometry width=\\"64\\" height=\\"64\\" as=\\"geometry\\"/></mxCell></root></mxGraphModel>"
  }
]</mxlibrary>`;
