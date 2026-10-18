import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ShareModal } from '../components/ShareModal';
import { RemoteUser } from '../types/whiteboard';

describe('ShareModal Component', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  const currentUser = {
    userId: 'me',
    userName: 'Designer Alex',
    userColor: '#2563eb',
  };

  const connectedUsers: RemoteUser[] = [
    {
      userId: 'user-2',
      userName: 'Taylor Guest',
      userColor: '#059669',
      cursor: undefined,
    },
  ];

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ShareModal
        isOpen={false}
        onClose={vi.fn()}
        roomId="room-abc"
        connectedUsers={connectedUsers}
        currentUser={currentUser}
        onUpdateUserName={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders room URL and copies to clipboard', () => {
    render(
      <ShareModal
        isOpen={true}
        onClose={vi.fn()}
        roomId="room-xyz"
        connectedUsers={connectedUsers}
        currentUser={currentUser}
        onUpdateUserName={vi.fn()}
      />
    );

    const input = screen.getByTestId('input-share-url') as HTMLInputElement;
    expect(input.value).toContain('room=room-xyz');

    const copyBtn = screen.getByTestId('btn-copy-share-url');
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(input.value);
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('allows user to change and save display name', () => {
    const onUpdateUserName = vi.fn();

    render(
      <ShareModal
        isOpen={true}
        onClose={vi.fn()}
        roomId="room-xyz"
        connectedUsers={connectedUsers}
        currentUser={currentUser}
        onUpdateUserName={onUpdateUserName}
      />
    );

    const changeBtn = screen.getByTestId('btn-change-username');
    fireEvent.click(changeBtn);

    const nameInput = screen.getByTestId('input-username');
    expect(nameInput).toHaveValue('Designer Alex');

    // Empty save does not update
    fireEvent.change(nameInput, { target: { value: '   ' } });
    fireEvent.click(screen.getByTestId('btn-save-username'));
    expect(onUpdateUserName).not.toHaveBeenCalled();

    // Valid save updates
    fireEvent.change(nameInput, { target: { value: 'Lead Architect' } });
    fireEvent.click(screen.getByTestId('btn-save-username'));
    expect(onUpdateUserName).toHaveBeenCalledWith('Lead Architect');
  });

  it('renders connected collaborators list and closes modal', () => {
    const onClose = vi.fn();

    render(
      <ShareModal
        isOpen={true}
        onClose={onClose}
        roomId="room-xyz"
        connectedUsers={connectedUsers}
        currentUser={currentUser}
        onUpdateUserName={vi.fn()}
      />
    );

    expect(screen.getByText('Taylor Guest')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('btn-close-share-modal'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Done'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
