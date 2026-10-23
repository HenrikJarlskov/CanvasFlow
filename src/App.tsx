/**
 * @file App.tsx
 * @description Root application component for AIdboard.
 * Orchestrates Toolbar, Header, Canvas, Modals, and real-time collaboration.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { WhiteboardModals } from './components/WhiteboardModals';
import { WhiteboardNotifications } from './components/WhiteboardNotifications';
import {
  BoardElement,
  ToolType,
  ShapeType,
  BackgroundType,
  RemoteUser,
} from './types/whiteboard';
import { WhiteboardSocket, getStoredUser } from './utils/socket';
import { exportToPNG, exportToPDF, exportToSVG } from './utils/export';
import { loadShortcuts } from './utils/shortcuts';
import { cloneElements, duplicateElements } from './utils/canvasGeometry';
import { useWhiteboardHistory } from './hooks/useWhiteboardHistory';
import { useBoardStorage } from './hooks/useBoardStorage';
import { useWhiteboardShortcuts } from './hooks/useWhiteboardShortcuts';
import { useWhiteboardOcr } from './hooks/useWhiteboardOcr';
import { useWhiteboardAiDraw } from './hooks/useWhiteboardAiDraw';
import { useBoardOrchestration } from './hooks/useBoardOrchestration';
import { useAuth } from './context/AuthContext';
import { getUserBoard } from './services/boardService';
import { useTranslation } from 'react-i18next';

export default function App() {
  const { t } = useTranslation();
  const socketRef = useRef<WhiteboardSocket | null>(null);

  // History stack
  const {
    elements,
    setElements,
    pushHistory,
    resetState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useWhiteboardHistory([]);

  // Tools, styles & theme
  const [currentTool, setCurrentTool] = useState<ToolType>('pen');
  const [selectedShape, setSelectedShape] = useState<ShapeType>('rectangle');
  const [color, setColor] = useState<string>('#18181b');
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [autoSnap, setAutoSnap] = useState<boolean>(false);
  const [background, setBackground] = useState<BackgroundType>('dots');
  const [lastActiveGrid, setLastActiveGrid] = useState<BackgroundType>('dots');

  const handleToggleGrid = useCallback(() => {
    if (background === 'blank') {
      const nextGrid = lastActiveGrid === 'blank' ? 'grid' : lastActiveGrid;
      setBackground(nextGrid);
    } else {
      setLastActiveGrid(background);
      setBackground('blank');
    }
  }, [background, lastActiveGrid]);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const stored = localStorage.getItem('aidboard_theme');
      if (stored === 'dark' || stored === 'light') return stored;
    } catch (e) {}
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    try {
      localStorage.setItem('aidboard_theme', theme);
    } catch (e) {}
  }, [theme]);

  // Viewport & Selection
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Dialogs & Shortcuts
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isBoardsModalOpen, setIsBoardsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState(() => loadShortcuts());
  const [snapToast, setSnapToast] = useState<string | null>(null);

  // Collaboration
  const [connectedUsers, setConnectedUsers] = useState<RemoteUser[]>([]);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState(getStoredUser());

  // Firebase Google Authentication
  const { user } = useAuth();

  const saveBoardRef = useRef<(elems: BoardElement[], name?: string, immediate?: boolean) => void>(() => {});

  const handleElementsChange = useCallback(
    (newElements: BoardElement[], operation = 'update') => {
      const cloned = cloneElements(newElements);
      setElements(cloned);
      pushHistory(cloned);
      saveBoardRef.current(cloned);
      socketRef.current?.sendElementsChange(cloned, operation);
    },
    [pushHistory, setElements]
  );

  const handleChangeColor = useCallback(
    (newColor: string) => {
      setColor(newColor);
      if (selectedIds.length > 0) {
        const updated = elements.map((el) => {
          if (selectedIds.includes(el.id)) {
            return {
              ...el,
              color: newColor,
              updatedAt: Date.now(),
            };
          }
          return el;
        });
        handleElementsChange(updated, 'update_color');
      }
    },
    [elements, selectedIds, handleElementsChange]
  );

  const handleChangeStrokeWidth = useCallback(
    (newWidth: number) => {
      setStrokeWidth(newWidth);
      if (selectedIds.length > 0) {
        const updated = elements.map((el) => {
          if (selectedIds.includes(el.id)) {
            return {
              ...el,
              strokeWidth: newWidth,
              updatedAt: Date.now(),
            };
          }
          return el;
        });
        handleElementsChange(updated, 'update_stroke_width');
      }
    },
    [elements, selectedIds, handleElementsChange]
  );

  // Sync toolbar active color and stroke width with selected element
  useEffect(() => {
    if (selectedIds.length === 1) {
      const selectedEl = elements.find((el) => el.id === selectedIds[0]);
      if (selectedEl && 'color' in selectedEl && typeof (selectedEl as any).color === 'string') {
        setColor((selectedEl as any).color);
      }
      if (selectedEl && 'strokeWidth' in selectedEl && typeof (selectedEl as any).strokeWidth === 'number') {
        setStrokeWidth((selectedEl as any).strokeWidth);
      }
    }
  }, [selectedIds, elements]);

  const handleElementsLiveUpdate = useCallback((liveElements: BoardElement[]) => {
    const cloned = cloneElements(liveElements);
    setElements(cloned);
    socketRef.current?.sendElementsChange(cloned, 'move_live');
  }, [setElements]);

  const {
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
  } = useBoardOrchestration({
    elements,
    setElements,
    resetState,
    saveBoard: (elems, name) => saveBoardRef.current(elems, name),
    handleElementsChange,
    setSelectedIds,
    socketRef,
    pan,
    zoom,
  });

  // User-isolated board persistence in Firestore & IndexedDB
  const { savedBoards, saveBoard, deleteBoard } = useBoardStorage(
    roomId,
    boardName,
    elements.length,
    user,
    background
  );

  useEffect(() => {
    saveBoardRef.current = saveBoard;
  }, [saveBoard]);

  // Load board from user's isolated Firestore collection if available
  useEffect(() => {
    if (!user) return;
    getUserBoard(user.uid, roomId)
      .then((cloudBoard) => {
        if (cloudBoard) {
          if (Array.isArray(cloudBoard.elements) && cloudBoard.elements.length > 0) {
            resetState(cloudBoard.elements);
          }
          if (cloudBoard.name) {
            setBoardName(cloudBoard.name);
          }
          if (cloudBoard.background) {
            setBackground(cloudBoard.background as BackgroundType);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not load board from user Firestore storage:', err);
      });
  }, [user, roomId, resetState, setBoardName]);

  // Sync collaborator user name with Google profile
  useEffect(() => {
    if (user?.displayName || user?.email) {
      const displayName = user.displayName || user.email?.split('@')[0] || 'Collaborator';
      setCurrentUser((prev) => ({
        ...prev,
        userName: displayName,
      }));
      socketRef.current?.setUserName(displayName);
    }
  }, [user]);

  const handleSaveBoardAndNew = useCallback(() => {
    saveBoard(elements, boardName, true);
    handleNewBoard();
  }, [elements, boardName, saveBoard, handleNewBoard]);

  const handleDiscardAndNew = useCallback(() => {
    deleteBoard(roomId);
    handleNewBoard();
  }, [deleteBoard, roomId, handleNewBoard]);

  // Undo / Redo
  const handleUndo = useCallback(() => {
    const restored = undo();
    if (restored) {
      setSelectedIds([]);
      saveBoard(restored);
      socketRef.current?.sendElementsChange(restored, 'undo');
    }
  }, [undo, saveBoard]);

  const handleRedo = useCallback(() => {
    const restored = redo();
    if (restored) {
      setSelectedIds([]);
      saveBoard(restored);
      socketRef.current?.sendElementsChange(restored, 'redo');
    }
  }, [redo, saveBoard]);

  // OCR Hook
  const {
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
  } = useWhiteboardOcr(elements, selectedIds, color, handleElementsChange, setSelectedIds);

  // AI Whiteboard Artist Hook
  const {
    isAiDrawOpen,
    setIsAiDrawOpen,
    aiDrawLoading,
    handleCancelAiDraw,
    handleAiGenerateDrawing,
  } = useWhiteboardAiDraw(elements, pan, zoom, handleElementsChange, setSelectedIds, setSnapToast);

  // WebSocket sync
  useEffect(() => {
    try {
      const cached = localStorage.getItem(`aidboard_board_${roomId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.elements && Array.isArray(parsed.elements)) {
          resetState(parsed.elements);
          if (parsed.name) setBoardName(parsed.name);
        }
      }
    } catch (e) {}

    const socket = new WhiteboardSocket(roomId, {
      onConnected: () => setIsSocketConnected(true),
      onDisconnected: () => setIsSocketConnected(false),
      onRoomState: (data) => {
        if (data.elements && Array.isArray(data.elements)) resetState(data.elements);
        if (data.name) setBoardName(data.name);
        if (data.users) setConnectedUsers(data.users.filter((u) => u.userId !== currentUser.userId));
      },
      onUserJoined: (data) => {
        if (data.users) setConnectedUsers(data.users.filter((u) => u.userId !== currentUser.userId));
      },
      onUserLeft: (data) => {
        if (data.users) setConnectedUsers(data.users.filter((u) => u.userId !== currentUser.userId));
      },
      onUserCursor: (data) => {
        if (data.userId === currentUser.userId) return;
        setConnectedUsers((prev) => {
          const index = prev.findIndex((u) => u.userId === data.userId);
          if (index >= 0) {
            const current = prev[index];
            if (
              current.cursor &&
              Math.abs(current.cursor.x - data.x) < 0.5 &&
              Math.abs(current.cursor.y - data.y) < 0.5
            ) {
              return prev;
            }
            const next = [...prev];
            next[index] = {
              ...current,
              userName: data.userName || current.userName,
              userColor: data.userColor || current.userColor,
              cursor: { x: data.x, y: data.y },
            };
            return next;
          }
          return [
            ...prev,
            {
              userId: data.userId,
              userName: data.userName || 'Collaborator',
              userColor: data.userColor || '#6366f1',
              cursor: { x: data.x, y: data.y },
            },
          ];
        });
      },
      onElementsUpdated: (data) => {
        if (data.userId !== currentUser.userId && data.elements && Array.isArray(data.elements)) {
          const cloned = cloneElements(data.elements);
          setElements(cloned);
          pushHistory(cloned);
        }
      },
      onElementDelta: (data) => {
        if (data.userId !== currentUser.userId) {
          setElements((prev) => {
            const { op, element, elementId } = data;
            if (op === 'upsert' && element) {
              const idx = prev.findIndex((el) => el.id === element.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = element;
                return next;
              }
              return [...prev, element];
            } else if (op === 'delete' && elementId) {
              return prev.filter((el) => el.id !== elementId);
            }
            return prev;
          });
        }
      },
      onBoardCleared: (data) => {
        if (data.userId !== currentUser.userId) {
          resetState([]);
          setSelectedIds([]);
        }
      },
      onBoardRenamed: (data) => setBoardName(data.name),
    });

    socketRef.current = socket;
    return () => {
      socket.destroy();
      socketRef.current = null;
    };
  }, [roomId, currentUser.userId, pushHistory, resetState, setBoardName, setElements]);

  // Global Keyboard Shortcuts
  useWhiteboardShortcuts({
    shortcuts,
    elements,
    selectedIds,
    setCurrentTool,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onDeleteSelected: () => {
      if (selectedIds.length > 0) {
        handleElementsChange(elements.filter((el) => !selectedIds.includes(el.id)), 'delete');
        setSelectedIds([]);
      }
    },
    onSelectAll: () => setSelectedIds(elements.map((el) => el.id)),
    onDuplicateSelected: () => {
      if (selectedIds.length > 0) {
        const duplicated = duplicateElements(elements, selectedIds, 20);
        handleElementsChange([...elements, ...duplicated], 'duplicate');
        setSelectedIds(duplicated.map((d) => d.id));
      }
    },
    onZoomIn: () => setZoom((z) => Math.min(3.5, Math.round(z * 1.15 * 100) / 100)),
    onZoomOut: () => setZoom((z) => Math.max(0.2, Math.round((z / 1.15) * 100) / 100)),
    onResetZoom: () => {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    },
    onToggleSnap: () => setAutoSnap((s) => !s),
    onToggleGrid: handleToggleGrid,
    onOpenAiDraw: () => setIsAiDrawOpen(true),
    onOpenBoards: () => setIsBoardsModalOpen(true),
    onOpenHelp: () => setIsHelpModalOpen(true),
    onPan: (dx: number, dy: number) => setPan((p) => ({ x: p.x + dx, y: p.y + dy })),
  });

  return (
    <div
      data-testid="aidboard-app"
      className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-zinc-950 font-sans text-slate-900 dark:text-zinc-100 transition-colors"
    >
      <Header
        boardName={boardName}
        onRenameBoard={handleRenameBoard}
        background={background}
        onChangeBackground={(bg) => {
          setBackground(bg);
          if (bg !== 'blank') setLastActiveGrid(bg);
        }}
        onNewBoard={handleNewBoard}
        hasElements={elements.length > 0}
        onSaveBoardAndNew={handleSaveBoardAndNew}
        onDiscardAndNew={handleDiscardAndNew}
        onOpenBoardsModal={() => setIsBoardsModalOpen(true)}
        onClearBoard={handleClearBoard}
        onExportPNG={() => exportToPNG(elements, boardName, background)}
        onExportPDF={() => exportToPDF(elements, boardName, background)}
        onExportSVG={() => exportToSVG(elements, boardName)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        connectedUsers={connectedUsers}
        currentUser={currentUser}
        isSocketConnected={isSocketConnected}
        isDarkMode={theme === 'dark'}
        onToggleDarkMode={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onOpenAiDraw={() => setIsAiDrawOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onImportImageFile={handleImportImageFile}
        onOpenHelpModal={() => setIsHelpModalOpen(true)}
      />

      <Toolbar
        currentTool={currentTool}
        onSelectTool={setCurrentTool}
        selectedShape={selectedShape}
        onSelectShape={setSelectedShape}
        color={color}
        onChangeColor={handleChangeColor}
        strokeWidth={strokeWidth}
        onChangeStrokeWidth={handleChangeStrokeWidth}
        autoSnap={autoSnap}
        onToggleAutoSnap={() => setAutoSnap(!autoSnap)}
        background={background}
        onToggleGrid={handleToggleGrid}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(3.5, z * 1.15))}
        onZoomOut={() => setZoom((z) => Math.max(0.2, z * 0.85))}
        onResetZoom={() => {
          setZoom(1);
          setPan({ x: 0, y: 0 });
        }}
      />

      <Canvas
        elements={elements}
        onElementsChange={handleElementsChange}
        onElementsLiveUpdate={handleElementsLiveUpdate}
        currentTool={currentTool}
        selectedShape={selectedShape}
        color={color}
        strokeWidth={strokeWidth}
        autoSnap={autoSnap}
        background={background}
        zoom={zoom}
        pan={pan}
        onPanChange={setPan}
        onZoomChange={setZoom}
        selectedIds={selectedIds}
        onSelectElements={setSelectedIds}
        onTriggerOcr={handleTriggerOcr}
        remoteUsers={connectedUsers}
        onCursorMove={(x, y) => socketRef.current?.sendCursor(x, y)}
        onSnapFeedback={(shapeName) => {
          const shapeKey = shapeName.toLowerCase();
          const localizedShape = t(`toolbar.shapes.${shapeKey}`, {
            defaultValue: shapeName.charAt(0).toUpperCase() + shapeName.slice(1),
          });
          setSnapToast(t('canvas.snappedTo', { shape: localizedShape }));
          setTimeout(() => setSnapToast(null), 2500);
        }}
        onImportImageFile={handleImportImageFile}
      />

      <WhiteboardNotifications snapToast={snapToast} aiDrawLoading={aiDrawLoading} />

      <WhiteboardModals
        isOcrModalOpen={isOcrModalOpen}
        onCloseOcr={() => setIsOcrModalOpen(false)}
        ocrResult={ocrResult}
        ocrLoading={ocrLoading}
        ocrProgress={ocrProgress}
        ocrStatusText={ocrStatusText}
        onReplaceWithText={handleReplaceWithText}
        onInsertBesideText={handleInsertBesideText}
        onRunAiOcr={handleRunAiOcr}
        onRunTesseractOcr={handleTriggerOcr}
        isAiDrawOpen={isAiDrawOpen}
        onCloseAiDraw={() => setIsAiDrawOpen(false)}
        onGenerateDrawing={handleAiGenerateDrawing}
        aiDrawLoading={aiDrawLoading}
        onCancelAiDraw={handleCancelAiDraw}
        isBoardsModalOpen={isBoardsModalOpen}
        onCloseBoards={() => setIsBoardsModalOpen(false)}
        boards={savedBoards}
        currentBoardId={roomId}
        onSelectBoard={(id) => {
          window.location.search = `?room=${id}`;
        }}
        onCreateNewBoard={handleNewBoard}
        onDeleteBoard={deleteBoard}
        onImportBoard={handleImportBoard}
        onExportCurrentJson={handleExportCurrentJson}
        isShareModalOpen={isShareModalOpen}
        onCloseShare={() => setIsShareModalOpen(false)}
        roomId={roomId}
        connectedUsers={connectedUsers}
        currentUser={currentUser}
        onUpdateUserName={(name) => {
          socketRef.current?.setUserName(name);
          setCurrentUser(getStoredUser());
        }}
        isHelpModalOpen={isHelpModalOpen}
        onCloseHelp={() => setIsHelpModalOpen(false)}
        shortcuts={shortcuts}
        onUpdateShortcuts={setShortcuts}
        isImportModalOpen={isImportModalOpen}
        onCloseImport={() => setIsImportModalOpen(false)}
        onImportElements={handleImportElements}
        onImportImageFile={handleImportImageFile}
        canvasCenter={{
          x: Math.round((-pan.x + (typeof window !== 'undefined' ? window.innerWidth : 800) / 2) / zoom),
          y: Math.round((-pan.y + (typeof window !== 'undefined' ? window.innerHeight : 600) / 2) / zoom),
        }}
      />
    </div>
  );
}
