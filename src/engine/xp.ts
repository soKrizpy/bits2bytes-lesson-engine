// src/engine/xp.ts
// Layer 2 — Engine Core.
// XPCalculator: pure, idempotency-safe XP awarding functions.
// No React, no side effects. Topic-agnostic.
//
// IMPORTANT BUSINESS RULES:
// - Node XP is awarded ONLY ONCE per node (guarded by completedNodes set).
// - Topic completion XP is awarded EXACTLY ONCE (guarded by xpAwardedForCompletion flag).
// - Both functions are pure — they return new state objects without mutating input.
// - The future Parent Hub reports bestQuizScore (MAX), not XP directly,
//   but XP must be accurate for the AchievementScreen display.

import type { StudentState } from '@/types/state';

/**
 * Awards XP for completing a learning node.
 *
 * Idempotency guard: if the nodeId is already in completedNodes, XP is NOT re-awarded.
 * If xpAmount is 0 or undefined, xpEarned is unchanged.
 *
 * @param state - Current StudentState (not mutated)
 * @param nodeId - The ID of the node being completed
 * @param xpAmount - XP to award (0 or undefined = no award)
 * @returns New StudentState with updated xpEarned
 */
export function awardNodeXP(
  state: StudentState,
  nodeId: string,
  xpAmount: number | undefined
): StudentState {
  // Guard: node already completed — do not double-award
  if (state.completedNodes.includes(nodeId)) {
    return state;
  }

  // Guard: no XP defined for this node
  if (!xpAmount || xpAmount <= 0) {
    return state;
  }

  return {
    ...state,
    xpEarned: state.xpEarned + xpAmount,
  };
}

/**
 * Awards the topic-level completion XP exactly once.
 *
 * Idempotency guard: xpAwardedForCompletion flag prevents double-awarding
 * if the completion screen is revisited or the state is restored.
 *
 * @param state - Current StudentState (not mutated)
 * @param topicXP - The xp value from Lesson.metadata.xp
 * @returns New StudentState with updated xpEarned and xpAwardedForCompletion = true
 */
export function awardCompletionXP(
  state: StudentState,
  topicXP: number
): StudentState {
  // Guard: completion XP already awarded
  if (state.xpAwardedForCompletion) {
    return state;
  }

  // Guard: no XP to award
  if (topicXP <= 0) {
    return {
      ...state,
      xpAwardedForCompletion: true,
    };
  }

  return {
    ...state,
    xpEarned: state.xpEarned + topicXP,
    xpAwardedForCompletion: true,
  };
}
