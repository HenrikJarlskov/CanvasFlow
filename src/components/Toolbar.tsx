/**
 * @file Toolbar.tsx
 * @description Floating vector drawing toolbar component for AIdboard.
 *
 * Controls Provided:
 * - Tool Selection (Selection Cursor, Pan Hand, Pencil, Highlighter, Eraser, Shapes, Text)
 * - Color Picker Popover with curated color swatches and custom hex picker
 * - Stroke Width Selector Popover (Fine 2px, Medium 4px, Bold 8px, Heavy 14px)
 * - Geometric Shapes Menu Popover (Rectangle, Circle, Triangle, Line, Arrow)
 * - Auto-Snap Geometric Heuristic Toggle
 * - Background Grid Lines Toggle (Clean vs Grid-Assisted Workspace)
 * - Undo & Redo History Controls
 * - Image & Draw.io File Import Buttons
 * - AI Diagram & Vision Generation Trigger
 * - Zoom & Canvas Pan Controls
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  MousePointer,
  Pencil,
  Highlighter,
  Eraser,
  Type,
  Hand,
  Sparkles,
  Undo2,
  Redo2,
  FolderInput,
  Wand2,
  Grid,
  MoreHorizontal,
} from 'lucide-react';
import { ToolType, ShapeType, BackgroundType } from '../types/whiteboard';
import { useTranslation } from 'react-i18next';
import { ZoomControls } from './toolbar/ZoomControls';
import { ColorPickerPopover, COLOR_PALETTE } from './toolbar/ColorPickerPopover';
import { StrokeWidthSelector, STROKE_WIDTHS } from './toolbar/StrokeWidthSelector';
import { ShapesMenuPopover } from './toolbar/ShapesMenuPopover';

export { COLOR_PALETTE, STROKE_WIDTHS };

/**
 * Properties for the Toolbar component.
 */
interface ToolbarProps {
  currentTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  selectedShape: ShapeType;
  onSelectShape: (shape: ShapeType) => void;
  color: string;
  onChangeColor: (color: string) => void;
  strokeWidth: number;
  onChangeStrokeWidth: (width: number) => void;
  autoSnap: boolean;
  onToggleAutoSnap: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onOpenAiDraw?: () => void;
  onOpenImportModal?: () => void;
  onImportImageFile?: (file: File) => void;
  /** Active canvas background pattern texture ('dots' | 'grid' | 'blank' | 'blueprint' | 'dark') */
  background?: BackgroundType;
  /** Callback fired to toggle background grid lines on/off between clean and grid-assisted workspace */
  onToggleGrid?: () => void;
  /** Optional callback to directly update canvas background style */
  onChangeBackground?: (bg: BackgroundType) => void;
}

/**
 * Floating toolbar anchored to the top/center of the canvas.
 */
