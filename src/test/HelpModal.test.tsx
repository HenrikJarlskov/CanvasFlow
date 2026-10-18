import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HelpModal } from '../components/HelpModal';
import { DEFAULT_SHORTCUTS } from '../utils/shortcuts';

describe('HelpModal Component', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <HelpModal
        isOpen={false}
        onClose={vi.fn()}
        shortcuts={DEFAULT_SHORTCUTS}
        onUpdateShortcuts={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders features guide tab by default with core features', () => {
    render(
      <HelpModal
        isOpen={true}
        onClose={vi.fn()}
        shortcuts={DEFAULT_SHORTCUTS}
        onUpdateShortcuts={vi.fn()}
      />
    );

    expect(screen.getByTestId('help-modal')).toBeInTheDocument();
    expect(screen.getByText('AIdboard Help & Settings')).toBeInTheDocument();
    expect(screen.getByText('Infinite Vector Canvas')).toBeInTheDocument();
    expect(screen.getByText('Intelligent Geometric Auto-Snap')).toBeInTheDocument();
    expect(screen.getByText('AI Whiteboard Artist (Gemini)')).toBeInTheDocument();
    expect(screen.getByText('Real-Time Multiplayer Collaboration')).toBeInTheDocument();
  });

  it('switches to Keyboard Shortcuts tab and displays customizable shortcuts', () => {
    render(
      <HelpModal
        isOpen={true}
        onClose={vi.fn()}
        shortcuts={DEFAULT_SHORTCUTS}
        onUpdateShortcuts={vi.fn()}
      />
    );

    // Switch to shortcuts tab
    fireEvent.click(screen.getByTestId('tab-shortcuts'));

    expect(screen.getByText('Click any shortcut badge to change it. Press your desired key to rebind, or ESC to cancel.')).toBeInTheDocument();
    expect(screen.getByTestId('btn-shortcut-tool_select')).toBeInTheDocument();
    expect(screen.getByTestId('btn-shortcut-action_ai_draw')).toBeInTheDocument();
  });

  it('allows user to customize a shortcut key with modifier and swap on conflict', () => {
    const onUpdateShortcuts = vi.fn();
    render(
      <HelpModal
        isOpen={true}
        onClose={vi.fn()}
        shortcuts={DEFAULT_SHORTCUTS}
        onUpdateShortcuts={onUpdateShortcuts}
      />
    );

    fireEvent.click(screen.getByTestId('tab-shortcuts'));

    // Click select tool shortcut to rebind
    const selectBtn = screen.getByTestId('btn-shortcut-tool_select');
    fireEvent.click(selectBtn);

    expect(screen.getByText('Press any key...')).toBeInTheDocument();

    // Bare modifier key is ignored
    fireEvent.keyDown(window, { key: 'Control' });
    expect(screen.getByText('Press any key...')).toBeInTheDocument();

    // Rebind to 'p' (which conflicts with pen tool 'p' -> triggers swap)
    fireEvent.keyDown(window, { key: 'p' });

    expect(onUpdateShortcuts).toHaveBeenCalled();
  });

  it('cancels key recording on Escape key press', () => {
    render(
      <HelpModal
        isOpen={true}
        onClose={vi.fn()}
        shortcuts={DEFAULT_SHORTCUTS}
        onUpdateShortcuts={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('tab-shortcuts'));
    fireEvent.click(screen.getByTestId('btn-shortcut-tool_select'));

    expect(screen.getByText('Press any key...')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText('Press any key...')).not.toBeInTheDocument();
  });

  it('filters shortcuts by category and search query', () => {
    render(
      <HelpModal
        isOpen={true}
        onClose={vi.fn()}
        shortcuts={DEFAULT_SHORTCUTS}
        onUpdateShortcuts={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('tab-shortcuts'));

    // Click 'Tools' category button
    fireEvent.click(screen.getByRole('button', { name: 'Tools' }));
    expect(screen.getByTestId('btn-shortcut-tool_select')).toBeInTheDocument();

    // Search for nonexistent query
    const searchInput = screen.getByPlaceholderText('Search shortcuts...');
    fireEvent.change(searchInput, { target: { value: 'xyz123nonsense' } });
    expect(screen.getByText('No shortcuts matched your search query.')).toBeInTheDocument();

    // Search for 'undo'
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    fireEvent.change(searchInput, { target: { value: 'undo' } });
    expect(screen.getByText('Undo')).toBeInTheDocument();
  });

  it('resets shortcuts to default and closes on close buttons or Escape', () => {
    const onUpdateShortcuts = vi.fn();
    const onClose = vi.fn();

    render(
      <HelpModal
        isOpen={true}
        onClose={onClose}
        shortcuts={DEFAULT_SHORTCUTS}
        onUpdateShortcuts={onUpdateShortcuts}
      />
    );

    fireEvent.click(screen.getByTestId('tab-shortcuts'));
    fireEvent.click(screen.getByTestId('btn-reset-shortcuts'));

    expect(onUpdateShortcuts).toHaveBeenCalledWith(DEFAULT_SHORTCUTS);

    // Escape closes modal when not recording
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    // Both Close buttons (header X and footer button)
    const closeButtons = screen.getAllByRole('button', { name: 'Close' });
    expect(closeButtons).toHaveLength(2);

    fireEvent.click(closeButtons[0]);
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.click(closeButtons[1]);
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('switches to OKF Bundle tab and navigates all 5 operational sections', () => {
    render(
      <HelpModal
        isOpen={true}
        onClose={vi.fn()}
        shortcuts={DEFAULT_SHORTCUTS}
        onUpdateShortcuts={vi.fn()}
      />
    );

    // Click OKF tab
    const okfTab = screen.getByTestId('tab-okf');
    expect(okfTab).toBeInTheDocument();
    fireEvent.click(okfTab);

    // Verify OKF viewer rendered with live benchmark indicators
    expect(screen.getByTestId('okf-viewer')).toBeInTheDocument();
    expect(screen.getByText('755.3 req/s')).toBeInTheDocument();
    expect(screen.getByText('1.94 ms p95')).toBeInTheDocument();
    expect(screen.getByText('27,675 ops/s')).toBeInTheDocument();

    // Navigate to Deployment section
    fireEvent.click(screen.getByTestId('okf-tab-deployment'));
    expect(screen.getByText('Deployment & Security Operations')).toBeInTheDocument();
    expect(screen.getByText('Quick Docker Compose Deployment')).toBeInTheDocument();

    // Navigate to Testing & Benchmarks section
    fireEvent.click(screen.getByTestId('okf-tab-testing'));
    expect(screen.getByText('Test Suite, Performance & Scalability Results')).toBeInTheDocument();
    expect(screen.getByText('HTTP Server Throughput')).toBeInTheDocument();

    // Navigate to Features section
    fireEvent.click(screen.getByTestId('okf-tab-features'));
    expect(screen.getByText('Technical Features Specification')).toBeInTheDocument();
    expect(screen.getByText('SAP BTP Architecture Icons')).toBeInTheDocument();

    // Navigate to Log & ADRs section
    fireEvent.click(screen.getByTestId('okf-tab-log'));
    expect(screen.getByText('Operational Log & Architectural Decision Records')).toBeInTheDocument();
    expect(screen.getByText('ADR-001: SVG-based Vector Canvas vs HTML5 Canvas')).toBeInTheDocument();

    // Return to Index
    fireEvent.click(screen.getByTestId('okf-tab-index'));
    expect(screen.getByText('Master Index & Architecture Overview')).toBeInTheDocument();
  });
});
