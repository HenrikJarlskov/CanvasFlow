import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CanvasRemoteCursors } from '../../components/canvas/CanvasRemoteCursors';
import { RemoteUser } from '../../types/whiteboard';

describe('CanvasRemoteCursors Component', () => {
  it('renders nothing when remoteUsers list is empty or users have no cursor', () => {
    const users: RemoteUser[] = [
      {
        userId: 'u1',
        userName: 'Alice',
        userColor: '#2563eb',
        cursor: undefined,
      },
    ];

    const { container } = render(
      <CanvasRemoteCursors remoteUsers={users} zoom={1} pan={{ x: 0, y: 0 }} />
    );

    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  it('renders remote cursor badge with correct position and color', () => {
    const users: RemoteUser[] = [
      {
        userId: 'u2',
        userName: 'Bob Smith',
        userColor: '#dc2626',
        cursor: { x: 100, y: 150 },
      },
    ];

    render(
      <CanvasRemoteCursors remoteUsers={users} zoom={1.5} pan={{ x: 50, y: 20 }} />
    );

    const badge = screen.getByText('Bob Smith');
    expect(badge).toBeInTheDocument();
    expect(badge.parentElement).toHaveStyle({ backgroundColor: '#dc2626' });

    const cursorContainer = screen.getByTestId('remote-cursor-u2');
    expect(cursorContainer).toBeInTheDocument();
    expect(cursorContainer).toHaveAttribute('aria-label', 'Cursor for Bob Smith');
    expect(cursorContainer).toHaveStyle({
      left: '200px',
      top: '245px',
    });
  });
});
