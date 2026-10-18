/**
 * @file useWhiteboardShortcuts.ts
 * @description Global keyboard event listener hook mapping user-customizable hotkeys
 * to whiteboard tool activations, viewport navigation, zooming, and canvas actions.
 */

import { useEffect } from 'react';
import { ToolType, BoardElement } from '../types/whiteboard';
import { ShortcutItem, matchesShortcut } from '../utils/shortcuts';

/**
 * Flexible pan callback supporting both 2-argument (dx, dy) and single-object ({ x, y }) signatures.
 */
export type PanCallback =
  | ((dx: number, dy: number) => void)
  | ((delta: { x: number; y: number }) => void);

/**
 * Configuration options and action triggers for keyboard shortcut bindings.
 */
interface UseWhiteboardShortcutsOptions {
  /** Array of active shortcut bindings */
  shortcuts: ShortcutItem[];
  /** Current elements on the board */
  elements?: BoardElement[];
  /** IDs of currently selected elements */
  selectedIds?: string[];
  /** Tool selector callback */
  setCurrentTool: (tool: ToolType) => void;
  /** Undo action callback */
  onUndo: () => void;
  /** Redo action callback */
  onRedo: () => void;
  /** Deletion callback */
  onDeleteSelected: () => void;
  /** Select all elements callback */
  onSelectAll: () => void;
  /** Duplicate selected items callback */
  onDuplicateSelected: () => void;
  /** Zoom in callback */
  onZoomIn: () => void;
  /** Zoom out callback */
  onZoomOut: () => void;
  /** Reset zoom level callback */
  onResetZoom: () => void;
  /** Toggle auto-snapping callback */
  onToggleSnap: () => void;
  /** Toggle background grid lines on/off callback */
  onToggleGrid?: () => void;
  /** Trigger AI Diagram Generator modal */
  onOpenAiDraw: () => void;
  /** Trigger Saved Boards modal */
  onOpenBoards: () => void;
  /** Trigger Help / Shortcuts modal */
  onOpenHelp: () => void;
  /** Viewport pan handler */
  onPan?: PanCallback;
  /** Alternative alias for viewport pan handler */
  onPanViewport?: PanCallback;
}

/**
 * Hook registering global `keydown` listeners on the window object.
 *
 * Complex Event Handling Loop:
 * 1. **Focus Protection**: Automatically ignores events when focused inside `<input>`, `<textarea>`,
 *    or contenteditable nodes to preserve natural typing.
 * 2. **Arrow Key Navigation**: Maps ArrowUp/Down/Left/Right directly to canvas viewport pan (40px step,
 *    accelerated to 120px when Shift is held).
 * 3. **Shortcut Match Loop**: Iterates through each configured `ShortcutItem`, evaluating `matchesShortcut()`.
 *    Upon first match, calls `e.preventDefault()` and dispatches the corresponding state action.
 */
export function useWhiteboardShortcuts({
  shortcuts,
  setCurrentTool,
  onUndo,
  onRedo,
  onDeleteSelected,
  onSelectAll,
  onDuplicateSelected,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleSnap,
  onToggleGrid,
  onOpenAiDraw,
  onOpenBoards,
  onOpenHelp,
  onPan,
  onPanViewport,
}: UseWhiteboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      // Do not trigger canvas shortcuts while typing in forms
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      ) {
        return;
      }

      // -------------------------------------------------------------
      // Arrow keys pan whiteboard viewport
      // -------------------------------------------------------------
      if (
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight'
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 120 : 40;
        let dx = 0;
        let dy = 0;
        if (e.key === 'ArrowUp') dy = step;
        else if (e.key === 'ArrowDown') dy = -step;
        else if (e.key === 'ArrowLeft') dx = step;
        else if (e.key === 'ArrowRight') dx = -step;

        const panFn = onPanViewport || onPan;
        if (typeof panFn === 'function') {
          if (panFn.length === 1) {
            (panFn as (delta: { x: number; y: number }) => void)({ x: dx, y: dy });
          } else {
            (panFn as (dx: number, dy: number) => void)(dx, dy);
          }
        }
        return;
      }

      // -------------------------------------------------------------
      // Shortcut Matching Loop: Test against active shortcut bindings
      // -------------------------------------------------------------
      for (const item of shortcuts) {
        if (matchesShortcut(e, item.currentKey)) {
          switch (item.id) {
            case 'tool_select':
              e.preventDefault();
              setCurrentTool('select');
              return;
            case 'tool_hand':
              e.preventDefault();
              setCurrentTool('pan');
              return;
            case 'tool_pencil':
              e.preventDefault();
              setCurrentTool('pen');
              return;
            case 'tool_highlighter':
              e.preventDefault();
              setCurrentTool('highlighter');
              return;
            case 'tool_eraser':
              e.preventDefault();
              setCurrentTool('eraser');
              return;
            case 'tool_shape':
              e.preventDefault();
              setCurrentTool('shape');
              return;
            case 'tool_text':
              e.preventDefault();
              setCurrentTool('text');
              return;
            case 'action_undo':
              e.preventDefault();
              onUndo();
              return;
            case 'action_redo':
              e.preventDefault();
              onRedo();
              return;
            case 'action_delete':
              e.preventDefault();
              onDeleteSelected();
              return;
            case 'action_select_all':
              e.preventDefault();
              onSelectAll();
              return;
            case 'action_duplicate':
              e.preventDefault();
              onDuplicateSelected();
              return;
            case 'action_zoom_in':
              e.preventDefault();
              onZoomIn();
              return;
            case 'action_zoom_out':
              e.preventDefault();
              onZoomOut();
              return;
            case 'action_reset_zoom':
              e.preventDefault();
              onResetZoom();
              return;
            case 'action_toggle_snap':
              e.preventDefault();
              onToggleSnap();
              return;
            case 'action_toggle_grid':
              e.preventDefault();
              onToggleGrid?.();
              return;
            case 'action_pan_viewport': {
              e.preventDefault();
              const step = e.shiftKey ? 120 : 40;
              let dx = 0;
              let dy = 0;
              if (e.key === 'ArrowUp') dy = step;
              else if (e.key === 'ArrowDown') dy = -step;
              else if (e.key === 'ArrowLeft') dx = step;
              else if (e.key === 'ArrowRight') dx = -step;

              const panFn = onPanViewport || onPan;
              if (typeof panFn === 'function') {
                if (panFn.length === 1) {
                  (panFn as (delta: { x: number; y: number }) => void)({ x: dx, y: dy });
                } else {
                  (panFn as (dx: number, dy: number) => void)(dx, dy);
                }
              }
              return;
            }
            case 'action_ai_draw':
              e.preventDefault();
              onOpenAiDraw();
              return;
            case 'action_boards':
              e.preventDefault();
              onOpenBoards();
              return;
            case 'action_help':
              e.preventDefault();
              onOpenHelp();
              return;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    shortcuts,
    setCurrentTool,
    onUndo,
    onRedo,
    onDeleteSelected,
    onSelectAll,
    onDuplicateSelected,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    onToggleSnap,
    onOpenAiDraw,
    onOpenBoards,
    onOpenHelp,
    onPan,
    onPanViewport,
  ]);
}
