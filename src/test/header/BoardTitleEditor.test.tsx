import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BoardTitleEditor } from '../../components/header/BoardTitleEditor';

describe('BoardTitleEditor Component', () => {
  it('renders board title in read mode with rename trigger', () => {
    const handleRename = vi.fn();
    render(<BoardTitleEditor boardName="My Project Diagram" onRenameBoard={handleRename} />);

    const button = screen.getByTestId('header-board-title');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('My Project Diagram');
  });

  it('switches to editing mode on click and submits on form submit', () => {
    const handleRename = vi.fn();
    render(<BoardTitleEditor boardName="Initial Name" onRenameBoard={handleRename} />);

    fireEvent.click(screen.getByTestId('header-board-title'));

    const input = screen.getByTestId('header-title-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('Initial Name');

    fireEvent.change(input, { target: { value: 'Updated Whiteboard' } });
    fireEvent.click(screen.getByTestId('header-title-save'));

    expect(handleRename).toHaveBeenCalledWith('Updated Whiteboard');
    // Switched back to read mode
    expect(screen.queryByTestId('header-title-input')).not.toBeInTheDocument();
  });

  it('submits on blur if input is not empty', () => {
    const handleRename = vi.fn();
    render(<BoardTitleEditor boardName="Board One" onRenameBoard={handleRename} />);

    fireEvent.click(screen.getByTestId('header-board-title'));
    const input = screen.getByTestId('header-title-input');

    fireEvent.change(input, { target: { value: 'Blurred Name' } });
    fireEvent.blur(input);

    expect(handleRename).toHaveBeenCalledWith('Blurred Name');
  });

  it('does not submit if input is empty or whitespace', () => {
    const handleRename = vi.fn();
    render(<BoardTitleEditor boardName="Board One" onRenameBoard={handleRename} />);

    fireEvent.click(screen.getByTestId('header-board-title'));
    const input = screen.getByTestId('header-title-input');

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByTestId('header-title-save'));

    expect(handleRename).not.toHaveBeenCalled();
    expect(screen.getByTestId('header-title-input')).toBeInTheDocument();
  });

  it('updates title input when boardName prop changes', () => {
    const { rerender } = render(
      <BoardTitleEditor boardName="Original" onRenameBoard={vi.fn()} />
    );
    expect(screen.getByTestId('header-board-title')).toHaveTextContent('Original');

    rerender(<BoardTitleEditor boardName="Prop Changed" onRenameBoard={vi.fn()} />);
    expect(screen.getByTestId('header-board-title')).toHaveTextContent('Prop Changed');
  });
});
