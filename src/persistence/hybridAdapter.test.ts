// src/persistence/hybridAdapter.test.ts
// Unit tests for HybridAdapter.
// Verifies fallback logic, dual-write, and clearState behavior.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HybridAdapter } from './hybridAdapter';
import { LocalStorageAdapter } from './localStorageAdapter';
import type { SupabaseAdapter } from './supabaseAdapter';
import type { StudentState } from '@/types/state';

// Minimal StudentState fixture
const makeState = (overrides: Partial<StudentState> = {}): StudentState => ({
  studentId: 'student-1',
  topicId: 'beginner-html-01',
  currentNodeIndex: 0,
  completedNodes: [],
  quizAttempts: [],
  bestQuizScore: 0,
  xpEarned: 0,
  topicCompleted: false,
  achievement: null,
  xpAwardedForCompletion: false,
  ...overrides,
});

// Factory for a mock SupabaseAdapter
function makeMockSupabase(cachedState: StudentState | null = null): SupabaseAdapter {
  return {
    prefetch: vi.fn().mockResolvedValue(undefined),
    loadState: vi.fn().mockReturnValue(cachedState),
    saveState: vi.fn(),
    clearState: vi.fn(),
  } as unknown as SupabaseAdapter;
}

describe('HybridAdapter', () => {
  let localAdapter: LocalStorageAdapter;

  beforeEach(() => {
    localAdapter = new LocalStorageAdapter();
  });

  // ── loadState ────────────────────────────────────────────────────────────

  it('returns Supabase cached state when available', () => {
    const state = makeState({ xpEarned: 50 });
    const supabase = makeMockSupabase(state);
    const hybrid = new HybridAdapter(supabase, localAdapter);

    const result = hybrid.loadState('beginner-html-01');
    expect(result).toEqual(state);
    expect(supabase.loadState).toHaveBeenCalledWith('beginner-html-01');
  });

  it('falls back to localStorage when Supabase cache returns null', () => {
    const state = makeState({ xpEarned: 20 });
    const supabase = makeMockSupabase(null); // nothing in Supabase cache
    const hybrid = new HybridAdapter(supabase, localAdapter);

    // Pre-populate localStorage
    localAdapter.saveState('beginner-html-01', state);

    const result = hybrid.loadState('beginner-html-01');
    expect(result).toEqual(state);
  });

  it('returns null when both Supabase and localStorage have no state', () => {
    const supabase = makeMockSupabase(null);
    const hybrid = new HybridAdapter(supabase, localAdapter);

    // Use a unique topicId that was never written, ensuring localStorage is clean
    const result = hybrid.loadState('nonexistent-topic-xyz');
    expect(result).toBeNull();
  });

  it('reads from localStorage when supabaseAdapter is null', () => {
    const state = makeState({ xpEarned: 10 });
    localAdapter.saveState('beginner-html-01', state);
    const hybrid = new HybridAdapter(null, localAdapter);

    const result = hybrid.loadState('beginner-html-01');
    expect(result).toEqual(state);
  });

  // ── saveState ────────────────────────────────────────────────────────────

  it('saves to both localStorage and Supabase', () => {
    const state = makeState({ xpEarned: 75 });
    const supabase = makeMockSupabase(null);
    const hybrid = new HybridAdapter(supabase, localAdapter);

    hybrid.saveState('beginner-html-01', state);

    // localStorage should have the state
    expect(localAdapter.loadState('beginner-html-01')).toEqual(state);
    // Supabase saveState should have been called
    expect(supabase.saveState).toHaveBeenCalledWith('beginner-html-01', state);
  });

  it('saves only to localStorage when supabaseAdapter is null', () => {
    const state = makeState({ xpEarned: 30 });
    const hybrid = new HybridAdapter(null, localAdapter);

    hybrid.saveState('beginner-html-01', state);

    expect(localAdapter.loadState('beginner-html-01')).toEqual(state);
  });

  // ── clearState ───────────────────────────────────────────────────────────

  it('clears from both stores', () => {
    const state = makeState({ xpEarned: 90 });
    const supabase = makeMockSupabase(state);
    const hybrid = new HybridAdapter(supabase, localAdapter);

    localAdapter.saveState('beginner-html-01', state);
    hybrid.clearState('beginner-html-01');

    expect(localAdapter.loadState('beginner-html-01')).toBeNull();
    expect(supabase.clearState).toHaveBeenCalledWith('beginner-html-01');
  });

  it('clears only localStorage when supabaseAdapter is null', () => {
    const state = makeState({ xpEarned: 5 });
    localAdapter.saveState('beginner-html-01', state);
    const hybrid = new HybridAdapter(null, localAdapter);

    hybrid.clearState('beginner-html-01');
    expect(localAdapter.loadState('beginner-html-01')).toBeNull();
  });

  // ── prefetch ─────────────────────────────────────────────────────────────

  it('delegates prefetch to supabase adapter', async () => {
    const supabase = makeMockSupabase(null);
    const hybrid = new HybridAdapter(supabase, localAdapter);

    await hybrid.prefetch('beginner-html-01');
    expect(supabase.prefetch).toHaveBeenCalledWith('beginner-html-01');
  });

  it('prefetch is a no-op when supabaseAdapter is null', async () => {
    const hybrid = new HybridAdapter(null, localAdapter);
    // Should not throw
    await expect(hybrid.prefetch('beginner-html-01')).resolves.toBeUndefined();
  });
});
