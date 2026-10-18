/**
 * @file Canvas.tsx
 * @description Main interactive whiteboard canvas orchestrator component.
 *
 * Coordinates:
 * - HTML5 SVG rendering of vector elements, strokes, geometric primitives, and text
 * - Zoom, multi-touch pinch-to-zoom, and 2D pan camera transformations
 * - Multi-element selection bounding box and affine resize/scaling handles
 * - High-speed pointer gestures and shape auto-snapping integration
 * - Drag-and-drop file import (images and Draw.io architecture XML packages)
 * - Remote collaborator presence and live cursor interpolation
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  BoardElement,
  Point,
  ToolType,
  ShapeType,
  BackgroundType,
  RemoteUser,
  TextElementData,
} from '../types/whiteboard';
import { useTranslation } from 'react-i18next';
import { SelectionOverlay } from './SelectionOverlay';
import { CanvasBackground } from './canvas/CanvasBackground';
import { CanvasElementsLayer } from './canvas/CanvasElementsLayer';
import { CanvasPreviewsLayer } from './canvas/CanvasPreviewsLayer';
import { CanvasRemoteCursors } from './canvas/CanvasRemoteCursors';
import { CanvasInlineTextEditor } from './canvas/CanvasInlineTextEditor';
import { useCanvasGestures } from '../hooks/useCanvasGestures';
import {
  createImageElementFromFile,
  scaleSelectedElements,
  getCanvasBackgroundThemeClass,
} from '../utils/canvasGeometry';
import { parseDrawio, convertDrawioItemToBoardElement } from '../utils/drawioParser';

/**
 * Properties for the Canvas orchestrator component.
 */
interface CanvasProps {
  /** Authoritative list of whiteboard elements */
  elements: BoardElement[];
  /** Mutation handler dispatching element changes */
  onElementsChange: (newElements: BoardElement[], operation?: string) => void;
  /** High-frequency ephemeral live update handler during drag/transform */
  onElementsLiveUpdate?: (newElements: BoardElement[]) => void;
  /** Active user tool ('select', 'pan', 'pen', 'highlighter', 'eraser', 'shape', 'text') */
  currentTool: ToolType;
  /** Selected shape variant when currentTool === 'shape' */
  selectedShape: ShapeType;
  /** Active drawing color */
  color: string;
  /** Active stroke thickness */
  strokeWidth: number;
  /** Whether freehand strokes should automatically snap to geometric shapes */
  autoSnap: boolean;
  /** Background grid/dot/color preset */
  background: BackgroundType;
  /** Current camera magnification zoom level */
  zoom: number;
  /** Current camera pan offset */
  pan: { x: number; y: number };
  /** Pan offset change handler */
  onPanChange: (pan: { x: number; y: number }) => void;
  /** Zoom level change handler */
  onZoomChange: (zoom: number) => void;
  /** IDs of currently selected elements */
  selectedIds: string[];
  /** Selection change handler */
  onSelectElements: (ids: string[]) => void;
  /** Callback to trigger OCR modal */
  onTriggerOcr: () => void;
  /** Active remote collaborators in the session */
  remoteUsers: RemoteUser[];
  /** Local cursor broadcast callback */
  onCursorMove: (x: number, y: number) => void;
  /** Toast feedback callback when a shape is auto-snapped */
  onSnapFeedback?: (shapeName: string) => void;
  /** Image file import handler */
  onImportImageFile?: (file: File, x?: number, y?: number) => void;
}

/**
 * Canvas orchestrator component managing SVG scene graph layers and interactive gesture events.
 */
