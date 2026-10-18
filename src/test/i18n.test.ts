import { describe, it, expect, beforeEach } from 'vitest';
import i18n, { SUPPORTED_LANGUAGES, resources } from '../i18n';
import { en } from '../i18n/locales/en';
import { fr } from '../i18n/locales/fr';
import { de } from '../i18n/locales/de';
import { da } from '../i18n/locales/da';

describe('i18n Multi-Language Support', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('defines English, French, German, and Danish as supported languages', () => {
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).toContain('en');
    expect(codes).toContain('fr');
    expect(codes).toContain('de');
    expect(codes).toContain('da');
    expect(SUPPORTED_LANGUAGES).toHaveLength(4);
  });

  it('provides matching keys across all four locale files', () => {
    function getAllKeys(obj: any, prefix = ''): string[] {
      return Object.keys(obj).flatMap((key) => {
        const val = obj[key];
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        if (typeof val === 'object' && val !== null) {
          return getAllKeys(val, newPrefix);
        }
        return [newPrefix];
      });
    }

    const enKeys = new Set(getAllKeys(en));
    const frKeys = new Set(getAllKeys(fr));
    const deKeys = new Set(getAllKeys(de));
    const daKeys = new Set(getAllKeys(da));

    expect(frKeys.size).toBe(enKeys.size);
    expect(deKeys.size).toBe(enKeys.size);
    expect(daKeys.size).toBe(enKeys.size);

    for (const key of enKeys) {
      expect(frKeys.has(key)).toBe(true);
      expect(deKeys.has(key)).toBe(true);
      expect(daKeys.has(key)).toBe(true);
    }
  });

  it('translates common UI labels in English', () => {
    expect(i18n.t('common.close')).toBe('Close');
    expect(i18n.t('header.boards')).toBe('Boards');
    expect(i18n.t('toolbar.shapes.rectangle')).toBe('Rectangle');
    expect(i18n.t('backgrounds.grid')).toBe('Grid');
  });

  it('translates common UI labels in French', async () => {
    await i18n.changeLanguage('fr');
    expect(i18n.t('common.close')).toBe('Fermer');
    expect(i18n.t('header.boards')).toBe('Tableaux');
    expect(i18n.t('toolbar.shapes.rectangle')).toBe('Rectangle');
    expect(i18n.t('backgrounds.grid')).toBe('Grille');
    expect(i18n.t('toolbar.shapeSnap')).toBe('Aimantation Formes');
  });

  it('translates common UI labels in German', async () => {
    await i18n.changeLanguage('de');
    expect(i18n.t('common.close')).toBe('Schließen');
    expect(i18n.t('header.boards')).toBe('Tafeln');
    expect(i18n.t('toolbar.shapes.rectangle')).toBe('Rechteck');
    expect(i18n.t('backgrounds.grid')).toBe('Raster');
    expect(i18n.t('toolbar.shapeSnap')).toBe('Formen-Einrasten');
  });

  it('translates common UI labels in Danish', async () => {
    await i18n.changeLanguage('da');
    expect(i18n.t('common.close')).toBe('Luk');
    expect(i18n.t('header.boards')).toBe('Tavler');
    expect(i18n.t('toolbar.shapes.rectangle')).toBe('Rektangel');
    expect(i18n.t('backgrounds.grid')).toBe('Gitter');
    expect(i18n.t('toolbar.shapeSnap')).toBe('Form-fastgørelse');
  });

  it('handles interpolation correctly in all languages', async () => {
    expect(i18n.t('canvas.snappedTo', { shape: 'Circle' })).toBe('✨ Snapped to Circle!');

    await i18n.changeLanguage('fr');
    expect(i18n.t('canvas.snappedTo', { shape: 'Cercle' })).toBe('✨ Aligné sur Cercle !');

    await i18n.changeLanguage('de');
    expect(i18n.t('canvas.snappedTo', { shape: 'Kreis' })).toBe('✨ Eingeklinkt in Kreis!');

    await i18n.changeLanguage('da');
    expect(i18n.t('canvas.snappedTo', { shape: 'Cirkel' })).toBe('✨ Rettet til Cirkel!');
  });
});
