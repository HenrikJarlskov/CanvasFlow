/**
 * @file SelectionOverlay.tsx
 * @description Interactive canvas selection bounding box, transform handles, and floating toolbar.
 * Supports:
 * - 8-point affine resize handles (nw, n, ne, e, se, s, sw, w) with opposite anchor scaling
 * - Pointer drag translation with viewport pan & zoom compensation
 * - Floating quick-action bar (delete, duplicate, color swatch popover, OCR trigger, deselect)
 */

import React, { useState, useRef } from 'react';
import { Sparkles, Trash2, Copy, Palette, X, Move } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BoardElement, BoundingBox } from '../types/whiteboard';
import { getElementsBoundingBox } from '../utils/ocr';

/** 8 cardinal/diagonal handle points for bounding box transformation */
export type ResizeHandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

/**
 * Props for the SelectionOverlay component.
 */
interface SelectionOverlayProps {
  /** Currently highlighted whiteboard elements */
  selectedElements: BoardElement[];
  /** Current camera magnification scale */
  zoom: number;
  /** Current camera 2D translation offset */
  pan: { x: number; y: number };
  /** Callback fired continuously during drag translation */
  onMoveSelection: (dx: number, dy: number) => void;
  /** Callback fired when pointer release commits translation */
  onMoveEnd?: () => void;
  /** Callback fired continuously during affine scaling */
  onScaleSelection?: (scaleX: number, scaleY: number, anchorX: number, anchorY: number) => void;
  /** Callback fired when pointer release commits resize scaling */
  onScaleEnd?: () => void;
  /** Callback to delete all selected items */
  onDeleteSelection: () => void;
  /** Callback to duplicate selected items */
  onDuplicateSelection: () => void;
  /** Callback to apply a color tint to all selected items */
  onChangeColor: (color: string) => void;
  /** Trigger OCR transcription on the selected visual elements */
  onTriggerOcr: () => void;
  /** Deselect all elements */
  onDeselect: () => void;
}

/** Palette swatches for immediate color adjustments */
const QUICK_COLORS = ['#18181b', '#2563eb', '#059669', '#dc2626', '#d97706', '#7c3aed'];

/**
 * Screen-space interactive box surrounding selected whiteboard elements.
 */
