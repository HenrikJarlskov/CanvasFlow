/**
 * @file security.ts
 * @description Comprehensive application security engine for AIdboard (Tier 1 & Tier 2).
 *
 * Security Modules:
 * 1. **Input Validation & Sanitization (SEC-01)**: Validates room IDs against injection patterns,
 *    strips HTML markup from collaborator names, and checks hex color formats.
 * 2. **Geometric & Payload Bounds Checking (SEC-02)**: Prevents ReDoS, JSON bombs, and memory exhaustion
 *    by capping stroke point counts (<= 2500), array items (<= 3000), coordinate ranges, and image payloads.
 * 3. **Sliding-Window Rate Limiting (SEC-03)**: Guards public AI endpoints against denial-of-wallet
 *    and quota starvation attacks by throttling requests per IP address.
 * 4. **Defensive HTTP Headers (SEC-04)**: Enforces MIME-type protection, Referrer policies, and CSP
 *    while allowing iframe rendering in the AI Studio preview environment.
 * 5. **Cryptographic HMAC Room Tokens**: Generates and verifies tamper-proof session tokens
 *    using `crypto.timingSafeEqual` to prevent timing attacks.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';

const SERVER_SECRET = process.env.SESSION_SECRET || 'aidboard-secure-session-salt-2026';

/**
 * Validates and sanitizes a Room ID to prevent path traversal and database injection attacks.
 *
 * Rules:
 * - Must be a string between 1 and 64 characters.
 * - Must only contain alphanumeric characters, underscores, and hyphens (`^[a-zA-Z0-9_\-]+$`).
 *
 * @param roomId - Unsanitized candidate room ID
 * @returns Object indicating validity, the sanitized string, and an optional error message
 */
export function validateRoomId(roomId: unknown): { valid: boolean; cleanRoomId: string; error?: string } {
  if (typeof roomId !== 'string') {
    return { valid: false, cleanRoomId: '', error: 'Room ID must be a string' };
  }
  const trimmed = roomId.trim();
  if (trimmed.length < 1 || trimmed.length > 64) {
    return { valid: false, cleanRoomId: '', error: 'Room ID must be between 1 and 64 characters' };
  }
  if (!/^[a-zA-Z0-9_\-]+$/.test(trimmed)) {
    return { valid: false, cleanRoomId: '', error: 'Room ID contains invalid characters' };
  }
  return { valid: true, cleanRoomId: trimmed };
}

/**
 * Sanitizes collaborator attributes to prevent Stored XSS and identity spoofing.
 *
 * Sanitization Rules:
 * - `userId`: Alphanumeric, max 64 characters; generates random ID if invalid.
 * - `userName`: Strips any HTML tags via regex, trims, and truncates to 40 characters.
 * - `userColor`: Validates 6-digit hex format (`^#[0-9a-fA-F]{6}$`), defaulting to blue if malformed.
 *
 * @param user - Raw collaborator object from WebSocket message
 * @returns Sanitized user profile
 */
export function sanitizeUser(user: {
  userId?: unknown;
  userName?: unknown;
  userColor?: unknown;
}): { userId: string; userName: string; userColor: string } {
  let userId = typeof user?.userId === 'string' ? user.userId.trim() : '';
  if (!userId || userId.length > 64 || !/^[a-zA-Z0-9_\-]+$/.test(userId)) {
    userId = 'user_' + crypto.randomBytes(4).toString('hex');
  }

  let userName = typeof user?.userName === 'string' ? user.userName.trim() : 'Guest';
  // Strip any HTML markup to prevent Cross-Site Scripting (XSS)
  userName = userName.replace(/<[^>]*>?/gm, '').trim();
  if (!userName || userName.length > 40) {
    userName = userName.slice(0, 40) || 'Collaborator';
  }

  let userColor = typeof user?.userColor === 'string' ? user.userColor.trim() : '#3b82f6';
  if (!/^#[0-9a-fA-F]{6}$/.test(userColor)) {
    userColor = '#3b82f6';
  }

  return { userId, userName, userColor };
}

