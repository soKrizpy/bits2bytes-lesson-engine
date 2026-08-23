// src/persistence/localStorageAdapter.ts
// V1 implementation of IPersistenceAdapter using browser localStorage.
//
// ARCHITECTURE NOTE:
// This is the ONLY storage-specific code in V1. Everything else is agnostic.
// To switch to Supabase in a future version: implement IPersistenceAdapter
// in a new SupabaseAdapter class. Zero UI or engine changes required.
//
// Future LMS integration:
// When the BITS2BYTES LMS provides student identity (topicId + studentId),
// the SupabaseAdapter will use those values for per-student persistence.
// The interface contract (loadState/saveState/clearState) remains identical.
//
// Storage key format: b2b_lesson_state_{topicId}

import type { IPersistenceAdapter } from './types';
import type { StudentState } from '@/types/state';

const KEY_PREFIX = 'b2b_lesson_state_';

function storageKey(topicId: string): string {
  return `${KEY_PREFIX}${topicId}`;
}

/**
 * Detects whether localStorage is available.
 * Returns false in SSR (no window) and in private browsing where storage is blocked.
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const probe = '__b2b_storage_probe__';
    localStorage.setItem(probe, probe);
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/**
 * V1 persistence adapter — browser localStorage.
 *
 * Error handling policy:
 * - loadState  → returns null on ANY error (SSR, missing key, parse failure)
 * - saveState  → silently swallows errors; caller sets saveError signal
 * - clearState → silently swallows errors
 *
 * This policy ensures persistence failures NEVER interrupt the student's
 * learning flow. State is always held in-memory for the current session.
 */
export class LocalStorageAdapter implements IPersistenceAdapter {
  loadState(topicId: string): StudentState | null {
    if (!isLocalStorageAvailable()) return null;

    try {
      const raw = localStorage.getItem(storageKey(topicId));
      if (raw === null) return null;
      return JSON.parse(raw) as StudentState;
    } catch {
      // Covers JSON.parse failures or any unexpected storage error
      return null;
    }
  }

  saveState(topicId: string, state: StudentState): void {
    if (!isLocalStorageAvailable()) return;

    try {
      localStorage.setItem(storageKey(topicId), JSON.stringify(state));
    } catch {
      // Quota exceeded or security error — silently swallow.
      // The useEngineState hook detects failure by comparing before/after
      // and sets saveError to surface a non-blocking banner to the student.
    }
  }

  clearState(topicId: string): void {
    if (!isLocalStorageAvailable()) return;

    try {
      localStorage.removeItem(storageKey(topicId));
    } catch {
      // Silently swallow
    }
  }
}
