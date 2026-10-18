/**
 * @file idbStorage.ts
 * @description High-capacity IndexedDB client storage engine with automatic localStorage fallback (ENG-03).
 *
 * Architecture Context:
 * Standard browser `localStorage` enforces a strict 5MB quota per origin. Ingesting base64 images,
 * complex CAD/Draw.io imports, or extensive freehand vector drawings quickly exhausts this limit,
 * triggering uncaught `QuotaExceededError` DOMExceptions.
 *
 * IndexedDB provides hundreds of megabytes of structured, asynchronous offline storage, ensuring
 * that large diagrams and embedded images are safely persisted without crashing the browser session.
 */

const DB_NAME = 'aidboard_offline_db';
const DB_VERSION = 1;
const STORE_BOARDS = 'boards';

/**
 * Opens or initializes the local IndexedDB database instance.
 *
 * Method Explanation:
 * Returns `null` if the environment lacks window/IndexedDB (e.g. server-side rendering or restricted contexts).
 * In `onupgradeneeded`, establishes the `'boards'` object store with keyPath `'id'`.
 *
 * @returns Promise resolving to the opened IDBDatabase or null if unavailable
 */
function openDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_BOARDS)) {
          db.createObjectStore(STORE_BOARDS, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn('IndexedDB open error, using localStorage fallback');
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

/**
 * Persists whiteboard data into IndexedDB under the specified board ID.
 * Falls back transparently to `localStorage` if IndexedDB fails or is disabled.
 *
 * Transaction Details:
 * Employs a `'readwrite'` transaction on the `'boards'` object store, executing `store.put()`.
 *
 * @param id - Board unique identifier
 * @param data - Board snapshot data (name, elements, background, etc.)
 */
export async function setBoardStorage(id: string, data: any): Promise<void> {
  const db = await openDB();
  if (db) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_BOARDS, 'readwrite');
        const store = tx.objectStore(STORE_BOARDS);
        store.put({ id, ...data });
        tx.oncomplete = () => resolve();
        tx.onerror = () => {
          fallbackLocalStorageSet(id, data);
          resolve();
        };
      } catch {
        fallbackLocalStorageSet(id, data);
        resolve();
      }
    });
  } else {
    fallbackLocalStorageSet(id, data);
  }
}

/**
 * Retrieves stored whiteboard state for a given board ID.
 *
 * @param id - Board unique identifier
 * @returns Promise resolving to the retrieved board record or null if not found
 */
export async function getBoardStorage(id: string): Promise<any | null> {
  const db = await openDB();
  if (db) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_BOARDS, 'readonly');
        const store = tx.objectStore(STORE_BOARDS);
        const req = store.get(id);
        req.onsuccess = () => {
          if (req.result) {
            resolve(req.result);
          } else {
            resolve(fallbackLocalStorageGet(id));
          }
        };
        req.onerror = () => resolve(fallbackLocalStorageGet(id));
      } catch {
        resolve(fallbackLocalStorageGet(id));
      }
    });
  } else {
    return fallbackLocalStorageGet(id);
  }
}

/**
 * Removes a board record from IndexedDB and clears any legacy localStorage item.
 *
 * @param id - Board unique identifier to delete
 */
export async function deleteBoardStorage(id: string): Promise<void> {
  const db = await openDB();
  if (db) {
    try {
      const tx = db.transaction(STORE_BOARDS, 'readwrite');
      const store = tx.objectStore(STORE_BOARDS);
      store.delete(id);
    } catch {}
  }
  try {
    localStorage.removeItem(`aidboard_board_${id}`);
  } catch {}
}

/**
 * Internal fallback helper to write board JSON into localStorage.
 */
function fallbackLocalStorageSet(id: string, data: any) {
  try {
    localStorage.setItem(`aidboard_board_${id}`, JSON.stringify(data));
  } catch (err) {
    console.warn('localStorage quota exceeded during fallback storage:', err);
  }
}

/**
 * Internal fallback helper to read board JSON from localStorage.
 */
function fallbackLocalStorageGet(id: string): any | null {
  try {
    const raw = localStorage.getItem(`aidboard_board_${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
