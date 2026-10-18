import { describe, it, expect } from 'vitest';
import {
  validateRoomId,
  sanitizeUser,
  validateBoardElement,
  validateElementsArray,
  generateRoomToken,
  verifyRoomToken,
  createRateLimiter,
  securityHeadersMiddleware,
} from '../server/security';

describe('Tier 1 Security: Room & User Sanitization (SEC-01)', () => {
  it('validates legitimate room IDs and rejects path traversal or script tags', () => {
    expect(validateRoomId('board-123_abc').valid).toBe(true);
    expect(validateRoomId('default').valid).toBe(true);

    // Malicious patterns
    expect(validateRoomId('../etc/passwd').valid).toBe(false);
    expect(validateRoomId('<script>alert(1)</script>').valid).toBe(false);
    expect(validateRoomId('room with spaces').valid).toBe(false);
    expect(validateRoomId('').valid).toBe(false);
    expect(validateRoomId(null as any).valid).toBe(false);
    expect(validateRoomId('a'.repeat(65)).valid).toBe(false);
  });

  it('sanitizes user names, prevents XSS, and validates hex colors', () => {
    const sanitized = sanitizeUser({
      userId: 'user_123',
      userName: '<script>alert("hacked")</script>Alice',
      userColor: '#ff0000',
    });

    expect(sanitized.userId).toBe('user_123');
    expect(sanitized.userName).toBe('alert("hacked")Alice');
    expect(sanitized.userColor).toBe('#ff0000');
  });

  it('generates fallback userId and default color for malformed inputs', () => {
    const sanitized = sanitizeUser({
      userId: 'bad id with spaces & symbols!',
      userName: 'Bob',
      userColor: 'javascript:alert(1)',
    });

    expect(sanitized.userId.startsWith('user_')).toBe(true);
    expect(sanitized.userColor).toBe('#3b82f6');
  });

  it('issues and verifies HMAC room tokens securely', () => {
    const roomId = 'board_finance_q3';
    const userId = 'user_789';
    const token = generateRoomToken(roomId, userId);

    expect(typeof token).toBe('string');
    expect(token.length).toBe(64); // sha256 hex string

    expect(verifyRoomToken(token, roomId, userId)).toBe(true);
    expect(verifyRoomToken(token, 'other_room', userId)).toBe(false);
    expect(verifyRoomToken(token, roomId, 'other_user')).toBe(false);
    expect(verifyRoomToken('forged_token', roomId, userId)).toBe(false);
  });
});

describe('Tier 1 Security: WebSocket Payload Limits & Schema Bounds (SEC-02)', () => {
  it('validates legitimate shape and stroke elements', () => {
    const stroke = {
      id: 'stroke_1',
      type: 'stroke',
      points: [
        { x: 10, y: 20 },
        { x: 30, y: 40 },
      ],
      color: '#000000',
      strokeWidth: 2,
    };
    expect(validateBoardElement(stroke).valid).toBe(true);

    const shape = {
      id: 'shape_1',
      type: 'shape',
      shapeType: 'rectangle',
      x: 100,
      y: 150,
      width: 200,
      height: 100,
    };
    expect(validateBoardElement(shape).valid).toBe(true);
  });

  it('rejects elements with missing id, invalid types, or out-of-bound coords', () => {
    expect(validateBoardElement({}).valid).toBe(false);
    expect(validateBoardElement({ id: '1', type: 'unknown_type' }).valid).toBe(false);
    expect(validateBoardElement({ id: '1', type: 'shape', x: Infinity }).valid).toBe(false);
    expect(validateBoardElement({ id: '1', type: 'shape', x: 99_999_999 }).valid).toBe(false);
    expect(validateBoardElement({ id: '1', type: 'shape', x: NaN }).valid).toBe(false);
  });

  it('rejects stroke elements with excessive points (>2500)', () => {
    const hugeStroke = {
      id: 'stroke_huge',
      type: 'stroke',
      points: Array.from({ length: 2501 }, (_, i) => ({ x: i, y: i })),
    };
    const res = validateBoardElement(hugeStroke);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('exceeds 2500 points');
  });

  it('rejects elements array exceeding 3000 items', () => {
    const hugeArray = Array.from({ length: 3001 }, (_, i) => ({
      id: `el_${i}`,
      type: 'shape',
      x: 10,
      y: 10,
    }));
    const res = validateElementsArray(hugeArray);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('exceeds 3000 items');
  });
});

describe('Tier 1 Security: Rate Limiting & HTTP Headers (SEC-03 & SEC-04)', () => {
  it('enforces rate limiting when max threshold is exceeded', () => {
    const limiter = createRateLimiter({
      windowMs: 1000,
      max: 2,
    });

    const mockRes = () => {
      const headers: Record<string, any> = {};
      let statusCode = 200;
      let body: any = null;
      return {
        setHeader: (k: string, v: any) => {
          headers[k] = v;
        },
        status: (code: number) => {
          statusCode = code;
          return {
            json: (data: any) => {
              body = data;
            },
          };
        },
        getHeader: (k: string) => headers[k],
        getStatusCode: () => statusCode,
        getBody: () => body,
      };
    };

    const req = {
      headers: {},
      socket: { remoteAddress: '127.0.0.1' },
    } as any;

    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    // Request 1: allowed
    const res1 = mockRes();
    limiter(req, res1 as any, next);
    expect(nextCalled).toBe(true);

    // Request 2: allowed
    nextCalled = false;
    const res2 = mockRes();
    limiter(req, res2 as any, next);
    expect(nextCalled).toBe(true);

    // Request 3: blocked with 429
    nextCalled = false;
    const res3 = mockRes();
    limiter(req, res3 as any, next);
    expect(nextCalled).toBe(false);
    expect(res3.getStatusCode()).toBe(429);
    expect(res3.getBody().error).toContain('Rate limit exceeded');
    expect(res3.getHeader('Retry-After')).toBeDefined();
  });

  it('sets required security headers including CSP and nosniff', () => {
    const headers: Record<string, string> = {};
    const mockRes = {
      setHeader: (k: string, v: string) => {
        headers[k] = v;
      },
    } as any;

    let nextCalled = false;
    securityHeadersMiddleware({} as any, mockRes, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
    expect(headers['Content-Security-Policy']).toContain("frame-ancestors *");
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['X-Frame-Options']).toBeUndefined();
  });
});
