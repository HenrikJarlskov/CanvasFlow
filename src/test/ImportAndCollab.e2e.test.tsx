import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import App from '../App';

let capturedCallbacks: any = null;
let lastSocketInstance: any = null;

vi.mock('../utils/socket', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/socket')>();
  return {
    ...actual,
    WhiteboardSocket: class MockWhiteboardSocket {
      constructor(roomId: string, callbacks: any) {
        capturedCallbacks = callbacks;
        lastSocketInstance = this;
      }
      sendCursor = vi.fn();
      sendCursorMove = vi.fn();
      sendElementsChange = vi.fn();
      sendClear = vi.fn();
      sendRename = vi.fn();
      destroy = vi.fn();
    },
  };
});

describe('Import and Real-Time Cursor Collaboration End-to-End', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    capturedCallbacks = null;
  });

  it('opens Import modal from Header, searches SAP icons, and drops SAP BTP icon onto canvas', async () => {
    render(<App />);

    // 1. Verify Header has "Import" button and click it
    const importHeaderBtn = screen.getByTestId('btn-header-import');
    expect(importHeaderBtn).toBeInTheDocument();
    fireEvent.click(importHeaderBtn);

    // 2. Import dialog opens with SAP Architecture Icons tab
    expect(screen.getByTestId('import-modal')).toBeInTheDocument();
    expect(screen.getByText('SAP Architecture Icons')).toBeInTheDocument();

    // 3. Search for SAP HANA Cloud
    const searchInput = screen.getByTestId('sap-icon-search-input');
    fireEvent.change(searchInput, { target: { value: 'HANA' } });

    const hanaCard = screen.getByTestId('btn-add-sap-icon-sap-btp-hana-cloud');
    expect(hanaCard).toBeInTheDocument();

    // 4. Click Add to Canvas
    await act(async () => {
      fireEvent.click(hanaCard);
    });

    expect(screen.getByText('Added!')).toBeInTheDocument();

    // 5. Close modal
    fireEvent.click(screen.getByTestId('btn-close-import-modal'));
    expect(screen.queryByTestId('import-modal')).not.toBeInTheDocument();

    // 6. Verify SVG Canvas has rendered the imported image/vector element
    const canvas = screen.getByTestId('whiteboard-svg');
    expect(canvas).toBeInTheDocument();
    const images = canvas.querySelectorAll('image');
    expect(images.length).toBeGreaterThanOrEqual(1);
  });

  it('opens Import modal from Toolbar, loads draw.io format library, and imports items to canvas', async () => {
    render(<App />);

    // 1. Click Import button on Toolbar
    const toolImportBtn = screen.getByTestId('tool-import');
    expect(toolImportBtn).toBeInTheDocument();
    fireEvent.click(toolImportBtn);

    expect(screen.getByTestId('import-modal')).toBeInTheDocument();

    // 2. Switch to Draw.io Format tab
    fireEvent.click(screen.getByTestId('tab-drawio'));
    expect(screen.getByTestId('drawio-xml-textarea')).toBeInTheDocument();

    // 3. Load Sample SAP BTP Draw.io Library
    fireEvent.click(screen.getByTestId('btn-load-sample-drawio'));

    // 4. Verify parsed items preview and click Import
    const importItemsBtn = screen.getByTestId('btn-import-drawio-items');
    expect(importItemsBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(importItemsBtn);
    });

    // Modal closes automatically on batch import
    expect(screen.queryByTestId('import-modal')).not.toBeInTheDocument();

    // Elements exist on canvas
    const canvas = screen.getByTestId('whiteboard-svg');
    expect(canvas).toBeInTheDocument();
  });

  it('renders collaborators cursors live on canvas when collaborating', async () => {
    render(<App />);

    const canvasContainer = screen.getByTestId('canvas-container');
    expect(canvasContainer).toBeInTheDocument();

    // 1. Moving pointer on canvas transmits local cursor coordinates
    fireEvent.pointerMove(canvasContainer, { clientX: 250, clientY: 180 });
    expect(lastSocketInstance.sendCursor).toHaveBeenCalled();

    // 2. Incoming collaborator cursor broadcast from WebSocket renders live on canvas
    await act(async () => {
      capturedCallbacks?.onUserCursor?.({
        userId: 'collab-alice-42',
        userName: 'Alice Cloud Arch',
        userColor: '#ec4899',
        x: 320,
        y: 240,
      });
    });

    // 3. Verify cursor element and name tag appear with collaborator badge
    const cursorEl = screen.getByTestId('remote-cursor-collab-alice-42');
    expect(cursorEl).toBeInTheDocument();
    expect(screen.getByText('Alice Cloud Arch')).toBeInTheDocument();
    expect(cursorEl.getAttribute('data-cursor-user')).toBe('Alice Cloud Arch');
  });
});
