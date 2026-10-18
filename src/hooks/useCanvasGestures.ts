/**
 * @file useCanvasGestures.ts
 * @description State machine and event handler hook for pointer gestures, freehand drawing,
 * shape creation, marquee box selections, viewport panning, and hit-testing on the whiteboard.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Point,
  ToolType,
  ShapeType,
  BoardElement,
  ShapeElementData,
  StrokeElement,
} from '../types/whiteboard';
import {
  isPointNearElement,
  elementIntersectsBox,
} from '../utils/canvasGeometry';
import { detectShape, SnappedShapeResult } from '../utils/shapeDetection';
import { getElementsBoundingBox } from '../utils/ocr';
import { useTouchGestures } from './useTouchGestures';

/**
 * Options configuration for the canvas gestures hook.
 */
interface UseCanvasGesturesOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  elements: BoardElement[];
  onElementsChange: (newElements: BoardElement[], operation?: string) => void;
  onElementsLiveUpdate?: (newElements: BoardElement[]) => void;
  currentTool: ToolType;
  selectedShape: ShapeType;
  color: string;
  strokeWidth: number;
  autoSnap: boolean;
  zoom: number;
  pan: { x: number; y: number };
  onPanChange: (pan: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  selectedIds: string[];
  onSelectElements: (ids: string[]) => void;
  onCursorMove: (x: number, y: number) => void;
  onSnapFeedback?: (shapeName: string) => void;
  onStartInlineText: (id: string, pt: Point) => void;
}

/**
 * Custom hook encapsulating pointer interaction gestures, screen-to-canvas coordinate
 * projection, continuous freehand point sampling, shape heuristic preview, and selection moves.
 */
