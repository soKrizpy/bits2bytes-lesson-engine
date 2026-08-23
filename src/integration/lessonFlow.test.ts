// src/integration/lessonFlow.test.ts
// Integration tests covering the complete student lesson flow.
// Tests business rules: sequential navigation, XP idempotency,
// quiz attempt limits, bestQuizScore MAX rule, topic completion,
// persistence round-trip, and topic isolation.
//
// These tests work directly with pure engine functions + LocalStorageAdapter
// to avoid React/hook testing complexity while covering all critical paths.

import { describe, it, expect, beforeEach } from 'vitest';
import { validateLesson } from '@/engine/validator';
import { awardNodeXP, awardCompletionXP } from '@/engine/xp';
import { calculateProgress } from '@/engine/progress';
import { LocalStorageAdapter } from '@/persistence/localStorageAdapter';
import { resolveLessonPath } from '@/engine/loader';
import { findTopicEntry } from '@/engine/topicRegistry';
import type { StudentState, QuizAttempt } from '@/types/state';
import type { Lesson } from '@/types/lesson';
import { INITIAL_STUDENT_STATE } from '@/types/state';
import lessonData from '../../public/lessons/beginner/html/beginner-html-01.json';

// Cast the imported JSON to Lesson (already validated by schema tests)
const lesson = lessonData as unknown as Lesson;

const MAX_QUIZ_ATTEMPTS = 2;

function freshState(topicId = 'beginner-html-01'): StudentState {
  return { ...INITIAL_STUDENT_STATE, studentId: 'student-01', topicId };
}

// Simulates the logic from useEngineState.advanceNode — pure state transition
function advanceNode(state: StudentState, lessonArg: Lesson): StudentState {
  const currentNode = lessonArg.learningPath[state.currentNodeIndex];
  if (currentNode === undefined) return state;

  // Sequential guard
  for (let i = 0; i < state.currentNodeIndex; i++) {
    const node = lessonArg.learningPath[i];
    if (node === undefined) continue;
    if (!state.completedNodes.includes(node.id)) return state;
  }

  const nodeId = currentNode.id;
  const isAlreadyCompleted = state.completedNodes.includes(nodeId);
  const completedNodes = isAlreadyCompleted
    ? state.completedNodes
    : [...state.completedNodes, nodeId];

  // Award XP using state BEFORE adding nodeId to completedNodes (matches engine fix)
  let updated = awardNodeXP(state, nodeId, currentNode.xp);
  // Merge updated completedNodes into state
  updated = { ...updated, completedNodes };

  const nextIndex = Math.min(state.currentNodeIndex + 1, lessonArg.learningPath.length);
  updated = { ...updated, currentNodeIndex: nextIndex };

  const isLastNode = nextIndex >= lessonArg.learningPath.length;
  if (isLastNode && !state.topicCompleted) {
    updated = awardCompletionXP(updated, lessonArg.metadata.xp);
    updated = {
      ...updated,
      topicCompleted: true,
      achievement: lessonArg.completion.achievementName,
    };
  }
  return updated;
}

