import type { AnalyticsEvent } from '@zuzz/types';
import type { TrackEventInput, AnalyticsQueryOptions, AnalyticsCountResult } from './types';

/**
 * Server-side analytics event tracker.
 * Stores events to the database via Prisma.
 */
export class AnalyticsTracker {
  private prisma: any;
  private buffer: TrackEventInput[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private bufferSize: number;
  private flushIntervalMs: number;

  constructor(
    prisma: unknown,
    options?: {
      /** Number of events to buffer before flushing (default: 50) */
      bufferSize?: number;
      /** Flush interval in ms (default: 5000) */
      flushIntervalMs?: number;
    },
  ) {
    this.prisma = prisma;
    this.bufferSize = options?.bufferSize ?? 50;
    this.flushIntervalMs = options?.flushIntervalMs ?? 5000;
  }

  /** Start the periodic flush timer */
  start(): void {
    if (this.flushInterval) return;
    this.flushInterval = setInterval(() => {
      void this.flush();
    }, this.flushIntervalMs);
  }

  /** Stop the periodic flush timer and flush remaining events */
  async stop(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    await this.flush();
  }

  /** Track a single event. Buffers it and flushes when the buffer is full. */
  async track(input: TrackEventInput): Promise<void> {
    this.buffer.push(input);
    if (this.buffer.length >= this.bufferSize) {
      await this.flush();
    }
  }

  /** Track an event immediately without buffering */
  async trackImmediate(input: TrackEventInput): Promise<AnalyticsEvent> {
    const id = this.generateId();
    const event = await this.prisma.analyticsEvent.create({
      data: {
        id,
        type: input.type,
        userId: input.userId ?? null,
        sessionId: input.sessionId,
        properties: input.properties ?? {},
        source: input.source ?? 'api',
        userAgent: input.userAgent ?? null,
        ip: input.ip ?? null,
        timestamp: new Date(),
      },
    });
    return event;
  }

  /** Flush all buffered events to the database */
  async flush(): Promise<number> {
    if (this.buffer.length === 0) return 0;

    const events = this.buffer.splice(0, this.buffer.length);
    const now = new Date();

    try {
      const data = events.map((e) => ({
        id: this.generateId(),
        type: e.type,
        userId: e.userId ?? null,
        sessionId: e.sessionId,
        properties: e.properties ?? {},
        source: e.source ?? 'api',
        userAgent: e.userAgent ?? null,
        ip: e.ip ?? null,
        timestamp: now,
      }));

      await this.prisma.analyticsEvent.createMany({ data });
      return data.length;
    } catch (error) {
      // Put events back in the buffer on failure
      this.buffer.unshift(...events);
      console.error('[AnalyticsTracker] Failed to flush events:', error);
      throw error;
    }
  }

  /** Query events from the database */
  async query(options: AnalyticsQueryOptions): Promise<AnalyticsEvent[]> {
    const where: Record<string, unknown> = {};

    if (options.type) where.type = options.type;
    if (options.userId) where.userId = options.userId;
    if (options.from || options.to) {
      where.timestamp = {
        ...(options.from ? { gte: options.from } : {}),
        ...(options.to ? { lte: options.to } : {}),
      };
    }

    return this.prisma.analyticsEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: options.limit ?? 100,
      skip: options.offset ?? 0,
    });
  }

  /** Get event counts grouped by type */
  async countByType(from?: Date, to?: Date): Promise<AnalyticsCountResult[]> {
    const where: Record<string, unknown> = {};
    if (from || to) {
      where.timestamp = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }

    const results = await this.prisma.analyticsEvent.groupBy({
      by: ['type'],
      _count: { type: true },
      where,
      orderBy: { _count: { type: 'desc' } },
    });

    return results.map((r: any) => ({
      type: r.type,
      count: r._count.type,
    }));
  }

  private generateId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}
