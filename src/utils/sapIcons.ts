/**
 * SAP BTP Solution Diagrams — Architecture & Generic Icons Library
 * Based on the official SAP BTP Solution Diagrams repositories:
 * 1. 20-02-99-sap-btp-service-icons-all (100 official BTP service icons)
 *    https://github.com/SAP/btp-solution-diagrams/tree/main/assets/shape-libraries-and-editable-presets/draw.io/20-02-99-sap-btp-service-icons-all
 * 2. 20-03-generic-icons (126 official generic architecture icons)
 *    https://github.com/SAP/btp-solution-diagrams/tree/main/assets/shape-libraries-and-editable-presets/draw.io/20-03-generic-icons
 */

import sapIconsRaw from './sapIconsAll.json';

export type SapIconType = 'service' | 'generic';

export type SapIconCategory =
  | 'Integration Suite'
  | 'Data & Analytics'
  | 'Business AI'
  | 'Security & Identity'
  | 'App Development & Automation'
  | 'Foundation & Runtimes'
  | 'Architecture Actors'
  | 'Infrastructure & Storage'
  | 'Network & Connectivity'
  | 'Generic Architecture';

export const SAP_ICON_CATEGORIES: SapIconCategory[] = [
  'Integration Suite',
  'Data & Analytics',
  'Business AI',
  'Security & Identity',
  'App Development & Automation',
  'Foundation & Runtimes',
  'Architecture Actors',
  'Infrastructure & Storage',
  'Network & Connectivity',
  'Generic Architecture',
];

export interface SapArchitectureIcon {
  id: string;
  title: string;
  category: SapIconCategory;
  iconType: SapIconType;
  description: string;
  dataUri: string;
  tags: string[];
  color?: string;
  svg?: string;
  drawioXml?: string;
}

/**
 * Creates or normalizes a clean SVG data URI for use in board image elements
 */
export function getSvgDataUri(svgOrDataUri: string): string {
  if (!svgOrDataUri) return '';
  const trimmed = svgOrDataUri.trim();
  if (trimmed.startsWith('data:image/svg+xml,PHN2')) {
    return trimmed.replace('data:image/svg+xml,', 'data:image/svg+xml;base64,');
  }
  if (trimmed.startsWith('data:image/svg+xml')) {
    return trimmed;
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(trimmed)}`;
}

/**
 * Generate standard draw.io mxCell XML for an icon
 */
export function createDrawioIconXml(title: string, dataUri: string, width = 64, height = 64): string {
  const cleanUri = getSvgDataUri(dataUri);
  const encodedUri = encodeURIComponent(cleanUri);
  return `<mxCell id="sap_${Date.now()}_${Math.floor(Math.random() * 1000)}" value="${title}" style="shape=image;verticalLabelPosition=bottom;labelBackgroundColor=none;verticalAlign=top;aspect=fixed;imageAspect=0;image=${encodedUri};" vertex="1" parent="1">
  <mxGeometry width="${width}" height="${height}" as="geometry"/>
</mxCell>`;
}

const ID_ALIASES: Record<string, string> = {
  '32086-sap-integration-suite_sd': 'sap-btp-integration-suite',
  '20083-sap-hana-cloud_sd': 'sap-btp-hana-cloud',
};

const seenIds = new Map<string, number>();

// Typed list of all 226 official SAP BTP services & generic architecture icons
export const SAP_ARCHITECTURE_ICONS: SapArchitectureIcon[] = (sapIconsRaw as any[]).map((raw) => {
  const baseId = ID_ALIASES[raw.id] || raw.id;
  const count = (seenIds.get(baseId) || 0) + 1;
  seenIds.set(baseId, count);
  const uniqueId = count > 1 ? `${baseId}-${count}` : baseId;

  const dataUri = getSvgDataUri(raw.dataUri);

  return {
    id: uniqueId,
    title: raw.title,
    category: raw.category as SapIconCategory,
    iconType: raw.iconType as SapIconType,
    description: raw.description,
    dataUri,
    tags: raw.tags || [],
    color: raw.iconType === 'service' ? '#0070F2' : '#5B738B',
    drawioXml: createDrawioIconXml(raw.title, dataUri, 64, 64),
  };
});

const iconSearchCache = new Map<string, SapArchitectureIcon[]>();

/**
 * Filter icons by search query, category, and icon type ('all', 'service', 'generic')
 * with LRU memoization cache.
 */
export function searchSapIcons(
  query: string,
  category?: string,
  iconType?: 'all' | 'service' | 'generic'
): SapArchitectureIcon[] {
  const cleanQ = query.trim().toLowerCase();
  const selectedType = iconType || 'all';
  const cacheKey = `${selectedType}::${category || 'All'}::${cleanQ}`;

  if (iconSearchCache.has(cacheKey)) {
    return iconSearchCache.get(cacheKey)!;
  }

  const result = SAP_ARCHITECTURE_ICONS.filter((icon) => {
    // Type filter
    if (selectedType !== 'all' && icon.iconType !== selectedType) {
      return false;
    }
    // Category filter
    const matchesCategory = !category || category === 'All' || icon.category === category;
    if (!matchesCategory) return false;

    // Search query filter
    if (!cleanQ) return true;
    return (
      icon.title.toLowerCase().includes(cleanQ) ||
      icon.description.toLowerCase().includes(cleanQ) ||
      icon.category.toLowerCase().includes(cleanQ) ||
      icon.tags.some((tag) => tag.toLowerCase().includes(cleanQ))
    );
  });

  if (iconSearchCache.size > 300) {
    iconSearchCache.clear();
  }
  iconSearchCache.set(cacheKey, result);
  return result;
}

/**
 * Total counts of services and generic icons
 */
export const SAP_ICON_STATS = {
  total: SAP_ARCHITECTURE_ICONS.length,
  services: SAP_ARCHITECTURE_ICONS.filter((i) => i.iconType === 'service').length,
  generics: SAP_ARCHITECTURE_ICONS.filter((i) => i.iconType === 'generic').length,
};

/**
 * Generates an official Draw.io <mxlibrary> XML package from a list of SAP icons
 */
export function generateDrawioLibraryXml(icons: SapArchitectureIcon[]): string {
  const entries = icons.map((icon) => ({
    title: icon.title,
    w: 64,
    h: 64,
    aspect: 'fixed',
    data: icon.dataUri,
    xml: icon.drawioXml || `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" value="${icon.title}" style="shape=image;image=${encodeURIComponent(icon.dataUri)};" vertex="1" parent="1"><mxGeometry width="64" height="64" as="geometry"/></mxCell></root></mxGraphModel>`,
  }));
  return `<mxlibrary>${JSON.stringify(entries)}</mxlibrary>`;
}
