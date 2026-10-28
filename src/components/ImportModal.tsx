/**
 * @file ImportModal.tsx
 * @description Architecture diagram and external asset import modal.
 * Supports:
 * 1. SAP BTP & enterprise architecture vector icons library
 * 2. Draw.io / Diagrams.net XML file parsing and bulk element insertion
 * 3. Raster image uploads with automatic coordinate centering
 */

import React, { useState, useId } from 'react';
import {
  X,
  Search,
  Upload,
  Layers,
  FileCode,
  Image as ImageIcon,
  Check,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  SAP_ICON_CATEGORIES,
  SAP_ICON_STATS,
  SAP_ARCHITECTURE_ICONS,
  generateDrawioLibraryXml,
  SapArchitectureIcon,
  searchSapIcons,
  getSvgDataUri,
} from '../utils/sapIcons';
import {
  parseDrawio,
  convertDrawioItemToBoardElement,
  DrawioParsedItem,
  SAMPLE_SAP_DRAWIO_LIBRARY,
} from '../utils/drawioParser';
import { BoardElement } from '../types/whiteboard';

/**
 * Props for the ImportModal component.
 */
export interface ImportModalProps {
  /** Modal visibility flag */
  isOpen: boolean;
  /** Callback fired to close the modal */
  onClose: () => void;
  /** Callback to ingest converted board elements into canvas state */
  onImportElements: (elements: BoardElement[]) => void;
  /** Callback to upload and ingest an image file */
  onImportImageFile: (file: File) => void;
  /** Center viewport coordinates where imported elements will be anchored */
  canvasCenter?: { x: number; y: number };
}

/** Active modal navigation tabs */
export type ImportTab = 'sap-icons' | 'drawio' | 'images';

/**
 * Enterprise asset import dialog facilitating SAP cloud icons insertion,
 * Draw.io diagram migrations, and asset uploads.
 */
