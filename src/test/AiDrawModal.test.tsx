import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { AiDrawModal } from '../components/AiDrawModal';

describe('AiDrawModal Component', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <AiDrawModal
        isOpen={false}
        onClose={vi.fn()}
        onGenerateDrawing={vi.fn()}
        isLoading={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders prompt input, suggestions, and submits request', async () => {
    const onGenerate = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <AiDrawModal
        isOpen={true}
        onClose={onClose}
        onGenerateDrawing={onGenerate}
        isLoading={false}
      />
    );

    const input = screen.getByTestId('input-ai-draw-prompt');
    expect(input).toBeInTheDocument();

    // Click a suggestion
    const suggestionBtn = screen.getByText('Flowchart of user login and authentication');
    fireEvent.click(suggestionBtn);
    expect(input).toHaveValue('Flowchart of user login and authentication');

    // Submit form
    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-submit-ai-draw'));
    });

    expect(onGenerate).toHaveBeenCalledWith('Flowchart of user login and authentication');
    expect(onClose).toHaveBeenCalled();
  });

  it('displays loading state and cancels generation when cancel button is clicked', () => {
    const onCancel = vi.fn();
    const onClose = vi.fn();

    render(
      <AiDrawModal
        isOpen={true}
        onClose={onClose}
        onGenerateDrawing={vi.fn()}
        isLoading={true}
        onCancel={onCancel}
      />
    );

    expect(screen.getByTestId('ai-draw-progress-card')).toBeInTheDocument();

    // Click cancel in progress card
    const cancelBtns = screen.getAllByText('Cancel');
    fireEvent.click(cancelBtns[0]);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cycles progress stages and dynamic percentage during loading', () => {
    render(
      <AiDrawModal
        isOpen={true}
        onClose={vi.fn()}
        onGenerateDrawing={vi.fn()}
        isLoading={true}
      />
    );

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // Verify progress card is still active
    expect(screen.getByTestId('ai-draw-progress-card')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });
  });

  it('handles general error during drawing generation', async () => {
    const onGenerate = vi.fn().mockRejectedValue(new Error('Prompt was invalid'));

    render(
      <AiDrawModal
        isOpen={true}
        onClose={vi.fn()}
        onGenerateDrawing={onGenerate}
        isLoading={false}
      />
    );

    const input = screen.getByTestId('input-ai-draw-prompt');
    fireEvent.change(input, { target: { value: 'Something' } });

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-submit-ai-draw'));
    });

    expect(screen.getByTestId('ai-draw-error-banner')).toBeInTheDocument();
    expect(screen.getByText('Prompt was invalid')).toBeInTheDocument();
  });

  it('handles 503 high demand overloaded error and shows retry button', async () => {
    const onGenerate = vi.fn()
      .mockRejectedValueOnce(new Error('503 Service Unavailable: high demand'))
      .mockResolvedValueOnce(undefined);

    render(
      <AiDrawModal
        isOpen={true}
        onClose={vi.fn()}
        onGenerateDrawing={onGenerate}
        isLoading={false}
      />
    );

    const input = screen.getByTestId('input-ai-draw-prompt');
    fireEvent.change(input, { target: { value: 'Draw architecture diagram' } });

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-submit-ai-draw'));
    });

    expect(screen.getByText('Model High Demand (503)')).toBeInTheDocument();
    const retryBtn = screen.getByTestId('btn-retry-ai-draw');
    expect(retryBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(retryBtn);
    });

    expect(onGenerate).toHaveBeenCalledTimes(2);
  });

  it('closes on Escape key press', () => {
    const onClose = vi.fn();
    render(
      <AiDrawModal
        isOpen={true}
        onClose={onClose}
        onGenerateDrawing={vi.fn()}
        isLoading={false}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when close button in header is clicked', () => {
    const onClose = vi.fn();
    render(
      <AiDrawModal
        isOpen={true}
        onClose={onClose}
        onGenerateDrawing={vi.fn()}
        isLoading={false}
      />
    );

    fireEvent.click(screen.getByTestId('btn-close-ai-draw'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