export function useCanvasGestures({
  containerRef,
  elements,
  onElementsChange,
  onElementsLiveUpdate,
  currentTool,
  selectedShape,
  color,
  strokeWidth,
  autoSnap,
  zoom,
  pan,
  onPanChange,
  onZoomChange,
  selectedIds,
  onSelectElements,
  onCursorMove,
  onSnapFeedback,
  onStartInlineText,
}: UseCanvasGesturesOptions) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const currentStrokeRef = useRef<Point[]>([]);
  const [shapeStart, setShapeStart] = useState<Point | null>(null);
  const [currentShapePreview, setCurrentShapePreview] = useState<SnappedShapeResult | null>(null);
  const shapePreviewRef = useRef<SnappedShapeResult | null>(null);

  const [marqueeStart, setMarqueeStart] = useState<Point | null>(null);
  const [marqueeCurrent, setMarqueeCurrent] = useState<Point | null>(null);

  const [isMovingSelection, setIsMovingSelection] = useState(false);
  const moveStartRef = useRef<Point | null>(null);

  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number } | null>(null);
  const [spacePressed, setSpacePressed] = useState(false);

  const elementsRef = useRef<BoardElement[]>(elements);
  elementsRef.current = elements;

  const { handleTouchDown, handleTouchMove, handleTouchUp } = useTouchGestures({
    zoom,
    pan,
    onZoomChange,
    onPanChange,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (e.code === 'Space' && !spacePressed) {
        setSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [spacePressed]);

  const screenToCanvas = useCallback(
    (clientX: number, clientY: number): Point => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const x = (clientX - rect.left - pan.x) / zoom;
      const y = (clientY - rect.top - pan.y) / zoom;
      return { x, y };
    },
    [pan, zoom, containerRef]
  );

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      const newZoom = Math.min(3.5, Math.max(0.2, zoom * zoomFactor));

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const newPanX = mouseX - ((mouseX - pan.x) / zoom) * newZoom;
        const newPanY = mouseY - ((mouseY - pan.y) / zoom) * newZoom;
        onZoomChange(newZoom);
        onPanChange({ x: newPanX, y: newPanY });
      } else {
        onZoomChange(newZoom);
      }
    } else {
      onPanChange({
        x: pan.x - e.deltaX,
        y: pan.y - e.deltaY,
      });
    }
  };

  /**
   * Erases all whiteboard elements situated within a 16px proximity radius of point `pt`.
   */
  const eraseAtPoint = (pt: Point) => {
    const toDelete = elementsRef.current.filter((el) => isPointNearElement(pt, el, 16));
    if (toDelete.length > 0) {
      const remaining = elementsRef.current.filter((el) => !toDelete.includes(el));
      onElementsChange(remaining, 'delete');
    }
  };

  /**
   * Top-to-bottom z-index hit-testing loop:
   * Scans elements in reverse render order (highest z-index to lowest) to find the topmost
   * element intersecting pointer coordinates `pt`.
   *
   * @param pt - Pointer coordinate in canvas space
   * @returns Topmost element under the cursor or null if clicking empty canvas
   */
  const findElementAtPoint = (pt: Point): BoardElement | null => {
    for (let i = elementsRef.current.length - 1; i >= 0; i--) {
      if (isPointNearElement(pt, elementsRef.current[i], 12)) {
        return elementsRef.current[i];
      }
    }
    return null;
  };

  const handleMoveSelectionLive = (dx: number, dy: number) => {
    const updated = elementsRef.current.map((el) => {
      if (!selectedIds.includes(el.id)) return el;
      if (el.type === 'stroke') {
        return { ...el, points: el.points.map((p) => ({ x: p.x + dx, y: p.y + dy })), updatedAt: Date.now() };
      } else if (el.type === 'shape') {
        return {
          ...el,
          x: el.x + dx,
          y: el.y + dy,
          x2: el.x2 !== undefined ? el.x2 + dx : undefined,
          y2: el.y2 !== undefined ? el.y2 + dy : undefined,
          updatedAt: Date.now(),
        };
      }
      return { ...el, x: el.x + dx, y: el.y + dy, updatedAt: Date.now() };
    });

    elementsRef.current = updated;
    if (onElementsLiveUpdate) onElementsLiveUpdate(updated);
    else onElementsChange(updated, 'move_live');
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (handleTouchDown(e)) {
      setIsDrawing(false);
      setCurrentStroke([]);
      return;
    }

    if (e.button === 1 || spacePressed || currentTool === 'pan') {
      setIsPanning(true);
      panStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      return;
    }

    if (e.button !== 0 && e.pointerType !== 'touch') return;
    const pt = screenToCanvas(e.clientX, e.clientY);

    if (currentTool === 'text') {
      onStartInlineText('text_' + Date.now(), pt);
      return;
    }

    if (currentTool === 'eraser') {
      eraseAtPoint(pt);
      setIsDrawing(true);
      return;
    }

    if (currentTool === 'select') {
      if (selectedIds.length > 0) {
        const selected = elementsRef.current.filter((el) => selectedIds.includes(el.id));
        if (selected.length > 0) {
          const bounds = getElementsBoundingBox(selected);
          const inside =
            pt.x >= bounds.minX - 8 &&
            pt.x <= bounds.maxX + 8 &&
            pt.y >= bounds.minY - 8 &&
            pt.y <= bounds.maxY + 8;
          if (inside) {
            setIsMovingSelection(true);
            moveStartRef.current = pt;
            return;
          }
        }
      }

      const clickedEl = findElementAtPoint(pt);
      if (clickedEl) {
        if (e.shiftKey) {
          onSelectElements(
            selectedIds.includes(clickedEl.id)
              ? selectedIds.filter((id) => id !== clickedEl.id)
              : [...selectedIds, clickedEl.id]
          );
        } else {
          if (!selectedIds.includes(clickedEl.id)) onSelectElements([clickedEl.id]);
          setIsMovingSelection(true);
          moveStartRef.current = pt;
        }
      } else {
        if (!e.shiftKey) onSelectElements([]);
        setMarqueeStart(pt);
        setMarqueeCurrent(pt);
      }
      return;
    }

    if (currentTool === 'shape') {
      setIsDrawing(true);
      setShapeStart(pt);
      const initPreview = {
        shapeType: selectedShape,
        x: pt.x,
        y: pt.y,
        width: 1,
        height: 1,
        x2: pt.x,
        y2: pt.y,
      };
      shapePreviewRef.current = initPreview;
      setCurrentShapePreview(initPreview);
      return;
    }

    if (currentTool === 'pen' || currentTool === 'highlighter') {
      setIsDrawing(true);
      currentStrokeRef.current = [pt];
      setCurrentStroke([pt]);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (handleTouchMove(e)) return;

    const pt = screenToCanvas(e.clientX, e.clientY);
    onCursorMove(pt.x, pt.y);

    if (isPanning && panStartRef.current) {
      const dx = e.clientX - panStartRef.current.clientX;
      const dy = e.clientY - panStartRef.current.clientY;
      onPanChange({
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy,
      });
      return;
    }

    if (isMovingSelection && moveStartRef.current) {
      const dx = pt.x - moveStartRef.current.x;
      const dy = pt.y - moveStartRef.current.y;
      moveStartRef.current = pt;
      handleMoveSelectionLive(dx, dy);
      return;
    }

    if (isDrawing && currentTool === 'eraser') {
      eraseAtPoint(pt);
      return;
    }

    if (marqueeStart) {
      setMarqueeCurrent(pt);
      return;
    }

    if (isDrawing && currentTool === 'shape' && shapeStart) {
      const minX = Math.min(shapeStart.x, pt.x);
      const minY = Math.min(shapeStart.y, pt.y);
      const width = Math.abs(pt.x - shapeStart.x);
      const height = Math.abs(pt.y - shapeStart.y);
      const isLineLike = selectedShape === 'line' || selectedShape === 'arrow';

      const preview = {
        shapeType: selectedShape,
        x: isLineLike ? shapeStart.x : minX,
        y: isLineLike ? shapeStart.y : minY,
        width,
        height,
        x2: pt.x,
        y2: pt.y,
      };
      shapePreviewRef.current = preview;
      setCurrentShapePreview(preview);
      return;
    }

    if (isDrawing && (currentTool === 'pen' || currentTool === 'highlighter')) {
      const nextStroke = [...currentStrokeRef.current, pt];
      currentStrokeRef.current = nextStroke;
      setCurrentStroke(nextStroke);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    handleTouchUp(e);

    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
      return;
    }

    if (isMovingSelection) {
      setIsMovingSelection(false);
      moveStartRef.current = null;
      onElementsChange(elementsRef.current, 'move');
      return;
    }

    if (marqueeStart && marqueeCurrent) {
      const minX = Math.min(marqueeStart.x, marqueeCurrent.x);
      const minY = Math.min(marqueeStart.y, marqueeCurrent.y);
      const maxX = Math.max(marqueeStart.x, marqueeCurrent.x);
      const maxY = Math.max(marqueeStart.y, marqueeCurrent.y);

      const hitIds = elementsRef.current
        .filter((el) => elementIntersectsBox(el, minX, minY, maxX, maxY))
        .map((el) => el.id);

      onSelectElements(hitIds);
      setMarqueeStart(null);
      setMarqueeCurrent(null);
      return;
    }

    const effectiveShape = shapePreviewRef.current || currentShapePreview;
    if (isDrawing && currentTool === 'shape' && effectiveShape) {
      if (effectiveShape.width > 5 || effectiveShape.height > 5) {
        const shapeEl: ShapeElementData = {
          id: 'shape_' + Date.now(),
          type: 'shape',
          shapeType: effectiveShape.shapeType,
          x: effectiveShape.x,
          y: effectiveShape.y,
          width: effectiveShape.width,
          height: effectiveShape.height,
          x2: effectiveShape.x2,
          y2: effectiveShape.y2,
          color,
          strokeWidth,
          opacity: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          zIndex: elementsRef.current.length + 1,
        };
        onElementsChange([...elementsRef.current, shapeEl], 'create');
      }
      setIsDrawing(false);
      setShapeStart(null);
      shapePreviewRef.current = null;
      setCurrentShapePreview(null);
      return;
    }

    const effectiveStroke = currentStrokeRef.current.length > 1 ? currentStrokeRef.current : currentStroke;
    if (isDrawing && (currentTool === 'pen' || currentTool === 'highlighter') && effectiveStroke.length > 1) {
      const isHighlighter = currentTool === 'highlighter';

      if (autoSnap && !isHighlighter) {
        const detected = detectShape(effectiveStroke);
        if (detected) {
          const snappedEl: ShapeElementData = {
            id: 'shape_' + Date.now(),
            type: 'shape',
            shapeType: detected.shapeType,
            x: detected.x,
            y: detected.y,
            width: detected.width,
            height: detected.height,
            x2: detected.x2,
            y2: detected.y2,
            color,
            strokeWidth,
            opacity: 1,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            zIndex: elementsRef.current.length + 1,
          };

          onElementsChange([...elementsRef.current, snappedEl], 'create');
          setIsDrawing(false);
          currentStrokeRef.current = [];
          setCurrentStroke([]);
          onSnapFeedback?.(detected.shapeType);
          return;
        }
      }

      const strokeEl: StrokeElement = {
        id: 'stroke_' + Date.now(),
        type: 'stroke',
        points: effectiveStroke,
        color,
        strokeWidth: isHighlighter ? strokeWidth * 3.5 : strokeWidth,
        opacity: isHighlighter ? 0.35 : 1,
        isHighlighter,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        zIndex: elementsRef.current.length + 1,
      };

      onElementsChange([...elementsRef.current, strokeEl], 'create');
      setIsDrawing(false);
      currentStrokeRef.current = [];
      setCurrentStroke([]);
    } else {
      setIsDrawing(false);
      currentStrokeRef.current = [];
      setCurrentStroke([]);
    }
  };

  return {
    screenToCanvas,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    isDrawing,
    currentStroke,
    currentShapePreview,
    marqueeStart,
    marqueeCurrent,
    isPanning,
    isMovingSelection,
    spacePressed,
    elementsRef,
  };
}
