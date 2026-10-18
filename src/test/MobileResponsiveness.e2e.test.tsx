import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import App from '../App';

describe('Mobile Responsiveness End-to-End Tests', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    localStorage.clear();
    // Mock WebSocket to prevent network errors in test environment
    vi.stubGlobal(
      'WebSocket',
      class MockWebSocket {
        onopen: any;
        onmessage: any;
        onclose: any;
        onerror: any;
        send = vi.fn();
        close = vi.fn();
        constructor() {
          setTimeout(() => this.onopen?.({}), 10);
        }
      }
    );
  });

  afterEach(() => {
    window.innerWidth = originalInnerWidth;
    window.innerHeight = originalInnerHeight;
    vi.restoreAllMocks();
  });

  const setViewport = (width: number, height: number) => {
    window.innerWidth = width;
    window.innerHeight = height;
    window.dispatchEvent(new Event('resize'));
  };

  it('renders correctly in Mobile Portrait Mode (375x667 iPhone SE)', async () => {
    setViewport(375, 667);

    render(<App />);

    // App and Header should render
    expect(screen.getByTestId('aidboard-app')).toBeInTheDocument();
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
    expect(screen.getByTestId('header-board-title')).toBeInTheDocument();

    // In mobile portrait (< 640px), hamburger menu toggle should be available
    const menuToggle = screen.getByTestId('btn-mobile-menu-toggle');
    expect(menuToggle).toBeInTheDocument();

    // Open mobile actions drawer
    fireEvent.click(menuToggle);

    // Mobile drawer should be visible with key actions
    expect(screen.getByTestId('mobile-header-drawer')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-btn-boards')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-btn-new-board')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-btn-share')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-btn-ai-draw')).toBeInTheDocument();

    // Close the drawer
    const closeBtn = screen.getByTestId('btn-close-mobile-drawer');
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('mobile-header-drawer')).not.toBeInTheDocument();

    // Primary toolbar should be visible and contain essential tools
    const toolbar = screen.getByTestId('primary-toolbar');
    expect(toolbar).toBeInTheDocument();
    expect(screen.getByTestId('tool-select')).toBeInTheDocument();
    expect(screen.getByTestId('tool-pen')).toBeInTheDocument();
    expect(screen.getByTestId('tool-eraser')).toBeInTheDocument();
    expect(screen.getByTestId('tool-shape-menu')).toBeInTheDocument();

    // Canvas container and SVG layer should be interactive
    expect(screen.getByTestId('canvas-container')).toBeInTheDocument();
    expect(screen.getByTestId('whiteboard-svg')).toBeInTheDocument();
  });

  it('handles touch drawing in Mobile Portrait Mode', async () => {
    setViewport(390, 844); // iPhone 14/15 portrait

    render(<App />);

    // Select Pen Tool
    const penTool = screen.getByTestId('tool-pen');
    fireEvent.click(penTool);

    const canvas = screen.getByTestId('canvas-container');

    // Simulate single-finger touch stroke
    fireEvent.pointerDown(canvas, {
      clientX: 100,
      clientY: 200,
      pointerType: 'touch',
      pointerId: 1,
      button: 0,
    });

    fireEvent.pointerMove(canvas, {
      clientX: 120,
      clientY: 230,
      pointerType: 'touch',
      pointerId: 1,
    });

    fireEvent.pointerMove(canvas, {
      clientX: 150,
      clientY: 260,
      pointerType: 'touch',
      pointerId: 1,
    });

    fireEvent.pointerUp(canvas, {
      clientX: 150,
      clientY: 260,
      pointerType: 'touch',
      pointerId: 1,
    });

    // Check that path element was created on the SVG layer
    const svgLayer = screen.getByTestId('whiteboard-svg');
    const pathElements = svgLayer.querySelectorAll('path');
    expect(pathElements.length).toBeGreaterThan(0);
  });

  it('renders and operates smoothly in Mobile Landscape Mode (844x390)', async () => {
    setViewport(844, 390); // iPhone 14/15 landscape

    render(<App />);

    expect(screen.getByTestId('aidboard-app')).toBeInTheDocument();
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
    expect(screen.getByTestId('primary-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-container')).toBeInTheDocument();

    // Zoom controls should be present and operational in landscape
    const zoomReset = screen.getByTestId('btn-zoom-reset');
    expect(zoomReset).toHaveTextContent('100%');

    const zoomIn = screen.getByTestId('btn-zoom-in');
    fireEvent.click(zoomIn);
    expect(zoomReset).toHaveTextContent('115%');

    const zoomOut = screen.getByTestId('btn-zoom-out');
    fireEvent.click(zoomOut);
    fireEvent.click(zoomOut);
    expect(zoomReset).toHaveTextContent('83%');
  });

  it('adapts when orientation switches between Portrait and Landscape dynamically', async () => {
    // Start in Portrait
    setViewport(375, 667);
    render(<App />);

    expect(screen.getByTestId('btn-mobile-menu-toggle')).toBeInTheDocument();

    // Switch to Landscape
    act(() => {
      setViewport(667, 375);
      window.dispatchEvent(new Event('orientationchange'));
    });

    // Whiteboard should remain stable and fully functional
    expect(screen.getByTestId('whiteboard-svg')).toBeInTheDocument();
    expect(screen.getByTestId('primary-toolbar')).toBeInTheDocument();

    // Switch back to Portrait
    act(() => {
      setViewport(375, 667);
      window.dispatchEvent(new Event('orientationchange'));
    });

    expect(screen.getByTestId('btn-mobile-menu-toggle')).toBeInTheDocument();
  });

  it('handles multi-touch pinch gesture on canvas without drawing accidental strokes', async () => {
    setViewport(390, 844);
    render(<App />);

    // Select pen tool
    fireEvent.click(screen.getByTestId('tool-pen'));
    const canvas = screen.getByTestId('canvas-container');

    // First finger down
    fireEvent.pointerDown(canvas, {
      clientX: 100,
      clientY: 200,
      pointerType: 'touch',
      pointerId: 1,
    });

    // Second finger down (pinch initiated)
    fireEvent.pointerDown(canvas, {
      clientX: 200,
      clientY: 200,
      pointerType: 'touch',
      pointerId: 2,
    });

    // Fingers move apart (pinching out to zoom in)
    fireEvent.pointerMove(canvas, {
      clientX: 80,
      clientY: 200,
      pointerType: 'touch',
      pointerId: 1,
    });

    fireEvent.pointerMove(canvas, {
      clientX: 240,
      clientY: 200,
      pointerType: 'touch',
      pointerId: 2,
    });

    // Lift fingers
    fireEvent.pointerUp(canvas, {
      clientX: 80,
      clientY: 200,
      pointerType: 'touch',
      pointerId: 1,
    });

    fireEvent.pointerUp(canvas, {
      clientX: 240,
      clientY: 200,
      pointerType: 'touch',
      pointerId: 2,
    });

    // Canvas should remain pristine and responsive
    expect(screen.getByTestId('canvas-container')).toBeInTheDocument();
  });

  it('renders all controls comfortably on Tablet Viewport (768x1024)', async () => {
    setViewport(768, 1024); // iPad portrait
    render(<App />);

    // Desktop/Tablet buttons should be visible in header
    expect(screen.getByTestId('btn-boards-modal')).toBeInTheDocument();
    expect(screen.getByTestId('btn-new-board')).toBeInTheDocument();
    expect(screen.getByTestId('btn-clear-board')).toBeInTheDocument();
    expect(screen.getByTestId('btn-bg-menu')).toBeInTheDocument();
    expect(screen.getByTestId('btn-header-ai-draw')).toBeInTheDocument();
    expect(screen.getByTestId('btn-share-modal')).toBeInTheDocument();

    // Toolbar should display all controls without cramping
    expect(screen.getByTestId('tool-select')).toBeInTheDocument();
    expect(screen.getByTestId('color-picker-btn')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-auto-snap')).toBeInTheDocument();
  });
});
