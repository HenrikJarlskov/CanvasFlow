import { describe, it, expect } from 'vitest';
import {
  parseDrawio,
  parseStyleString,
  convertDrawioItemToBoardElement,
  SAMPLE_SAP_DRAWIO_LIBRARY,
  DrawioParsedItem,
} from '../utils/drawioParser';

describe('Draw.io Format Parser', () => {
  it('parses draw.io style strings into key-value pairs', () => {
    const styleStr = 'rounded=1;whiteSpace=wrap;fillColor=#d5e8d4;strokeColor=#82b366;shape=ellipse;';
    const parsed = parseStyleString(styleStr);
    expect(parsed.rounded).toBe('1');
    expect(parsed.fillColor).toBe('#d5e8d4');
    expect(parsed.strokeColor).toBe('#82b366');
    expect(parsed.shape).toBe('ellipse');
  });

  it('parses <mxlibrary> containing SAP BTP solution diagram shapes', () => {
    const result = parseDrawio(SAMPLE_SAP_DRAWIO_LIBRARY);
    expect(result.success).toBe(true);
    expect(result.items.length).toBe(2);

    const integrationIcon = result.items.find((i) => i.title.includes('Integration'));
    expect(integrationIcon).toBeDefined();
    expect(integrationIcon?.type).toBe('image');
    expect(integrationIcon?.src).toContain('data:image/svg+xml');

    const hanaIcon = result.items.find((i) => i.title.includes('HANA'));
    expect(hanaIcon).toBeDefined();
    expect(hanaIcon?.type).toBe('image');
  });

  it('parses standard <mxGraphModel> and <mxfile> diagrams with geometric shapes', () => {
    const standardModel = `<mxGraphModel dx="1000" dy="800" grid="1">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <mxCell id="2" value="SAP API Gateway" style="rounded=1;whiteSpace=wrap;fillColor=#E0F2FE;strokeColor=#0284C7;strokeWidth=2;" vertex="1" parent="1">
          <mxGeometry x="100" y="80" width="140" height="70" as="geometry"/>
        </mxCell>
        <mxCell id="3" value="HANA Cloud" style="shape=ellipse;fillColor=#FEF08A;strokeColor=#CA8A04;" vertex="1" parent="1">
          <mxGeometry x="300" y="80" width="80" height="80" as="geometry"/>
        </mxCell>
        <mxCell id="4" value="Architecture Note" style="text;html=1;strokeColor=none;fillColor=none;" vertex="1" parent="1">
          <mxGeometry x="100" y="200" width="160" height="30" as="geometry"/>
        </mxCell>
      </root>
    </mxGraphModel>`;

    const result = parseDrawio(standardModel);
    expect(result.success).toBe(true);
    expect(result.items.length).toBe(3);

    const rectItem = result.items.find((i) => i.title === 'SAP API Gateway');
    expect(rectItem).toBeDefined();
    expect(rectItem?.type).toBe('shape');
    expect(rectItem?.shapeType).toBe('rectangle');
    expect(rectItem?.width).toBe(140);
    expect(rectItem?.height).toBe(70);

    const circleItem = result.items.find((i) => i.title === 'HANA Cloud');
    expect(circleItem).toBeDefined();
    expect(circleItem?.type).toBe('shape');
    expect(circleItem?.shapeType).toBe('circle');

    const textItem = result.items.find((i) => i.title === 'Architecture Note');
    expect(textItem).toBeDefined();
    expect(textItem?.type).toBe('text');
  });

  it('parses embedded raw SVG from draw.io export', () => {
    const rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" fill="#4F46E5" rx="20"/>
    </svg>`;

    const result = parseDrawio(rawSvg);
    expect(result.success).toBe(true);
    expect(result.items.length).toBe(1);
    expect(result.items[0].type).toBe('image');
    expect(result.items[0].src).toContain('data:image/svg+xml');
  });

  it('handles invalid or empty inputs gracefully', () => {
    const emptyResult = parseDrawio('');
    expect(emptyResult.success).toBe(false);
    expect(emptyResult.error).toBeDefined();

    const garbageResult = parseDrawio('random plain text that is not xml');
    expect(garbageResult.success).toBe(false);
    expect(garbageResult.error).toBeDefined();
  });

  it('converts Draw.io parsed items to Whiteboard BoardElements', () => {
    const imageItem: DrawioParsedItem = {
      id: 'item-1',
      title: 'SAP Icon',
      type: 'image',
      src: 'data:image/svg+xml;utf8,<svg></svg>',
      width: 64,
      height: 64,
    };
    const el1 = convertDrawioItemToBoardElement(imageItem, 200, 150, 1);
    expect(el1.type).toBe('image');
    if (el1.type === 'image') {
      expect(el1.x).toBe(200);
      expect(el1.y).toBe(150);
      expect(el1.width).toBe(64);
      expect(el1.height).toBe(64);
    }

    const shapeItem: DrawioParsedItem = {
      id: 'item-2',
      title: 'Service Box',
      type: 'shape',
      shapeType: 'rectangle',
      width: 120,
      height: 80,
      color: '#059669',
      fillColor: '#D1FAE5',
    };
    const el2 = convertDrawioItemToBoardElement(shapeItem, 100, 100, 2);
    expect(el2.type).toBe('shape');
    if (el2.type === 'shape') {
      expect(el2.color).toBe('#059669');
      expect(el2.fillColor).toBe('#D1FAE5');
    }

    const textItem: DrawioParsedItem = {
      id: 'item-3',
      title: 'Legend Label',
      type: 'text',
      text: 'Legend Label',
      width: 100,
      height: 30,
    };
    const el3 = convertDrawioItemToBoardElement(textItem, 50, 50, 3);
    expect(el3.type).toBe('text');
    if (el3.type === 'text') {
      expect(el3.text).toBe('Legend Label');
    }
  });
});
