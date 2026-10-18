import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { OcrModal } from '../components/OcrModal';
import { OcrResult } from '../utils/ocr';

describe('OcrModal Component', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <OcrModal
        isOpen={false}
        onClose={vi.fn()}
        ocrResult={null}
        isLoading={false}
        progress={0}
        statusText=""
        onReplaceWithText={vi.fn()}
        onInsertBesideText={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders loading indicator with progress and status text', () => {
    render(
      <OcrModal
        isOpen={true}
        onClose={vi.fn()}
        ocrResult={null}
        isLoading={true}
        progress={0.65}
        statusText="Recognizing strokes with neural model..."
        onReplaceWithText={vi.fn()}
        onInsertBesideText={vi.fn()}
      />
    );

    expect(screen.getByTestId('ocr-loading-indicator')).toBeInTheDocument();
    expect(screen.getByText('Recognizing strokes with neural model...')).toBeInTheDocument();
    expect(screen.getByText('65% complete')).toBeInTheDocument();
  });

  const defaultBox = { minX: 0, minY: 0, maxX: 100, maxY: 50, width: 100, height: 50 };

  it('renders recognized text and confidence badges', () => {
    const mockResultHigh: OcrResult = {
      text: 'Hello Whiteboard',
      confidence: 88,
      boundingBox: defaultBox,
    };

    const { rerender } = render(
      <OcrModal
        isOpen={true}
        onClose={vi.fn()}
        ocrResult={mockResultHigh}
        isLoading={false}
        progress={1}
        statusText="Done"
        onReplaceWithText={vi.fn()}
        onInsertBesideText={vi.fn()}
      />
    );

    expect(screen.getByTestId('ocr-text-textarea')).toHaveValue('Hello Whiteboard');
    expect(screen.getByTestId('ocr-confidence-badge')).toHaveTextContent('88% Confidence');

    // Medium confidence
    rerender(
      <OcrModal
        isOpen={true}
        onClose={vi.fn()}
        ocrResult={{ text: 'Maybe text', confidence: 55, boundingBox: defaultBox }}
        isLoading={false}
        progress={1}
        statusText="Done"
        onReplaceWithText={vi.fn()}
        onInsertBesideText={vi.fn()}
      />
    );
    expect(screen.getByTestId('ocr-confidence-badge')).toHaveTextContent('55% Confidence');

    // Low confidence
    rerender(
      <OcrModal
        isOpen={true}
        onClose={vi.fn()}
        ocrResult={{ text: 'Unclear text', confidence: 25, boundingBox: defaultBox }}
        isLoading={false}
        progress={1}
        statusText="Done"
        onReplaceWithText={vi.fn()}
        onInsertBesideText={vi.fn()}
      />
    );
    expect(screen.getByTestId('ocr-confidence-badge')).toHaveTextContent('25% Confidence');
  });

  it('copies text to clipboard and displays feedback', async () => {
    render(
      <OcrModal
        isOpen={true}
        onClose={vi.fn()}
        ocrResult={{ text: 'Copy me please', confidence: 90, boundingBox: defaultBox }}
        isLoading={false}
        progress={1}
        statusText="Done"
        onReplaceWithText={vi.fn()}
        onInsertBesideText={vi.fn()}
      />
    );

    const copyBtn = screen.getByTestId('btn-copy-ocr-text');
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Copy me please');
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('allows editing text and inserting beside or replacing strokes', () => {
    const onReplace = vi.fn();
    const onInsertBeside = vi.fn();

    render(
      <OcrModal
        isOpen={true}
        onClose={vi.fn()}
        ocrResult={{ text: 'Initial OCR', confidence: 80, boundingBox: defaultBox }}
        isLoading={false}
        progress={1}
        statusText="Done"
        onReplaceWithText={onReplace}
        onInsertBesideText={onInsertBeside}
      />
    );

    const textarea = screen.getByTestId('ocr-text-textarea');
    fireEvent.change(textarea, { target: { value: 'Edited OCR Result' } });

    fireEvent.click(screen.getByTestId('btn-insert-ocr-beside'));
    expect(onInsertBeside).toHaveBeenCalledWith('Edited OCR Result');

    fireEvent.click(screen.getByTestId('btn-replace-ocr-strokes'));
    expect(onReplace).toHaveBeenCalledWith('Edited OCR Result');
  });

  it('triggers engine switchers for Tesseract and Gemini AI Vision', () => {
    const onRunAiOcr = vi.fn();
    const onRunTesseractOcr = vi.fn();

    render(
      <OcrModal
        isOpen={true}
        onClose={vi.fn()}
        ocrResult={{ text: 'Sample', confidence: 90, boundingBox: defaultBox }}
        isLoading={false}
        progress={1}
        statusText="Done"
        onReplaceWithText={vi.fn()}
        onInsertBesideText={vi.fn()}
        onRunAiOcr={onRunAiOcr}
        onRunTesseractOcr={onRunTesseractOcr}
      />
    );

    fireEvent.click(screen.getByTestId('btn-switch-tesseract'));
    expect(onRunTesseractOcr).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('btn-switch-ai-ocr'));
    expect(onRunAiOcr).toHaveBeenCalledTimes(1);
  });

  it('closes on cancel and close buttons', () => {
    const onClose = vi.fn();

    render(
      <OcrModal
        isOpen={true}
        onClose={onClose}
        ocrResult={null}
        isLoading={false}
        progress={0}
        statusText=""
        onReplaceWithText={vi.fn()}
        onInsertBesideText={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('btn-close-ocr-modal'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('btn-cancel-ocr'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
