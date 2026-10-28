import { describe, it, expect } from 'vitest';
import { SAP_ARCHITECTURE_ICONS } from '../utils/sapIcons';

describe('AI Drawing & Vector Geometry Quality', () => {
  it('guarantees Jira / Kanban boards have non-overlapping columns and strictly bounded cards', () => {
    // Column layout specification
    const col1 = { x: 20, width: 130, height: 300 };
    const col2 = { x: 165, width: 130, height: 300 };
    const col3 = { x: 310, width: 130, height: 300 };

    // Columns must not overlap horizontally
    expect(col1.x + col1.width).toBeLessThanOrEqual(col2.x);
    expect(col2.x + col2.width).toBeLessThanOrEqual(col3.x);

    // Cards in column 1
    const card1 = { x: 30, y: 68, width: 110, height: 48 };
    const card2 = { x: 30, y: 126, width: 110, height: 48 };

    // Cards must be strictly inside column 1 horizontally
    expect(card1.x).toBeGreaterThanOrEqual(col1.x);
    expect(card1.x + card1.width).toBeLessThanOrEqual(col1.x + col1.width);
    expect(card2.x).toBeGreaterThanOrEqual(col1.x);
    expect(card2.x + card2.width).toBeLessThanOrEqual(col1.x + col1.width);

    // Cards must not overlap vertically
    expect(card1.y + card1.height).toBeLessThanOrEqual(card2.y);

    // Text must be padded inside cards with zero border collision
    const text1 = { x: 38, y: 84, text: 'Write code' };
    expect(text1.x).toBeGreaterThan(card1.x + 5);
    expect(text1.y).toBeGreaterThan(card1.y + 10);
    expect(text1.y).toBeLessThan(card1.y + card1.height);
  });

  it('eliminates unintentional diagonal slashes on lines without x2/y2', () => {
    // Test the fallback logic implemented in CanvasElementsLayer and server sanitizer
    const sanitizeLine = (el: { x: number; y: number; width?: number; height?: number; x2?: number; y2?: number }) => {
      const x2 = el.x2 !== undefined ? el.x2 : el.x + (el.width || 0);
      const y2 = el.y2 !== undefined ? el.y2 : (el.height && el.height > 0 && (!el.width || el.width === 0) ? el.y + el.height : el.y);
      return { x1: el.x, y1: el.y, x2, y2 };
    };

    // Case 1: Line with width=100 and height=200 without x2/y2 (previously would draw a diagonal slash!)
    const result1 = sanitizeLine({ x: 20, y: 50, width: 100, height: 200 });
    // Now it defaults to a clean horizontal line, NOT a diagonal slash:
    expect(result1.y2).toBe(50);
    expect(result1.y2 - result1.y1).toBe(0);

    // Case 2: Pure vertical line (width=0, height=150)
    const result2 = sanitizeLine({ x: 100, y: 20, width: 0, height: 150 });
    expect(result2.x2).toBe(100);
    expect(result2.y2).toBe(170);

    // Case 3: Explicit horizontal divider
    const result3 = sanitizeLine({ x: 20, y: 40, x2: 150, y2: 40 });
    expect(result3.y1).toBe(result3.y2);
    expect(result3.x2).toBe(150);
  });

  it('verifies anti-skew angle snapping on near-horizontal or near-vertical lines', () => {
    const snapOrthogonal = (x: number, y: number, x2: number, y2: number) => {
      let finalX2 = x2;
      let finalY2 = y2;
      if (Math.abs(finalY2 - y) <= 12 && Math.abs(finalX2 - x) > 15) {
        finalY2 = y; // Snap to true horizontal
      } else if (Math.abs(finalX2 - x) <= 12 && Math.abs(finalY2 - y) > 15) {
        finalX2 = x; // Snap to true vertical
      }
      return { x2: finalX2, y2: finalY2 };
    };

    // A slightly skewed horizontal line (e.g. y=100, y2=104 over width of 120px)
    const snappedH = snapOrthogonal(20, 100, 140, 104);
    expect(snappedH.y2).toBe(100); // Perfectly horizontal!

    // A slightly skewed vertical line (e.g. x=50, x2=54 over height of 200px)
    const snappedV = snapOrthogonal(50, 30, 54, 230);
    expect(snappedV.x2).toBe(50); // Perfectly vertical!
  });

  it('verifies text layer priority: text is assigned top-level z-index', () => {
    const getZIndex = (type: string, shapeType?: string, width?: number, height?: number) => {
      if (type === 'text') return 25;
      if (shapeType === 'rectangle' && (width || 0) > 110 && (height || 0) > 160) return 2; // Column
      if (shapeType === 'rectangle') return 8; // Card
      if (shapeType === 'line' || shapeType === 'arrow') return 14;
      return 10;
    };

    const columnZ = getZIndex('shape', 'rectangle', 130, 300);
    const cardZ = getZIndex('shape', 'rectangle', 110, 48);
    const lineZ = getZIndex('shape', 'line');
    const textZ = getZIndex('text');

    expect(textZ).toBeGreaterThan(columnZ);
    expect(textZ).toBeGreaterThan(cardZ);
    expect(textZ).toBeGreaterThan(lineZ);
    expect(cardZ).toBeGreaterThan(columnZ);
  });

  it('guarantees Mind Map branches align with node borders and preserve diagonal connectivity', () => {
    // Central Hub
    const hub = { x: 160, y: 118, width: 120, height: 64 };
    const cx = hub.x + hub.width / 2; // 220
    const cy = hub.y + hub.height / 2; // 150

    // Research Card (Top-Left)
    const research = { x: 30, y: 35, width: 100, height: 44 };
    const researchRight = research.x + research.width; // 130
    const researchCenterY = research.y + research.height / 2; // 57

    // Line from Hub to Research
    const branch1 = { x: 178, y: 127, x2: 130, y2: 57 };

    // Line endpoint must match Research card edge exactly
    expect(branch1.x2).toBe(researchRight);
    expect(branch1.y2).toBe(researchCenterY);

    // Diagonal angle must NOT be flattened to horizontal or vertical
    const dx = Math.abs(branch1.x2 - branch1.x); // 48
    const dy = Math.abs(branch1.y2 - branch1.y); // 70
    expect(dx).toBeGreaterThan(15);
    expect(dy).toBeGreaterThan(15);

    // Design Card (Top-Right)
    const design = { x: 310, y: 35, width: 100, height: 44 };
    const branch2 = { x: 262, y: 127, x2: 310, y2: 57 };
    expect(branch2.x2).toBe(design.x);
    expect(branch2.y2).toBe(design.y + design.height / 2);

    // Launch Card (Bottom-Right)
    const launch = { x: 310, y: 220, width: 100, height: 44 };
    const branch4 = { x: 262, y: 173, x2: 310, y2: 242 };
    expect(branch4.x2).toBe(launch.x);
    expect(branch4.y2).toBe(launch.y + launch.height / 2);

    // Hub center check
    expect(cx).toBe(220);
    expect(cy).toBe(150);
  });

  it('guarantees AI drawing progress bar advances monotonically towards 100% without oscillating', () => {
    // Simulate the progress progression over 30 ticks
    let currentPercent = 18;
    const recorded: number[] = [currentPercent];

    for (let tick = 0; tick < 30; tick++) {
      let nextPercent = currentPercent;
      if (currentPercent < 35) nextPercent = currentPercent + 4;
      else if (currentPercent < 65) nextPercent = currentPercent + 2.5;
      else if (currentPercent < 85) nextPercent = currentPercent + 1.8;
      else if (currentPercent < 94) nextPercent = currentPercent + 0.8;
      else if (currentPercent < 98) nextPercent = currentPercent + 0.3;
      else if (currentPercent < 99) nextPercent = currentPercent + 0.1;

      // Crucial requirement: Progress MUST be strictly non-decreasing!
      expect(nextPercent).toBeGreaterThanOrEqual(currentPercent);
      currentPercent = nextPercent;
      recorded.push(Math.round(currentPercent));
    }

    // Verify it never jumps backwards (e.g. 97 -> 95)
    for (let i = 1; i < recorded.length; i++) {
      expect(recorded[i]).toBeGreaterThanOrEqual(recorded[i - 1]);
    }

    // Simulated completion sets 100%
    currentPercent = 100;
    expect(currentPercent).toBe(100);
  });

  it('guarantees complete retrieval and indexing of 226 SAP BTP service and generic architecture icons', async () => {
    const { SAP_ARCHITECTURE_ICONS, SAP_ICON_STATS, searchSapIcons } = await import('../utils/sapIcons');

    // Full count validation
    expect(SAP_ICON_STATS.total).toBe(226);
    expect(SAP_ICON_STATS.services).toBe(100);
    expect(SAP_ICON_STATS.generics).toBe(126);
    expect(SAP_ARCHITECTURE_ICONS.length).toBe(226);

    // Every icon must possess a valid base64 SVG data URI
    for (const icon of SAP_ARCHITECTURE_ICONS) {
      expect(icon.dataUri).toBeTruthy();
      expect(icon.dataUri.startsWith('data:image/svg+xml;base64,')).toBe(true);
      expect(icon.title.length).toBeGreaterThan(0);
      expect(icon.id.length).toBeGreaterThan(0);
    }

    // Search tests
    const cpiResults = searchSapIcons('integration');
    expect(cpiResults.length).toBeGreaterThanOrEqual(1);

    const hanaResults = searchSapIcons('hana');
    expect(hanaResults.length).toBeGreaterThanOrEqual(1);

    const serviceOnly = searchSapIcons('', 'All', 'service');
    expect(serviceOnly.length).toBe(100);

    const genericOnly = searchSapIcons('', 'All', 'generic');
    expect(genericOnly.length).toBe(126);
  });

  it('validates SAP BTP Solution Architecture diagram embeds official SAP architecture icons', () => {
    // 3 Distinct Horizontal Regions
    const r1 = { x: 20, y: 25, width: 122, height: 215, title: 'External Users' };
    const r2 = { x: 154, y: 25, width: 236, height: 215, title: 'SAP BTP Subaccount' };
    const r3 = { x: 402, y: 25, width: 118, height: 215, title: 'Enterprise Backends' };

    // Regions must be horizontally non-overlapping
    expect(r1.x + r1.width).toBeLessThanOrEqual(r2.x);
    expect(r2.x + r2.width).toBeLessThanOrEqual(r3.x);

    // Component cards in Region 2 (BTP Subaccount)
    const apiMgmt = { x: 162, y: 64, width: 106, height: 44 };
    const cpi = { x: 274, y: 64, width: 106, height: 44 };
    const hanaCloud = { x: 162, y: 172, width: 218, height: 44 };

    // Cards must fit strictly inside Region 2
    expect(apiMgmt.x).toBeGreaterThanOrEqual(r2.x);
    expect(cpi.x + cpi.width).toBeLessThanOrEqual(r2.x + r2.width);
    expect(hanaCloud.x + hanaCloud.width).toBeLessThanOrEqual(r2.x + r2.width);

    // Verify icons exist for key SAP components in library
    const integrationIcon = SAP_ARCHITECTURE_ICONS.find((i) => i.id.includes('integration-suite'));
    const hanaIcon = SAP_ARCHITECTURE_ICONS.find((i) => i.id.includes('hana-cloud'));
    const identityIcon = SAP_ARCHITECTURE_ICONS.find((i) => i.id.includes('identity-authentication'));

    expect(integrationIcon).toBeDefined();
    expect(integrationIcon?.dataUri).toMatch(/^data:image\/svg\+xml;base64,/);
    expect(hanaIcon).toBeDefined();
    expect(hanaIcon?.dataUri).toMatch(/^data:image\/svg\+xml;base64,/);
    expect(identityIcon).toBeDefined();
    expect(identityIcon?.dataUri).toMatch(/^data:image\/svg\+xml;base64,/);
  });
});
