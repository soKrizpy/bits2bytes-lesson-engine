'use client';

// src/hooks/useEngineState.ts
// Layer 3 — State Management.
// useEngineState: the central React hook that orchestrates the lesson engine.
//
// Responsibilities:
// - Load lesson JSON via LessonLoader
// - Validate via SchemaValidator (already done inside loadLesson)
// - Restore or initialise StudentState via IPersistenceAdapter
// - Expose EngineState and EngineStateActions to UI components
// - Enforce all business rules (sequential navigation, quiz attempt limit, XP idempotency)
// - Persist state changes and surface persistence errors non-destructively
//
// Business rules enforced here:
// 1. Sequential progression — cannot advance past an incomplete preceding node
// 2. completedNodes never contains duplicates
// 3. XP is idempotent (delegated to xp.ts)
// 4. Quiz max 2 attempts — hard block on 3rd attempt
// 5. bestQuizScore = MAX(all attempts), never overwritten with lower score
// 6. Persistence errors set saveError but never lose in-memory progress
// 7. Topic-agnostic — no HTML-specific logic anywhere

import { useState, useEffect, useCallback, useRef } from 'react';
import { loadLesson } from '@/engine/loader';
import { awardNodeXP, awardCompletionXP } from '@/engine/xp';
import type { IPersistenceAdapter } from '@/persistence/types';
import type { Lesson, QuizQuestion } from '@/types/lesson';
import type {
  StudentState,
  QuizAttempt,
  EngineState,
  EngineStateActions,
} from '@/types/state';
import { INITIAL_STUDENT_STATE } from '@/types/state';

const MAX_QUIZ_ATTEMPTS = 2;

function createInitialState(topicId: string): StudentState {
  return {
    ...INITIAL_STUDENT_STATE,
    studentId: 'anonymous', // V1: no auth. Future: LMS provides studentId.
    topicId,
  };
}

function scoreQuizAttempt(
  questions: QuizQuestion[],
  answers: Record<string, string>
): number {
  return questions.reduce((total, question) => {
    const given = answers[question.id];
    return given === question.correctAnswer ? total + question.points : total;
  }, 0);
}

/**
 * Attempts to persist state via the adapter.
 * Returns a non-null error message if persistence failed, null on success.
 *
 * Failure detection: if saveState throws, or if a subsequent loadState
 * returns null (indicating a silent write failure), the error is surfaced.
 */
function persistSafely(
  adapter: IPersistenceAdapter,
  topicId: string,
  state: StudentState
): string | null {
  try {
    adapter.saveState(topicId, state);
    // Verify round-trip to detect silent localStorage failures
    const verify = adapter.loadState(topicId);
    if (verify === null) {
      return 'Progress could not be saved. Your progress is available for this session only.';
    }
    return null;
  } catch {
    return 'Progress could not be saved. Your progress is available for this session only.';
  }
}

