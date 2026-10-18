import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { OcrModal } from '../components/OcrModal';
import { BoardsModal } from '../components/BoardsModal';
import { ShareModal } from '../components/ShareModal';
import { AiDrawModal } from '../components/AiDrawModal';

describe('Modal Dialogs', () => {
  describe('OcrModal', () => {
    it('renders loading state when OCR is running', () => {
      render(
        <OcrModal
          isOpen={true}
          onClose={vi.fn()}
          ocrResult={null}
          isLoading={true}
          progress={0.65}
          statusText="Reading handwriting..."
          onReplaceWithText={vi.fn()}
          onInsertBesideText={vi.fn()}
        />
      );

      expect(screen.getByTestId('ocr-loading-indicator')).toBeInTheDocument();
      expect(screen.getByText('Reading handwriting...')).toBeInTheDocument();
    });

    it('renders recognized text and allows replacing or inserting', () => {
      const onReplaceWithText = vi.fn();
      const onInsertBesideText = vi.fn();

      render(
        <OcrModal
          isOpen={true}
          onClose={vi.fn()}
          ocrResult={{
            text: 'Hello World OCR',
            confidence: 88,
            boundingBox: { minX: 10, minY: 10, maxX: 100, maxY: 50, width: 90, height: 40 },
          }}
          isLoading={false}
          progress={1}
          statusText=""
          onReplaceWithText={onReplaceWithText}
          onInsertBesideText={onInsertBesideText}
        />
      );

      expect(screen.getByTestId('ocr-confidence-badge')).toHaveTextContent('88% Confidence');
      const textarea = screen.getByTestId('ocr-text-textarea');
      expect(textarea).toHaveValue('Hello World OCR');

      // Edit recognized text
      fireEvent.change(textarea, { target: { value: 'Updated OCR Text' } });

      // Click Replace
      fireEvent.click(screen.getByTestId('btn-replace-ocr-strokes'));
      expect(onReplaceWithText).toHaveBeenCalledWith('Updated OCR Text');

      // Click Insert beside
      fireEvent.click(screen.getByTestId('btn-insert-ocr-beside'));
      expect(onInsertBesideText).toHaveBeenCalledWith('Updated OCR Text');
    });
  });

  describe('BoardsModal', () => {
    it('lists boards and triggers new board', () => {
      const onCreateNewBoard = vi.fn();
      const onSelectBoard = vi.fn();

      render(
        <BoardsModal
          isOpen={true}
          onClose={vi.fn()}
          boards={[
            { id: 'b1', name: 'Board One', elementCount: 5, updatedAt: Date.now() },
            { id: 'b2', name: 'Board Two', elementCount: 12, updatedAt: Date.now() },
          ]}
          currentBoardId="b1"
          onSelectBoard={onSelectBoard}
          onCreateNewBoard={onCreateNewBoard}
          onDeleteBoard={vi.fn()}
          onImportBoard={vi.fn()}
          onExportCurrentJson={vi.fn()}
        />
      );

      expect(screen.getByText('Board One')).toBeInTheDocument();
      expect(screen.getByText('Board Two')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('btn-modal-new-board'));
      expect(onCreateNewBoard).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText('Board Two'));
      expect(onSelectBoard).toHaveBeenCalledWith('b2');
    });
  });

  describe('ShareModal', () => {
    it('shows share link and copies it', () => {
      // Mock clipboard
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockImplementation(() => Promise.resolve()),
        },
      });

      render(
        <ShareModal
          isOpen={true}
          onClose={vi.fn()}
          roomId="room-abc-123"
          connectedUsers={[
            { userId: 'u2', userName: 'Alice', userColor: '#10b981' },
          ]}
          currentUser={{ userId: 'u1', userName: 'Bob', userColor: '#3b82f6' }}
          onUpdateUserName={vi.fn()}
        />
      );

      expect(screen.getByTestId('input-share-url')).toHaveValue(
        `${window.location.origin}/?room=room-abc-123`
      );
      expect(screen.getByText('Alice')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('btn-copy-share-url'));
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `${window.location.origin}/?room=room-abc-123`
      );
    });

    it('allows changing display name', () => {
      const onUpdateUserName = vi.fn();

      render(
        <ShareModal
          isOpen={true}
          onClose={vi.fn()}
          roomId="room-123"
          connectedUsers={[]}
          currentUser={{ userId: 'u1', userName: 'OldName', userColor: '#3b82f6' }}
          onUpdateUserName={onUpdateUserName}
        />
      );

      fireEvent.click(screen.getByTestId('btn-change-username'));
      const input = screen.getByTestId('input-username');
      fireEvent.change(input, { target: { value: 'NewName' } });
      fireEvent.click(screen.getByTestId('btn-save-username'));

      expect(onUpdateUserName).toHaveBeenCalledWith('NewName');
    });
  });

  describe('AiDrawModal', () => {
    it('renders prompt input, suggestions, and submits request', async () => {
      const onGenerateDrawing = vi.fn().mockImplementation(() => Promise.resolve());
      const onClose = vi.fn();

      render(
        <AiDrawModal
          isOpen={true}
          onClose={onClose}
          onGenerateDrawing={onGenerateDrawing}
          isLoading={false}
        />
      );

      expect(screen.getByTestId('ai-draw-modal')).toBeInTheDocument();
      const input = screen.getByTestId('input-ai-draw-prompt');
      fireEvent.change(input, { target: { value: 'Draw a house with a garden' } });

      const submitBtn = screen.getByTestId('btn-submit-ai-draw');
      fireEvent.click(submitBtn);

      expect(onGenerateDrawing).toHaveBeenCalledWith('Draw a house with a garden');
    });

    it('displays active progress indicator when isLoading is true', () => {
      render(
        <AiDrawModal
          isOpen={true}
          onClose={vi.fn()}
          onGenerateDrawing={vi.fn()}
          isLoading={true}
        />
      );

      expect(screen.getByTestId('ai-draw-progress-card')).toBeInTheDocument();
      expect(screen.getByText(/Connecting to Gemini 3.8/)).toBeInTheDocument();
      expect(screen.getByText('Drawing on Whiteboard...')).toBeInTheDocument();
    });

    it('handles 503 high demand error and provides retry button', async () => {
      const onGenerateDrawing = vi.fn().mockRejectedValue(
        new Error('This model is currently experiencing high demand. Spikes in demand are usually temporary (503).')
      );

      render(
        <AiDrawModal
          isOpen={true}
          onClose={vi.fn()}
          onGenerateDrawing={onGenerateDrawing}
          isLoading={false}
        />
      );

      const input = screen.getByTestId('input-ai-draw-prompt');
      fireEvent.change(input, { target: { value: 'Draw a flowchart' } });
      fireEvent.click(screen.getByTestId('btn-submit-ai-draw'));

      await screen.findByTestId('ai-draw-error-banner');
      expect(screen.getByText('Model High Demand (503)')).toBeInTheDocument();
      expect(screen.getByTestId('btn-retry-ai-draw')).toBeInTheDocument();
    });

    it('allows clicking cancel or close button while loading to cancel request', () => {
      const onClose = vi.fn();
      const onCancel = vi.fn();

      render(
        <AiDrawModal
          isOpen={true}
          onClose={onClose}
          onGenerateDrawing={vi.fn()}
          isLoading={true}
          onCancel={onCancel}
        />
      );

      // Verify close button is not disabled and triggers cancel
      const closeBtn = screen.getByTestId('btn-close-ai-draw');
      expect(closeBtn).not.toBeDisabled();
      fireEvent.click(closeBtn);
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);

      // Verify cancel button is not disabled
      const cancelBtn = screen.getByTestId('btn-cancel-ai-draw');
      expect(cancelBtn).not.toBeDisabled();
      fireEvent.click(cancelBtn);
      expect(onCancel).toHaveBeenCalledTimes(2);
      expect(onClose).toHaveBeenCalledTimes(2);
    });

    it('does not display security prompt injection label', () => {
      render(
        <AiDrawModal
          isOpen={true}
          onClose={vi.fn()}
          onGenerateDrawing={vi.fn()}
          isLoading={false}
        />
      );

      expect(screen.queryByText(/Security protected against prompt injection/i)).not.toBeInTheDocument();
    });
  });
});
