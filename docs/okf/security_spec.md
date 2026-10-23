# Firestore Security Specification & Attack Vectors

## 1. Data Invariants
1. **Strict User Isolation**: Every whiteboard document resides under `/users/{userId}/boards/{boardId}`. Only the authenticated user whose `request.auth.uid == userId` can read, list, create, update, or delete boards in that subcollection.
2. **Verified Identity**: Write operations are strictly limited to authenticated users whose `request.auth.token.email_verified == true`.
3. **Immutable Ownership**: The `ownerId` field in the board document must match `request.auth.uid` and `{userId}` on creation and can never be changed or transferred.
4. **Temporal Integrity**: `createdAt` is immutable after creation and must equal `request.time` upon creation. `updatedAt` must equal `request.time` upon update.
5. **No Cross-User Access**: An authenticated user cannot read, query, list, or mutate another user's profile or boards under any circumstance.
6. **Anti-Resource Poisoning**: Document IDs and string fields are strictly bounded in length and character sets. Unregistered shadow fields are prohibited.

---

## 2. The "Dirty Dozen" Attack Payloads

### Payload 1: Unauthenticated Read
- **Target**: `GET /users/user_abc123/boards/board_1`
- **Auth**: `request.auth = null`
- **Expected**: `PERMISSION_DENIED`

### Payload 2: Cross-User Subcollection Read
- **Target**: `GET /users/victim_uid/boards/board_1`
- **Auth**: `{ uid: "attacker_uid", token: { email_verified: true } }`
- **Expected**: `PERMISSION_DENIED`

### Payload 3: Cross-User Subcollection List/Query
- **Target**: `LIST /users/victim_uid/boards`
- **Auth**: `{ uid: "attacker_uid", token: { email_verified: true } }`
- **Expected**: `PERMISSION_DENIED`

### Payload 4: Cross-User Document Creation
- **Target**: `CREATE /users/victim_uid/boards/board_1`
- **Auth**: `{ uid: "attacker_uid", token: { email_verified: true } }`
- **Data**: `{ id: "board_1", ownerId: "attacker_uid", name: "Infiltrate", createdAt: request.time, updatedAt: request.time }`
- **Expected**: `PERMISSION_DENIED`

### Payload 5: Identity Spoofing on Own Path
- **Target**: `CREATE /users/attacker_uid/boards/board_1`
- **Auth**: `{ uid: "attacker_uid", token: { email_verified: true } }`
- **Data**: `{ id: "board_1", ownerId: "victim_uid", name: "Spoofed Board", createdAt: request.time, updatedAt: request.time }`
- **Expected**: `PERMISSION_DENIED` (ownerId must match request.auth.uid)

### Payload 6: Oversized / Malformed Document ID Injection
- **Target**: `CREATE /users/attacker_uid/boards/very-long-id-repeated-overflow-attack-1024-chars-poisoning...`
- **Auth**: `{ uid: "attacker_uid", token: { email_verified: true } }`
- **Expected**: `PERMISSION_DENIED` (ID must match regex and size <= 128)

### Payload 7: Unverified Email Write
- **Target**: `CREATE /users/attacker_uid/boards/board_1`
- **Auth**: `{ uid: "attacker_uid", token: { email_verified: false } }`
- **Data**: `{ id: "board_1", ownerId: "attacker_uid", name: "My Board", createdAt: request.time, updatedAt: request.time }`
- **Expected**: `PERMISSION_DENIED` (Requires email_verified == true)

### Payload 8: Shadow Field Injection (Ghost Privilege Escalation)
- **Target**: `CREATE /users/attacker_uid/boards/board_1`
- **Auth**: `{ uid: "attacker_uid", token: { email_verified: true } }`
- **Data**: `{ id: "board_1", ownerId: "attacker_uid", name: "My Board", role: "superadmin", isGlobal: true, createdAt: request.time, updatedAt: request.time }`
- **Expected**: `PERMISSION_DENIED` (hasOnly check rejects undeclared shadow keys)

### Payload 9: Missing Required Fields
- **Target**: `CREATE /users/attacker_uid/boards/board_1`
- **Auth**: `{ uid: "attacker_uid", token: { email_verified: true } }`
- **Data**: `{ id: "board_1" }`
- **Expected**: `PERMISSION_DENIED` (Missing name, ownerId, createdAt, updatedAt)

### Payload 10: Value Poisoning (Denial of Wallet Buffer Overrun)
- **Target**: `CREATE /users/attacker_uid/boards/board_1`
- **Auth**: `{ uid: "attacker_uid", token: { email_verified: true } }`
- **Data**: `{ id: "board_1", ownerId: "attacker_uid", name: "<5000 chars of padding>", createdAt: request.time, updatedAt: request.time }`
- **Expected**: `PERMISSION_DENIED` (name length must be <= 100)

### Payload 11: Immortal Ownership Hijack Mutation
- **Target**: `UPDATE /users/attacker_uid/boards/board_1`
- **Auth**: `{ uid: "attacker_uid", token: { email_verified: true } }`
- **Existing**: `{ id: "board_1", ownerId: "attacker_uid", name: "My Board", createdAt: request.time, updatedAt: request.time }`
- **Update**: `{ ownerId: "victim_uid", updatedAt: request.time }`
- **Expected**: `PERMISSION_DENIED` (ownerId and createdAt are immutable)

### Payload 12: Cross-User Document Deletion
- **Target**: `DELETE /users/victim_uid/boards/board_1`
- **Auth**: `{ uid: "attacker_uid", token: { email_verified: true } }`
- **Expected**: `PERMISSION_DENIED`