export function useEngineState(
  topicId: string,
  adapter: IPersistenceAdapter
): EngineState & EngineStateActions {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [studentState, setStudentState] = useState<StudentState>(
    () => createInitialState(topicId)
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // True when no persisted state was found on load (genuine first visit).
  // Remains false until the lesson finishes loading so we don't flash the
  // intro on every render before the adapter has had a chance to check storage.
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  // Keep a stable ref to the adapter so callbacks don't need it as a dep
  const adapterRef = useRef(adapter);
  adapterRef.current = adapter;

  // ─── Load lesson and restore state on mount ───────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const result = await loadLesson(topicId);
      if (cancelled) return;

      if (!result.success) {
        setLoadError(result.error);
        return;
      }

      setLesson(result.lesson);

      // Restore persisted state or start fresh
      const saved = adapterRef.current.loadState(topicId);
      if (saved !== null) {
        setStudentState(saved);
      } else {
        setStudentState(createInitialState(topicId));
        // No persisted state found — this is a first visit; show intro splash.
        setIsFirstVisit(true);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
    // adapter is stable via ref; topicId change triggers full reload
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  // ─── advanceNode ──────────────────────────────────────────────────────────
  const advanceNode = useCallback(() => {
    if (lesson === null) return;

    setStudentState((prev) => {
      const currentNode = lesson.learningPath[prev.currentNodeIndex];
      if (currentNode === undefined) return prev;

      // Business rule: sequential navigation guard.
      // All nodes before currentNodeIndex must already be completed.
      for (let i = 0; i < prev.currentNodeIndex; i++) {
        const node = lesson.learningPath[i];
        if (node === undefined) continue;
        if (!prev.completedNodes.includes(node.id)) return prev; // blocked
      }

      const nodeId = currentNode.id;
      const isAlreadyCompleted = prev.completedNodes.includes(nodeId);

      // Build updated completedNodes (no duplicates)
      const completedNodes = isAlreadyCompleted
        ? prev.completedNodes
        : [...prev.completedNodes, nodeId];

      // Award node XP using prev state (before adding node to completedNodes).
      // awardNodeXP guards on completedNodes.includes(nodeId) — so we pass prev,
      // which does NOT yet contain nodeId, allowing XP to flow through.
      // On revisit the node IS in completedNodes, so the guard correctly blocks re-award.
      let updated = awardNodeXP(prev, nodeId, currentNode.xp);
      // Now merge the updated completedNodes into the state
      updated = { ...updated, completedNodes };

      // Advance index (clamped to learningPath.length so it never goes out of bounds)
      const nextIndex = Math.min(
        prev.currentNodeIndex + 1,
        lesson.learningPath.length
      );
      updated = { ...updated, currentNodeIndex: nextIndex };

      // Check if this was the last node
      const isLastNode = nextIndex >= lesson.learningPath.length;
      if (isLastNode && !prev.topicCompleted) {
        updated = awardCompletionXP(updated, lesson.metadata.xp);
        updated = {
          ...updated,
          topicCompleted: true,
          achievement: lesson.completion.achievementName,
        };
      }

      // Persist outside updater via microtask to keep updater pure
      const stateToSave = updated;
      queueMicrotask(() => {
        setIsSaving(true);
        const err = persistSafely(adapterRef.current, topicId, stateToSave);
        setIsSaving(false);
        if (err !== null) setSaveError(err);
      });

      return updated;
    });
  }, [lesson, topicId]);

  // ─── submitQuizAttempt ────────────────────────────────────────────────────
  const submitQuizAttempt = useCallback(
    (answers: Record<string, string>) => {
      if (lesson === null) return;

      setStudentState((prev) => {
        // Hard block: max 2 attempts
        if (prev.quizAttempts.length >= MAX_QUIZ_ATTEMPTS) return prev;

        const attemptNumber = (prev.quizAttempts.length + 1) as 1 | 2;
        const score = scoreQuizAttempt(lesson.quiz.questions, answers);
        const bestQuizScore = Math.max(prev.bestQuizScore, score);

        const attempt: QuizAttempt = {
          attemptNumber,
          score,
          answers,
          submittedAt: new Date().toISOString(),
        };

        // Find the quiz node to mark it complete
        const quizNode = lesson.learningPath.find((n) => n.type === 'quiz');
        const quizNodeId = quizNode?.id;
        const completedNodes =
          quizNodeId !== undefined && !prev.completedNodes.includes(quizNodeId)
            ? [...prev.completedNodes, quizNodeId]
            : prev.completedNodes;

        const updated: StudentState = {
          ...prev,
          quizAttempts: [...prev.quizAttempts, attempt],
          bestQuizScore,
          completedNodes,
        };

        // Persist outside updater via microtask
        const stateToSave = updated;
        queueMicrotask(() => {
          setIsSaving(true);
          const err = persistSafely(adapterRef.current, topicId, stateToSave);
          setIsSaving(false);
          if (err !== null) setSaveError(err);
        });

        return updated;
      });
    },
    [lesson, topicId]
  );

  // ─── resetTopic ───────────────────────────────────────────────────────────
  const resetTopic = useCallback(() => {
    adapterRef.current.clearState(topicId);
    setStudentState(createInitialState(topicId));
    setSaveError(null);
  }, [topicId]);

  // ─── dismissIntro ─────────────────────────────────────────────────────────
  const dismissIntro = useCallback(() => {
    setIsFirstVisit(false);
  }, []);

  return {
    lesson,
    studentState,
    loadError,
    isSaving,
    saveError,
    isFirstVisit,
    advanceNode,
    submitQuizAttempt,
    resetTopic,
    dismissIntro,
  };
}
