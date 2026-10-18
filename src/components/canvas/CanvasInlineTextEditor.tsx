/**
 * @file CanvasInlineTextEditor.tsx
 * @description In-place vector canvas textarea editor overlay.
 * Positions a focused textarea over target canvas coordinates, scaling font size
 * to match current canvas zoom and text element stroke width styling.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Props for the inline canvas text editor component.
 */
interface CanvasInlineTextEditorProps {
  /** Identifier of the text element currently being edited */
  editingTextId: string | null;
  /** Canvas coordinate position of the target text element */
  editingTextPos: { x: number; y: number } | null;
  /** Controlled text content value */
  editingTextValue: string;
  /** Value change callback */
  onChangeValue: (val: string) => void;
  /** Commit and close text editing callback */
  onFinishEditing: () => void;
  /** Active text color */
  color: string;
  /** Stroke width metric mapped to font sizing */
  strokeWidth: number;
  /** Viewport zoom factor */
  zoom: number;
  /** Viewport 2D pan offset */
  pan: { x: number; y: number };
  /** React ref targeting the underlying HTML textarea */
  textInputRef: React.RefObject<HTMLTextAreaElement | null>;
}

/**
 * Overlay textarea permitting inline multiline typing and formatting on the whiteboard.
 */
export const CanvasInlineTextEditor: React.FC<CanvasInlineTextEditorProps> = ({
  editingTextId,
  editingTextPos,
  editingTextValue,
  onChangeValue,
  onFinishEditing,
  color,
  strokeWidth,
  zoom,
  pan,
  textInputRef,
}) => {
  const { t } = useTranslation();
  if (!editingTextId || !editingTextPos) return null;

  return (
    <div
      className="absolute z-40"
      style={{
        left: `${editingTextPos.x * zoom + pan.x}px`,
        top: `${editingTextPos.y * zoom + pan.y}px`,
        transformOrigin: 'top left',
      }}
    >
      <textarea
        ref={textInputRef}
        data-testid="inline-text-input"
        aria-label="Text content"
        value={editingTextValue}
        onChange={(e) => onChangeValue(e.target.value)}
        onBlur={onFinishEditing}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            onFinishEditing();
          }
        }}
        placeholder={t('canvas.typeTextHere')}
        className="p-1 bg-white dark:bg-zinc-800 border border-indigo-500 rounded-md shadow-lg outline-none font-sans min-w-36 min-h-12 resize-both"
        style={{
          color,
          fontSize: `${Math.max(14, strokeWidth * 5 * zoom)}px`,
          lineHeight: 1.3,
        }}
      />
      <div className="text-[10px] text-slate-400 bg-white/90 dark:bg-zinc-800/90 px-1 py-0.5 rounded shadow-xs mt-0.5">
        {t('canvas.finishEditingTip')}
      </div>
    </div>
  );
};
