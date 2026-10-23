import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BoardsModal } from '../components/BoardsModal';
import { BoardMetadata } from '../types/whiteboard';

describe('BoardsModal Component', () => {
  beforeEach(() => {
    vi.stubGlobal('alert', vi.fn());
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  const mockBoards: BoardMetadata[] = [
    {
      id: 'board-1',
      name: 'Main Board',
      updatedAt: 1704193200000,
      elementCount: 15,
    },
    {
      id: 'board-2',
      name: 'Secondary Board',
      updatedAt: 1704193200000,
      elementCount: 3,
    },
  ];

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <BoardsModal
        isOpen={false}
        onClose={vi.fn()}
        boards={mockBoards}
        currentBoardId="board-1"
        onSelectBoard={vi.fn()}
        onCreateNewBoard={vi.fn()}
        onDeleteBoard={vi.fn()}
        onImportBoard={vi.fn()}
        onExportCurrentJson={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders boards list with current board badge', () => {
    render(
      <BoardsModal
        isOpen={true}
        onClose={vi.fn()}
        boards={mockBoards}
        currentBoardId="board-1"
        onSelectBoard={vi.fn()}
        onCreateNewBoard={vi.fn()}
        onDeleteBoard={vi.fn()}
        onImportBoard={vi.fn()}
        onExportCurrentJson={vi.fn()}
      />
    );

    expect(screen.getByTestId('boards-modal')).toBeInTheDocument();
    expect(screen.getByText('Main Board')).toBeInTheDocument();
    expect(screen.getByText('Secondary Board')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('renders empty message when no boards exist', () => {
    render(
      <BoardsModal
        isOpen={true}
        onClose={vi.fn()}
        boards={[]}
        currentBoardId="board-1"
        onSelectBoard={vi.fn()}
        onCreateNewBoard={vi.fn()}
        onDeleteBoard={vi.fn()}
        onImportBoard={vi.fn()}
        onExportCurrentJson={vi.fn()}
      />
    );

    expect(screen.getByText('No saved whiteboards yet.')).toBeInTheDocument();
  });

  it('selects a different board and closes modal', () => {
    const onSelectBoard = vi.fn();
    const onClose = vi.fn();

    render(
      <BoardsModal
        isOpen={true}
        onClose={onClose}
        boards={mockBoards}
        currentBoardId="board-1"
        onSelectBoard={onSelectBoard}
        onCreateNewBoard={vi.fn()}
        onDeleteBoard={vi.fn()}
        onImportBoard={vi.fn()}
        onExportCurrentJson={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Secondary Board'));
    expect(onSelectBoard).toHaveBeenCalledWith('board-2');
    expect(onClose).toHaveBeenCalled();
  });

  it('does not select or close when clicking the current board', () => {
    const onSelectBoard = vi.fn();
    const onClose = vi.fn();

    render(
      <BoardsModal
        isOpen={true}
        onClose={onClose}
        boards={mockBoards}
        currentBoardId="board-1"
        onSelectBoard={onSelectBoard}
        onCreateNewBoard={vi.fn()}
        onDeleteBoard={vi.fn()}
        onImportBoard={vi.fn()}
        onExportCurrentJson={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Main Board'));
    expect(onSelectBoard).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('deletes board when confirmed', () => {
    const onDeleteBoard = vi.fn();

    render(
      <BoardsModal
        isOpen={true}
        onClose={vi.fn()}
        boards={mockBoards}
        currentBoardId="board-1"
        onSelectBoard={vi.fn()}
        onCreateNewBoard={vi.fn()}
        onDeleteBoard={onDeleteBoard}
        onImportBoard={vi.fn()}
        onExportCurrentJson={vi.fn()}
      />
    );

    const deleteBtn = screen.getByTitle('Delete board');
    fireEvent.click(deleteBtn);
    expect(onDeleteBoard).toHaveBeenCalledWith('board-2');
  });

  it('creates new board from action bar', () => {
    const onCreateNewBoard = vi.fn();
    const onClose = vi.fn();

    render(
      <BoardsModal
        isOpen={true}
        onClose={onClose}
        boards={mockBoards}
        currentBoardId="board-1"
        onSelectBoard={vi.fn()}
        onCreateNewBoard={onCreateNewBoard}
        onDeleteBoard={vi.fn()}
        onImportBoard={vi.fn()}
        onExportCurrentJson={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('btn-modal-new-board'));
    expect(onCreateNewBoard).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('triggers JSON export', () => {
    const onExportCurrentJson = vi.fn();

    render(
      <BoardsModal
        isOpen={true}
        onClose={vi.fn()}
        boards={mockBoards}
        currentBoardId="board-1"
        onSelectBoard={vi.fn()}
        onCreateNewBoard={vi.fn()}
        onDeleteBoard={vi.fn()}
        onImportBoard={vi.fn()}
        onExportCurrentJson={onExportCurrentJson}
      />
    );

    fireEvent.click(screen.getByTestId('btn-export-board'));
    expect(onExportCurrentJson).toHaveBeenCalledTimes(1);
  });

  it('handles JSON file upload with valid board content', async () => {
    const onImportBoard = vi.fn();
    const onClose = vi.fn();

    render(
      <BoardsModal
        isOpen={true}
        onClose={onClose}
        boards={mockBoards}
        currentBoardId="board-1"
        onSelectBoard={vi.fn()}
        onCreateNewBoard={vi.fn()}
        onDeleteBoard={vi.fn()}
        onImportBoard={onImportBoard}
        onExportCurrentJson={vi.fn()}
      />
    );

    const fileInput = screen.getByTestId('input-import-board-file') as HTMLInputElement;
    const file = new File(
      [JSON.stringify({ name: 'Imported Board', elements: [{ id: 'e1', type: 'stroke' }] })],
      'board.json',
      { type: 'application/json' }
    );

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(onImportBoard).toHaveBeenCalledWith({
        name: 'Imported Board',
        elements: [{ id: 'e1', type: 'stroke' }],
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('shows error alert on invalid file format', async () => {
    const onImportBoard = vi.fn();

    render(
      <BoardsModal
        isOpen={true}
        onClose={vi.fn()}
        boards={mockBoards}
        currentBoardId="board-1"
        onSelectBoard={vi.fn()}
        onCreateNewBoard={vi.fn()}
        onDeleteBoard={vi.fn()}
        onImportBoard={onImportBoard}
        onExportCurrentJson={vi.fn()}
      />
    );

    const fileInput = screen.getByTestId('input-import-board-file') as HTMLInputElement;
    const file = new File(
      [JSON.stringify({ invalid: 'format' })],
      'bad.json',
      { type: 'application/json' }
    );

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Invalid AIdboard file format.');
      expect(onImportBoard).not.toHaveBeenCalled();
    });
  });

  it('closes on header close button and footer close button', () => {
    const onClose = vi.fn();

    const { rerender } = render(
      <BoardsModal
        isOpen={true}
        onClose={onClose}
        boards={mockBoards}
        currentBoardId="board-1"
        onSelectBoard={vi.fn()}
        onCreateNewBoard={vi.fn()}
        onDeleteBoard={vi.fn()}
        onImportBoard={vi.fn()}
        onExportCurrentJson={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('btn-close-boards-modal'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('displays the list of saved boards sorted by change date with latest changed at top', () => {
    const unorderedBoards: BoardMetadata[] = [
      { id: 'board-old', name: 'Old Board', updatedAt: 1000, elementCount: 1 },
      { id: 'board-newest', name: 'Newest Board', updatedAt: 5000, elementCount: 4 },
      { id: 'board-middle', name: 'Middle Board', updatedAt: 3000, elementCount: 2 },
    ];

    render(
      <BoardsModal
        isOpen={true}
        onClose={vi.fn()}
        boards={unorderedBoards}
        currentBoardId="board-middle"
        onSelectBoard={vi.fn()}
        onCreateNewBoard={vi.fn()}
        onDeleteBoard={vi.fn()}
        onImportBoard={vi.fn()}
        onExportCurrentJson={vi.fn()}
      />
    );

    const list = screen.getByTestId('boards-list');
    const boardTitles = Array.from(list.querySelectorAll('h4')).map((h) => h.textContent);
    expect(boardTitles).toEqual(['Newest Board', 'Middle Board', 'Old Board']);
  });
});
