// src/engine/validator.test.ts
// Tests for SchemaValidator — covers valid lessons, missing fields, bad versions, node types.

import { describe, it, expect } from 'vitest';
import { validateLesson } from '@/engine/validator';
import lessonData from '../../public/lessons/beginner/html/beginner-html-01.json';

// Minimal valid lesson helper
function minimalValidLesson(): Record<string, unknown> {
  return {
    schemaVersion: '1.0',
    metadata: {
      id: 'test-topic',
      title: 'Test Topic',
      description: 'A test topic.',
      level: 'beginner',
      category: 'HTML',
      topicNumber: 1,
      estimatedTime: 10,
      xp: 50,
    },
    objectives: ['Learn something'],
    learningPath: [
      { id: 'node-01', type: 'lesson', title: 'Node One' },
      { id: 'node-quiz', type: 'quiz', title: 'Quiz' },
    ],
    quiz: {
      questions: [
        { id: 'q1', question: 'Q1?', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A', explanation: 'Because A.', points: 10 },
        { id: 'q2', question: 'Q2?', options: ['A', 'B', 'C', 'D'], correctAnswer: 'B', explanation: 'Because B.', points: 10 },
        { id: 'q3', question: 'Q3?', options: ['A', 'B', 'C', 'D'], correctAnswer: 'C', explanation: 'Because C.', points: 10 },
        { id: 'q4', question: 'Q4?', options: ['A', 'B', 'C', 'D'], correctAnswer: 'D', explanation: 'Because D.', points: 10 },
        { id: 'q5', question: 'Q5?', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A', explanation: 'Because A.', points: 10 },
      ],
    },
    completion: {
      title: 'Done!',
      message: 'You completed the test topic.',
      achievementName: 'Test Achiever',
    },
  };
}

describe('validateLesson — valid lesson', () => {
  it('validates the real beginner-html-01 lesson with zero errors', () => {
    const result = validateLesson(lessonData);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.lesson.metadata.id).toBe('beginner-html-01');
      expect(result.lesson.learningPath).toHaveLength(10);
      expect(result.lesson.quiz.questions).toHaveLength(5);
    }
  });

  it('validates a minimal well-formed lesson', () => {
    const result = validateLesson(minimalValidLesson());
    expect(result.valid).toBe(true);
  });

  it('validates optional review summary and challenge solution fields when present', () => {
    const lesson = minimalValidLesson();
    lesson['review'] = {
      learned: ['A useful thing'],
      keyConcepts: ['A key concept'],
      takeaways: ['A takeaway'],
    };
    lesson['learningPath'] = [
      {
        id: 'node-challenge',
        type: 'challenge',
        title: 'Challenge',
        instructions: 'Build something.',
        solution: {
          language: 'python',
          code: 'print("done")',
          explanation: 'A simple complete solution.',
        },
      },
      { id: 'node-quiz', type: 'quiz', title: 'Quiz' },
    ];

    const result = validateLesson(lesson);

    expect(result.valid).toBe(true);
  });
});

describe('validateLesson — schema version checks', () => {
  it('rejects a missing schemaVersion', () => {
    const lesson = minimalValidLesson();
    delete lesson['schemaVersion'];
    const result = validateLesson(lesson);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some(e => e.includes('schemaVersion'))).toBe(true);
    }
  });

  it('rejects schemaVersion "2.0" (unsupported MAJOR)', () => {
    const lesson = { ...minimalValidLesson(), schemaVersion: '2.0' };
    const result = validateLesson(lesson);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some(e => e.includes('2.0'))).toBe(true);
    }
  });

  it('accepts schemaVersion "1.1" (same MAJOR)', () => {
    const lesson = { ...minimalValidLesson(), schemaVersion: '1.1' };
    const result = validateLesson(lesson);
    expect(result.valid).toBe(true);
  });

  it('rejects non-string schemaVersion', () => {
    const lesson = { ...minimalValidLesson(), schemaVersion: 1 };
    const result = validateLesson(lesson);
    expect(result.valid).toBe(false);
  });
});

describe('validateLesson — required sections', () => {
  it('rejects missing metadata', () => {
    const lesson = minimalValidLesson();
    delete lesson['metadata'];
    const result = validateLesson(lesson);
    expect(result.valid).toBe(false);
  });

  it('rejects missing learningPath', () => {
    const lesson = minimalValidLesson();
    delete lesson['learningPath'];
    const result = validateLesson(lesson);
    expect(result.valid).toBe(false);
  });

  it('rejects missing quiz', () => {
    const lesson = minimalValidLesson();
    delete lesson['quiz'];
    const result = validateLesson(lesson);
    expect(result.valid).toBe(false);
  });

  it('rejects missing completion', () => {
    const lesson = minimalValidLesson();
    delete lesson['completion'];
    const result = validateLesson(lesson);
    expect(result.valid).toBe(false);
  });
});

describe('validateLesson — quiz constraints', () => {
  it('accepts a quiz with 3 questions (minimum)', () => {
    const lesson = minimalValidLesson();
    const quiz = lesson['quiz'] as { questions: unknown[] };
    quiz.questions = quiz.questions.slice(0, 3);
    const result = validateLesson(lesson);
    expect(result.valid).toBe(true);
  });

  it('rejects a quiz with 2 questions (below minimum)', () => {
    const lesson = minimalValidLesson();
    const quiz = lesson['quiz'] as { questions: unknown[] };
    quiz.questions = quiz.questions.slice(0, 2);
    const result = validateLesson(lesson);
    expect(result.valid).toBe(false);
  });

  it('rejects a quiz with 21 questions (above maximum)', () => {
    const lesson = minimalValidLesson();
    const quiz = lesson['quiz'] as { questions: unknown[] };
    const base = quiz.questions[0] as Record<string, unknown>;
    quiz.questions = Array.from({ length: 21 }, (_, i) => ({ ...base, id: `q${i + 1}` }));
    const result = validateLesson(lesson);
    expect(result.valid).toBe(false);
  });
});

describe('validateLesson — non-object input', () => {
  it('rejects null', () => {
    const result = validateLesson(null);
    expect(result.valid).toBe(false);
  });

  it('rejects a string', () => {
    const result = validateLesson('not-an-object');
    expect(result.valid).toBe(false);
  });

  it('rejects an array', () => {
    const result = validateLesson([1, 2, 3]);
    expect(result.valid).toBe(false);
  });
});
