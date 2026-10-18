/**
 * @file useTouchGestures.ts
 * @description Multi-touch pinch-to-zoom and two-finger pan gestures hook for mobile/tablet screens.
 * Tracks multi-pointer touches in a local touch map, calculating Euclidean distance ratios
 * and midpoint displacement deltas to update canvas camera zoom and pan coordinates smoothly.
 */

import { useRef } from 'react';

/**
 * Configuration options for touch gesture handling.
 */
interface UseTouchGesturesOptions {
  /** Current camera magnification scale */
  zoom: number;
  /** Current camera 2D offset */
  pan: { x: number; y: number };
  /** Callback fired to update zoom scale */
  onZoomChange: (zoom: number) => void;
  /** Callback fired to update pan offset */
  onPanChange: (pan: { x: number; y: number }) => void;
}

/**
 * Hook detecting two-finger multi-touch gestures on touch screens.
 *
 * @param options Configuration for zoom/pan callbacks
 * @returns Object providing `handleTouchDown`, `handleTouchMove`, and `handleTouchUp`
 */
export function useTouchGestures({
  zoom,
  pan,
  onZoomChange,
  onPanChange,
}: UseTouchGesturesOptions) {
  const touchMapRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);
  const pinchMidpointRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch') return false;

    touchMapRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touchMapRef.current.size === 2) {
      const touches = Array.from(touchMapRef.current.values());
      const dist = Math.hypot(touches[0].x - touches[1].x, touches[0].y - touches[1].y);
      pinchStartDistRef.current = dist;
      pinchStartZoomRef.current = zoom;
      pinchMidpointRef.current = {
        x: (touches[0].x + touches[1].x) / 2,
        y: (touches[0].y + touches[1].y) / 2,
      };
      return true; // indicates multi-touch gesture active
    }
    return false;
  };

  const handleTouchMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch' || !touchMapRef.current.has(e.pointerId)) return false;

    touchMapRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touchMapRef.current.size === 2 && pinchStartDistRef.current && pinchMidpointRef.current) {
      const touches = Array.from(touchMapRef.current.values());
      const currentDist = Math.hypot(touches[0].x - touches[1].x, touches[0].y - touches[1].y);
      const currentMid = {
        x: (touches[0].x + touches[1].x) / 2,
        y: (touches[0].y + touches[1].y) / 2,
      };

      const scaleChange = currentDist / pinchStartDistRef.current;
      const newZoom = Math.min(3.5, Math.max(0.2, pinchStartZoomRef.current * scaleChange));
      const deltaX = currentMid.x - pinchMidpointRef.current.x;
      const deltaY = currentMid.y - pinchMidpointRef.current.y;

      onZoomChange(newZoom);
      onPanChange({
        x: pan.x + deltaX,
        y: pan.y + deltaY,
      });
      pinchMidpointRef.current = currentMid;
      return true; // handled multi-touch gesture
    }
    return false;
  };

  const handleTouchUp = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch') return;
    touchMapRef.current.delete(e.pointerId);
    if (touchMapRef.current.size < 2) {
      pinchStartDistRef.current = null;
      pinchMidpointRef.current = null;
    }
  };

  return {
    handleTouchDown,
    handleTouchMove,
    handleTouchUp,
    activeTouchesCount: touchMapRef.current.size,
  };
}
