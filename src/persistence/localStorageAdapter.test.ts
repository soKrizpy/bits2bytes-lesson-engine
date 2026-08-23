// src/persistence/localStorageAdapter.test.ts
// Tests for LocalStorageAdapter — round-trip, missing key, parse error, clear, topic isolation.

import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageAdapter } from '@/persistence/localStorageAdapter';
import type { StudentState } from '@/types/state';
import { INITIAL_STUDENT_STATE } from '@/types/state';

function makeState(topicId: string, overrides: Partial<StudentState> = {}): StudentState {
  return {
    ...INITIAL_STUDENT_STATE,
    studentId: 'test-student',
    topicId,
    ...overrides,
  };
}

const adapter = new LocalStorageAdapter();

beforeEach(() => {
  localStorage.clear();
});

describe('LocalStorageAdapter — basic round-trip', () => {
  it('saves and restores state correctly', () => {
    const state = makeState('test-topic-01', { xpEarned: 42, completedNodes: ['n1', 'n2'] });
    adapter.saveState('test-topic-01', state);
    const loaded = adapter.loadState('test-topic-01');
    expect(loaded).not.toBeNull();
    expect(loaded?.xpEarned).toBe(42);
    expect(loaded?.completedNodes).toEqual(['n1', 'n2']);
  });

  it('returns null when no state has been saved', () => {
    const loaded = adapter.loadState('never-saved-topic');
    expect(loaded).toBeNull();
  });

  it('clearState causes subsequent loadState to return null', () => {
    const state = makeState('clear-test');
    adapter.saveState('clear-test', state);
    adapter.clearState('clear-test');
    expect(adapter.loadState('clear-test')).toBeNull();
  });

  it('round-trip preserves all StudentState fields', () => {
    const state = makeState('full-state-test', {
      currentNodeIndex: 5,
      completedNodes: ['n1', 'n2', 'n3', 'n4', 'n5'],
      quizAttempts: [
        { attemptNumber: 1, score: 60, answers: { q1: 'A' }, submittedAt: '2025-01-01T00:00:00Z' },
      ],
      bestQuizScore: 60,
      xpEarned: 55,
      topicCompleted: false,
      achievement: null,
      xpAwardedForCompletion: false,
    });
    adapter.saveState('full-state-test', state);
    const loaded = adapter.loadState('full-state-test');
    expect(loaded).toStrictEqual(state);
  });
});

describe('LocalStorageAdapter — topic isolation', () => {
  it('different topics have independent state', () => {
    const stateA = makeState('topic-a', { xpEarned: 10 });
    const stateB = makeState('topic-b', { xpEarned: 99 });
    adapter.saveState('topic-a', stateA);
    adapter.saveState('topic-b', stateB);
    expect(adapter.loadState('topic-a')?.xpEarned).toBe(10);
    expect(adapter.loadState('topic-b')?.xpEarned).toBe(99);
  });

  it('clearing one topic does not affect another', () => {
    const stateA = makeState('topic-a', { xpEarned: 10 });
    const stateB = makeState('topic-b', { xpEarned: 99 });
    adapter.saveState('topic-a', stateA);
    adapter.saveState('topic-b', stateB);
    adapter.clearState('topic-a');
    expect(adapter.loadState('topic-a')).toBeNull();
    expect(adapter.loadState('topic-b')?.xpEarned).toBe(99);
  });
});

describe('LocalStorageAdapter — error resilience', () => {
  it('returns null when stored data is not valid JSON', () => {
    localStorage.setItem('b2b_lesson_state_corrupt-topic', 'THIS IS NOT JSON {{{');
    const loaded = adapter.loadState('corrupt-topic');
    expect(loaded).toBeNull();
  });
});
