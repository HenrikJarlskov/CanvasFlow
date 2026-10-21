import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from '../App';
import i18n from '../i18n';

describe('Color Selection & Toolbar Cleanup Verification', () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage('en');
    vi.clearAllMocks();
  });

  it('updates selected element color when clicking a color in the toolbar popover', async () => {
    render(<App />);

    // Verify 5 quick color buttons are NOT displayed in toolbar to keep it clean and compact
    expect(screen.queryByTestId('quick-color-#2563eb')).toBeNull();

    // Draw a rectangle element using shape tool
    fireEvent.click(screen.getByTestId('tool-shape-menu'));
    fireEvent.click(screen.getByTestId('shape-rectangle'));

    const canvas = screen.getByTestId('whiteboard-svg');

    // Simulate pointer drag on canvas to create a rectangle
    fireEvent.pointerDown(canvas, { clientX: 200, clientY: 200, buttons: 1 });
    fireEvent.pointerMove(canvas, { clientX: 350, clientY: 350, buttons: 1 });
    fireEvent.pointerUp(canvas, { clientX: 350, clientY: 350, buttons: 1 });

    // Switch to select tool
    fireEvent.click(screen.getByTestId('tool-select'));

    // Click on the created shape to select it
    fireEvent.pointerDown(canvas, { clientX: 250, clientY: 250, buttons: 1 });
    fireEvent.pointerUp(canvas, { clientX: 250, clientY: 250, buttons: 1 });

    // Click current color button to open standard color picker popover
    fireEvent.click(screen.getByTestId('color-picker-btn'));
    expect(screen.getByTestId('color-picker-popover')).toBeInTheDocument();

    // Pick blue swatch (#2563eb)
    fireEvent.click(screen.getByTestId('color-swatch-#2563eb'));

    // Verify the SVG rect now has blue stroke color
    const rect = canvas.querySelector('rect:not([data-testid="grid-pattern-rect"])');
    expect(rect).toHaveAttribute('stroke', '#2563eb');

    // Open color picker again and pick red swatch (#dc2626)
    fireEvent.click(screen.getByTestId('color-picker-btn'));
    fireEvent.click(screen.getByTestId('color-swatch-#dc2626'));
    expect(rect).toHaveAttribute('stroke', '#dc2626');
  });

  it('updates selected element stroke width when clicking a thickness in the stroke width popover', async () => {
    render(<App />);

    // Draw a circle element
    fireEvent.click(screen.getByTestId('tool-shape-menu'));
    fireEvent.click(screen.getByTestId('shape-circle'));

    const canvas = screen.getByTestId('whiteboard-svg');
    fireEvent.pointerDown(canvas, { clientX: 200, clientY: 200, buttons: 1 });
    fireEvent.pointerMove(canvas, { clientX: 350, clientY: 350, buttons: 1 });
    fireEvent.pointerUp(canvas, { clientX: 350, clientY: 350, buttons: 1 });

    // Switch to select tool and select the circle
    fireEvent.click(screen.getByTestId('tool-select'));
    fireEvent.pointerDown(canvas, { clientX: 250, clientY: 250, buttons: 1 });
    fireEvent.pointerUp(canvas, { clientX: 250, clientY: 250, buttons: 1 });

    // Click single stroke width button to open popover
    fireEvent.click(screen.getByTestId('stroke-width-btn'));
    expect(screen.getByTestId('stroke-width-popover')).toBeInTheDocument();

    // Click thick stroke width (8px)
    fireEvent.click(screen.getByTestId('stroke-width-8'));

    const ellipse = canvas.querySelector('ellipse');
    expect(ellipse).toHaveAttribute('stroke-width', '8');
  });

  it('reacts and opens dropdown menu when clicking shape icon, allowing selection of shapes', () => {
    render(<App />);

    const shapeBtn = screen.getByTestId('tool-shape-menu');
    expect(shapeBtn).toBeInTheDocument();

    // Click to open shape dropdown menu
    fireEvent.click(shapeBtn);
    const dropdown = screen.getByTestId('shape-dropdown-menu');
    expect(dropdown).toBeInTheDocument();

    // Check all shape options exist
    expect(screen.getByTestId('shape-rectangle')).toBeInTheDocument();
    expect(screen.getByTestId('shape-circle')).toBeInTheDocument();
    expect(screen.getByTestId('shape-triangle')).toBeInTheDocument();
    expect(screen.getByTestId('shape-arrow')).toBeInTheDocument();
    expect(screen.getByTestId('shape-line')).toBeInTheDocument();

    // Select circle
    fireEvent.click(screen.getByTestId('shape-circle'));
    expect(screen.queryByTestId('shape-dropdown-menu')).toBeNull();
  });

  it('eliminates duplicate AI and Import tools from floating toolbar while preserving Header buttons', () => {
    render(<App />);

    // Header MUST have Import and AI Drawing
    expect(screen.getByTestId('btn-header-import')).toBeInTheDocument();
    expect(screen.getByTestId('btn-header-ai-draw')).toBeInTheDocument();

    // Floating toolbar MUST NOT have duplicate Import or AI Drawing buttons
    const primaryToolbar = screen.getByTestId('primary-toolbar');
    expect(primaryToolbar.querySelector('[data-testid="tool-import"]')).toBeNull();
    expect(primaryToolbar.querySelector('[data-testid="tool-ai-draw"]')).toBeNull();
  });

  it('calls Danish language by its full name "Danish" and not abbreviation "DA"', async () => {
    render(<App />);

    const langBtn = screen.getByTestId('btn-language-menu');
    // Initially English
    expect(langBtn).toHaveTextContent(/English/i);

    // Switch to Danish
    fireEvent.click(langBtn);
    const daOption = screen.getByTestId('language-option-da');
    expect(daOption).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(daOption);
    });

    // The button must display the full name "Danish", NOT the abbreviation "DA"
    const updatedLangBtn = screen.getByTestId('btn-language-menu');
    expect(updatedLangBtn).toHaveTextContent(/Danish/i);
    expect(updatedLangBtn.textContent?.trim()).not.toBe('DA');
  });
});
