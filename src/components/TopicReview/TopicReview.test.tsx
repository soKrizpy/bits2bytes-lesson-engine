import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TopicReview } from './TopicReview';
import type { Lesson } from '@/types/lesson';
import type { StudentState } from '@/types/state';
import { INITIAL_STUDENT_STATE } from '@/types/state';
import lessonData from '../../../public/lessons/beginner/html/beginner-html-01.json';

const lesson = lessonData as unknown as Lesson;

function completedState(lessonArg: Lesson = lesson): StudentState {
  return {
    ...INITIAL_STUDENT_STATE,
    studentId: 'student-01',
    topicId: lessonArg.metadata.id,
    currentNodeIndex: lessonArg.learningPath.length,
    completedNodes: lessonArg.learningPath.map((node) => node.id),
    quizAttempts: [
      {
        attemptNumber: 1,
        score: 100,
        answers: {},
        submittedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    bestQuizScore: 100,
    xpEarned: 160,
    topicCompleted: true,
    achievement: lessonArg.completion.achievementName,
    xpAwardedForCompletion: true,
  };
}

function renderReview(overrides: Partial<React.ComponentProps<typeof TopicReview>> = {}) {
  const props: React.ComponentProps<typeof TopicReview> = {
    lesson,
    studentState: completedState(),
    selectedNodeIndex: 0,
    onSelectNode: vi.fn(),
    onBackToAchievement: vi.fn(),
    onReturn: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<TopicReview {...props} />),
    props,
  };
}

beforeEach(() => {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  Element.prototype.scrollIntoView = vi.fn();
});

describe('TopicReview', () => {
  it('renders all nodes in the completed topic learning path', () => {
    renderReview();

    for (const node of lesson.learningPath) {
      expect(screen.getAllByText(node.title).length).toBeGreaterThan(0);
    }
  });

  it('allows review nodes to be selected freely', () => {
    const onSelectNode = vi.fn();
    renderReview({ onSelectNode });

    fireEvent.click(screen.getAllByRole('button', { name: /review full html boilerplate/i })[0]!);

    expect(onSelectNode).toHaveBeenCalledWith(4);
  });

  it('does not mutate student state during review interactions', () => {
    const studentState = completedState();
    const before = JSON.stringify(studentState);
    renderReview({ studentState });

    fireEvent.click(screen.getAllByRole('button', { name: /review build your first page/i })[0]!);

    expect(JSON.stringify(studentState)).toBe(before);
    expect(studentState.topicCompleted).toBe(true);
    expect(studentState.completedNodes).toEqual(lesson.learningPath.map((node) => node.id));
    expect(studentState.quizAttempts).toHaveLength(1);
    expect(studentState.bestQuizScore).toBe(100);
    expect(studentState.xpEarned).toBe(160);
  });

  it('reviews generic future topics without subject-specific assumptions', () => {
    const genericLesson: Lesson = {
      ...lesson,
      metadata: {
        ...lesson.metadata,
        id: 'future-topic-01',
        title: 'Future Topic',
        description: 'A topic that is not about HTML.',
        category: 'Python',
      },
      objectives: ['Understand a generic concept'],
      review: {
        learned: ['Generic lessons can be reviewed.'],
        keyConcepts: ['Topic-agnostic rendering'],
        takeaways: ['Content comes from JSON.'],
      },
      learningPath: [
        {
          id: 'future-node-01',
          type: 'code',
          title: 'Python Example',
          code: {
            language: 'python',
            content: 'print("hello")',
          },
        },
      ],
    };

    renderReview({
      lesson: genericLesson,
      studentState: completedState(genericLesson),
    });

    expect(screen.getByRole('heading', { name: 'Future Topic' })).toBeInTheDocument();
    expect(screen.getByText('python')).toBeInTheDocument();
    expect(screen.getByText('print("hello")')).toBeInTheDocument();
  });
});