// Simulates quiz scoring from useEngineState.submitQuizAttempt — pure
function submitQuizAttempt(
  state: StudentState,
  answers: Record<string, string>,
  lessonArg: Lesson
): StudentState {
  if (state.quizAttempts.length >= MAX_QUIZ_ATTEMPTS) return state;

  const attemptNumber = (state.quizAttempts.length + 1) as 1 | 2;
  const score = lessonArg.quiz.questions.reduce((total, question) => {
    const given = answers[question.id];
    return given === question.correctAnswer ? total + question.points : total;
  }, 0);

  const bestQuizScore = Math.max(state.bestQuizScore, score);

  const attempt: QuizAttempt = {
    attemptNumber,
    score,
    answers,
    submittedAt: new Date().toISOString(),
  };

  const quizNode = lessonArg.learningPath.find((n) => n.type === 'quiz');
  const quizNodeId = quizNode?.id;
  const completedNodes =
    quizNodeId !== undefined && !state.completedNodes.includes(quizNodeId)
      ? [...state.completedNodes, quizNodeId]
      : state.completedNodes;

  return {
    ...state,
    quizAttempts: [...state.quizAttempts, attempt],
    bestQuizScore,
    completedNodes,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

describe('Real lesson loading — schema validation', () => {
  it('beginner-html-01 passes schema validation with zero errors', () => {
    const result = validateLesson(lessonData);
    expect(result.valid).toBe(true);
  });

  it('lesson has exactly 10 learning nodes', () => {
    expect(lesson.learningPath).toHaveLength(10);
  });

  it('lesson has exactly 5 quiz questions', () => {
    expect(lesson.quiz.questions).toHaveLength(5);
  });

  it('every quiz question has exactly 4 options', () => {
    for (const q of lesson.quiz.questions) {
      expect(q.options).toHaveLength(4);
    }
  });

  it('every correctAnswer exactly matches one of the 4 options', () => {
    for (const q of lesson.quiz.questions) {
      expect(q.options).toContain(q.correctAnswer);
    }
  });

  it('topic registry resolves to the correct fetch path', () => {
    const entry = findTopicEntry('beginner-html-01');
    expect(entry).toBeDefined();
    if (entry) {
      const path = resolveLessonPath(entry.level, entry.category, entry.topicId);
      expect(path).toBe('/lessons/beginner/html/beginner-html-01.json');
    }
  });
});

describe('Sequential node progression', () => {
  it('starts at node index 0 with empty completedNodes', () => {
    const state = freshState();
    expect(state.currentNodeIndex).toBe(0);
    expect(state.completedNodes).toHaveLength(0);
  });

  it('advancing adds node to completedNodes and increments index', () => {
    let state = freshState();
    state = advanceNode(state, lesson);
    expect(state.currentNodeIndex).toBe(1);
    expect(state.completedNodes).toContain('node-01-welcome');
  });

  it('completedNodes never contains duplicates', () => {
    let state = freshState();
    // Advance all 10 nodes
    for (let i = 0; i < lesson.learningPath.length; i++) {
      state = advanceNode(state, lesson);
    }
    const unique = new Set(state.completedNodes);
    expect(unique.size).toBe(state.completedNodes.length);
  });

  it('sequential guard: cannot skip to node 5 without completing 0–4', () => {
    const state = freshState();
    // Manually set currentNodeIndex to 5 without completing preceding nodes
    const skipped = { ...state, currentNodeIndex: 5 };
    const result = advanceNode(skipped, lesson);
    // Guard fires — state unchanged
    expect(result.currentNodeIndex).toBe(5);
    expect(result.completedNodes).toHaveLength(0);
  });

  it('advancing through all 10 nodes sets topicCompleted = true', () => {
    let state = freshState();
    for (let i = 0; i < lesson.learningPath.length; i++) {
      state = advanceNode(state, lesson);
    }
    expect(state.topicCompleted).toBe(true);
  });

  it('achievement is set on completion', () => {
    let state = freshState();
    for (let i = 0; i < lesson.learningPath.length; i++) {
      state = advanceNode(state, lesson);
    }
    expect(state.achievement).toBe('HTML Explorer');
  });
});

describe('XP idempotency', () => {
  it('each node awards XP exactly once across full progression', () => {
    let state = freshState();
    for (let i = 0; i < lesson.learningPath.length; i++) {
      state = advanceNode(state, lesson);
    }
    // node XP: nodes 1–7 = 5 each (35), node-08-practice = 10, node-09-challenge = 15 → 60
    // topic completion XP: 100 → total 160
    const nodeXpTotal = lesson.learningPath.reduce((sum, n) => sum + (n.xp ?? 0), 0);
    expect(state.xpEarned).toBe(nodeXpTotal + lesson.metadata.xp);
  });

  it('completion XP awarded exactly once (idempotency guard)', () => {
    let state = freshState();
    for (let i = 0; i < lesson.learningPath.length; i++) {
      state = advanceNode(state, lesson);
    }
    const xpAfterCompletion = state.xpEarned;
    // Try to award completion XP again
    const again = awardCompletionXP(state, lesson.metadata.xp);
    expect(again.xpEarned).toBe(xpAfterCompletion); // unchanged
  });

  it('node XP not re-awarded for already-completed node', () => {
    let state = freshState();
    state = advanceNode(state, lesson); // completes node-01
    const xpAfterFirst = state.xpEarned;
    // Manually try to re-award
    const again = awardNodeXP(state, 'node-01-welcome', 5);
    expect(again.xpEarned).toBe(xpAfterFirst); // unchanged
  });
});

describe('Quiz — attempt rules', () => {
  // All correct answers
  const allCorrectAnswers: Record<string, string> = {
    q01: '<h1>',
    q02: 'HyperText Markup Language',
    q03: '<body>',
    q04: '<p>',
    q05: 'Page metadata and the page title',
  };

  // All wrong answers
  const allWrongAnswers: Record<string, string> = {
    q01: '<h6>',
    q02: 'Hyper Transfer Markup Language',
    q03: '<head>',
    q04: '<para>',
    q05: 'The main heading of the page',
  };

  it('first attempt is allowed and records the score', () => {
    let state = freshState();
    state = submitQuizAttempt(state, allCorrectAnswers, lesson);
    expect(state.quizAttempts).toHaveLength(1);
    expect(state.quizAttempts[0]?.score).toBe(100); // 5 × 20 pts
  });

  it('second attempt is allowed', () => {
    let state = freshState();
    state = submitQuizAttempt(state, allWrongAnswers, lesson);
    state = submitQuizAttempt(state, allCorrectAnswers, lesson);
    expect(state.quizAttempts).toHaveLength(2);
  });

  it('third attempt is hard-blocked — state is not modified', () => {
    let state = freshState();
    state = submitQuizAttempt(state, allWrongAnswers, lesson);
    state = submitQuizAttempt(state, allWrongAnswers, lesson);
    const beforeBestScore = state.bestQuizScore;
    state = submitQuizAttempt(state, allCorrectAnswers, lesson);
    // State must be identical — no new attempt recorded
    expect(state.quizAttempts).toHaveLength(2);
    expect(state.bestQuizScore).toBe(beforeBestScore);
  });

  it('bestQuizScore = MAX(all attempt scores), never the latest alone', () => {
    let state = freshState();
    // Attempt 1: score 100 (all correct)
    state = submitQuizAttempt(state, allCorrectAnswers, lesson);
    expect(state.bestQuizScore).toBe(100);
    // Attempt 2: score 0 (all wrong) — best score must NOT decrease
    state = submitQuizAttempt(state, allWrongAnswers, lesson);
    expect(state.bestQuizScore).toBe(100); // still 100
    expect(state.quizAttempts[1]?.score).toBe(0); // latest is 0
  });

  it('lower score on attempt 2 is preserved but does not overwrite best', () => {
    let state = freshState();
    state = submitQuizAttempt(state, allWrongAnswers, lesson); // score 0
    state = submitQuizAttempt(state, allCorrectAnswers, lesson); // score 100
    expect(state.bestQuizScore).toBe(100);
    expect(state.quizAttempts[0]?.score).toBe(0);
    expect(state.quizAttempts[1]?.score).toBe(100);
  });

  it('quiz node is marked complete after first submission', () => {
    let state = freshState();
    state = submitQuizAttempt(state, allWrongAnswers, lesson);
    expect(state.completedNodes).toContain('node-10-quiz');
  });

  it('quiz node is not duplicated in completedNodes after second submission', () => {
    let state = freshState();
    state = submitQuizAttempt(state, allWrongAnswers, lesson);
    state = submitQuizAttempt(state, allCorrectAnswers, lesson);
    const quizEntries = state.completedNodes.filter(id => id === 'node-10-quiz');
    expect(quizEntries).toHaveLength(1);
  });
});

describe('Persistence — save and restore', () => {
  const adapter = new LocalStorageAdapter();

  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and restores progress after partial completion', () => {
    let state = freshState();
    state = advanceNode(state, lesson);
    state = advanceNode(state, lesson);
    adapter.saveState('beginner-html-01', state);

    const restored = adapter.loadState('beginner-html-01');
    expect(restored).not.toBeNull();
    expect(restored?.currentNodeIndex).toBe(2);
    expect(restored?.completedNodes).toHaveLength(2);
    expect(restored?.xpEarned).toBe(10); // 2 nodes × 5 XP
  });

  it('saves and restores quiz attempts and bestQuizScore', () => {
    const allCorrect: Record<string, string> = {
      q01: '<h1>', q02: 'HyperText Markup Language', q03: '<body>', q04: '<p>',
      q05: 'Page metadata and the page title',
    };
    let state = freshState();
    state = submitQuizAttempt(state, allCorrect, lesson);
    adapter.saveState('beginner-html-01', state);

    const restored = adapter.loadState('beginner-html-01');
    expect(restored?.quizAttempts).toHaveLength(1);
    expect(restored?.bestQuizScore).toBe(100);
  });

  it('saves and restores topicCompleted = true', () => {
    let state = freshState();
    for (let i = 0; i < lesson.learningPath.length; i++) {
      state = advanceNode(state, lesson);
    }
    adapter.saveState('beginner-html-01', state);
    const restored = adapter.loadState('beginner-html-01');
    expect(restored?.topicCompleted).toBe(true);
    expect(restored?.achievement).toBe('HTML Explorer');
  });
});

