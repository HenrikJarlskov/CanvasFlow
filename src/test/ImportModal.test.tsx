import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ImportModal } from '../components/ImportModal';
import { BoardElement } from '../types/whiteboard';

describe('ImportModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onImportElements: vi.fn(),
    onImportImageFile: vi.fn(),
    canvasCenter: { x: 400, y: 300 },
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<ImportModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal dialog with tabs and header', () => {
    render(<ImportModal {...defaultProps} />);

    expect(screen.getByTestId('import-modal')).toBeInTheDocument();
    expect(screen.getByText('Import Content')).toBeInTheDocument();
    expect(screen.getByTestId('tab-sap-icons')).toBeInTheDocument();
    expect(screen.getByTestId('tab-drawio')).toBeInTheDocument();
    expect(screen.getByTestId('tab-images')).toBeInTheDocument();
  });

  it('searches and filters SAP architecture icons', () => {
    render(<ImportModal {...defaultProps} />);

    // Default view shows SAP icons
    expect(screen.getByTestId('sap-icon-grid')).toBeInTheDocument();
    expect(screen.getByText('SAP Integration Suite')).toBeInTheDocument();

    // Search query
    const searchInput = screen.getByTestId('sap-icon-search-input');
    fireEvent.change(searchInput, { target: { value: 'HANA Cloud' } });

    expect(screen.getByText('SAP HANA Cloud')).toBeInTheDocument();
    expect(screen.queryByText('SAP Integration Suite')).not.toBeInTheDocument();

    // Filter by category
    fireEvent.change(searchInput, { target: { value: '' } });
    const aiCategoryPill = screen.getByTestId('category-pill-Business AI');
    fireEvent.click(aiCategoryPill);

    expect(screen.getByText('SAP Business AI Platform, ABAP environment')).toBeInTheDocument();
    expect(screen.queryByText('SAP Audit Log Service')).not.toBeInTheDocument();
  });

  it('allows selecting icon size presets and adding an icon to canvas', () => {
    const onImportElements = vi.fn();
    render(<ImportModal {...defaultProps} onImportElements={onImportElements} />);

    // Select Large size preset
    const largeSizeBtn = screen.getByText('L (96px)');
    fireEvent.click(largeSizeBtn);

    // Click on SAP Integration Suite icon card
    const cpiBtn = screen.getByTestId('btn-add-sap-icon-sap-btp-integration-suite');
    const iconImg = cpiBtn.querySelector('img');
    expect(iconImg).not.toBeNull();
    expect(iconImg?.getAttribute('src')).toMatch(/^data:image\/svg\+xml;base64,/);

    fireEvent.click(cpiBtn);

    expect(onImportElements).toHaveBeenCalledTimes(1);
    const importedArray: BoardElement[] = onImportElements.mock.calls[0][0];
    expect(importedArray).toHaveLength(1);
    const firstItem = importedArray[0];
    expect(firstItem.type).toBe('image');
    if (firstItem.type === 'image') {
      expect(firstItem.width).toBe(96);
      expect(firstItem.height).toBe(96);
      expect(firstItem.src).toMatch(/^data:image\/svg\+xml;base64,/);
      const b64 = firstItem.src.replace('data:image/svg+xml;base64,', '');
      const decodedSvg = Buffer.from(b64, 'base64').toString('utf-8');
      expect(decodedSvg).toContain('<svg');
    }

    // Shows added feedback
    expect(screen.getByText('Added!')).toBeInTheDocument();
  });

  it('handles Draw.io format tab, loads sample library, and imports items to canvas', () => {
    const onImportElements = vi.fn();
    const onClose = vi.fn();
    render(<ImportModal {...defaultProps} onImportElements={onImportElements} onClose={onClose} />);

    // Switch to Draw.io tab
    fireEvent.click(screen.getByTestId('tab-drawio'));
    expect(screen.getByTestId('drawio-xml-textarea')).toBeInTheDocument();

    // Click Load Sample Draw.io Library
    fireEvent.click(screen.getByTestId('btn-load-sample-drawio'));

    // Should successfully parse items
    expect(screen.getByTestId('btn-import-drawio-items')).toBeInTheDocument();
    expect(screen.getByText(/Successfully parsed 2 draw\.io element\(s\)/i)).toBeInTheDocument();

    // Click Import to canvas
    fireEvent.click(screen.getByTestId('btn-import-drawio-items'));
    expect(onImportElements).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('displays error when invalid draw.io XML is parsed', () => {
    render(<ImportModal {...defaultProps} />);

    fireEvent.click(screen.getByTestId('tab-drawio'));
    const textarea = screen.getByTestId('drawio-xml-textarea');
    fireEvent.change(textarea, { target: { value: 'not valid xml' } });

    fireEvent.click(screen.getByTestId('btn-parse-drawio'));
    expect(screen.getByTestId('drawio-parse-error')).toBeInTheDocument();
  });

  it('handles image file selection and drop in Images tab', () => {
    const onImportImageFile = vi.fn();
    const onClose = vi.fn();
    render(<ImportModal {...defaultProps} onImportImageFile={onImportImageFile} onClose={onClose} />);

    // Switch to Images tab
    fireEvent.click(screen.getByTestId('tab-images'));
    expect(screen.getByTestId('import-image-dropzone')).toBeInTheDocument();

    // Drop image file onto dropzone
    const dropzone = screen.getByTestId('import-image-dropzone');
    const imageFile = new File(['image-bytes'], 'architecture.png', { type: 'image/png' });

    fireEvent.dragOver(dropzone);
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [imageFile],
      },
    });

    expect(onImportImageFile).toHaveBeenCalledWith(imageFile);
    expect(onClose).toHaveBeenCalled();

    // File input change
    const fileInput = screen.getByTestId('import-modal-file-input') as HTMLInputElement;
    const anotherFile = new File(['pic-bytes'], 'diagram.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [anotherFile] } });
    expect(onImportImageFile).toHaveBeenCalledWith(anotherFile);
  });

  it('closes modal when close button is clicked', () => {
    const onClose = vi.fn();
    render(<ImportModal {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByTestId('btn-close-import-modal'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