export const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  onSelectTool,
  selectedShape,
  onSelectShape,
  color,
  onChangeColor,
  strokeWidth,
  onChangeStrokeWidth,
  autoSnap,
  onToggleAutoSnap,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onOpenAiDraw,
  onOpenImportModal,
  onImportImageFile,
  background = 'dots',
  onToggleGrid,
  onChangeBackground,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const overflowMenuRef = useRef<HTMLDivElement>(null);

  /** Close overflow popover when clicking outside */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overflowMenuRef.current && !overflowMenuRef.current.contains(e.target as Node)) {
        setIsOverflowOpen(false);
      }
    };
    if (isOverflowOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOverflowOpen]);

  /** Whether background grid lines/pattern are currently displayed */
  const isGridOn = background !== 'blank';

  /**
   * Toggles background grid lines on or off.
   * If onToggleGrid callback is provided, delegates to parent.
   * Otherwise falls back to toggling background between 'blank' and 'grid'.
   */
  const handleToggleGrid = () => {
    if (onToggleGrid) {
      onToggleGrid();
    } else if (onChangeBackground) {
      onChangeBackground(isGridOn ? 'blank' : 'grid');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportImageFile) {
      onImportImageFile(file);
    }
    if (e.target) e.target.value = '';
  };

  return (
    <>
      {/* Hidden image file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        data-testid="toolbar-image-file-input"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Primary Floating Toolbar - Responsive for Desktop, Tablet, and Mobile */}
      <div
        data-testid="primary-toolbar"
        role="toolbar"
        aria-label="Drawing tools toolbar"
        className="fixed top-16 sm:top-18 left-1/2 -translate-x-1/2 z-20 max-w-[calc(100vw-1rem)] overflow-visible bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200/90 dark:border-zinc-800 rounded-2xl shadow-xl p-1 sm:p-1.5 flex items-center gap-0.5 sm:gap-1 select-none"
      >
        {/* Select / Move */}
        <button
          type="button"
          data-testid="tool-select"
          aria-label={t('toolbar.selectTool')}
          aria-pressed={currentTool === 'select'}
          onClick={() => onSelectTool('select')}
          className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer min-w-8 min-h-8 sm:min-w-9 sm:min-h-9 flex items-center justify-center ${
            currentTool === 'select'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
          title={t('toolbar.selectToolTitle')}
        >
          <MousePointer className="w-4 h-4" />
        </button>

        {/* Hand / Pan Canvas */}
        <button
          type="button"
          data-testid="tool-pan"
          aria-label={t('toolbar.panTool')}
          aria-pressed={currentTool === 'pan'}
          onClick={() => onSelectTool('pan')}
          className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer min-w-8 min-h-8 sm:min-w-9 sm:min-h-9 flex items-center justify-center ${
            currentTool === 'pan'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
          title={t('toolbar.panToolTitle')}
        >
          <Hand className="w-4 h-4" />
        </button>

        {/* Freehand Pen */}
        <button
          type="button"
          data-testid="tool-pen"
          aria-label={t('toolbar.penTool')}
          aria-pressed={currentTool === 'pen'}
          onClick={() => onSelectTool('pen')}
          className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer min-w-8 min-h-8 sm:min-w-9 sm:min-h-9 flex items-center justify-center ${
            currentTool === 'pen'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
          title={t('toolbar.penToolTitle')}
        >
          <Pencil className="w-4 h-4" />
        </button>

        {/* Highlighter */}
        <button
          type="button"
          data-testid="tool-highlighter"
          aria-label={t('toolbar.highlighterTool')}
          aria-pressed={currentTool === 'highlighter'}
          onClick={() => onSelectTool('highlighter')}
          className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer min-w-8 min-h-8 sm:min-w-9 sm:min-h-9 flex items-center justify-center ${
            currentTool === 'highlighter'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
          title={t('toolbar.highlighterToolTitle')}
        >
          <Highlighter className="w-4 h-4" />
        </button>

        {/* Eraser */}
        <button
          type="button"
          data-testid="tool-eraser"
          aria-label={t('toolbar.eraserTool')}
          aria-pressed={currentTool === 'eraser'}
          onClick={() => onSelectTool('eraser')}
          className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer min-w-8 min-h-8 sm:min-w-9 sm:min-h-9 flex items-center justify-center ${
            currentTool === 'eraser'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
          title={t('toolbar.eraserToolTitle')}
        >
          <Eraser className="w-4 h-4" />
        </button>

        {/* Geometric Shapes Dropdown */}
        <ShapesMenuPopover
          selectedShape={selectedShape}
          onSelectShape={onSelectShape}
          isActive={currentTool === 'shape'}
          onActivate={() => onSelectTool('shape')}
        />

        {/* Text tool */}
        <button
          type="button"
          data-testid="tool-text"
          aria-label={t('toolbar.textTool')}
          aria-pressed={currentTool === 'text'}
          onClick={() => onSelectTool('text')}
          className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer min-w-8 min-h-8 sm:min-w-9 sm:min-h-9 flex items-center justify-center ${
            currentTool === 'text'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
          title={t('toolbar.textToolTitle')}
        >
          <Type className="w-4 h-4" />
        </button>

        {/* AI Whiteboard Artist Quick Button */}
        {onOpenAiDraw && (
          <button
            type="button"
            data-testid="tool-ai-draw"
            aria-label={t('toolbar.aiDrawTool')}
            onClick={onOpenAiDraw}
            className="p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer min-w-8 min-h-8 sm:min-w-9 sm:min-h-9 flex items-center justify-center text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/50 hover:text-violet-700"
            title={t('toolbar.aiDrawToolTitle')}
          >
            <Wand2 className="w-4 h-4" />
          </button>
        )}

        {/* Import button (Images, SAP Icons, Draw.io) */}
        {(onOpenImportModal || onImportImageFile) && (
          <button
            type="button"
            data-testid="tool-import"
            data-testid-alias="tool-import-image"
            aria-label={t('toolbar.importTool')}
            onClick={() => {
              if (onOpenImportModal) {
                onOpenImportModal();
              } else {
                fileInputRef.current?.click();
              }
            }}
            className="p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer min-w-8 min-h-8 sm:min-w-9 sm:min-h-9 flex items-center justify-center text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800"
            title={t('toolbar.importToolTitle')}
          >
            <FolderInput className="w-4 h-4" />
          </button>
        )}

        {/* Desktop-only secondary controls: AutoSnap & Grid */}
        <div className="hidden lg:flex items-center gap-0.5 sm:gap-1">
          {/* Divider */}
          <div className="h-5 sm:h-6 w-px bg-slate-200 dark:bg-zinc-800 mx-0.5 shrink-0" />

          {/* Shape Snapping Toggle */}
          <button
            type="button"
            data-testid="toggle-auto-snap"
            aria-label={t('toolbar.shapeSnapAria', { status: autoSnap ? 'on' : 'off' })}
            onClick={onToggleAutoSnap}
            className={`px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer shrink-0 ${
              autoSnap
                ? 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 shadow-2xs'
                : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 border border-transparent'
            }`}
            title={t('toolbar.shapeSnapTitle')}
          >
            <Sparkles className={`w-3.5 h-3.5 ${autoSnap ? 'text-amber-600 animate-pulse' : 'text-slate-400 dark:text-zinc-400'}`} />
            <span className="hidden xl:inline font-semibold">{t('toolbar.shapeSnap')}</span>
            <span
              data-testid="auto-snap-status"
              className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded-full ${
                autoSnap ? 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200' : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200'
              }`}
            >
              {autoSnap ? t('common.on') : t('common.off')}
            </span>
          </button>

          {/* Background Grid Lines Toggle */}
          <button
            type="button"
            data-testid="toggle-grid"
            data-testid-alias="toggle-grid-lines"
            aria-label={t('toolbar.gridAria', { status: isGridOn ? 'on' : 'off' })}
            aria-pressed={isGridOn}
            onClick={handleToggleGrid}
            className={`px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer shrink-0 ${
              isGridOn
                ? 'bg-blue-100/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-800 shadow-2xs'
                : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 border border-transparent'
            }`}
            title={isGridOn ? t('toolbar.gridCleanTitle') : t('toolbar.gridAssistedTitle')}
          >
            <Grid className={`w-3.5 h-3.5 ${isGridOn ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-400'}`} />
            <span className="hidden xl:inline font-semibold">{t('toolbar.grid')}</span>
            <span
              data-testid="grid-status"
              className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded-full ${
                isGridOn
                  ? 'bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200'
                  : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200'
              }`}
            >
              {isGridOn ? t('common.on') : t('common.off')}
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="h-5 sm:h-6 w-px bg-slate-200 dark:bg-zinc-800 mx-0.5 shrink-0" />

        {/* Color Palette Popover */}
        <ColorPickerPopover color={color} onChangeColor={onChangeColor} />

        {/* Stroke Width Selector */}
        <StrokeWidthSelector strokeWidth={strokeWidth} onChangeStrokeWidth={onChangeStrokeWidth} />

        {/* Desktop-only Undo / Redo */}
        <div className="hidden lg:flex items-center gap-0.5 sm:gap-1">
          {/* Divider */}
          <div className="h-5 sm:h-6 w-px bg-slate-200 dark:bg-zinc-800 mx-0.5 shrink-0" />

          {/* Undo / Redo */}
          <button
            type="button"
            data-testid="btn-undo"
            aria-label={t('toolbar.undoAria')}
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 sm:p-2 rounded-xl text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
            title={t('toolbar.undo')}
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            data-testid="btn-redo"
            aria-label={t('toolbar.redoAria')}
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 sm:p-2 rounded-xl text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
            title={t('toolbar.redo')}
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Responsive Toolbar Overflow Menu for compact viewports */}
        <div className="relative lg:hidden flex items-center" ref={overflowMenuRef}>
          <div className="h-5 sm:h-6 w-px bg-slate-200 dark:bg-zinc-800 mx-0.5 shrink-0" />
          <button
            type="button"
            data-testid="tool-overflow-menu"
            aria-label={t('toolbar.moreTools')}
            aria-expanded={isOverflowOpen}
            onClick={() => setIsOverflowOpen((prev) => !prev)}
            className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer min-w-8 min-h-8 sm:min-w-9 sm:min-h-9 flex items-center justify-center ${
              isOverflowOpen
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
            title={t('toolbar.moreToolsTitle')}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {isOverflowOpen && (
            <div
              data-testid="toolbar-overflow-popover"
              role="menu"
              className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-1 text-xs"
            >
              <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                {t('toolbar.quickSettings')}
              </div>

              {/* Grid toggle in overflow */}
              <button
                type="button"
                data-testid="overflow-toggle-grid"
                role="menuitem"
                onClick={() => {
                  handleToggleGrid();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                  isGridOn
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                    : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Grid className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium">{t('toolbar.grid')}</span>
                </span>
                <span
                  className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full ${
                    isGridOn
                      ? 'bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200'
                      : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200'
                  }`}
                >
                  {isGridOn ? t('common.on') : t('common.off')}
                </span>
              </button>

              {/* Auto-snap toggle in overflow */}
              <button
                type="button"
                data-testid="overflow-toggle-auto-snap"
                role="menuitem"
                onClick={() => {
                  onToggleAutoSnap();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                  autoSnap
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                    : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-medium">{t('toolbar.shapeSnap')}</span>
                </span>
                <span
                  className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full ${
                    autoSnap
                      ? 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200'
                      : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200'
                  }`}
                >
                  {autoSnap ? t('common.on') : t('common.off')}
                </span>
              </button>

              <div className="h-px bg-slate-200 dark:bg-zinc-800 my-1" />

              {/* Undo & Redo in overflow */}
              <div className="grid grid-cols-2 gap-1 px-1">
                <button
                  type="button"
                  data-testid="overflow-btn-undo"
                  role="menuitem"
                  disabled={!canUndo}
                  onClick={() => {
                    onUndo();
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                >
                  <Undo2 className="w-4 h-4" />
                  <span>{t('toolbar.undo')}</span>
                </button>
                <button
                  type="button"
                  data-testid="overflow-btn-redo"
                  role="menuitem"
                  disabled={!canRedo}
                  onClick={() => {
                    onRedo();
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                >
                  <Redo2 className="w-4 h-4" />
                  <span>{t('toolbar.redo')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Navigation / Zoom Bar */}
      <ZoomControls
        zoom={zoom}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onResetZoom={onResetZoom}
      />
    </>
  );
};