export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  selectedElements,
  zoom,
  pan,
  onMoveSelection,
  onMoveEnd,
  onScaleSelection,
  onScaleEnd,
  onDeleteSelection,
  onDuplicateSelection,
  onChangeColor,
  onTriggerOcr,
  onDeselect,
}) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [resizingHandle, setResizingHandle] = useState<ResizeHandleType | null>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const resizeStartRef = useRef<{
    handle: ResizeHandleType;
    clientX: number;
    clientY: number;
    initialBounds: BoundingBox;
  } | null>(null);
  const [showColorPopover, setShowColorPopover] = useState(false);

  if (!selectedElements || selectedElements.length === 0) return null;

  const bounds: BoundingBox = getElementsBoundingBox(selectedElements);

  // Convert canvas coordinates to screen coordinates
  const screenLeft = bounds.minX * zoom + pan.x;
  const screenTop = bounds.minY * zoom + pan.y;
  const screenWidth = Math.max(30, bounds.width * zoom);
  const screenHeight = Math.max(30, bounds.height * zoom);

  const startDrag = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStartRef.current = { clientX, clientY };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!dragStartRef.current) return;
      const dx = (moveEvent.clientX - dragStartRef.current.clientX) / zoom;
      const dy = (moveEvent.clientY - dragStartRef.current.clientY) / zoom;
      dragStartRef.current = { clientX: moveEvent.clientX, clientY: moveEvent.clientY };
      onMoveSelection(dx, dy);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      onMoveEnd?.();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  };

  // Interactive Resizing Handle Pointer Handlers
  const handleResizePointerDown = (handle: ResizeHandleType, e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    setResizingHandle(handle);
    const initialBounds = { ...bounds };
    resizeStartRef.current = {
      handle,
      clientX: e.clientX,
      clientY: e.clientY,
      initialBounds,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!resizeStartRef.current) return;
      const { handle: activeHandle, clientX: startX, clientY: startY, initialBounds: init } = resizeStartRef.current;
      const totalDx = (moveEvent.clientX - startX) / zoom;
      const totalDy = (moveEvent.clientY - startY) / zoom;

      const initW = Math.max(10, init.width);
      const initH = Math.max(10, init.height);

      let anchorX = init.minX;
      let anchorY = init.minY;
      let scaleX = 1;
      let scaleY = 1;

      switch (activeHandle) {
        case 'se': {
          anchorX = init.minX;
          anchorY = init.minY;
          const newW = Math.max(15, initW + totalDx);
          const newH = Math.max(15, initH + totalDy);
          scaleX = newW / initW;
          scaleY = newH / initH;
          break;
        }
        case 'nw': {
          anchorX = init.maxX;
          anchorY = init.maxY;
          const newW = Math.max(15, initW - totalDx);
          const newH = Math.max(15, initH - totalDy);
          scaleX = newW / initW;
          scaleY = newH / initH;
          break;
        }
        case 'ne': {
          anchorX = init.minX;
          anchorY = init.maxY;
          const newW = Math.max(15, initW + totalDx);
          const newH = Math.max(15, initH - totalDy);
          scaleX = newW / initW;
          scaleY = newH / initH;
          break;
        }
        case 'sw': {
          anchorX = init.maxX;
          anchorY = init.minY;
          const newW = Math.max(15, initW - totalDx);
          const newH = Math.max(15, initH + totalDy);
          scaleX = newW / initW;
          scaleY = newH / initH;
          break;
        }
        case 'e': {
          anchorX = init.minX;
          anchorY = init.minY;
          const newW = Math.max(15, initW + totalDx);
          scaleX = newW / initW;
          scaleY = 1;
          break;
        }
        case 'w': {
          anchorX = init.maxX;
          anchorY = init.minY;
          const newW = Math.max(15, initW - totalDx);
          scaleX = newW / initW;
          scaleY = 1;
          break;
        }
        case 's': {
          anchorX = init.minX;
          anchorY = init.minY;
          const newH = Math.max(15, initH + totalDy);
          scaleX = 1;
          scaleY = newH / initH;
          break;
        }
        case 'n': {
          anchorX = init.minX;
          anchorY = init.maxY;
          const newH = Math.max(15, initH - totalDy);
          scaleX = 1;
          scaleY = newH / initH;
          break;
        }
      }

      onScaleSelection?.(scaleX, scaleY, anchorX, anchorY);
    };

    const handlePointerUp = () => {
      setResizingHandle(null);
      resizeStartRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      onScaleEnd?.();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const resizeHandles: { id: ResizeHandleType; posClass: string; cursor: string; label: string }[] = [
    { id: 'nw', posClass: '-top-2 -left-2', cursor: 'cursor-nwse-resize', label: 'Top-Left' },
    { id: 'n', posClass: '-top-2 left-1/2 -translate-x-1/2', cursor: 'cursor-ns-resize', label: 'Top' },
    { id: 'ne', posClass: '-top-2 -right-2', cursor: 'cursor-nesw-resize', label: 'Top-Right' },
    { id: 'e', posClass: 'top-1/2 -right-2 -translate-y-1/2', cursor: 'cursor-ew-resize', label: 'Right' },
    { id: 'se', posClass: '-bottom-2 -right-2', cursor: 'cursor-nwse-resize', label: 'Bottom-Right' },
    { id: 's', posClass: '-bottom-2 left-1/2 -translate-x-1/2', cursor: 'cursor-ns-resize', label: 'Bottom' },
    { id: 'sw', posClass: '-bottom-2 -left-2', cursor: 'cursor-nesw-resize', label: 'Bottom-Left' },
    { id: 'w', posClass: 'top-1/2 -left-2 -translate-y-1/2', cursor: 'cursor-ew-resize', label: 'Left' },
  ];

  return (
    <div
      data-testid="selection-overlay"
      className="absolute z-30 pointer-events-auto"
      style={{
        left: `${screenLeft - 6}px`,
        top: `${screenTop - 6}px`,
        width: `${screenWidth + 12}px`,
        height: `${screenHeight + 12}px`,
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Draggable selection box area */}
      <div
        data-testid="selection-drag-handle"
        onPointerDown={handlePointerDown}
        className={`w-full h-full border-2 border-dashed border-indigo-600 dark:border-indigo-400 rounded-lg cursor-move transition-colors flex items-center justify-center ${
          isDragging || resizingHandle
            ? 'bg-indigo-500/25 border-indigo-700 dark:border-indigo-300 ring-2 ring-indigo-400'
            : 'bg-indigo-500/5 hover:bg-indigo-500/15 dark:hover:bg-indigo-400/20'
        }`}
        title="Click and drag anywhere inside to move selection"
      >
        {/* Subtle move icon indicator in center */}
        <div className="opacity-60 hover:opacity-100 transition-opacity bg-white/95 dark:bg-zinc-800/95 p-1.5 rounded-full shadow-sm text-indigo-600 dark:text-indigo-400 pointer-events-none">
          <Move className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* 8 Interactive Resizing Handles */}
      {resizeHandles.map((handle) => (
        <div
          key={handle.id}
          data-testid={`resize-handle-${handle.id}`}
          onPointerDown={(e) => handleResizePointerDown(handle.id, e)}
          className={`absolute ${handle.posClass} ${handle.cursor} w-4 h-4 bg-white dark:bg-zinc-800 border-2 border-indigo-600 dark:border-indigo-400 rounded-sm shadow-md hover:scale-125 hover:bg-indigo-100 dark:hover:bg-indigo-950 transition-transform z-50`}
          title={`Drag to scale (${handle.label})`}
        />
      ))}

      {/* Floating Action Bar above selection */}
      <div
        data-testid="selection-toolbar"
        className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl p-1 flex items-center gap-1 select-none animate-in fade-in duration-100 whitespace-nowrap z-40"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* OCR Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTriggerOcr();
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          title={t('selection.ocrTitle')}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{t('selection.ocrButton')}</span>
        </button>

        <div className="w-px h-4 bg-slate-200 dark:bg-zinc-800 mx-0.5" />

        {/* Color picker */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowColorPopover(!showColorPopover);
            }}
            className="p-1.5 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
            title={t('selection.changeColor')}
          >
            <Palette className="w-3.5 h-3.5" />
          </button>

          {showColorPopover && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl p-2 flex items-center gap-1.5 z-50">
              {QUICK_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChangeColor(c);
                    setShowColorPopover(false);
                  }}
                  className="w-5 h-5 rounded-full border border-slate-200 dark:border-zinc-700 cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Duplicate */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicateSelection();
          }}
          className="p-1.5 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
          title={t('selection.duplicate')}
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteSelection();
          }}
          className="p-1.5 text-slate-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer"
          title={t('selection.delete')}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {/* Deselect */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeselect();
          }}
          className="p-1.5 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
          title={t('selection.deselect')}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
