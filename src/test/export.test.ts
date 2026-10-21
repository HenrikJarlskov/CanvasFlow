import { describe, it, expect, vi } from 'vitest';
import { renderBoardToCanvas, exportToPNG, exportToPDF, exportToSVG } from '../utils/export';
import { BoardElement } from '../types/whiteboard';

// Mock jsPDF to prevent physical test pdf export files from being created on disk
vi.mock('jspdf', () => {
  return {
    jsPDF: class MockJsPDF {
      addImage = vi.fn();
      save = vi.fn();
    },
  };
});

describe('Export Utilities', () => {
  const mockElements: BoardElement[] = [
    {
      id: 's-1',
      type: 'shape',
      shapeType: 'rectangle',
      x: 20,
      y: 20,
      width: 100,
      height: 80,
      color: '#000000',
      strokeWidth: 2,
      opacity: 1,
      createdAt: 100,
      updatedAt: 100,
      zIndex: 1,
    },
    {
      id: 't-1',
      type: 'text',
      x: 30,
      y: 40,
      text: 'Export Test',
      fontSize: 16,
      color: '#000000',
      fontFamily: 'Inter',
      width: 100,
      height: 20,
      createdAt: 101,
      updatedAt: 101,
      zIndex: 2,
    },
  ];

  it('renders elements to canvas', () => {
    const canvas = renderBoardToCanvas(mockElements, 'blank');
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
  });

  it('exports to PNG without error', () => {
    expect(() => exportToPNG(mockElements, 'TestBoard', 'blank')).not.toThrow();
  });

  it('exports to PDF without error and without creating disk artifacts', async () => {
    await expect(exportToPDF(mockElements, 'TestBoard', 'blank')).resolves.not.toThrow();
  });

  it('exports to SVG without error', () => {
    expect(() => exportToSVG(mockElements, 'TestBoard')).not.toThrow();
  });
});
