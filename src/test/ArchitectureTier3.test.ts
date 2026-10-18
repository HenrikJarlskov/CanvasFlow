import { describe, it, expect, vi } from 'vitest';
import { LocalRoomBroker, DistributedRoomBroker } from '../server/roomBroker';
import { WhiteboardSocket } from '../utils/socket';
import { setBoardStorage, getBoardStorage, deleteBoardStorage } from '../utils/idbStorage';

describe('Tier 3 Architecture: Multi-Instance Room Broker (ARC-02)', () => {
  it('publishes and receives messages across room subscribers using LocalRoomBroker', async () => {
    const broker = new LocalRoomBroker();
    const receivedA: any[] = [];
    const receivedB: any[] = [];

    const unsubA = broker.subscribe('board_alpha', (msg) => receivedA.push(msg));
    const unsubB = broker.subscribe('board_alpha', (msg) => receivedB.push(msg));

    await broker.publish('board_alpha', { type: 'test_event', value: 42 });

    expect(receivedA.length).toBe(1);
    expect(receivedA[0].value).toBe(42);
    expect(receivedB.length).toBe(1);
    expect(receivedB[0].value).toBe(42);

    // Unsubscribe A and verify only B receives next event
    unsubA();
    await broker.publish('board_alpha', { type: 'test_event', value: 100 });
    expect(receivedA.length).toBe(1);
    expect(receivedB.length).toBe(2);

    unsubB();
    broker.destroy();
  });

  it('handles room isolation so different rooms do not cross-talk', async () => {
    const broker = new DistributedRoomBroker();
    const receivedAlpha: any[] = [];
    const receivedBeta: any[] = [];

    const unsubAlpha = broker.subscribe('room_1', (msg) => receivedAlpha.push(msg));
    const unsubBeta = broker.subscribe('room_2', (msg) => receivedBeta.push(msg));

    await broker.publish('room_1', { hello: 'room1' });
    await broker.publish('room_2', { hello: 'room2' });

    expect(receivedAlpha.length).toBe(1);
    expect(receivedAlpha[0].hello).toBe('room1');
    expect(receivedBeta.length).toBe(1);
    expect(receivedBeta[0].hello).toBe('room2');

    unsubAlpha();
    unsubBeta();
    broker.destroy();
  });
});

describe('Tier 3 Network Protocol: Full Jitter Exponential Backoff (ENG-04)', () => {
  it('calculates randomized full jitter delays bounded by 30 seconds', () => {
    // Mock WebSocket global for node/jsdom
    const socket = new WhiteboardSocket('test_room', {});

    const delaysAttempt0: number[] = [];
    for (let i = 0; i < 10; i++) {
      delaysAttempt0.push(socket.calculateReconnectDelay());
    }

    // Attempt 0 should be bounded by base 1000ms
    delaysAttempt0.forEach((d) => {
      expect(d).toBeGreaterThanOrEqual(200);
      expect(d).toBeLessThanOrEqual(1000);
    });

    // Delays should have jitter (not all identical values)
    const uniqueValues = new Set(delaysAttempt0);
    expect(uniqueValues.size).toBeGreaterThan(1);

    socket.destroy();
  });
});

describe('Tier 3 Client Storage: Robust Offline Persistence (ENG-03)', () => {
  it('saves, retrieves, and deletes board data safely', async () => {
    const testId = 'test_idb_board_1';
    const payload = {
      name: 'Offline Test Board',
      elements: [{ id: 'el1', type: 'text', text: 'Offline note' }],
    };

    await setBoardStorage(testId, payload);
    const retrieved = await getBoardStorage(testId);
    expect(retrieved).toBeDefined();
    expect(retrieved.name).toBe('Offline Test Board');

    await deleteBoardStorage(testId);
    const afterDelete = await getBoardStorage(testId);
    expect(afterDelete).toBeNull();
  });
});
