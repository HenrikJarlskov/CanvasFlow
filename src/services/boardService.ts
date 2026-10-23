/**
 * @file boardService.ts
 * @description Firestore persistence service for isolated, per-user whiteboard storage.
 * Enforces zero-trust partition: whiteboards are stored under /users/{userId}/boards/{boardId}.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { BoardElement, BoardMetadata } from '../types/whiteboard';

export interface FirestoreBoardDoc {
  id: string;
  ownerId: string;
  name: string;
  elementCount: number;
  elements: BoardElement[];
  background?: string;
  createdAt: any;
  updatedAt: any;
}

/**
 * Retrieves all whiteboards owned exclusively by the authenticated user.
 *
 * @param userId - Firebase Auth UID of the current user
 * @returns Array of board metadata entries sorted newest first
 */
export async function getUserBoards(userId: string): Promise<BoardMetadata[]> {
  const collectionPath = `users/${userId}/boards`;
  try {
    const q = query(collection(db, 'users', userId, 'boards'), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    const boards: BoardMetadata[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const updatedAtMillis =
        data.updatedAt?.toMillis?.() ||
        (typeof data.updatedAt === 'number' ? data.updatedAt : Date.now());

      boards.push({
        id: docSnap.id,
        name: data.name || 'Untitled Board',
        elementCount: data.elementCount ?? (Array.isArray(data.elements) ? data.elements.length : 0),
        updatedAt: updatedAtMillis,
      });
    });

    return boards;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, collectionPath);
  }
}

/**
 * Fetches a single whiteboard owned by the user.
 *
 * @param userId - Board owner UID
 * @param boardId - Whiteboard unique document ID
 */
export async function getUserBoard(
  userId: string,
  boardId: string
): Promise<{ id: string; name: string; elements: BoardElement[]; background?: string } | null> {
  const docPath = `users/${userId}/boards/${boardId}`;
  try {
    const docRef = doc(db, 'users', userId, 'boards', boardId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name || 'Untitled Board',
      elements: Array.isArray(data.elements) ? data.elements : [],
      background: data.background || 'dots',
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, docPath);
  }
}

/**
 * Persists whiteboard data to the user's isolated subcollection.
 * Performs insert or partial update complying with security rule invariants.
 *
 * @param userId - Board owner UID
 * @param boardId - Whiteboard ID
 * @param name - Board title
 * @param elements - Serialized canvas vector objects
 * @param background - Active canvas background pattern
 */
export async function saveUserBoard(
  userId: string,
  boardId: string,
  name: string,
  elements: BoardElement[],
  background = 'dots'
): Promise<void> {
  const docPath = `users/${userId}/boards/${boardId}`;
  try {
    const docRef = doc(db, 'users', userId, 'boards', boardId);
    const docSnap = await getDoc(docRef);

    const cleanName = (name || 'Untitled Board').slice(0, 100);

    if (!docSnap.exists()) {
      // Document creation
      await setDoc(docRef, {
        id: boardId,
        ownerId: userId,
        name: cleanName,
        elementCount: elements.length,
        elements,
        background: background.slice(0, 30),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // Document update: mutate only whitelisted fields
      await updateDoc(docRef, {
        name: cleanName,
        elementCount: elements.length,
        elements,
        background: background.slice(0, 30),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}

/**
 * Deletes a whiteboard document from the user's personal storage.
 *
 * @param userId - Board owner UID
 * @param boardId - Target whiteboard ID
 */
export async function deleteUserBoard(userId: string, boardId: string): Promise<void> {
  const docPath = `users/${userId}/boards/${boardId}`;
  try {
    const docRef = doc(db, 'users', userId, 'boards', boardId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, docPath);
  }
}
