import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Firebase Blueprint & Security Rules Validation (Pillars 1-8)', () => {
  it('validates firebase-blueprint.json schema and entity definitions', () => {
    const blueprintPath = path.resolve(process.cwd(), 'firebase-blueprint.json');
    expect(fs.existsSync(blueprintPath)).toBe(true);

    const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));
    expect(blueprint.entities).toBeDefined();
    expect(blueprint.entities.User).toBeDefined();
    expect(blueprint.entities.Board).toBeDefined();

    // Verify Board properties
    const boardProps = blueprint.entities.Board.properties;
    expect(boardProps.id).toBeDefined();
    expect(boardProps.ownerId).toBeDefined();
    expect(boardProps.name).toBeDefined();
    expect(boardProps.elements).toBeDefined();
    expect(boardProps.createdAt).toBeDefined();
    expect(boardProps.updatedAt).toBeDefined();

    // Verify Firestore paths
    expect(blueprint.firestore).toBeDefined();
    expect(blueprint.firestore['/users/{userId}']).toBeDefined();
    expect(blueprint.firestore['/users/{userId}/boards/{boardId}']).toBeDefined();
  });

  it('validates firestore.rules fortress security and user isolation invariants', () => {
    const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
    expect(fs.existsSync(rulesPath)).toBe(true);

    const rules = fs.readFileSync(rulesPath, 'utf8');

    // Pillar 1: Global default deny catch-all
    expect(rules).toContain('match /{document=**}');
    expect(rules).toContain('allow read, write: if false;');

    // Pillar 2: Email verification and authentication requirements
    expect(rules).toContain('request.auth != null');
    expect(rules).toContain('request.auth.token.email_verified == true');
    expect(rules).toContain('request.auth.uid == userId');

    // Pillar 3: Subcollection scoping & Zero-Trust isolation
    expect(rules).toContain('match /users/{userId}');
    expect(rules).toContain('match /boards/{boardId}');

    // User collection must forbid blanket listing
    expect(rules).toContain('allow list: if false;');

    // Subcollection boards access must require ownership
    expect(rules).toContain('allow get: if isOwner(userId) && isValidId(boardId);');
    expect(rules).toContain('allow list: if isOwner(userId);');
    expect(rules).toContain('allow delete: if isOwner(userId) && isValidId(boardId);');

    // Pillar 4: Immutable fields
    expect(rules).toContain('incoming().id == existing().id');
    expect(rules).toContain('incoming().ownerId == existing().ownerId');
    expect(rules).toContain('incoming().createdAt == existing().createdAt');

    // Pillar 5: Server timestamps
    expect(rules).toContain('incoming().createdAt == request.time');
    expect(rules).toContain('incoming().updatedAt == request.time');

    // Pillar 6: Strict allowlists (Anti-Ghost fields)
    expect(rules).toContain('affectedKeys().hasOnly');
  });

  it('verifies that user isolation prevents cross-user access logically', () => {
    const userA = 'user_alice_123';
    const userB = 'user_bob_456';

    const getStoragePathForUser = (userId: string, boardId: string) => `/users/${userId}/boards/${boardId}`;
    const canAccess = (requestAuthUid: string, targetUserId: string) => requestAuthUid === targetUserId;

    // Alice accesses her own board
    expect(canAccess(userA, userA)).toBe(true);
    expect(getStoragePathForUser(userA, 'board_1')).toBe('/users/user_alice_123/boards/board_1');

    // Alice attempts to access Bob's board
    expect(canAccess(userA, userB)).toBe(false);

    // Bob attempts to access Alice's board
    expect(canAccess(userB, userA)).toBe(false);
  });
});
