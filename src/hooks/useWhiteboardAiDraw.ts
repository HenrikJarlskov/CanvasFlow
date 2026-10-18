/**
 * @file useWhiteboardAiDraw.ts
 * @description React hook managing Gemini AI diagram synthesis requests.
 * Handles viewport center coordinate calculation, fetch abort controllers for cancellation,
 * loading state indicators, canvas insertion, and automatic element selection.
 */

import { useState, useRef, useCallback } from 'react';
import { BoardElement } from '../types/whiteboard';

/**
 * Manages Gemini diagram generation requests and modal UI state.
 *
 * @param elements Current board elements
 * @param pan Current camera 2D translation offset
 * @param zoom Current camera scale
 * @param onElementsChange Canvas state mutation callback
 * @param setSelectedIds Selection setter to highlight generated shapes
 * @param setSnapToast Notification toast trigger
 */
export function useWhiteboardAiDraw(
  elements: BoardElement[],
  pan: { x: number; y: number },
  zoom: number,
  onElementsChange: (elements: BoardElement[], operation?: string) => void,
  setSelectedIds: (ids: string[]) => void,
  setSnapToast: (msg: string | null) => void
) {
  const [isAiDrawOpen, setIsAiDrawOpen] = useState(false);
  const [aiDrawLoading, setAiDrawLoading] = useState(false);
  const aiAbortControllerRef = useRef<AbortController | null>(null);

  const handleCancelAiDraw = useCallback(() => {
    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
      aiAbortControllerRef.current = null;
    }
    setAiDrawLoading(false);
  }, []);

  const handleAiGenerateDrawing = useCallback(
    async (prompt: string) => {
      if (aiAbortControllerRef.current) {
        aiAbortControllerRef.current.abort();
      }
      const controller = new AbortController();
      aiAbortControllerRef.current = controller;
      setAiDrawLoading(true);

      try {
        const viewportX = Math.round((-pan.x + 350) / zoom);
        const viewportY = Math.round((-pan.y + 200) / zoom);

        const res = await fetch('/api/ai/draw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, viewport: { x: viewportX, y: viewportY } }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed generating drawing');
        }

        const data = await res.json();
        if (data.elements && Array.isArray(data.elements) && data.elements.length > 0) {
          const nextElements = [...elements, ...data.elements];
          onElementsChange(nextElements, 'ai_draw');
          setSelectedIds(data.elements.map((el: any) => el.id));
          setSnapToast(`🤖 AI drew: "${data.title || prompt}"`);
          setTimeout(() => setSnapToast(null), 3000);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        throw err;
      } finally {
        aiAbortControllerRef.current = null;
        setAiDrawLoading(false);
      }
    },
    [elements, onElementsChange, pan.x, pan.y, setSelectedIds, setSnapToast, zoom]
  );

  return {
    isAiDrawOpen,
    setIsAiDrawOpen,
    aiDrawLoading,
    handleCancelAiDraw,
    handleAiGenerateDrawing,
  };
}