describe('Topic isolation', () => {
  const adapter = new LocalStorageAdapter();

  beforeEach(() => {
    localStorage.clear();
  });

  it('completing beginner-html-01 does not affect a different topic', () => {
    let state = freshState('beginner-html-01');
    for (let i = 0; i < lesson.learningPath.length; i++) {
      state = advanceNode(state, lesson);
    }
    adapter.saveState('beginner-html-01', state);

    // A different topic has no saved state
    expect(adapter.loadState('beginner-css-01')).toBeNull();
  });

  it('different topics use isolated storage keys', () => {
    const stateA = freshState('topic-a');
    const stateB = freshState('topic-b');
    adapter.saveState('topic-a', { ...stateA, xpEarned: 50 });
    adapter.saveState('topic-b', { ...stateB, xpEarned: 200 });

    expect(adapter.loadState('topic-a')?.xpEarned).toBe(50);
    expect(adapter.loadState('topic-b')?.xpEarned).toBe(200);
    expect(adapter.loadState('topic-a')?.topicId).toBe('topic-a');
    expect(adapter.loadState('topic-b')?.topicId).toBe('topic-b');
  });
});

describe('AchievementScreen data integrity', () => {
  it('completion state contains all required fields for AchievementScreen', () => {
    let state = freshState();
    for (let i = 0; i < lesson.learningPath.length; i++) {
      state = advanceNode(state, lesson);
    }

    // All fields AchievementScreen needs
    expect(state.topicCompleted).toBe(true);
    expect(state.achievement).toBeTruthy();
    expect(typeof state.xpEarned).toBe('number');
    expect(state.xpEarned).toBeGreaterThan(0);
    expect(typeof state.bestQuizScore).toBe('number');
    expect(state.completedNodes.length).toBeGreaterThan(0);

    // lesson fields AchievementScreen needs
    expect(lesson.metadata.title).toBeTruthy();
    expect(lesson.completion.achievementName).toBeTruthy();
    expect(lesson.completion.message).toBeTruthy();
    expect(lesson.quiz.questions.length).toBe(5);
  });
});

// Keep calculateProgress import exercised
describe('Progress calculation — integration', () => {
  it('progress reflects number of completed nodes vs total', () => {
    let state = freshState();
    state = advanceNode(state, lesson);
    state = advanceNode(state, lesson);
    state = advanceNode(state, lesson);
    const progress = calculateProgress(state, lesson.learningPath.length);
    expect(progress.completedCount).toBe(3);
    expect(progress.totalCount).toBe(10);
    expect(progress.percentage).toBe(30);
  });
});
