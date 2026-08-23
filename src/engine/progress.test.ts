// src/engine/progress.test.ts
// Tests for ProgressTracker — covers percentage calculation and edge cases.

import { describe, it, expect } from 'vitest';
import { calculateProgress } from '@/engine/progress';
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

describe('calculateProgress', () => {
  it('returns 0% when no nodes completed', () => {
    const state = makeState({ completedNodes: [], currentNodeIndex: 0 });
    const result = calculateProgress(state, 10);
    expect(result.percentage).toBe(0);
    expect(result.completedCount).toBe(0);
    expect(result.totalCount).toBe(10);
  });

  it('returns 100% when all nodes completed', () => {
    const nodes = ['n1', 'n2', 'n3', 'n4', 'n5'];
    const state = makeState({ completedNodes: nodes, currentNodeIndex: 5 });
    const result = calculateProgress(state, 5);
    expect(result.percentage).toBe(100);
    expect(result.completedCount).toBe(5);
  });

  it('calculates mid-way percentage correctly', () => {
    const state = makeState({ completedNodes: ['n1', 'n2', 'n3'], currentNodeIndex: 3 });
    const result = calculateProgress(state, 10);
    expect(result.percentage).toBe(30);
  });

  it('rounds percentage to nearest integer', () => {
    // 1/3 = 33.33... → rounds to 33
    const state = makeState({ completedNodes: ['n1'], currentNodeIndex: 1 });
    const result = calculateProgress(state, 3);
    expect(result.percentage).toBe(33);
  });

  it('handles zero total nodes gracefully', () => {
    const state = makeState({ completedNodes: [], currentNodeIndex: 0 });
    const result = calculateProgress(state, 0);
    expect(result.percentage).toBe(0);
    expect(result.completedCount).toBe(0);
    expect(result.totalCount).toBe(0);
  });

  it('clamps percentage to 100 even if completedNodes > totalNodes', () => {
    const state = makeState({ completedNodes: ['n1', 'n2', 'n3', 'n4', 'n5'], currentNodeIndex: 5 });
    const result = calculateProgress(state, 3); // more completed than total
    expect(result.percentage).toBe(100);
  });

  it('returns correct currentNodeIndex', () => {
    const state = makeState({ completedNodes: ['n1'], currentNodeIndex: 3 });
    const result = calculateProgress(state, 10);
    expect(result.currentNodeIndex).toBe(3);
  });
});
