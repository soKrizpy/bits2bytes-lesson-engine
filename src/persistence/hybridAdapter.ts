// src/persistence/hybridAdapter.ts
// Hybrid IPersistenceAdapter: Supabase (primary) + localStorage (fallback/cache).
//
// Strategy:
//   loadState()  → Supabase cache first, then localStorage
//   saveState()  → always saves to localStorage (reliable); Supabase is fire-and-forget
//   clearState() → clears both
//
// When `supabaseAdapter` is null (no authenticated student), behaves as a pure
// localStorage adapter. This preserves the existing anonymous-user experience.

import type { IPersistenceAdapter } from './types';
import type { StudentState } from '@/types/state';
import type { SupabaseAdapter } from './supabaseAdapter';
import { LocalStorageAdapter } from './localStorageAdapter';

export class HybridAdapter implements IPersistenceAdapter {
  private readonly supabase: SupabaseAdapter | null;
  private readonly local: LocalStorageAdapter;

  constructor(supabase: SupabaseAdapter | null, local: LocalStorageAdapter) {
    this.supabase = supabase;
    this.local = local;
  }

  /**
   * Prefetch state from Supabase for the given topicId.
   * Must be awaited during component mount before loadState() is called.
   * No-op when supabase adapter is null.
   */
  async prefetch(topicId: string): Promise<void> {
    if (this.supabase !== null) {
      await this.supabase.prefetch(topicId);
    }
  }

  /**
   * Load priority: Supabase cache → localStorage.
   * Returns null only if both sources return null (genuine first visit).
   */
  loadState(topicId: string): StudentState | null {
    if (this.supabase !== null) {
      const fromSupabase = this.supabase.loadState(topicId);
      if (fromSupabase !== null) return fromSupabase;
    }
    return this.local.loadState(topicId);
  }

  /**
   * Saves to localStorage synchronously, then fires Supabase save async.
   * localStorage acts as an immediate reliable cache; Supabase is the durable store.
   */
  saveState(topicId: string, state: StudentState): void {
    this.local.saveState(topicId, state);
    this.supabase?.saveState(topicId, state);
  }

  /** Clears from both stores. */
  clearState(topicId: string): void {
    this.local.clearState(topicId);
    this.supabase?.clearState(topicId);
  }
}
