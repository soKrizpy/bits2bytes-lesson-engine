// src/content/__tests__/beginner-scratch-02.content.test.ts
// Content-level tests for the beginner-scratch-02 lesson JSON.

import { describe, it, expect } from 'vitest';
import lessonData from '../../../public/lessons/beginner/scratch/beginner-scratch-02.json';
import type { Lesson, ChallengeNode, CodeNode } from '@/types/lesson';

const lesson = lessonData as unknown as Lesson;

describe('Content property invariants', () => {
  it('all node id values in learningPath are unique', () => {
    const ids = lesson.learningPath.map(n => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all node ids have length >= 1 and <= 100', () => {
    for (const node of lesson.learningPath) {
      expect(node.id.length).toBeGreaterThanOrEqual(1);
      expect(node.id.length).toBeLessThanOrEqual(100);
    }
  });

  it('all question id values in quiz.questions are unique', () => {
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
      expect((node as CodeNode).code.language.length).toBeGreaterThan(0);
    }
  });

  it('every code node has a non-empty code.content', () => {
    const codeNodes = lesson.learningPath.filter(n => n.type === 'code');
    for (const node of codeNodes) {
      expect((node as CodeNode).code.content.length).toBeGreaterThan(0);
    }
  });
});

describe('Lesson metadata and structure', () => {
  it('metadata.id === "beginner-scratch-02"', () => {
    expect(lesson.metadata.id).toBe('beginner-scratch-02');
  });

  it('metadata.level === "beginner"', () => {
    expect(lesson.metadata.level).toBe('beginner');
  });

  it('metadata.xp === 100', () => {
    expect(lesson.metadata.xp).toBe(100);
  });

  it('learningPath.length === 10', () => {
    expect(lesson.learningPath).toHaveLength(10);
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

  it('challenge node (node-09-challenge) has non-empty expectedResult', () => {
    const challenge = lesson.learningPath.find(n => n.id === 'node-09-challenge') as ChallengeNode;
    expect(challenge).toBeDefined();
    expect(typeof challenge.expectedResult).toBe('string');
    expect(challenge.expectedResult!.length).toBeGreaterThan(0);
  });
});

