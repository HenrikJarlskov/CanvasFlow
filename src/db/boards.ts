import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { BoardElement } from '../types/whiteboard';

export interface BoardRecord {
  id: string;
  name: string;
  elements: BoardElement[];
  background?: string;
  updatedAt: number;
}

// Persistent SQLite database file in project root
const dbPath = path.resolve(process.cwd(), 'whiteboard.db');
let db: DatabaseSync;

try {
  db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      elements TEXT NOT NULL,
      background TEXT DEFAULT 'dots',
      updated_at INTEGER NOT NULL
    );
  `);
} catch (err) {
  console.warn('SQLite disk initialization warning, using in-memory database:', err);
  db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      elements TEXT NOT NULL,
      background TEXT DEFAULT 'dots',
      updated_at INTEGER NOT NULL
    );
  `);
}

export async function getBoardsList(): Promise<{ id: string; name: string; elementCount: number; updatedAt: number }[]> {
  try {
    const query = db.prepare('SELECT id, name, elements, updated_at FROM boards ORDER BY updated_at DESC');
    const rows = query.all() as { id: string; name: string; elements: string; updated_at: number }[];

    return rows.map((r) => {
      let elementCount = 0;
      try {
        const parsed = JSON.parse(r.elements);
        if (Array.isArray(parsed)) elementCount = parsed.length;
      } catch {}
      return {
        id: r.id,
        name: r.name,
        elementCount,
        updatedAt: Number(r.updated_at) || Date.now(),
      };
    });
  } catch (err) {
    console.error('SQLite getBoardsList error:', err);
    return [];
  }
}

export async function getBoardById(id: string): Promise<BoardRecord | null> {
  try {
    const query = db.prepare('SELECT id, name, elements, background, updated_at FROM boards WHERE id = ?');
    const row = query.get(id) as { id: string; name: string; elements: string; background: string; updated_at: number } | undefined;

    if (!row) return null;

    let parsedElements: BoardElement[] = [];
    try {
      parsedElements = JSON.parse(row.elements);
    } catch {}

    return {
      id: row.id,
      name: row.name,
      elements: parsedElements,
      background: row.background || 'dots',
      updatedAt: Number(row.updated_at) || Date.now(),
    };
  } catch (err) {
    console.error('SQLite getBoardById error:', err);
    return null;
  }
}

export async function saveBoardRecord(
  id: string,
  name: string,
  elements: BoardElement[],
  background?: string
): Promise<BoardRecord> {
  const updatedAt = Date.now();
  const elementsStr = JSON.stringify(elements);
  const bg = background || 'dots';
  const boardName = name || `Board ${id.slice(0, 6)}`;

  try {
    const upsert = db.prepare(`
      INSERT INTO boards (id, name, elements, background, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        elements = excluded.elements,
        background = excluded.background,
        updated_at = excluded.updated_at
    `);
    upsert.run(id, boardName, elementsStr, bg, updatedAt);
  } catch (err) {
    console.error('SQLite saveBoardRecord error:', err);
  }

  return {
    id,
    name: boardName,
    elements,
    background: bg,
    updatedAt,
  };
}

export async function deleteBoardRecord(id: string): Promise<boolean> {
  try {
    const stmt = db.prepare('DELETE FROM boards WHERE id = ?');
    stmt.run(id);
    return true;
  } catch (err) {
    console.error('SQLite deleteBoardRecord error:', err);
    return false;
  }
}
