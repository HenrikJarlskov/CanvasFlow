/**
 * @file useBoardOrchestration.ts
 * @description Domain hook orchestrating board lifecycle, identity, room routing,
 * and external I/O (JSON import/export, image uploads, board switching).
 */

import { useState, useCallback, MutableRefObject } from 'react';
import { BoardElement } from '../types/whiteboard';
import { WhiteboardSocket } from '../utils/socket';
import { cloneElements, createImageElementFromFile } from '../utils/canvasGeometry';

export interface UseBoardOrchestrationParams {
  initialRoomId?: string;
  elements: BoardElement[];
  setElements: (elements: BoardElement[]) => void;
  resetState: (elements: BoardElement[]) => void;
  saveBoard: (elements: BoardElement[], name?: string) => void;
  handleElementsChange: (elements: BoardElement[], operation?: string) => void;
  setSelectedIds: (ids: string[]) => void;
  socketRef: MutableRefObject<WhiteboardSocket | null>;
  pan: { x: number; y: number };
  zoom: number;
}

export function useBoardOrchestration({
  initialRoomId,
  elements,
  resetState,
  saveBoard,
  handleElementsChange,
  setSelectedIds,
  socketRef,
  pan,
  zoom,
}: UseBoardOrchestrationParams) {
  const [roomId] = useState<string>(() => {
    if (initialRoomId) return initialRoomId;
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get('room');
      if (fromUrl) return fromUrl;
    } catch (e) {}
    const generated = 'board_' + Math.random().toString(36).substring(2, 8);
    try {
      const newUrl = `${window.location.pathname}?room=${generated}`;
      window.history.replaceState({}, '', newUrl);
    } catch (e) {}
    return generated;
  });

  const [boardName, setBoardName] = useState<string>('My Whiteboard');

  const handleRenameBoard = useCallback(
    (newName: string) => {
      setBoardName(newName);
      socketRef.current?.sendRename(newName);
      saveBoard(elements, newName);
    },
    [elements, saveBoard, socketRef]
  );

  const handleNewBoard = useCallback(() => {
    window.location.search = `?room=board_${Math.random().toString(36).substring(2, 8)}`;
  }, []);

  const handleClearBoard = useCallback(() => {
    resetState([]);
    setSelectedIds([]);
    saveBoard([]);
    socketRef.current?.sendClear();
  }, [resetState, saveBoard, setSelectedIds, socketRef]);

  const handleImportBoard = useCallback(
    (data: { name: string; elements: BoardElement[] }) => {
      const cloned = cloneElements(data.elements);
      setBoardName(data.name);
      resetState(cloned);
      setSelectedIds([]);
      saveBoard(cloned, data.name);
      socketRef.current?.sendElementsChange(cloned, 'import');
      socketRef.current?.sendRename(data.name);
    },
    [resetState, saveBoard, setSelectedIds, socketRef]
  );

  const handleExportCurrentJson = useCallback(() => {
    const data = {
      app: 'AIdboard',
      version: '1.0',
      id: roomId,
      name: boardName,
      elements,
      exportedAt: Date.now(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${boardName.toLowerCase().replace(/\s+/g, '_')}.aidboard`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [boardName, elements, roomId]);

  const handleImportImageFile = useCallback(
    async (file: File) => {
      const posX = Math.round((-pan.x + 300) / zoom);
      const posY = Math.round((-pan.y + 200) / zoom);
      try {
        const newImgEl = await createImageElementFromFile(file, posX, posY, elements.length + 1);
        const next = [...elements, newImgEl];
        handleElementsChange(next, 'create');
        setSelectedIds([newImgEl.id]);
      } catch (e) {
        console.warn('Failed importing image:', e);
      }
    },
    [elements, handleElementsChange, pan.x, pan.y, setSelectedIds, zoom]
  );

  const handleImportElements = useCallback(
    (newElements: BoardElement[]) => {
      if (!newElements || newElements.length === 0) return;
      const next = [...elements, ...newElements];
      handleElementsChange(next, 'create');
      setSelectedIds(newElements.map((el) => el.id));
      saveBoard(next);
    },
    [elements, handleElementsChange, saveBoard, setSelectedIds]
  );

  return {
    roomId,
    boardName,
    setBoardName,
    handleRenameBoard,
    handleNewBoard,
    handleClearBoard,
    handleImportBoard,
    handleExportCurrentJson,
    handleImportImageFile,
    handleImportElements,
  };
}
