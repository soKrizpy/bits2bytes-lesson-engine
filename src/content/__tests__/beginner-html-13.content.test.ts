// src/content/__tests__/beginner-html-13.content.test.ts
// Content-level tests for the beginner-html-13 lesson JSON.
// Property invariants (identifier uniqueness, code node completeness, introduction fields)
// Example-based unit tests for metadata and structural facts

import { describe, it, expect } from 'vitest';
import lessonData from '../../../public/lessons/beginner/html/beginner-html-13.json';
import type { Lesson, ChallengeNode, CodeNode } from '@/types/lesson';

const lesson = lessonData as unknown as Lesson;

// ---------------------------------------------------------------------------
// Property invariants
// ---------------------------------------------------------------------------

describe('Content property invariants', () => {
  it('all 10 node id values in learningPath are unique', () => {
    const ids = lesson.learningPath.map(n => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all node ids have length >= 1 and <= 100', () => {
    for (const node of lesson.learningPath) {
      expect(node.id.length).toBeGreaterThanOrEqual(1);
      expect(node.id.length).toBeLessThanOrEqual(100);
    }
  });

  it('all 5 question id values in quiz.questions are unique', () => {
    const qids = lesson.quiz.questions.map(q => q.id);
    expect(new Set(qids).size).toBe(qids.length);
  });

  it('introduction does not contain a "learningObjectives" field', () => {
    expect(!('learningObjectives' in (lesson.introduction ?? {}))).toBe(true);
  });

  it('introduction does not contain an "estimatedTime" field', () => {
    expect(!('estimatedTime' in (lesson.introduction ?? {}))).toBe(true);
  });

  it('every code node has a non-empty code.language', () => {
    const codeNodes = lesson.learningPath.filter(n => n.type === 'code');
    for (const node of codeNodes) {
      const codeNode = node as CodeNode;
      expect(codeNode.code.language.length).toBeGreaterThan(0);
    }
  });

  it('every code node has a non-empty code.content', () => {
    const codeNodes = lesson.learningPath.filter(n => n.type === 'code');
    for (const node of codeNodes) {
      const codeNode = node as CodeNode;
      expect(codeNode.code.content.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Example-based unit tests for metadata and structural facts
// ---------------------------------------------------------------------------

describe('Lesson metadata and structure', () => {
  it('metadata.id === "beginner-html-13"', () => {
    expect(lesson.metadata.id).toBe('beginner-html-13');
  });

  it('metadata.level === "beginner"', () => {
    expect(lesson.metadata.level).toBe('beginner');
  });

  it('metadata.category === "CSS"', () => {
    expect(lesson.metadata.category).toBe('CSS');
  });

  it('metadata.topicNumber === 3', () => {
    expect(lesson.metadata.topicNumber).toBe(3);
  });

  it('metadata.xp === 100', () => {
    expect(lesson.metadata.xp).toBe(100);
  });

  it('metadata.estimatedTime === 30', () => {
    expect(lesson.metadata.estimatedTime).toBe(30);
  });

  it('learningPath.length === 10', () => {
    expect(lesson.learningPath).toHaveLength(10);
  });

  it('type count: exactly 2 lesson nodes', () => {
    const count = lesson.learningPath.filter(n => n.type === 'lesson').length;
    expect(count).toBe(2);
  });

  it('type count: exactly 5 code nodes', () => {
    const count = lesson.learningPath.filter(n => n.type === 'code').length;
    expect(count).toBe(5);
  });

  it('type count: exactly 1 practice node', () => {
    const count = lesson.learningPath.filter(n => n.type === 'practice').length;
    expect(count).toBe(1);
  });

  it('type count: exactly 1 challenge node', () => {
    const count = lesson.learningPath.filter(n => n.type === 'challenge').length;
    expect(count).toBe(1);
  });

  it('type count: exactly 1 quiz node', () => {
    const count = lesson.learningPath.filter(n => n.type === 'quiz').length;
    expect(count).toBe(1);
  });

  it('quiz.questions.length === 5', () => {
    expect(lesson.quiz.questions).toHaveLength(5);
  });

  it('each quiz question has exactly 4 options', () => {
    for (const q of lesson.quiz.questions) {
      expect(q.options).toHaveLength(4);
    }
  });

  it('each quiz question correctAnswer exactly matches one of its options', () => {
    for (const q of lesson.quiz.questions) {
      expect(q.options).toContain(q.correctAnswer);
    }
  });

  it('each quiz question has a non-empty explanation', () => {
    for (const q of lesson.quiz.questions) {
      expect(typeof q.explanation).toBe('string');
      expect(q.explanation.length).toBeGreaterThan(0);
    }
  });

  it('each quiz question has points === 20', () => {
    for (const q of lesson.quiz.questions) {
      expect(q.points).toBe(20);
    }
  });

  it('introduction.title is a non-empty string', () => {
    expect(typeof lesson.introduction!.title).toBe('string');
    expect(lesson.introduction!.title.length).toBeGreaterThan(0);
  });

  it('introduction.description is a non-empty string', () => {
    expect(typeof lesson.introduction!.description).toBe('string');
    expect(lesson.introduction!.description.length).toBeGreaterThan(0);
  });

  it('introduction.analogy is a non-empty string', () => {
    expect(typeof lesson.introduction!.analogy).toBe('string');
    expect(lesson.introduction!.analogy!.length).toBeGreaterThan(0);
  });

  it('review.learned.length > 0', () => {
    expect(lesson.review!.learned!.length).toBeGreaterThan(0);
  });

  it('review.keyConcepts.length > 0', () => {
    expect(lesson.review!.keyConcepts!.length).toBeGreaterThan(0);
  });

  it('review.takeaways.length > 0', () => {
    expect(lesson.review!.takeaways!.length).toBeGreaterThan(0);
  });

  it('completion.title is a non-empty string', () => {
    expect(typeof lesson.completion.title).toBe('string');
    expect(lesson.completion.title.length).toBeGreaterThan(0);
  });

  it('completion.message is a non-empty string', () => {
    expect(typeof lesson.completion.message).toBe('string');
    expect(lesson.completion.message.length).toBeGreaterThan(0);
  });

  it('completion.achievementName is a non-empty string', () => {
    expect(typeof lesson.completion.achievementName).toBe('string');
    expect(lesson.completion.achievementName.length).toBeGreaterThan(0);
  });

  it('completion.achievementIcon is a non-empty string', () => {
    expect(typeof lesson.completion.achievementIcon).toBe('string');
    expect(lesson.completion.achievementIcon!.length).toBeGreaterThan(0);
  });

  it('challenge node (node-09-challenge) has non-empty solution.language', () => {
    const challenge = lesson.learningPath.find(n => n.id === 'node-09-challenge') as ChallengeNode;
    expect(challenge).toBeDefined();
    expect(typeof challenge.solution!.language).toBe('string');
    expect(challenge.solution!.language.length).toBeGreaterThan(0);
  });

  it('challenge node (node-09-challenge) has non-empty solution.code', () => {
    const challenge = lesson.learningPath.find(n => n.id === 'node-09-challenge') as ChallengeNode;
    expect(challenge).toBeDefined();
    expect(typeof challenge.solution!.code).toBe('string');
    expect(challenge.solution!.code.length).toBeGreaterThan(0);
  });

  it('challenge node (node-09-challenge) has non-empty solution.explanation', () => {
    const challenge = lesson.learningPath.find(n => n.id === 'node-09-challenge') as ChallengeNode;
    expect(challenge).toBeDefined();
    expect(typeof challenge.solution!.explanation).toBe('string');
    expect(challenge.solution!.explanation!.length).toBeGreaterThan(0);
  });

  it('lesson nodes have xp === 5', () => {
    const lessonNodes = lesson.learningPath.filter(n => n.type === 'lesson');
    for (const node of lessonNodes) {
      expect((node as { xp?: number }).xp).toBe(5);
    }
  });

  it('code nodes have xp === 5', () => {
    const codeNodes = lesson.learningPath.filter(n => n.type === 'code');
    for (const node of codeNodes) {
      expect((node as CodeNode & { xp?: number }).xp).toBe(5);
    }
  });

  it('practice node has xp === 10', () => {
    const practiceNode = lesson.learningPath.find(n => n.type === 'practice');
    expect(practiceNode).toBeDefined();
    expect((practiceNode as { xp?: number }).xp).toBe(10);
  });

  it('challenge node has xp === 15', () => {
    const challengeNode = lesson.learningPath.find(n => n.type === 'challenge');
    expect(challengeNode).toBeDefined();
    expect((challengeNode as { xp?: number }).xp).toBe(15);
  });

  it('quiz node does not have an xp field', () => {
    const quizNode = lesson.learningPath.find(n => n.type === 'quiz');
    expect(quizNode).toBeDefined();
    expect('xp' in (quizNode ?? {})).toBe(false);
  });

  it('total node XP equals 60', () => {
    const total = lesson.learningPath.reduce((sum, n) => sum + ((n as { xp?: number }).xp ?? 0), 0);
    expect(total).toBe(60);
  });

  it('practice node has instructions field', () => {
    const practiceNode = lesson.learningPath.find(n => n.type === 'practice') as { instructions?: string };
    expect(practiceNode).toBeDefined();
    expect(typeof practiceNode!.instructions).toBe('string');
    expect(practiceNode!.instructions!.length).toBeGreaterThan(0);
  });

  it('practice node has interactionType === "multiple-choice"', () => {
    const practiceNode = lesson.learningPath.find(n => n.type === 'practice') as { interactionType?: string };
    expect(practiceNode!.interactionType).toBe('multiple-choice');
  });

  it('practice node correctOption is one of its options', () => {
    const practiceNode = lesson.learningPath.find(n => n.type === 'practice') as { options?: string[]; correctOption?: string };
    expect(practiceNode!.options).toContain(practiceNode!.correctOption);
  });
});
