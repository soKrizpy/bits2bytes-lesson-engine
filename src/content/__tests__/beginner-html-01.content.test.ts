// src/content/__tests__/beginner-html-01.content.test.ts
// Content-level tests for the beginner-html-01 lesson JSON.
// Task 6.1 — Property invariants (identifier uniqueness, code node completeness, introduction fields)
// Task 6.2 — Example-based unit tests for metadata and structural facts

import { describe, it, expect } from 'vitest';
import lessonData from '../../../public/lessons/beginner/html/beginner-html-01.json';
import type { Lesson, ChallengeNode, CodeNode } from '@/types/lesson';

const lesson = lessonData as unknown as Lesson;

// ---------------------------------------------------------------------------
// Task 6.1 — Property tests
// ---------------------------------------------------------------------------

describe('Content property invariants', () => {
  // Property 2: Node and question identifier uniqueness and length
  // Validates: Requirements 6.1, 6.2, 6.3

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

  // Property 3: Introduction block contains no unsupported fields
  // Validates: Requirements 4.3, 7.1, 7.2

  it('introduction does not contain a "learningObjectives" field', () => {
    expect(!('learningObjectives' in (lesson.introduction ?? {}))).toBe(true);
  });

  it('introduction does not contain an "estimatedTime" field', () => {
    expect(!('estimatedTime' in (lesson.introduction ?? {}))).toBe(true);
  });

  // Property 4: All code nodes provide non-empty language and content
  // Validates: Requirements 2.7

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
// Task 6.2 — Example-based unit tests for metadata and structural facts
// Validates: Requirements 1.2, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.8, 4.1, 4.2, 4.5
// ---------------------------------------------------------------------------

describe('Lesson metadata and structure', () => {
  it('metadata.id === "beginner-html-01"', () => {
    expect(lesson.metadata.id).toBe('beginner-html-01');
  });

  it('metadata.level === "beginner"', () => {
    expect(lesson.metadata.level).toBe('beginner');
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
});
