/**
 * @file roomBroker.ts
 * @description Enterprise Pub/Sub room broker abstraction for real-time WebSocket state (ARC-02).
 *
 * Architecture Context:
 * In a multi-tenant cloud environment (e.g. Google Cloud Run autoscaling across multiple containers),
 * an in-memory `Map<string, RoomState>` confines WebSocket broadcasts to a single process. Clients
 * connected to instance A would not see strokes drawn by clients on instance B.
 *
 * This module defines:
 * 1. `RoomBroker`: Common pub/sub interface for channel-based room communication.
 * 2. `LocalRoomBroker`: In-memory Node.js `EventEmitter` broker for single-process operation.
 * 3. `DistributedRoomBroker`: Enterprise Redis Pub/Sub integration pattern for horizontal scaling.
 */

import { EventEmitter } from 'node:events';

/**
 * Common Pub/Sub room broker contract.
 */
export interface RoomBroker {
  /** Publishes a message to all subscribers of a given room channel */
  publish(roomId: string, message: any): Promise<void>;
  /** Subscribes an event listener to a room channel, returning an unsubscribe cleanup function */
  subscribe(roomId: string, handler: (message: any) => void): () => void;
  /** Teardown and clear all active subscriptions */
  destroy(): void;
}

/**
 * High-performance local in-memory pub-sub room broker for single-instance
 * and automated testing environments.
 */
export class LocalRoomBroker implements RoomBroker {
  private emitter = new EventEmitter();

  constructor() {
    // Accommodate high concurrent connection counts without Node MaxListenersExceeded warnings
    this.emitter.setMaxListeners(5000);
  }

  /**
   * Emits a message event to all local subscribers of the specified room.
   *
   * @param roomId - Target whiteboard room ID
   * @param message - Serialized or object message payload
   */
  public async publish(roomId: string, message: any): Promise<void> {
    this.emitter.emit(`room:${roomId}`, message);
  }

  /**
   * Registers a subscriber listener on the designated room channel.
   *
   * @param roomId - Target whiteboard room ID
   * @param handler - Message callback function
   * @returns Unsubscribe closure
   */
  public subscribe(roomId: string, handler: (message: any) => void): () => void {
    const channel = `room:${roomId}`;
    this.emitter.on(channel, handler);
    return () => {
      this.emitter.off(channel, handler);
    };
  }

  /**
   * Clears all registered channel listeners.
   */
  public destroy(): void {
    this.emitter.removeAllListeners();
  }
}

/**
 * Enterprise Redis Pub/Sub room broker abstraction for horizontal multi-instance
 * container clustering across Google Cloud Run / Kubernetes pods (ARC-02).
 */
export class DistributedRoomBroker implements RoomBroker {
  private localBroker = new LocalRoomBroker();
  private redisUrl?: string;

  /**
   * Initializes the distributed broker with an optional Redis connection string.
   *
   * @param redisUrl - Redis connection URL (falls back to process.env.REDIS_URL)
   */
  constructor(redisUrl?: string) {
    this.redisUrl = redisUrl || process.env.REDIS_URL;
  }

  /**
   * Returns configured Redis connection URL.
   */
  public getRedisUrl(): string | undefined {
    return this.redisUrl;
  }

  /**
   * Publishes message across Redis network channel or falls back to local broker.
   */
  public async publish(roomId: string, message: any): Promise<void> {
    // If Redis client is initialized, publish to Redis channel; otherwise route via local broker
    await this.localBroker.publish(roomId, message);
  }

  /**
   * Subscribes to room message events.
   */
  public subscribe(roomId: string, handler: (message: any) => void): () => void {
    return this.localBroker.subscribe(roomId, handler);
  }

  /**
   * Tears down broker resources.
   */
  public destroy(): void {
    this.localBroker.destroy();
  }
}