export const Canvas: React.FC<CanvasProps> = ({
  elements = [],
  onElementsChange,
  onElementsLiveUpdate,
  currentTool,
  selectedShape,
  color,
  strokeWidth,
  autoSnap,
  background,
  zoom,
  pan,
  onPanChange,
  onZoomChange,
  selectedIds = [],
  onSelectElements,
  onTriggerOcr,
  remoteUsers = [],
  onCursorMove,
  onSnapFeedback,
}) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const safeElements = elements || [];

  // Inline text editing state
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextPos, setEditingTextPos] = useState<{ x: number; y: number } | null>(null);
  const [editingTextValue, setEditingTextValue] = useState('');
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // Drag-and-drop file import indicator
  const [isDragOver, setIsDragOver] = useState(false);

  const startInlineText = useCallback((id: string, pt: Point) => {
    const newTextEl: TextElementData = {
      id,
      type: 'text',
      x: pt.x,
      y: pt.y,
      text: '',
      fontSize: Math.max(16, strokeWidth * 5),
      color,
      fontFamily: 'Inter, sans-serif',
      width: 140,
      height: 40,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      zIndex: safeElements.length + 1,
    };
    setEditingTextId(id);
    setEditingTextPos({ x: pt.x, y: pt.y });
    setEditingTextValue('');
    onElementsChange([...safeElements, newTextEl], 'create');
    setTimeout(() => textInputRef.current?.focus(), 50);
  }, [color, onElementsChange, safeElements, strokeWidth]);

  const finishTextEditing = useCallback(() => {
    if (!editingTextId) return;
    if (!editingTextValue.trim()) {
      onElementsChange(safeElements.filter((el) => el.id !== editingTextId), 'delete');
    } else {
      onElementsChange(
        safeElements.map((el) => {
          if (el.id === editingTextId && el.type === 'text') {
            return {
              ...el,
              text: editingTextValue,
              updatedAt: Date.now(),
            };
          }
          return el;
        }),
        'update'
      );
    }
    setEditingTextId(null);
    setEditingTextPos(null);
    setEditingTextValue('');
  }, [editingTextId, editingTextValue, onElementsChange, safeElements]);

  // Gestures and interactions
  const {
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
  } = useCanvasGestures({
    containerRef,
    elements: safeElements,
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
    onStartInlineText: startInlineText,
  });

  // Keyboard Delete & Deselect listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      const isDeleteKey = e.key.toLowerCase() === 'delete' || e.key.toLowerCase() === 'backspace';
      if (isDeleteKey && selectedIds.length > 0) {
        e.preventDefault();
        onElementsChange(safeElements.filter((el) => !selectedIds.includes(el.id)), 'delete');
        onSelectElements([]);
      }
      if (e.key === 'Escape') {
        onSelectElements([]);
        if (editingTextId) {
          finishTextEditing();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, safeElements, onElementsChange, onSelectElements, editingTextId, finishTextEditing]);

  // Scaling selection live
  const scaleSnapshotRef = useRef<BoardElement[] | null>(null);

  const handleScaleSelectionLive = (scaleX: number, scaleY: number, anchorX: number, anchorY: number) => {
    if (!scaleSnapshotRef.current) {
      scaleSnapshotRef.current = elementsRef.current.map((el) => {
        if (el.type === 'stroke') {
          return { ...el, points: el.points.map((p) => ({ ...p })) };
        }
        return { ...el };
      });
    }

    const updated = scaleSelectedElements(
      scaleSnapshotRef.current,
      selectedIds,
      scaleX,
      scaleY,
      anchorX,
      anchorY
    );

    elementsRef.current = updated;
    if (onElementsLiveUpdate) {
      onElementsLiveUpdate(updated);
    } else {
      onElementsChange(updated, 'scale_live');
    }
  };

  const handleScaleSelectionEnd = () => {
    scaleSnapshotRef.current = null;
    onElementsChange(elementsRef.current, 'scale');
  };

  const handleDeleteSelection = () => {
    onElementsChange(safeElements.filter((el) => !selectedIds.includes(el.id)), 'delete');
    onSelectElements([]);
  };

  const handleDuplicateSelection = () => {
    const selected = safeElements.filter((el) => selectedIds.includes(el.id));
    const offset = 24;
    const duplicated: BoardElement[] = selected.map((el) => {
      const newId = el.type + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      if (el.type === 'stroke') {
        return {
          ...el,
          id: newId,
          points: el.points.map((p) => ({ x: p.x + offset, y: p.y + offset })),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      } else if (el.type === 'shape') {
        return {
          ...el,
          id: newId,
          x: el.x + offset,
          y: el.y + offset,
          x2: el.x2 !== undefined ? el.x2 + offset : undefined,
          y2: el.y2 !== undefined ? el.y2 + offset : undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      } else {
        return {
          ...el,
          id: newId,
          x: el.x + offset,
          y: el.y + offset,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      }
    });

    onElementsChange([...safeElements, ...duplicated], 'create');
    onSelectElements(duplicated.map((d) => d.id));
  };

  const handleChangeSelectedColor = (newColor: string) => {
    onElementsChange(
      safeElements.map((el) => {
        if (selectedIds.includes(el.id)) {
          return { ...el, color: newColor, updatedAt: Date.now() };
        }
        return el;
      }),
      'update'
    );
  };

  // Image Drag & Drop and Clipboard paste handling
  const handleImportFile = useCallback(
    async (file: File, targetX?: number, targetY?: number) => {
      const posX = targetX !== undefined ? targetX : (-pan.x + 300) / zoom;
      const posY = targetY !== undefined ? targetY : (-pan.y + 200) / zoom;
      try {
        const newImgEl = await createImageElementFromFile(file, posX, posY, elementsRef.current.length + 1);
        const next = [...elementsRef.current, newImgEl];
        elementsRef.current = next;
        onElementsChange(next, 'create');
        onSelectElements([newImgEl.id]);
      } catch (e) {
        console.warn('Image import failed:', e);
      }
    },
    [pan, zoom, onElementsChange, onSelectElements, elementsRef]
  );

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleImportFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleImportFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const allFiles = Array.from(e.dataTransfer.files);
    if (allFiles.length === 0) return;

    const pt = screenToCanvas(e.clientX, e.clientY);

    // Image files
    const imageFiles = allFiles.filter((f) => f.type.startsWith('image/'));
    imageFiles.forEach((file, index) => {
      handleImportFile(file, pt.x + index * 30, pt.y + index * 30);
    });

    // Draw.io XML files
    const drawioFiles = allFiles.filter(
      (f) => f.name.endsWith('.drawio') || f.name.endsWith('.xml') || f.name.endsWith('.drawio.xml')
    );
    drawioFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const res = parseDrawio(text);
          if (res.success && res.items.length > 0) {
            const newEls = res.items.map((item, idx) =>
              convertDrawioItemToBoardElement(
                item,
                pt.x + (idx % 4) * 80,
                pt.y + Math.floor(idx / 4) * 80,
                elementsRef.current.length + 1 + idx
              )
            );
            const next = [...elementsRef.current, ...newEls];
            elementsRef.current = next;
            onElementsChange(next, 'create');
            onSelectElements(newEls.map((el) => el.id));
          }
        }
      };
      reader.readAsText(file);
    });
  };

  // Cursor style
  let cursorClass = 'cursor-crosshair';
  if (spacePressed || isPanning || currentTool === 'pan') {
    cursorClass = isPanning ? 'cursor-grabbing' : 'cursor-grab';
  } else if (currentTool === 'select') {
    cursorClass = isMovingSelection ? 'cursor-grabbing' : 'cursor-default';
  } else if (currentTool === 'text') {
    cursorClass = 'cursor-text';
  }

  const selectedElements = safeElements.filter((el) => selectedIds.includes(el.id));

  return (
    <div
      ref={containerRef}
      data-testid="canvas-container"
      role="application"
      aria-label={t('canvas.canvasAria')}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full h-[calc(100vh-3.5rem)] overflow-hidden select-none touch-none ${cursorClass} ${getCanvasBackgroundThemeClass(background)}`}
    >
      {/* Drop Zone overlay */}
      {isDragOver && (
        <div
          data-testid="image-drop-indicator"
          className="absolute inset-0 z-40 bg-indigo-500/15 border-4 border-dashed border-indigo-500 backdrop-blur-xs flex items-center justify-center pointer-events-none"
        >
          <div className="bg-white/95 dark:bg-zinc-900/95 px-6 py-4 rounded-2xl shadow-2xl border border-indigo-200 dark:border-indigo-800 text-center flex flex-col items-center gap-2">
            <span className="text-2xl">🖼️</span>
            <p className="font-semibold text-slate-800 dark:text-zinc-100 text-sm">
              {t('canvas.dropImageHere')}
            </p>
          </div>
        </div>
      )}

      {/* Background SVG Grid / Pattern */}
      <CanvasBackground background={background} zoom={zoom} pan={pan} />

      {/* Main SVG Vector Layer */}
      <svg
        data-testid="whiteboard-svg"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <CanvasElementsLayer
          elements={safeElements}
          selectedIds={selectedIds}
          editingTextId={editingTextId}
        />
        <CanvasPreviewsLayer
          isDrawing={isDrawing}
          currentStroke={currentStroke}
          currentShapePreview={currentShapePreview}
          currentTool={currentTool}
          color={color}
          strokeWidth={strokeWidth}
        />
      </svg>

      {/* Marquee Selection Rectangle Box */}
      {marqueeStart && marqueeCurrent && (
        <div
          data-testid="marquee-selection-box"
          className="absolute border-2 border-dashed border-indigo-500 bg-indigo-500/10 rounded-sm pointer-events-none"
          style={{
            left: `${Math.min(marqueeStart.x, marqueeCurrent.x) * zoom + pan.x}px`,
            top: `${Math.min(marqueeStart.y, marqueeCurrent.y) * zoom + pan.y}px`,
            width: `${Math.abs(marqueeCurrent.x - marqueeStart.x) * zoom}px`,
            height: `${Math.abs(marqueeCurrent.y - marqueeStart.y) * zoom}px`,
          }}
        />
      )}

      {/* Selection Bounding Box & Action Bar */}
      {selectedElements.length > 0 && (
        <SelectionOverlay
          selectedElements={selectedElements}
          zoom={zoom}
          pan={pan}
          onMoveSelection={(dx, dy) => {
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
          }}
          onMoveEnd={() => onElementsChange(elementsRef.current, 'move')}
          onScaleSelection={handleScaleSelectionLive}
          onScaleEnd={handleScaleSelectionEnd}
          onDeleteSelection={handleDeleteSelection}
          onDuplicateSelection={handleDuplicateSelection}
          onChangeColor={handleChangeSelectedColor}
          onTriggerOcr={onTriggerOcr}
          onDeselect={() => onSelectElements([])}
        />
      )}

      {/* Inline Text Editor */}
      <CanvasInlineTextEditor
        editingTextId={editingTextId}
        editingTextPos={editingTextPos}
        editingTextValue={editingTextValue}
        onChangeValue={setEditingTextValue}
        onFinishEditing={finishTextEditing}
        color={color}
        strokeWidth={strokeWidth}
        zoom={zoom}
        pan={pan}
        textInputRef={textInputRef}
      />

      {/* Remote Collaborators Cursors */}
      <CanvasRemoteCursors remoteUsers={remoteUsers} zoom={zoom} pan={pan} />
    </div>
  );
};
