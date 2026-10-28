import { describe, it, expect } from 'vitest';
import {
  SAP_ARCHITECTURE_ICONS,
  SAP_ICON_CATEGORIES,
  SAP_ICON_STATS,
  searchSapIcons,
  getSvgDataUri,
  createDrawioIconXml,
  generateDrawioLibraryXml,
} from '../utils/sapIcons';

describe('SAP Architecture Icons Library', () => {
  it('contains comprehensive SAP BTP architecture icons across all defined categories', () => {
    expect(SAP_ARCHITECTURE_ICONS.length).toBe(226);
    expect(SAP_ICON_STATS.total).toBe(226);
    expect(SAP_ICON_STATS.services).toBe(100);
    expect(SAP_ICON_STATS.generics).toBe(126);

    expect(SAP_ICON_CATEGORIES).toContain('Integration Suite');
    expect(SAP_ICON_CATEGORIES).toContain('Data & Analytics');
    expect(SAP_ICON_CATEGORIES).toContain('Business AI');
    expect(SAP_ICON_CATEGORIES).toContain('Security & Identity');
    expect(SAP_ICON_CATEGORIES).toContain('Foundation & Runtimes');
    expect(SAP_ICON_CATEGORIES).toContain('Architecture Actors');

    // Every icon must have valid title, category, and valid base64 SVG dataUri
    SAP_ARCHITECTURE_ICONS.forEach((icon) => {
      expect(icon.id).toBeDefined();
      expect(icon.title).toBeTruthy();
      expect(icon.category).toBeTruthy();
      expect(icon.dataUri).toBeTruthy();
      expect(icon.dataUri.startsWith('data:image/svg+xml;base64,')).toBe(true);
      expect(icon.tags.length).toBeGreaterThan(0);
      expect(icon.drawioXml).toContain('<mxCell');

      // Verify base64 content decodes to valid SVG XML
      const b64 = icon.dataUri.replace('data:image/svg+xml;base64,', '');
      const decodedXml = Buffer.from(b64, 'base64').toString('utf-8');
      expect(decodedXml).toContain('<svg');
      expect(decodedXml).toContain('</svg>');
    });
  });

  it('searches icons by title, description, and tags', () => {
    // Title search
    const hanaResults = searchSapIcons('HANA');
    expect(hanaResults.length).toBeGreaterThan(0);

    // Tag / description search
    const cpiResults = searchSapIcons('integration');
    expect(cpiResults.length).toBeGreaterThan(0);

    // AI search
    const aiResults = searchSapIcons('ai');
    expect(aiResults.length).toBeGreaterThan(0);

    // Category filter
    const integrationIcons = searchSapIcons('', 'Integration Suite');
    expect(integrationIcons.length).toBeGreaterThan(0);
    expect(integrationIcons.every((i) => i.category === 'Integration Suite')).toBe(true);

    // Non-matching query
    const emptyResults = searchSapIcons('NonExistentServiceXYZ123');
    expect(emptyResults).toHaveLength(0);
  });

  it('generates valid SVG data URIs and draw.io XML', () => {
    const icon = SAP_ARCHITECTURE_ICONS[0];
    const dataUri = getSvgDataUri(icon.dataUri);
    expect(dataUri).toMatch(/^data:image\/svg\+xml/);

    const drawioXml = createDrawioIconXml(icon.title, dataUri, 64, 64);
    expect(drawioXml).toContain('<mxCell');
    expect(drawioXml).toContain(icon.title);
    expect(drawioXml).toContain('shape=image');
    expect(drawioXml).toContain('width="64"');

    const libraryXml = generateDrawioLibraryXml([icon]);
    expect(libraryXml.startsWith('<mxlibrary>')).toBe(true);
    expect(libraryXml.endsWith('</mxlibrary>')).toBe(true);
  });
});
