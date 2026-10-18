/**
 * @file CanvasRemoteCursors.tsx
 * @description Isolated real-time collaborator cursor and presence indicators overlay.
 *
 * Performance Architecture (ENG-01):
 * By decoupling remote user cursors into a dedicated memoized layer positioned using HTML/CSS
 * transforms rather than forcing top-level Canvas SVG re-renders, cursor updates at 25-60 FPS
 * do not cause the entire vector DOM tree to re-evaluate or thrash browser layout.
 */

import React from 'react';
import { RemoteUser } from '../../types/whiteboard';

/**
 * Properties for CanvasRemoteCursors.
 */
interface CanvasRemoteCursorsProps {
  /** Array of active collaborators in the room */
  remoteUsers: RemoteUser[];
  /** Current canvas zoom level multiplier */
  zoom: number;
  /** Viewport panning offset */
  pan: { x: number; y: number };
}

/**
 * CanvasRemoteCursors renders presence pointers for active collaborators:
 * - Color-coded pointer arrow matching the user's avatar color
 * - Tooltip name chip displaying collaborator's nickname
 * - Live pulse indicator
 */
export const CanvasRemoteCursors: React.FC<CanvasRemoteCursorsProps> = React.memo(({
  remoteUsers = [],
  zoom,
  pan,
}) => {
  return (
    <>
      {/* 
        Collaborator Cursors Iteration Loop:
        Projects each remote user's whiteboard space coordinates (x, y)
        into screen pixel space using current viewport zoom and pan offsets.
      */}
      {remoteUsers.map((user) => {
        if (!user.cursor) return null;
        // Screen coordinate transform projection
        const screenX = user.cursor.x * zoom + pan.x;
        const screenY = user.cursor.y * zoom + pan.y;

        return (
          <div
            key={user.userId}
            data-testid={`remote-cursor-${user.userId}`}
            data-cursor-user={user.userName}
            aria-label={`Cursor for ${user.userName}`}
            className="absolute pointer-events-none z-50 transition-all duration-75 ease-out select-none"
            style={{
              left: `${screenX}px`,
              top: `${screenY}px`,
            }}
          >
            {/* SVG Cursor Pointer with clear border */}
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill={user.userColor || '#6366f1'}
              stroke="#ffffff"
              strokeWidth="1.5"
              className="drop-shadow-md transform -rotate-12 origin-top-left"
            >
              <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.36z" />
            </svg>

            {/* User Name Badge */}
            <div
              className="absolute left-4 top-3 px-2 py-0.5 rounded-md text-[11px] font-bold text-white whitespace-nowrap shadow-md flex items-center gap-1 border border-white/20"
              style={{ backgroundColor: user.userColor || '#6366f1' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>{user.userName}</span>
            </div>
          </div>
        );
      })}
    </>
  );
});
