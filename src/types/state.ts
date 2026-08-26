// src/types/state.ts
// Layer 3 data model — student state and engine runtime types.
// These types are topic-agnostic and work for any lesson loaded by the engine.

import type { Lesson } from './lesson';

/** A single quiz attempt record. Max 2 per topic. */
export interface QuizAttempt {
  /** 1 or 2 — which attempt this was. */
  attemptNumber: 1 | 2;
  /** Sum of points for correctly answered questions. */
  score: number;
  /** Map of questionId → selectedOption for this attempt. */
  answers: Record<string, string>;
  /** ISO 8601 timestamp of when this attempt was submitted. */
  submittedAt: string;
}

/**
 * Complete student progress state for a single topic.
 * Persisted via IPersistenceAdapter and restored on topic re-open.
 */
export interface StudentState {
  /** Student identifier. 1–128 characters. Set to "anonymous" for V1 (no auth). */
  studentId: string;
  /** Topic identifier matching Lesson.metadata.id. 1–128 characters. */
  topicId: string;
  /** Zero-based index of the current node in learningPath. Integer >= 0. */
  currentNodeIndex: number;
  /** Array of node IDs the student has completed. Max 500 entries. */
  completedNodes: string[];
  /** Array of quiz attempt records. Max 2 entries (enforced by engine). */
  quizAttempts: QuizAttempt[];
  /**
   * The highest score across all quiz attempts.
   * IMPORTANT: Always MAX(all attempts), NEVER the latest score alone.
   * Integer 0–100. Used by future Parent Hub reporting.
   */
  bestQuizScore: number;
  /** Total XP earned in this topic. Integer >= 0. */
  xpEarned: number;
  /** Whether the student has reached the end of the learning path. */
  topicCompleted: boolean;
  /** Achievement name earned on completion. Null until topic is completed. */
  achievement: string | null;
  /**
   * Idempotency guard: ensures topic-level XP (metadata.xp) is awarded exactly once.
   * Prevents double-awarding XP if the completion screen is revisited.
   */
  xpAwardedForCompletion: boolean;
}

/**
 * Initial state values for a new student starting a topic.
 * Omits studentId and topicId which are set at initialisation time.
 */
export const INITIAL_STUDENT_STATE: Omit<StudentState, 'studentId' | 'topicId'> = {
  currentNodeIndex: 0,
  completedNodes: [],
  quizAttempts: [],
  bestQuizScore: 0,
  xpEarned: 0,
  topicCompleted: false,
  achievement: null,
  xpAwardedForCompletion: false,
};

/**
 * Runtime state exposed by the useEngineState hook.
 * Combines lesson content, student state, and error signals.
 */
export interface EngineState {
  /** The loaded and validated lesson. Null if not yet loaded or if load failed. */
  lesson: Lesson | null;
  /** Current student progress state. */
  studentState: StudentState;
  /**
   * Non-null if lesson loading or schema validation failed.
   * When non-null, the engine renders ErrorScreen instead of the lesson.
   */
  loadError: string | null;
  /** True while a persistence save is in progress. */
  isSaving: boolean;
  /**
   * Non-null if the last persistence save failed.
   * Non-blocking — lesson continues in-memory; a banner is shown to the student.
   */
  saveError: string | null;
  /**
   * True when no persisted state was found for this topic on load.
   * Used to gate the TopicIntro splash screen (shown only on first visit).
   * Cleared by calling dismissIntro().
   */
  isFirstVisit: boolean;
}

/** Actions exposed by the useEngineState hook. */
export interface EngineStateActions {
  /**
   * Advance from the current node to the next.
   * Marks the current node complete, awards node XP, increments currentNodeIndex.
   * On the final node: awards completion XP and sets topicCompleted = true.
   * Persists state after each advance.
   */
  advanceNode: () => void;
  /**
   * Submit a quiz attempt with the provided answers.
   * Scores the attempt, updates bestQuizScore = MAX(prev, current).
   * Blocked if quizAttempts.length >= 2.
   * Marks the quiz node complete after any submission.
   * Persists state after submission.
   */
  submitQuizAttempt: (answers: Record<string, string>) => void;
  /**
   * Reset the student's progress for this topic.
   * Clears persisted state and reinitialises to INITIAL_STUDENT_STATE.
   */
  resetTopic: () => void;
  /**
   * Dismiss the first-visit intro splash and begin the learning path.
   * Sets isFirstVisit to false; no persistence side-effects.
   */
  dismissIntro: () => void;
}
