import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { OkfViewer } from '../../components/okf/OkfViewer';

describe('OkfViewer Component', () => {
  it('renders all benchmark metrics in top banner', () => {
    render(<OkfViewer />);

    expect(screen.getByTestId('okf-viewer')).toBeInTheDocument();
    expect(screen.getByText(/OKF Bundle v2\./)).toBeInTheDocument();
    expect(screen.getByText('755.3 req/s')).toBeInTheDocument();
    expect(screen.getByText('1.94 ms p95')).toBeInTheDocument();
    expect(screen.getByText('27,675 ops/s')).toBeInTheDocument();
    expect(screen.getByText('278 / 278 Pass')).toBeInTheDocument();
  });

  it('navigates through all sections and copies file paths', () => {
    // Mock navigator.clipboard
    const writeText = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText,
      },
    });

    render(<OkfViewer />);

    // Click Deployment
    fireEvent.click(screen.getByTestId('okf-tab-deployment'));
    expect(screen.getByText('Deployment & Security Operations')).toBeInTheDocument();

    // Copy path
    const copyDeploymentBtn = screen.getByText('docs/okf/deployment.md');
    fireEvent.click(copyDeploymentBtn);
    expect(writeText).toHaveBeenCalledWith('docs/okf/deployment.md');

    // Click Testing
    fireEvent.click(screen.getByTestId('okf-tab-testing'));
    expect(screen.getByText('Test Suite, Performance & Scalability Results')).toBeInTheDocument();
    expect(screen.getByText('WebSocket 60-Peer Latency')).toBeInTheDocument();

    // Click Features
    fireEvent.click(screen.getByTestId('okf-tab-features'));
    expect(screen.getByText('Technical Features Specification')).toBeInTheDocument();
    expect(screen.getByText(/SAP Architecture Vector Icons/)).toBeInTheDocument();

    // Click Log
    fireEvent.click(screen.getByTestId('okf-tab-log'));
    expect(screen.getByText('Operational Log & Architectural Decision Records')).toBeInTheDocument();
    expect(screen.getByText('ADR-003: Sub-40ms Client Pointer Throttling')).toBeInTheDocument();

    // Click Improvements
    fireEvent.click(screen.getByTestId('okf-tab-improvements'));
    expect(screen.getByTestId('okf-improvements-section')).toBeInTheDocument();
    expect(screen.getByText('Tier 1: Critical Impact')).toBeInTheDocument();
    expect(screen.getByText('SEC-01: Unauthenticated WebSocket Room Joining & ID Tampering')).toBeInTheDocument();
    expect(screen.getByText('Tier 2: High Impact')).toBeInTheDocument();

    // Copy improvements path
    const copyImprovementsBtn = screen.getByText('docs/okf/improvements.md');
    fireEvent.click(copyImprovementsBtn);
    expect(writeText).toHaveBeenCalledWith('docs/okf/improvements.md');

    // Return to Index
    fireEvent.click(screen.getByTestId('okf-tab-index'));
    expect(screen.getByText('Master Index & Architecture Overview')).toBeInTheDocument();
  });
});
