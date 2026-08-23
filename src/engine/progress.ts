// src/engine/progress.ts
// Layer 2 — Engine Core.
// ProgressTracker: pure functions for calculating student progress.
// No React, no side effects. Topic-agnostic.

import type { StudentState } from '@/types/state';

export interface ProgressInfo {
  /** Number of nodes the student has completed. */
  completedCount: number;
  /** Total number of nodes in the learning path. */
  totalCount: number;
  /**
   * Overall progress as an integer percentage [0, 100].
   * Calculated as Math.round((completedCount / totalCount) * 100), clamped to [0, 100].
   * Returns 0 when totalCount is 0.
   */
  percentage: number;
  /** Zero-based index of the student's current node. */
  currentNodeIndex: number;
}

/**
 * Calculates the student's current progress through a topic.
 *
 * Pure function — takes state, returns progress info. No mutations.
 *
 * @param state - The current StudentState
 * @param totalNodes - Total number of nodes in the learning path
 * @returns ProgressInfo with completedCount, totalCount, percentage, and currentNodeIndex
 */
export function calculateProgress(
  state: StudentState,
  totalNodes: number
): ProgressInfo {
  const completedCount = state.completedNodes.length;
  const totalCount = totalNodes;

  if (totalCount === 0) {
    return {
      completedCount: 0,
      totalCount: 0,
      percentage: 0,
      currentNodeIndex: state.currentNodeIndex,
    };
  }

  const raw = (completedCount / totalCount) * 100;
  const percentage = Math.min(100, Math.max(0, Math.round(raw)));

  return {
    completedCount,
    totalCount,
    percentage,
    currentNodeIndex: state.currentNodeIndex,
  };
}