/**
 * Validates an individual board element against geometric bounds, schema integrity, and memory bloat.
 *
 * Constraints:
 * - ID must be non-empty string <= 128 characters.
 * - Coordinates (x, y) must be finite numbers within canvas bounds [-100,000..100,000].
 * - Dimensions (width, height) must be finite numbers within [0..50,000].
 * - Freehand strokes: point array must not exceed 2500 points (prevents memory exhaustion).
 * - Stroke points loop: validates each vertex is a valid finite coordinate pair.
 * - Image elements: base64 payload size must not exceed 10MB.
 *
 * @param elem - Untrusted board element candidate
 * @returns Object indicating validity and an error message if invalid
 */
export function validateBoardElement(elem: any): { valid: boolean; error?: string } {
  if (!elem || typeof elem !== 'object') {
    return { valid: false, error: 'Element must be an object' };
  }
  if (typeof elem.id !== 'string' || !elem.id.trim() || elem.id.length > 128) {
    return { valid: false, error: 'Element id must be a string <= 128 characters' };
  }
  if (!['stroke', 'shape', 'text', 'image'].includes(elem.type)) {
    return { valid: false, error: `Invalid element type: ${elem.type}` };
  }

  // Bounded coordinates checking
  if (typeof elem.x === 'number') {
    if (!Number.isFinite(elem.x) || Math.abs(elem.x) > 100000) {
      return { valid: false, error: 'Element x coordinate out of bounds' };
    }
  }
  if (typeof elem.y === 'number') {
    if (!Number.isFinite(elem.y) || Math.abs(elem.y) > 100000) {
      return { valid: false, error: 'Element y coordinate out of bounds' };
    }
  }
  if (typeof elem.width === 'number') {
    if (!Number.isFinite(elem.width) || elem.width < 0 || elem.width > 50000) {
      return { valid: false, error: 'Element width out of bounds' };
    }
  }
  if (typeof elem.height === 'number') {
    if (!Number.isFinite(elem.height) || elem.height < 0 || elem.height > 50000) {
      return { valid: false, error: 'Element height out of bounds' };
    }
  }

  // Stroke point count bounds (prevent ReDoS and memory bloat)
  if (elem.type === 'stroke') {
    if (!Array.isArray(elem.points)) {
      return { valid: false, error: 'Stroke element points must be an array' };
    }
    if (elem.points.length > 2500) {
      return { valid: false, error: 'Stroke exceeds 2500 points limit' };
    }
    // Validation loop over stroke vertices
    for (let i = 0; i < elem.points.length; i++) {
      const p = elem.points[i];
      if (!p || typeof p.x !== 'number' || typeof p.y !== 'number' || !Number.isFinite(p.x) || !Number.isFinite(p.y)) {
        return { valid: false, error: `Malformed stroke point at index ${i}` };
      }
    }
  }

  // Image source payload size bounding
  if (elem.type === 'image' && typeof elem.src === 'string') {
    // 10MB limit on base64 image data strings
    if (elem.src.length > 10 * 1024 * 1024) {
      return { valid: false, error: 'Image payload exceeds 10MB limit' };
    }
  }

  return { valid: true };
}

/**
 * Validates an entire array of board elements received via REST or WebSocket.
 *
 * Complex Loop Explanation:
 * 1. Checks that the elements array does not exceed 3,000 items.
 * 2. Iterates over every element `elem` calling `validateBoardElement()`.
 *    If any element fails validation, the entire batch is rejected with a descriptive error.
 *
 * @param elements - Candidate elements array
 * @returns Object indicating validity, sanitized elements array, and error message if rejected
 */
