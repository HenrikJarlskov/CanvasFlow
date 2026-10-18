/**
 * @file socket.ts
 * @description Real-time WebSocket collaboration client for AIdboard.
 * Manages bidirectional synchronization of whiteboard elements, cursors, presence,
 * operational deltas, and automated exponential backoff reconnection with Full Jitter.
 */

import { BoardElement, RemoteUser } from '../types/whiteboard';

/**
 * Event callbacks dispatched by the WhiteboardSocket client.
 */
export interface SocketEvents {
  /** Triggered when the WebSocket connection is successfully established */
  onConnected?: () => void;
  /** Triggered when the socket disconnects or closes */
  onDisconnected?: () => void;
  /** Receives authoritative room snapshot upon joining */
  onRoomState?: (data: { roomId: string; name: string; elements: BoardElement[]; users: RemoteUser[]; token?: string }) => void;
  /** Triggered when another user enters the room */
  onUserJoined?: (data: { user: RemoteUser; users: RemoteUser[] }) => void;
  /** Triggered when a collaborator disconnects from the room */
  onUserLeft?: (data: { userId: string; users: RemoteUser[] }) => void;
  /** Broadcast of remote user cursor movement */
  onUserCursor?: (data: { userId: string; userName: string; userColor: string; x: number; y: number }) => void;
  /** Authoritative full-array elements update */
  onElementsUpdated?: (data: { elements: BoardElement[]; operation: string; userId: string }) => void;
  /** Fine-grained element delta update (upsert, delete, or patch) */
  onElementDelta?: (data: { op: 'upsert' | 'delete' | 'patch'; element?: BoardElement; elementId?: string; userId: string }) => void;
  /** Board canvas was cleared by an administrator or user */
  onBoardCleared?: (data: { userId: string; userName: string }) => void;
  /** Board was renamed */
  onBoardRenamed?: (data: { name: string }) => void;
  /** Server error notification or validation rejection */
  onError?: (error: string) => void;
}

/** Palette of vibrant presence colors assigned to collaborators */
const USER_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6'
];

/**
 * Retrieves the stored collaborator identity from `localStorage` or generates
 * a friendly random identity (e.g. "Swift Falcon") and color avatar.
 *
 * @returns User identity object containing userId, userName, and userColor
 */
export function getStoredUser() {
  let userId = localStorage.getItem('aidboard_userId');
  let userName = localStorage.getItem('aidboard_userName');
  let userColor = localStorage.getItem('aidboard_userColor');

  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('aidboard_userId', userId);
  }
  if (!userName) {
    const adjectives = ['Creative', 'Swift', 'Bright', 'Clever', 'Agile', 'Bold', 'Curious', 'Keen'];
    const animals = ['Fox', 'Falcon', 'Otter', 'Panda', 'Lynx', 'Dolphin', 'Eagle', 'Badger'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const anim = animals[Math.floor(Math.random() * animals.length)];
    userName = `${adj} ${anim}`;
    localStorage.setItem('aidboard_userName', userName);
  }
  if (!userColor) {
    userColor = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
    localStorage.setItem('aidboard_userColor', userColor);
  }

  return { userId, userName, userColor };
}

/**
 * WhiteboardSocket manages real-time communication with the Express/WebSocket server.
 */
export class WhiteboardSocket {
  private ws: WebSocket | null = null;
  private roomId: string;
  private user = getStoredUser();
  private callbacks: SocketEvents;
  private reconnectTimer: any = null;
  private isDestroyed = false;
  private cursorThrottleTimer: any = null;
  private pendingCursor: { x: number; y: number } | null = null;
  private liveUpdateThrottleTimer: any = null;
  private pendingLiveUpdate: { elements: BoardElement[]; affectedIds?: string[] } | null = null;
  private retryCount = 0;

  /**
   * Initializes and connects the WebSocket client for a specific room.
   *
   * @param roomId - Target whiteboard room ID
   * @param callbacks - Event handlers for received messages
   */
  constructor(roomId: string, callbacks: SocketEvents) {
    this.roomId = roomId;
    this.callbacks = callbacks;
    this.connect();
  }

  /**
   * Computes exponential backoff delay with Full Jitter to eliminate reconnection stampedes (ENG-04).
   *
   * Formula:
   * `temp = min(maxDelay, baseDelay * (1.5 ^ retryCount))`
   * `delay = uniform_random(200ms, temp)`
   *
   * @returns Delay in milliseconds before attempting to reconnect
   */
  public calculateReconnectDelay(): number {
    const base = 1000;
    const max = 30000;
    const temp = Math.min(max, base * Math.pow(1.5, this.retryCount));
    // Full Jitter backoff (ENG-04): uniform random delay between 200ms and temp
    return 200 + Math.floor(Math.random() * (temp - 200));
  }

  /**
   * Returns current count of consecutive reconnection attempts.
   */
  public getRetryCount(): number {
    return this.retryCount;
  }

