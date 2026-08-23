// src/engine/xp.test.ts
// Tests for XPCalculator — covers idempotency, node XP, completion XP.

import { describe, it, expect } from 'vitest';
import { awardNodeXP, awardCompletionXP } from '@/engine/xp';
import type { StudentState } from '@/types/state';
import { INITIAL_STUDENT_STATE } from '@/types/state';

function makeState(overrides: Partial<StudentState> = {}): StudentState {
  return {
    ...INITIAL_STUDENT_STATE,
    studentId: 'test-student',
    topicId: 'test-topic',
    ...overrides,
  };
}

describe('awardNodeXP', () => {
  it('awards XP for a new node', () => {
    const state = makeState({ xpEarned: 0, completedNodes: [] });
    const result = awardNodeXP(state, 'node-01', 5);
    expect(result.xpEarned).toBe(5);
  });

  it('does not re-award XP for an already-completed node (idempotency)', () => {
    const state = makeState({ xpEarned: 5, completedNodes: ['node-01'] });
    const result = awardNodeXP(state, 'node-01', 5);
    expect(result.xpEarned).toBe(5); // unchanged
    expect(result).toBe(state); // same reference — no new object
  });

  it('does not award XP when xpAmount is undefined', () => {
    const state = makeState({ xpEarned: 10, completedNodes: [] });
    const result = awardNodeXP(state, 'node-02', undefined);
    expect(result.xpEarned).toBe(10);
  });

  it('does not award XP when xpAmount is 0', () => {
    const state = makeState({ xpEarned: 10, completedNodes: [] });
    const result = awardNodeXP(state, 'node-02', 0);
    expect(result.xpEarned).toBe(10);
  });

  it('awards XP for a different node even when completedNodes contains others', () => {
    const state = makeState({ xpEarned: 5, completedNodes: ['node-01'] });
    const result = awardNodeXP(state, 'node-02', 10);
    expect(result.xpEarned).toBe(15);
  });

  it('does not mutate input state', () => {
    const state = makeState({ xpEarned: 0, completedNodes: [] });
    const frozen = Object.freeze({ ...state });
    const result = awardNodeXP(frozen as StudentState, 'node-01', 5);
    expect(result).not.toBe(frozen);
    expect(result.xpEarned).toBe(5);
  });
});

describe('awardCompletionXP', () => {
  it('awards completion XP the first time', () => {
    const state = makeState({ xpEarned: 60, xpAwardedForCompletion: false });
    const result = awardCompletionXP(state, 100);
    expect(result.xpEarned).toBe(160);
    expect(result.xpAwardedForCompletion).toBe(true);
  });

  it('does not re-award completion XP when already awarded (idempotency)', () => {
    const state = makeState({ xpEarned: 160, xpAwardedForCompletion: true });
    const result = awardCompletionXP(state, 100);
    expect(result.xpEarned).toBe(160); // unchanged
    expect(result).toBe(state); // same reference
  });

  it('sets xpAwardedForCompletion = true even when topicXP is 0', () => {
    const state = makeState({ xpEarned: 50, xpAwardedForCompletion: false });
    const result = awardCompletionXP(state, 0);
    expect(result.xpEarned).toBe(50);
    expect(result.xpAwardedForCompletion).toBe(true);
  });

  it('does not mutate input state', () => {
    const state = makeState({ xpEarned: 0, xpAwardedForCompletion: false });
    const result = awardCompletionXP(state, 100);
    expect(result).not.toBe(state);
    expect(result.xpEarned).toBe(100);
  });
});
