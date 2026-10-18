export interface ShortcutItem {
  id: string;
  name: string;
  category: 'Tools' | 'Canvas & View' | 'Edit & History' | 'AI & Features';
  description: string;
  defaultKey: string;
  currentKey: string;
}

export const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  // Tools
  {
    id: 'tool_select',
    name: 'Select Tool',
    category: 'Tools',
    description: 'Select, move, transform and delete elements',
    defaultKey: 'v',
    currentKey: 'v',
  },
  {
    id: 'tool_hand',
    name: 'Hand / Pan Tool',
    category: 'Tools',
    description: 'Pan around the infinite whiteboard (or hold Space)',
    defaultKey: 'h',
    currentKey: 'h',
  },
  {
    id: 'tool_pencil',
    name: 'Pencil Tool',
    category: 'Tools',
    description: 'Freehand vector drawing with shape auto-detection',
    defaultKey: 'p',
    currentKey: 'p',
  },
  {
    id: 'tool_highlighter',
    name: 'Highlighter Tool',
    category: 'Tools',
    description: 'Semi-transparent highlighting marker',
    defaultKey: 'b',
    currentKey: 'b',
  },
  {
    id: 'tool_eraser',
    name: 'Eraser Tool',
    category: 'Tools',
    description: 'Erase drawn paths and whiteboard items',
    defaultKey: 'e',
    currentKey: 'e',
  },
  {
    id: 'tool_shape',
    name: 'Shape Tool',
    category: 'Tools',
    description: 'Insert rectangles, circles, triangles, and arrows',
    defaultKey: 'r',
    currentKey: 'r',
  },
  {
    id: 'tool_text',
    name: 'Text Tool',
    category: 'Tools',
    description: 'Add and edit inline typography labels',
    defaultKey: 't',
    currentKey: 't',
  },

  // Edit & History
  {
    id: 'action_undo',
    name: 'Undo',
    category: 'Edit & History',
    description: 'Revert last canvas modification',
    defaultKey: 'Ctrl+Z',
    currentKey: 'Ctrl+Z',
  },
  {
    id: 'action_redo',
    name: 'Redo',
    category: 'Edit & History',
    description: 'Reapply undone modification',
    defaultKey: 'Ctrl+Y',
    currentKey: 'Ctrl+Y',
  },
  {
    id: 'action_delete',
    name: 'Delete Selection',
    category: 'Edit & History',
    description: 'Delete currently selected elements',
    defaultKey: 'Delete',
    currentKey: 'Delete',
  },
  {
    id: 'action_select_all',
    name: 'Select All',
    category: 'Edit & History',
    description: 'Select all elements on the canvas',
    defaultKey: 'Ctrl+A',
    currentKey: 'Ctrl+A',
  },
  {
    id: 'action_duplicate',
    name: 'Duplicate',
    category: 'Edit & History',
    description: 'Duplicate selected elements with offset',
    defaultKey: 'Ctrl+D',
    currentKey: 'Ctrl+D',
  },

  // Canvas & View
  {
    id: 'action_zoom_in',
    name: 'Zoom In',
    category: 'Canvas & View',
    description: 'Zoom closer into canvas content',
    defaultKey: '+',
    currentKey: '+',
  },
  {
    id: 'action_zoom_out',
    name: 'Zoom Out',
    category: 'Canvas & View',
    description: 'Zoom out to view wider whiteboard area',
    defaultKey: '-',
    currentKey: '-',
  },
  {
    id: 'action_reset_zoom',
    name: 'Reset Zoom (100%)',
    category: 'Canvas & View',
    description: 'Reset canvas zoom level to 100%',
    defaultKey: '0',
    currentKey: '0',
  },
  {
    id: 'action_toggle_snap',
    name: 'Toggle Auto-Snap',
    category: 'Canvas & View',
    description: 'Toggle intelligent geometric shape snapping',
    defaultKey: 's',
    currentKey: 's',
  },
  {
    id: 'action_toggle_grid',
    name: 'Toggle Grid Lines',
    category: 'Canvas & View',
    description: 'Toggle background grid lines on/off between clean and grid-assisted workspace',
    defaultKey: 'g',
    currentKey: 'g',
  },
  {
    id: 'action_pan_viewport',
    name: 'Pan Viewport',
    category: 'Canvas & View',
    description: 'Pan whiteboard viewport using Arrow keys (Up, Down, Left, Right)',
    defaultKey: 'Arrow Keys',
    currentKey: 'Arrow Keys',
  },

  // AI & Features
  {
    id: 'action_ai_draw',
    name: 'AI Whiteboard Artist',
    category: 'AI & Features',
    description: 'Open AI Assistant to generate diagrams and flowcharts',
    defaultKey: 'a',
    currentKey: 'a',
  },
  {
    id: 'action_boards',
    name: 'Boards Library',
    category: 'AI & Features',
    description: 'Open saved whiteboard library',
    defaultKey: 'l',
    currentKey: 'l',
  },
  {
    id: 'action_help',
    name: 'Help & Features Guide',
    category: 'AI & Features',
    description: 'Open help dialog and shortcuts guide',
    defaultKey: '?',
    currentKey: '?',
  },
];

