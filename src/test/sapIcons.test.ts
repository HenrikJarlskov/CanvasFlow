import { describe, it, expect } from 'vitest';
import {
  SAP_ARCHITECTURE_ICONS,
  SAP_ICON_CATEGORIES,
  searchSapIcons,
  getSvgDataUri,
  createDrawioIconXml,
} from '../utils/sapIcons';

describe('SAP Architecture Icons Library', () => {
  it('contains comprehensive SAP BTP architecture icons across all defined categories', () => {
    expect(SAP_ARCHITECTURE_ICONS.length).toBeGreaterThanOrEqual(15);
    expect(SAP_ICON_CATEGORIES).toContain('Integration Suite');
    expect(SAP_ICON_CATEGORIES).toContain('Data & Analytics');
    expect(SAP_ICON_CATEGORIES).toContain('Business AI');
    expect(SAP_ICON_CATEGORIES).toContain('Foundational Services');
    expect(SAP_ICON_CATEGORIES).toContain('Security & Identity');
    expect(SAP_ICON_CATEGORIES).toContain('Enterprise Applications');
    expect(SAP_ICON_CATEGORIES).toContain('Architecture Actors');

    // Every icon must have valid title, category, svg, and drawioXml
    SAP_ARCHITECTURE_ICONS.forEach((icon) => {
      expect(icon.id).toBeDefined();
      expect(icon.title).toBeTruthy();
      expect(icon.category).toBeTruthy();
      expect(icon.svg).toContain('<svg');
      expect(icon.svg).toContain('</svg>');
      expect(icon.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(icon.tags.length).toBeGreaterThan(0);
      expect(icon.drawioXml).toContain('<mxCell');
    });
  });

  it('searches icons by title, description, and tags', () => {
    // Title search
    const hanaResults = searchSapIcons('HANA');
    expect(hanaResults.length).toBeGreaterThan(0);
    expect(hanaResults.some((i) => i.id === 'sap-btp-hana-cloud')).toBe(true);

    // Tag search
    const cpiResults = searchSapIcons('cpi');
    expect(cpiResults.length).toBeGreaterThan(0);
    expect(cpiResults.some((i) => i.id === 'sap-btp-cloud-integration')).toBe(true);

    // AI search
    const aiResults = searchSapIcons('genai');
    expect(aiResults.length).toBeGreaterThan(0);
    expect(aiResults.some((i) => i.id === 'sap-btp-generative-ai-hub')).toBe(true);

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
    const dataUri = getSvgDataUri(icon.svg);
    expect(dataUri).toMatch(/^data:image\/svg\+xml;utf8,/);

    const drawioXml = createDrawioIconXml(icon.title, dataUri, 64, 64);
    expect(drawioXml).toContain('<mxCell');
    expect(drawioXml).toContain(icon.title);
    expect(drawioXml).toContain('shape=image');
    expect(drawioXml).toContain('width="64"');
  });
});
