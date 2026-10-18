import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BackgroundMenu } from '../../components/header/BackgroundMenu';
import { BackgroundType } from '../../types/whiteboard';

describe('BackgroundMenu Component', () => {
  it('renders background trigger and opens menu', () => {
    const handleChange = vi.fn();
    render(<BackgroundMenu background="blank" onChangeBackground={handleChange} />);

    const button = screen.getByTestId('btn-bg-menu');
    expect(button).toBeInTheDocument();
    expect(screen.queryByTestId('bg-options-menu')).not.toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.getByTestId('bg-options-menu')).toBeInTheDocument();
    expect(screen.getByTestId('bg-option-blank')).toBeInTheDocument();
    expect(screen.getByTestId('bg-option-dots')).toBeInTheDocument();
    expect(screen.getByTestId('bg-option-grid')).toBeInTheDocument();
    expect(screen.getByTestId('bg-option-blueprint')).toBeInTheDocument();
    expect(screen.getByTestId('bg-option-dark')).toBeInTheDocument();
  });

  it('selects a background option, calls callback, and closes menu', () => {
    const handleChange = vi.fn();
    render(<BackgroundMenu background="blank" onChangeBackground={handleChange} />);

    fireEvent.click(screen.getByTestId('btn-bg-menu'));
    fireEvent.click(screen.getByTestId('bg-option-blueprint'));

    expect(handleChange).toHaveBeenCalledWith('blueprint');
    expect(screen.queryByTestId('bg-options-menu')).not.toBeInTheDocument();
  });

  it('closes menu when clicking outside', () => {
    render(
      <div>
        <div data-testid="outside-area">Outside</div>
        <BackgroundMenu background="dots" onChangeBackground={vi.fn()} />
      </div>
    );

    fireEvent.click(screen.getByTestId('btn-bg-menu'));
    expect(screen.getByTestId('bg-options-menu')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside-area'));
    expect(screen.queryByTestId('bg-options-menu')).not.toBeInTheDocument();
  });
});
