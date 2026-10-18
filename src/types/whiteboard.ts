export type ToolType = 'select' | 'pen' | 'highlighter' | 'eraser' | 'shape' | 'text' | 'pan';

export type ShapeType = 'line' | 'arrow' | 'rectangle' | 'circle' | 'triangle';

export type BackgroundType = 'dots' | 'grid' | 'blank' | 'blueprint' | 'dark';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export interface BaseElement {
  id: string;
  createdAt: number;
  updatedAt: number;
  zIndex: number;
}

export interface StrokeElement extends BaseElement {
  type: 'stroke';
  points: Point[];
  color: string;
  strokeWidth: number;
  opacity: number;
  isHighlighter?: boolean;
}

export interface ShapeElementData extends BaseElement {
  type: 'shape';
  shapeType: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  // Specific endpoints for line / arrow
  x2?: number;
  y2?: number;
  color: string;
  fillColor?: string;
  strokeWidth: number;
  opacity: number;
}

export interface TextElementData extends BaseElement {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  fontFamily: string;
  width: number;
  height: number;
}

export interface ImageElementData extends BaseElement {
  type: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  opacity?: number;
}

export type BoardElement = StrokeElement | ShapeElementData | TextElementData | ImageElementData;

export interface RemoteUser {
  userId: string;
  userName: string;
  userColor: string;
  cursor?: { x: number; y: number };
}

export interface BoardMetadata {
  id: string;
  name: string;
  elementCount?: number;
  updatedAt: number;
}
