/**
 * @file ExportMenu.tsx
 * @description Header dropdown menu triggering whiteboard diagram exports
 * into PNG (raster), SVG (scalable vector), or PDF (print/document) formats.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, Image as ImageIcon, FileText, Code2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Props for the ExportMenu component.
 */
interface ExportMenuProps {
  /** Handler to rasterize whiteboard to PNG file */
  onExportPNG: () => void;
  /** Handler to generate PDF document */
  onExportPDF: () => void;
  /** Handler to export vector SVG */
  onExportSVG: () => void;
}

/**
 * Dropdown button offering vector and raster export formats.
 */
export const ExportMenu: React.FC<ExportMenuProps> = ({
  onExportPNG,
  onExportPDF,
  onExportSVG,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        data-testid="btn-export-menu"
        aria-label={t('export.exportOptions')}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400" />
        <span className="hidden sm:inline">{t('export.export')}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 dark:text-zinc-400" />
      </button>

      {isOpen && (
        <div
          data-testid="export-dropdown-menu"
          role="menu"
          className="absolute top-full right-0 mt-1.5 w-44 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <button
            type="button"
            data-testid="btn-export-png"
            role="menuitem"
            onClick={() => {
              onExportPNG();
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t('export.exportPng')}</span>
          </button>
          <button
            type="button"
            data-testid="btn-export-pdf"
            role="menuitem"
            onClick={() => {
              onExportPDF();
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span>{t('export.exportPdf')}</span>
          </button>
          <button
            type="button"
            data-testid="btn-export-svg"
            role="menuitem"
            onClick={() => {
              onExportSVG();
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer"
          >
            <Code2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{t('export.exportSvg')}</span>
          </button>
        </div>
      )}
    </div>
  );
};