  /**
   * Establishes the WebSocket connection and configures event listeners.
   */
  public connect() {
    if (this.isDestroyed) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      this.ws = new WebSocket(wsUrl);

      // Connection opened
      this.ws.onopen = () => {
        this.retryCount = 0;
        this.callbacks.onConnected?.();
        // Send initial room join handshake
        this.send('join_room', {
          roomId: this.roomId,
          userId: this.user.userId,
          userName: this.user.userName,
          userColor: this.user.userColor,
        });
      };

      // Message dispatcher loop
      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const { type, payload } = msg;

          switch (type) {
            case 'room_state':
              this.callbacks.onRoomState?.(payload);
              break;
            case 'user_joined':
              this.callbacks.onUserJoined?.(payload);
              break;
            case 'user_left':
              this.callbacks.onUserLeft?.(payload);
              break;
            case 'user_cursor':
              this.callbacks.onUserCursor?.(payload);
              break;
            case 'elements_updated':
              this.callbacks.onElementsUpdated?.(payload);
              break;
            case 'element_delta':
              this.callbacks.onElementDelta?.(payload);
              break;
            case 'board_cleared':
              this.callbacks.onBoardCleared?.(payload);
              break;
            case 'board_renamed':
              this.callbacks.onBoardRenamed?.(payload);
              break;
            case 'error':
              this.callbacks.onError?.(msg.message || payload?.message || 'Server error');
              break;
          }
        } catch (e) {
          console.error('Socket message parse error:', e);
        }
      };

      // Connection closed
      this.ws.onclose = () => {
        this.callbacks.onDisconnected?.();
        if (!this.isDestroyed) {
          const delay = this.calculateReconnectDelay();
          this.retryCount++;
          this.reconnectTimer = setTimeout(() => this.connect(), delay);
        }
      };

      // Error handler
      this.ws.onerror = (err) => {
        console.warn('WebSocket error, reconnecting...', err);
        this.ws?.close();
      };
    } catch (e) {
      console.error('WebSocket connection setup failed:', e);
      if (!this.isDestroyed) {
        const delay = this.calculateReconnectDelay();
        this.retryCount++;
        this.reconnectTimer = setTimeout(() => this.connect(), delay);
      }
    }
  }

  /**
   * Low-level helper to transmit a JSON payload over the socket.
   *
   * @param type - Message event name
   * @param payload - Message data object
   */
  public send(type: string, payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  /**
   * Throttles cursor position broadcasts to 25 FPS (40ms interval) to avoid network congestion.
   *
   * Throttling Loop Explanation:
   * Stashes latest cursor coordinates in `pendingCursor`. If a timer is already active,
   * skips immediate transmission; once the 40ms timer fires, transmits the most recent coordinate.
   *
   * @param x - Canvas relative X coordinate
   * @param y - Canvas relative Y coordinate
   */
  public sendCursor(x: number, y: number) {
    this.pendingCursor = { x, y };
    if (!this.cursorThrottleTimer) {
      this.cursorThrottleTimer = setTimeout(() => {
        if (this.pendingCursor) {
          this.send('cursor_move', this.pendingCursor);
          this.pendingCursor = null;
        }
        this.cursorThrottleTimer = null;
      }, 40);
    }
  }

  /**
   * Transmits full elements array update to the server.
   *
   * @param elements - Complete array of elements
   * @param operation - Operation type descriptor (e.g. 'draw', 'delete', 'move')
   * @param affectedElements - Optional subset of elements directly mutated
   */
  public sendElementsChange(elements: BoardElement[], operation = 'update', affectedElements?: BoardElement[]) {
    this.send('elements_change', {
      elements,
      operation,
      affectedElements,
      actionUserId: this.user.userId,
    });
  }

  /**
   * Throttles high-frequency live element movements (e.g. active dragging/resizing)
   * to ~30 FPS (35ms interval) to prevent socket buffer saturation.
   *
   * @param elements - Complete updated elements array
   * @param affectedIds - Optional IDs of mutated elements
   */
  public sendElementsLiveUpdate(elements: BoardElement[], affectedIds?: string[]) {
    this.pendingLiveUpdate = { elements, affectedIds };
    if (!this.liveUpdateThrottleTimer) {
      this.liveUpdateThrottleTimer = setTimeout(() => {
        if (this.pendingLiveUpdate) {
          this.send('elements_change', {
            elements: this.pendingLiveUpdate.elements,
            operation: 'move_live',
            affectedIds: this.pendingLiveUpdate.affectedIds,
            actionUserId: this.user.userId,
          });
          this.pendingLiveUpdate = null;
        }
        this.liveUpdateThrottleTimer = null;
      }, 35);
    }
  }

  /**
   * Transmits a fine-grained element delta (upsert, delete, or patch) to eliminate
   * quadratic array overwrites and reduce network bandwidth by >95% (ARC-01, ARC-03).
   *
   * @param op - Delta operation ('upsert' | 'delete' | 'patch')
   * @param element - Full element object for upsert
   * @param elementId - Target element ID for delete or patch
   * @param patch - Partial fields to update for patch
   */
  public sendElementDelta(
    op: 'upsert' | 'delete' | 'patch',
    element?: BoardElement,
    elementId?: string,
    patch?: Partial<BoardElement>
  ) {
    this.send('element_delta', {
      op,
      element,
      elementId: elementId || element?.id,
      patch,
      userId: this.user.userId,
    });
  }

  /**
   * Requests clearing all elements on the whiteboard.
   */
  public sendClear() {
    this.send('clear_board', {});
  }

  /**
   * Broadcasts a new board title to all connected collaborators.
   *
   * @param name - New board name
   */
  public sendRename(name: string) {
    this.send('rename_board', { name });
  }

  /**
   * Updates the current collaborator's display nickname and persists to local storage.
   *
   * @param newName - Updated nickname
   */
  public setUserName(newName: string) {
    this.user.userName = newName;
    localStorage.setItem('aidboard_userName', newName);
  }

  /**
   * Returns current user identity metadata.
   */
  public getUser() {
    return this.user;
  }

  /**
   * Gracefully destroys the socket instance and clears all active timers.
   */
  public destroy() {
    this.isDestroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.cursorThrottleTimer) clearTimeout(this.cursorThrottleTimer);
    if (this.liveUpdateThrottleTimer) clearTimeout(this.liveUpdateThrottleTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
