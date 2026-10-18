import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ExportMenu } from '../../components/header/ExportMenu';

describe('ExportMenu Component', () => {
  it('renders export button and toggle opens menu', () => {
    const onExportPNG = vi.fn();
    const onExportPDF = vi.fn();
    const onExportSVG = vi.fn();

    render(
      <ExportMenu
        onExportPNG={onExportPNG}
        onExportPDF={onExportPDF}
        onExportSVG={onExportSVG}
      />
    );

    const menuButton = screen.getByTestId('btn-export-menu');
    expect(menuButton).toBeInTheDocument();
    expect(screen.queryByTestId('export-dropdown-menu')).not.toBeInTheDocument();

    fireEvent.click(menuButton);
    expect(screen.getByTestId('export-dropdown-menu')).toBeInTheDocument();
    expect(screen.getByTestId('btn-export-png')).toBeInTheDocument();
    expect(screen.getByTestId('btn-export-pdf')).toBeInTheDocument();
    expect(screen.getByTestId('btn-export-svg')).toBeInTheDocument();
  });

  it('triggers onExportPNG and closes dropdown', () => {
    const onExportPNG = vi.fn();
    render(
      <ExportMenu
        onExportPNG={onExportPNG}
        onExportPDF={vi.fn()}
        onExportSVG={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('btn-export-menu'));
    fireEvent.click(screen.getByTestId('btn-export-png'));

    expect(onExportPNG).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('export-dropdown-menu')).not.toBeInTheDocument();
  });

  it('triggers onExportPDF and closes dropdown', () => {
    const onExportPDF = vi.fn();
    render(
      <ExportMenu
        onExportPNG={vi.fn()}
        onExportPDF={onExportPDF}
        onExportSVG={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('btn-export-menu'));
    fireEvent.click(screen.getByTestId('btn-export-pdf'));

    expect(onExportPDF).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('export-dropdown-menu')).not.toBeInTheDocument();
  });

  it('triggers onExportSVG and closes dropdown', () => {
    const onExportSVG = vi.fn();
    render(
      <ExportMenu
        onExportPNG={vi.fn()}
        onExportPDF={vi.fn()}
        onExportSVG={onExportSVG}
      />
    );

    fireEvent.click(screen.getByTestId('btn-export-menu'));
    fireEvent.click(screen.getByTestId('btn-export-svg'));

    expect(onExportSVG).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('export-dropdown-menu')).not.toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', () => {
    render(
      <div>
        <div data-testid="outside-element">Outside</div>
        <ExportMenu
          onExportPNG={vi.fn()}
          onExportPDF={vi.fn()}
          onExportSVG={vi.fn()}
        />
      </div>
    );

    fireEvent.click(screen.getByTestId('btn-export-menu'));
    expect(screen.getByTestId('export-dropdown-menu')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside-element'));
    expect(screen.queryByTestId('export-dropdown-menu')).not.toBeInTheDocument();
  });
});