export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportElements,
  onImportImageFile,
  canvasCenter = { x: 300, y: 200 },
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ImportTab>('sap-icons');

  // SAP Icons state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<'all' | 'service' | 'generic'>('all');
  const [iconSize, setIconSize] = useState<number>(64);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  // Draw.io state
  const [drawioXml, setDrawioXml] = useState('');
  const [parsedItems, setParsedItems] = useState<DrawioParsedItem[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseSuccessCount, setParseSuccessCount] = useState<number | null>(null);

  const fileInputId = useId();

  if (!isOpen) return null;

  const filteredSapIcons = searchSapIcons(searchQuery, selectedCategory, selectedType);

  const handleAddSapIcon = (icon: SapArchitectureIcon) => {
    const dataUri = getSvgDataUri(icon.dataUri || icon.svg || '');
    const now = Date.now();
    const newElement: BoardElement = {
      id: `sap_icon_${icon.id}_${now}`,
      type: 'image',
      x: Math.round(canvasCenter.x - iconSize / 2),
      y: Math.round(canvasCenter.y - iconSize / 2),
      width: iconSize,
      height: iconSize,
      src: dataUri,
      opacity: 1,
      createdAt: now,
      updatedAt: now,
      zIndex: 10,
    };

    onImportElements([newElement]);
    setRecentlyAddedId(icon.id);
    setTimeout(() => setRecentlyAddedId(null), 1800);
  };

  const handleParseDrawio = (xmlText = drawioXml) => {
    setParseError(null);
    setParseSuccessCount(null);
    const result = parseDrawio(xmlText);
    if (result.success && result.items.length > 0) {
      setParsedItems(result.items);
      setParseSuccessCount(result.items.length);
    } else {
      setParsedItems([]);
      setParseError(result.error || 'Failed to parse draw.io XML');
    }
  };

  const handleLoadSampleDrawio = () => {
    setDrawioXml(SAMPLE_SAP_DRAWIO_LIBRARY);
    handleParseDrawio(SAMPLE_SAP_DRAWIO_LIBRARY);
  };

  const handleLoadBtpServicesDrawio = () => {
    const serviceIcons = SAP_ARCHITECTURE_ICONS.filter((i) => i.iconType === 'service');
    const xml = generateDrawioLibraryXml(serviceIcons);
    setDrawioXml(xml);
    handleParseDrawio(xml);
  };

  const handleLoadGenericDrawio = () => {
    const genericIcons = SAP_ARCHITECTURE_ICONS.filter((i) => i.iconType === 'generic');
    const xml = generateDrawioLibraryXml(genericIcons);
    setDrawioXml(xml);
    handleParseDrawio(xml);
  };

  const handleImportParsedDrawio = () => {
    if (parsedItems.length === 0) return;
    const elementsToImport: BoardElement[] = parsedItems.map((item, index) => {
      const offsetX = (index % 4) * 90;
      const offsetY = Math.floor(index / 4) * 90;
      return convertDrawioItemToBoardElement(
        item,
        canvasCenter.x - 120 + offsetX,
        canvasCenter.y - 60 + offsetY,
        10 + index
      );
    });

    onImportElements(elementsToImport);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.drawio') || file.name.endsWith('.xml')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setActiveTab('drawio');
          setDrawioXml(content);
          handleParseDrawio(content);
        }
      };
      reader.readAsText(file);
    } else if (file.type.startsWith('image/')) {
      onImportImageFile(file);
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
      data-testid="import-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-[96vw] md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 id="import-modal-title" className="text-base font-semibold leading-tight">
                {t('importModal.title')}
              </h2>
              <p className="text-xs text-slate-600 dark:text-zinc-300">
                {t('importModal.subtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            data-testid="btn-close-import-modal"
            aria-label={t('common.close')}
            title={t('common.close')}
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 shrink-0">
          <button
            type="button"
            data-testid="tab-sap-icons"
            onClick={() => setActiveTab('sap-icons')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'sap-icons'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900'
                : 'border-transparent text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('importModal.tabSapIcons')}</span>
          </button>

          <button
            type="button"
            data-testid="tab-drawio"
            onClick={() => setActiveTab('drawio')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'drawio'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900'
                : 'border-transparent text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>{t('importModal.tabDrawio')}</span>
          </button>

          <button
            type="button"
            data-testid="tab-images"
            onClick={() => setActiveTab('images')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'images'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900'
                : 'border-transparent text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{t('importModal.tabImages')}</span>
          </button>
        </div>

        {/* Tab 1: SAP Architecture Icons */}
        {activeTab === 'sap-icons' && (
          <div className="flex-1 flex flex-col min-h-0 p-5 gap-4 overflow-hidden">
            {/* Search & Type & Size Controls */}
            <div className="space-y-2.5 shrink-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    data-testid="sap-icon-search-input"
                    placeholder={t('importModal.searchSapPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Icon Size Preset */}
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-300 self-end sm:self-auto">
                  <span className="text-[11px] text-slate-600 dark:text-zinc-300 font-medium">{t('importModal.size')}</span>
                  {[
                    { label: 'S (48px)', size: 48 },
                    { label: 'M (64px)', size: 64 },
                    { label: 'L (96px)', size: 96 },
                  ].map((s) => (
                    <button
                      key={s.size}
                      type="button"
                      onClick={() => setIconSize(s.size)}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        iconSize === s.size
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200/50 dark:border-zinc-700/50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Library Type Selector (All vs Services vs Generic) */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedType('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      selectedType === 'all'
                        ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    All Icons ({SAP_ICON_STATS.total})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedType('service')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      selectedType === 'service'
                        ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    BTP Services ({SAP_ICON_STATS.services})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedType('generic')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      selectedType === 'generic'
                        ? 'bg-slate-700 text-white dark:bg-zinc-600 font-semibold shadow-2xs'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    Generic Architecture ({SAP_ICON_STATS.generics})
                  </button>
                </div>

                <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                  {filteredSapIcons.length} available
                </span>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center flex-wrap gap-1.5 pb-1 shrink-0 max-h-20 overflow-y-auto">
              <button
                type="button"
                data-testid="category-pill-All"
                onClick={() => setSelectedCategory('All')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === 'All'
                    ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200/60 dark:border-zinc-700/60 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
              >
                {t('importModal.allCategories')}
              </button>
              {SAP_ICON_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  data-testid={`category-pill-${cat}`}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200/60 dark:border-zinc-700/60 hover:bg-slate-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Icon Grid */}
            <div
              data-testid="sap-icon-grid"
              className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-1"
            >
              {filteredSapIcons.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400 dark:text-zinc-500 text-xs">
                  {t('importModal.noIconsFound', { query: searchQuery })}
                </div>
              ) : (
                filteredSapIcons.map((icon) => {
                  const isRecentlyAdded = recentlyAddedId === icon.id;
                  return (
                    <button
                      key={icon.id}
                      type="button"
                      data-testid={`btn-add-sap-icon-${icon.id}`}
                      onClick={() => handleAddSapIcon(icon)}
                      className="group relative flex flex-col items-center p-3 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-zinc-800/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 text-center transition-all cursor-pointer shadow-xs hover:shadow-md"
                    >
                      <div className="w-12 h-12 flex items-center justify-center shrink-0 mb-1.5 transition-transform group-hover:scale-110">
                        <img
                          src={icon.dataUri}
                          alt={icon.title}
                          className="w-10 h-10 object-contain drop-shadow-xs pointer-events-none"
                          loading="lazy"
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 line-clamp-1">
                        {icon.title}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full font-medium ${
                            icon.iconType === 'service'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}
                        >
                          {icon.iconType === 'service' ? 'BTP Service' : 'Generic'}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 line-clamp-1">
                          {icon.category}
                        </span>
                      </div>

                      {/* Add badge or checked indicator */}
                      <div className="mt-2 text-[10px] font-medium inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 opacity-90 group-hover:opacity-100">
                        {isRecentlyAdded ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{t('common.added')}</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>{t('importModal.addToCanvas')}</span>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Guideline info banner */}
            <div className="shrink-0 text-[11px] text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/60 p-2.5 rounded-lg flex items-center justify-between">
              <span>
                {t('importModal.sapGuidelineBanner')}
              </span>
              <a
                href="https://sap.github.io/btp-solution-diagrams/docs/btp_guideline/diagr_comp/icons/"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                {t('importModal.sapGuidelinesLink')}
              </a>
            </div>
          </div>
        )}

        {/* Tab 2: Draw.io Format */}
        {activeTab === 'drawio' && (
          <div className="flex-1 flex flex-col min-h-0 p-5 gap-4 overflow-y-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <label htmlFor="drawio-xml-input" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                {t('importModal.pasteDrawioLabel')}
              </label>
              <div className="flex items-center flex-wrap gap-2">
                <button
                  type="button"
                  data-testid="btn-load-sample-drawio"
                  onClick={handleLoadSampleDrawio}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  title="Load sample BTP solution architecture"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('importModal.loadSampleDrawio')}</span>
                </button>
                <span className="text-slate-300 dark:text-zinc-700">•</span>
                <button
                  type="button"
                  onClick={handleLoadBtpServicesDrawio}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  title="Load full 100 SAP BTP Services draw.io library"
                >
                  <span>SAP BTP Services (100)</span>
                </button>
                <span className="text-slate-300 dark:text-zinc-700">•</span>
                <button
                  type="button"
                  onClick={handleLoadGenericDrawio}
                  className="text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:underline flex items-center gap-1 cursor-pointer"
                  title="Load full 126 SAP Generic Architecture icons draw.io library"
                >
                  <span>Generic Icons (126)</span>
                </button>
              </div>
            </div>

            <textarea
              id="drawio-xml-input"
              data-testid="drawio-xml-textarea"
              rows={6}
              value={drawioXml}
              onChange={(e) => setDrawioXml(e.target.value)}
              placeholder={t('importModal.drawioPlaceholder')}
              className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-testid="btn-parse-drawio"
                  onClick={() => handleParseDrawio()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                >
                  {t('importModal.parseDrawioButton')}
                </button>

                <label
                  htmlFor={fileInputId}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-300 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{t('importModal.uploadDrawioFile')}</span>
                </label>
                <input
                  id={fileInputId}
                  type="file"
                  accept=".xml,.drawio,.svg"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {parsedItems.length > 0 && (
                <button
                  type="button"
                  data-testid="btn-import-drawio-items"
                  onClick={handleImportParsedDrawio}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{t('importModal.importDrawioItems', { count: parsedItems.length })}</span>
                </button>
              )}
            </div>

            {parseError && (
              <div
                data-testid="drawio-parse-error"
                className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-900/60"
              >
                {parseError}
              </div>
            )}

            {parseSuccessCount !== null && parseSuccessCount > 0 && (
              <div className="border border-slate-200 dark:border-zinc-800 rounded-xl p-3 bg-slate-50 dark:bg-zinc-800/40">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block mb-2">
                  {t('importModal.parseSuccess', { count: parsedItems.length })}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                  {parsedItems.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs flex items-center gap-2"
                    >
                      {item.type === 'image' && item.src ? (
                        <img src={item.src} alt={item.title} className="w-6 h-6 object-contain" />
                      ) : (
                        <div className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                          {item.type[0].toUpperCase()}
                        </div>
                      )}
                      <span className="truncate text-[11px] font-medium text-slate-700 dark:text-zinc-300">
                        {item.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Images */}
        {activeTab === 'images' && (
          <div className="flex-1 flex flex-col min-h-0 p-5 gap-4 overflow-y-auto">
            <div
              data-testid="import-image-dropzone"
              className="border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors bg-slate-50/50 dark:bg-zinc-800/30"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                  onImportImageFile(file);
                  onClose();
                }
              }}
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200 mb-1">
                {t('importModal.dragDropImage')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-300 max-w-xs mb-4">
                {t('importModal.imageFormats')}
              </p>
              <label
                htmlFor="import-modal-image-file"
                data-testid="btn-browse-image-file"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
              >
                {t('importModal.browseFiles')}
              </label>
              <input
                id="import-modal-image-file"
                data-testid="import-modal-file-input"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onImportImageFile(file);
                    onClose();
                  }
                }}
                className="hidden"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