/** LocalStorage key for persisting custom shortcut configurations */
const STORAGE_KEY = 'aidboard_shortcuts_custom';

/**
 * Loads custom user key bindings from localStorage, merging with defaults
 * to ensure newly added actions are consistently populated.
 *
 * @returns Array of fully hydrated ShortcutItems
 */
export function loadShortcuts(): ShortcutItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SHORTCUTS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_SHORTCUTS;

    // Merge saved custom keys with defaults to guarantee all IDs exist
    return DEFAULT_SHORTCUTS.map((def) => {
      const match = parsed.find((p: any) => p.id === def.id);
      return match && typeof match.currentKey === 'string'
        ? { ...def, currentKey: match.currentKey }
        : def;
    });
  } catch {
    return DEFAULT_SHORTCUTS;
  }
}

/**
 * Persists customized user key bindings to localStorage.
 *
 * @param shortcuts - Updated array of ShortcutItems
 */
export function saveShortcuts(shortcuts: ShortcutItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
  } catch (err) {
    console.warn('Failed saving keyboard shortcuts to localStorage:', err);
  }
}

/**
 * Clears custom bindings from localStorage and restores default factory shortcuts.
 *
 * @returns Default factory ShortcutItems array
 */
export function resetShortcuts(): ShortcutItem[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  return DEFAULT_SHORTCUTS;
}

/**
 * Checks whether a native KeyboardEvent matches a specified shortcut descriptor.
 * Supports modifier combinations (`Ctrl+Z`, `Cmd+Y`), special navigation keys (`Delete`, `Arrow Keys`),
 * and single-character bindings (`p`, `v`, `h`).
 *
 * @param e - Native browser KeyboardEvent
 * @param shortcutKey - Target key pattern string (e.g. 'Ctrl+Z', 'Delete', 'p')
 * @returns True if the event matches the shortcut binding
 */
export function matchesShortcut(e: KeyboardEvent, shortcutKey: string): boolean {
  const normKey = shortcutKey.trim();
  const lowerKey = normKey.toLowerCase();

  // Combo with Ctrl or Cmd
  if (lowerKey.startsWith('ctrl+') || lowerKey.startsWith('cmd+')) {
    const keyPart = lowerKey.replace(/^(ctrl|cmd)\+/i, '');
    const isModifier = e.ctrlKey || e.metaKey;
    if (!isModifier) return false;

    if (keyPart === 'z') {
      return e.key.toLowerCase() === 'z' && !e.shiftKey;
    }
    if (keyPart === 'y') {
      return e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey);
    }
    return e.key.toLowerCase() === keyPart;
  }

  if (normKey === 'Delete' || normKey === 'Backspace') {
    return e.key === 'Delete' || e.key === 'Backspace';
  }

  if (normKey === '+') {
    return e.key === '+' || e.key === '=';
  }

  if (normKey === '-') {
    return e.key === '-';
  }

  if (normKey === '?') {
    return e.key === '?' || (e.shiftKey && e.key === '/');
  }

  // Arrow keys matching (Arrow Keys / ArrowUp / ArrowDown / ArrowLeft / ArrowRight)
  if (lowerKey === 'arrow keys' || lowerKey === 'arrowkeys' || lowerKey === 'arrows') {
    return ['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase());
  }
  if (lowerKey === 'arrowup' || lowerKey === 'up' || lowerKey === 'arrow up') {
    return e.key === 'ArrowUp';
  }
  if (lowerKey === 'arrowdown' || lowerKey === 'down' || lowerKey === 'arrow down') {
    return e.key === 'ArrowDown';
  }
  if (lowerKey === 'arrowleft' || lowerKey === 'left' || lowerKey === 'arrow left') {
    return e.key === 'ArrowLeft';
  }
  if (lowerKey === 'arrowright' || lowerKey === 'right' || lowerKey === 'arrow right') {
    return e.key === 'ArrowRight';
  }

  // Single character match (case-insensitive, without Ctrl/Cmd)
  if (!e.ctrlKey && !e.metaKey && !e.altKey) {
    return e.key.toLowerCase() === lowerKey;
  }

  return false;
}
