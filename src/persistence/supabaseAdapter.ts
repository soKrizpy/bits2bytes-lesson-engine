// src/persistence/supabaseAdapter.ts
// Supabase-backed IPersistenceAdapter for the Lesson Engine.
//
// Because IPersistenceAdapter is synchronous but Supabase is async, this adapter
// uses an internal in-memory cache Map as the synchronous read layer.
//
// Usage pattern:
//   1. Call `await adapter.prefetch(topicId)` during component mount to populate cache.
//   2. Subsequent `loadState(topicId)` calls read from cache (instant, synchronous).
//   3. `saveState()` writes to cache immediately AND fires async upsert (fire-and-forget).
//   4. `clearState()` clears cache AND fires async delete.
//
// The LMS API base URL is either:
//   - Same-origin when engine is served via /learning/* proxy (default)
//   - An explicit base URL passed to the constructor for standalone deployments

import type { IPersistenceAdapter } from './types';
import type { StudentState } from '@/types/state';

export interface SupabaseAdapterOptions {
  /**
   * Base URL for the LMS API.
   * Defaults to '' (same-origin) which works when engine is proxied via /learning/*.
   * For standalone: pass the full LMS origin, e.g. 'https://lms.bits2bytes.id'
   */
  apiBase?: string;
  /** The authenticated student's Supabase user ID. */
  studentId: string;
}

export class SupabaseAdapter implements IPersistenceAdapter {
  private readonly apiBase: string;
  private readonly studentId: string;
  private readonly cache = new Map<string, StudentState | null>();
  /** Tracks in-flight save operations per topicId to avoid concurrent writes. */
  private readonly savingPromises = new Map<string, Promise<void>>();

  constructor(options: SupabaseAdapterOptions) {
    this.apiBase = options.apiBase ?? '';
    this.studentId = options.studentId;
  }

  /**
   * Async prefetch — call this during mount to populate the cache before
   * the synchronous `loadState()` is called by the engine.
   */
  async prefetch(topicId: string): Promise<void> {
    if (this.cache.has(topicId)) return;

    try {
      const url = `${this.apiBase}/api/engine/progress?topicId=${encodeURIComponent(topicId)}&studentId=${encodeURIComponent(this.studentId)}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000); // 3s hard timeout

      const res = await fetch(url, {
        credentials: 'include',
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        this.cache.set(topicId, null);
        return;
      }
      const data = await res.json() as { state: StudentState | null };
      this.cache.set(topicId, data.state);
    } catch {
      // AbortError (timeout) or network failure — cache null for graceful fallback
      this.cache.set(topicId, null);
    }
  }

  /** Synchronous load from cache. Returns null if prefetch hasn't run yet. */
  loadState(topicId: string): StudentState | null {
    return this.cache.get(topicId) ?? null;
  }

  /**
   * Writes to cache immediately (synchronous), then fires async upsert.
   * Never throws — errors are swallowed so learning flow is uninterrupted.
   */
  saveState(topicId: string, state: StudentState): void {
    // Update cache synchronously
    this.cache.set(topicId, state);

    // Fire-and-forget async save, serialised per topicId
    const prev = this.savingPromises.get(topicId) ?? Promise.resolve();
    const next = prev.then(async () => {
      try {
        const url = `${this.apiBase}/api/engine/progress`;
        await fetch(url, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topicId, state }),
        });
      } catch {
        // Swallow — HybridAdapter will have already saved to localStorage
      }
    });
    this.savingPromises.set(topicId, next);
    // Clean up promise reference when done
    void next.finally(() => {
      if (this.savingPromises.get(topicId) === next) {
        this.savingPromises.delete(topicId);
      }
    });
  }

  /** Clears cache and fires async DELETE. */
  clearState(topicId: string): void {
    this.cache.delete(topicId);

    void (async () => {
      try {
        const url = `${this.apiBase}/api/engine/progress?topicId=${encodeURIComponent(topicId)}`;
        await fetch(url, { method: 'DELETE', credentials: 'include' });
      } catch {
        // Swallow
      }
    })();
  }
}