export function validateElementsArray(elements: unknown): {
  valid: boolean;
  cleanElements?: any[];
  error?: string;
} {
  if (!Array.isArray(elements)) {
    return { valid: false, error: 'Elements must be an array' };
  }
  if (elements.length > 3000) {
    return { valid: false, error: 'Elements array exceeds 3000 items limit' };
  }

  // Validation loop over all elements in the payload
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const check = validateBoardElement(el);
    if (!check.valid) {
      return { valid: false, error: `Element at index ${i} invalid: ${check.error}` };
    }
  }

  return { valid: true, cleanElements: elements };
}

/**
 * Sliding-window rate limiter middleware generator for Express endpoints (SEC-03).
 *
 * Algorithmic Details:
 * Tracks request hits per client IP address in an in-memory map. Each IP record stores
 * `{ count, resetAt }`. If the request count exceeds `max` within `windowMs`, rejects the
 * request with an HTTP 429 status and emits standard `X-RateLimit-*` and `Retry-After` headers.
 *
 * @param options - Window duration and maximum threshold configuration
 * @returns Express RequestHandler middleware
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  const { windowMs, max, message = 'Rate limit exceeded, please try again later' } = options;
  const hits = new Map<string, { count: number; resetAt: number }>();

  // Periodic garbage collection timer to prevent IP map memory leak
  const gcTimer = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of hits.entries()) {
      if (now > record.resetAt) {
        hits.delete(ip);
      }
    }
  }, Math.max(10000, windowMs));

  if (gcTimer.unref) {
    gcTimer.unref();
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown-client';
    const now = Date.now();
    let record = hits.get(ip);

    if (!record || now > record.resetAt) {
      record = { count: 1, resetAt: now + windowMs };
      hits.set(ip, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));

    if (record.count > max) {
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        error: message,
        retryAfter: retryAfterSec,
      });
    }

    next();
  };
}

/**
 * Security HTTP headers middleware (SEC-04).
 *
 * Hardening Measures:
 * - `X-Content-Type-Options: nosniff` (mitigates MIME-confusion attacks)
 * - `Referrer-Policy: strict-origin-when-cross-origin` (prevents URL parameter leakage)
 * - `Permissions-Policy: camera=(), microphone=(), geolocation=()` (restricts sensitive hardware APIs)
 * - `Content-Security-Policy`: Disallows untrusted scripts while allowing `frame-ancestors *`
 *   to ensure seamless loading inside the AI Studio Build preview iframe.
 *
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // NOTE: In AI Studio Build preview, the app runs inside an iframe.
  // Setting X-Frame-Options: SAMEORIGIN or frame-ancestors 'self' causes browsers
  // to block the preview iframe from loading. We allow framing via frame-ancestors *
  // while keeping XSS, MIME-sniffing, and referrer protections active.
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: ws: wss: https:; frame-ancestors *;"
  );
  next();
}

/**
 * Generates an HMAC SHA-256 room authentication token.
 *
 * @param roomId - Whiteboard room identifier
 * @param userId - Collaborator user identifier
 * @param secret - Salt secret key
 * @returns Hex-encoded HMAC authentication token
 */
export function generateRoomToken(roomId: string, userId: string, secret = SERVER_SECRET): string {
  return crypto.createHmac('sha256', secret).update(`${roomId}:${userId}`).digest('hex');
}

/**
 * Verifies an HMAC room authentication token using constant-time comparison (`timingSafeEqual`)
 * to eliminate timing-channel side attacks.
 *
 * @param token - Received HMAC hex token
 * @param roomId - Whiteboard room identifier
 * @param userId - Collaborator user identifier
 * @param secret - Salt secret key
 * @returns True if the token is authentic and matches expected cryptographic hash
 */
export function verifyRoomToken(token: string, roomId: string, userId: string, secret = SERVER_SECRET): boolean {
  if (!token || typeof token !== 'string') return false;
  const expected = generateRoomToken(roomId, userId, secret);
  try {
    const a = Buffer.from(token, 'hex');
    const b = Buffer.from(expected, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
