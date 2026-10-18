/**
 * @file useWhiteboardOcr.ts
 * @description React hook orchestrating optical character recognition (OCR) workflows.
 * Coordinates Tesseract.js WASM client rendering and Gemini AI multimodal vision transcription,
 * supporting direct in-place replacement of raw handwriting or side-by-side insertion.
 */

import { useState, useCallback } from 'react';
import { BoardElement, TextElementData } from '../types/whiteboard';
import { recognizeBoardContent, OcrResult, getElementsBoundingBox } from '../utils/ocr';
import { renderBoardToCanvas } from '../utils/export';

/**
 * Manages OCR modal dialog state, raster snapshot rendering, and canvas element text insertion.
 *
 * @param elements Current elements array
 * @param selectedIds Selected element IDs targeted for OCR transcription
 * @param color Active primary color for generated text elements
 * @param onElementsChange Canvas mutation callback
 * @param setSelectedIds Selection setter callback
 */
export function useWhiteboardOcr(
  elements: BoardElement[],
  selectedIds: string[],
  color: string,
  onElementsChange: (elements: BoardElement[], operation?: string) => void,
  setSelectedIds: (ids: string[]) => void
) {
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatusText, setOcrStatusText] = useState('');
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);

  const handleTriggerOcr = useCallback(async () => {
    const selected = elements.filter((el) => selectedIds.includes(el.id));
    if (selected.length === 0) return;

    setIsOcrModalOpen(true);
    setOcrLoading(true);
    setOcrProgress(0.05);
    setOcrStatusText('Preparing canvas strokes for Tesseract...');
    setOcrResult(null);

    try {
      const result = await recognizeBoardContent(selected, (progress, status) => {
        setOcrProgress(progress);
        setOcrStatusText(status);
      });
      setOcrResult(result);
    } catch (err: any) {
      console.error('OCR error:', err);
      setOcrStatusText('OCR Failed: ' + (err.message || 'Unknown error'));
    } finally {
      setOcrLoading(false);
    }
  }, [elements, selectedIds]);

  const handleReplaceWithText = useCallback(
    (text: string) => {
      if (!ocrResult || !text.trim()) return;
      const bounds = ocrResult.boundingBox;
      const fontSize = Math.max(18, Math.min(48, Math.round(bounds.height * 0.45)));

      const textEl: TextElementData = {
        id: 'text_ocr_' + Date.now(),
        type: 'text',
        x: bounds.minX,
        y: bounds.minY,
        text,
        fontSize,
        color,
        fontFamily: 'Inter, sans-serif',
        width: Math.max(120, bounds.width),
        height: Math.max(40, bounds.height),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        zIndex: elements.length + 1,
      };

      const remaining = elements.filter((el) => !selectedIds.includes(el.id));
      onElementsChange([...remaining, textEl], 'ocr_replace');
      setSelectedIds([textEl.id]);
      setIsOcrModalOpen(false);
    },
    [color, elements, ocrResult, onElementsChange, selectedIds, setSelectedIds]
  );

  const handleInsertBesideText = useCallback(
    (text: string) => {
      if (!ocrResult || !text.trim()) return;
      const bounds = ocrResult.boundingBox;
      const fontSize = Math.max(18, Math.min(36, Math.round(bounds.height * 0.4)));

      const textEl: TextElementData = {
        id: 'text_ocr_' + Date.now(),
        type: 'text',
        x: bounds.maxX + 30,
        y: bounds.minY,
        text,
        fontSize,
        color,
        fontFamily: 'Inter, sans-serif',
        width: 200,
        height: Math.max(40, bounds.height),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        zIndex: elements.length + 1,
      };

      onElementsChange([...elements, textEl], 'ocr_insert');
      setSelectedIds([textEl.id]);
      setIsOcrModalOpen(false);
    },
    [color, elements, ocrResult, onElementsChange, setSelectedIds]
  );

  const handleRunAiOcr = useCallback(async () => {
    const selected = elements.filter((el) => selectedIds.includes(el.id));
    if (selected.length === 0) return;

    setOcrLoading(true);
    setOcrProgress(0.3);
    setOcrStatusText('Analyzing image with Gemini Vision AI...');

    try {
      const bounds = getElementsBoundingBox(selected);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(120, bounds.width + 40);
      canvas.height = Math.max(80, bounds.height + 40);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const tempCanvas = renderBoardToCanvas(selected, 'blank');
        ctx.drawImage(tempCanvas, 20, 20);
      }
      const imageBase64 = canvas.toDataURL('image/png');

      setOcrProgress(0.7);
      const res = await fetch('/api/ai/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed AI OCR');
      }
      const data = await res.json();
      setOcrResult({
        text: data.text || '',
        confidence: data.confidence || 95,
        boundingBox: bounds,
      });
      setOcrProgress(1);
      setOcrStatusText('AI Transcription complete!');
    } catch (err: any) {
      console.error('AI OCR error:', err);
      setOcrStatusText('AI OCR error: ' + (err.message || 'Error occurred'));
    } finally {
      setOcrLoading(false);
    }
  }, [elements, selectedIds]);

  return {
    isOcrModalOpen,
    setIsOcrModalOpen,
    ocrLoading,
    ocrProgress,
    ocrStatusText,
    ocrResult,
    handleTriggerOcr,
    handleReplaceWithText,
    handleInsertBesideText,
    handleRunAiOcr,
  };
}
