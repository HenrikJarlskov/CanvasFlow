/**
 * @file ShapesMenuPopover.tsx
 * @description Toolbar dropdown and quick-selector for vector geometric shapes
 * (rectangle, circle, triangle, line, arrow).
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Square,
  Circle,
  Triangle,
  MoveRight,
  Slash,
  ChevronDown,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ShapeType } from '../../types/whiteboard';

/**
 * Props for the ShapesMenuPopover component.
 */
interface ShapesMenuPopoverProps {
  /** The currently selected active shape type */
  selectedShape: ShapeType;
  /** Callback fired when a new shape primitive is selected */
  onSelectShape: (shape: ShapeType) => void;
  /** Whether the shape drawing tool is currently active */
  isActive: boolean;
  /** Callback to activate the shape tool */
  onActivate: () => void;
}

/**
 * Shapes toolbar item supporting one-click activation of the last used shape
 * and a dropdown chevron to choose alternative geometric primitives.
 */
export const ShapesMenuPopover: React.FC<ShapesMenuPopoverProps> = ({
  selectedShape,
  onSelectShape,
  isActive,
  onActivate,
}) => {
  const { t } = useTranslation();
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const shapeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (shapeMenuRef.current && !shapeMenuRef.current.contains(e.target as Node)) {
        setShowShapeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const getShapeIcon = (shape: ShapeType) => {
    switch (shape) {
      case 'rectangle':
        return <Square className="w-4 h-4" />;
      case 'circle':
        return <Circle className="w-4 h-4" />;
      case 'triangle':
        return <Triangle className="w-4 h-4" />;
      case 'line':
        return <Slash className="w-4 h-4" />;
      case 'arrow':
        return <MoveRight className="w-4 h-4" />;
      default:
        return <Square className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative" ref={shapeMenuRef}>
      <button
        type="button"
        data-testid="tool-shape-menu"
        aria-label={t('toolbar.shapes.menuAria', { shape: t(`toolbar.shapes.${selectedShape}`) })}
        aria-expanded={showShapeMenu}
        onClick={() => {
          onActivate();
          setShowShapeMenu((prev) => !prev);
        }}
        className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer min-w-8 min-h-8 sm:min-w-9 sm:min-h-9 flex items-center justify-center gap-0.5 ${
          isActive
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
        }`}
        title={t('toolbar.shapes.menuTitle')}
      >
        {getShapeIcon(selectedShape)}
        <ChevronDown className="w-2.5 h-2.5 opacity-70" />
      </button>

      {showShapeMenu && (
        <div
          data-testid="shape-dropdown-menu"
          role="menu"
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl p-1.5 z-50 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-100"
        >
          <button
            type="button"
            data-testid="shape-rectangle"
            role="menuitem"
            aria-label={t('toolbar.shapes.rectangleAria')}
            onClick={() => {
              onSelectShape('rectangle');
              onActivate();
              setShowShapeMenu(false);
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              selectedShape === 'rectangle' && isActive
                ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
            title={t('toolbar.shapes.rectangle')}
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            type="button"
            data-testid="shape-circle"
            role="menuitem"
            aria-label={t('toolbar.shapes.circleAria')}
            onClick={() => {
              onSelectShape('circle');
              onActivate();
              setShowShapeMenu(false);
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              selectedShape === 'circle' && isActive
                ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
            title={t('toolbar.shapes.circle')}
          >
            <Circle className="w-4 h-4" />
          </button>
          <button
            type="button"
            data-testid="shape-triangle"
            role="menuitem"
            aria-label={t('toolbar.shapes.triangleAria')}
            onClick={() => {
              onSelectShape('triangle');
              onActivate();
              setShowShapeMenu(false);
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              selectedShape === 'triangle' && isActive
                ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
            title={t('toolbar.shapes.triangle')}
          >
            <Triangle className="w-4 h-4" />
          </button>
          <button
            type="button"
            data-testid="shape-line"
            role="menuitem"
            aria-label={t('toolbar.shapes.lineAria')}
            onClick={() => {
              onSelectShape('line');
              onActivate();
              setShowShapeMenu(false);
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              selectedShape === 'line' && isActive
                ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
            title={t('toolbar.shapes.line')}
          >
            <Slash className="w-4 h-4" />
          </button>
          <button
            type="button"
            data-testid="shape-arrow"
            role="menuitem"
            aria-label={t('toolbar.shapes.arrowAria')}
            onClick={() => {
              onSelectShape('arrow');
              onActivate();
              setShowShapeMenu(false);
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              selectedShape === 'arrow' && isActive
                ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
            title={t('toolbar.shapes.arrow')}
          >
            <MoveRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
