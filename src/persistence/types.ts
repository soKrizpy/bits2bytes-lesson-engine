// src/persistence/types.ts
// Persistence abstraction interface.
//
// The engine never directly accesses localStorage, Supabase, or any storage API.
// All state I/O flows through this interface.
//
// V1 implementation: LocalStorageAdapter (see localStorageAdapter.ts)
// Future implementation: SupabaseAdapter — swap the adapter, zero UI changes required.
//
// Future LMS integration note:
// When the BITS2BYTES LMS provides student identity (topicId + studentId),
// the SupabaseAdapter will use those values to store per-student progress.
// The interface signature remains unchanged.

import type { StudentState } from '@/types/state';

/**
 * Persistence adapter interface.
 * Implementations must be synchronous or return Promises — V1 uses synchronous localStorage.
 * Future Supabase adapter will use async operations behind the same interface.
 */
export interface IPersistenceAdapter {
  /**
   * Load the student's state for a given topic.
   * Returns null if no state exists yet (new student or cleared state).
   * Returns null on any storage error (quota exceeded, parse error, etc.).
   */
  loadState(topicId: string): StudentState | null;

  /**
   * Save the student's state for a given topic.
   * Silently fails on any storage error — caller surfaces error via saveError signal.
   */
  saveState(topicId: string, state: StudentState): void;

  /**
   * Clear the student's state for a given topic.
   * Used by resetTopic() to start fresh.
   */
  clearState(topicId: string): void;
}
