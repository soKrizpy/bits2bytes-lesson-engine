import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NodeRenderer } from './NodeRenderer';
import type { Lesson } from '@/types/lesson';
import type { StudentState } from '@/types/state';
import { INITIAL_STUDENT_STATE } from '@/types/state';
import lessonData from '../../../public/lessons/beginner/html/beginner-html-01.json';

const lesson = lessonData as unknown as Lesson;

const studentState: StudentState = {
  ...INITIAL_STUDENT_STATE,
  studentId: 'student-01',
  topicId: lesson.metadata.id,
  currentNodeIndex: lesson.learningPath.length,
  completedNodes: lesson.learningPath.map((node) => node.id),
  bestQuizScore: 100,
  xpEarned: 160,
  topicCompleted: true,
  achievement: lesson.completion.achievementName,
  xpAwardedForCompletion: true,
};

describe('NodeRenderer review mode', () => {
  it('does not expose progression controls or call advanceNode in lesson review', () => {
    const onAdvance = vi.fn();

    render(
      <NodeRenderer
        node={lesson.learningPath[0]!}
        studentState={studentState}
        quizQuestions={lesson.quiz.questions}
        onAdvance={onAdvance}
        onSubmitQuizAttempt={vi.fn()}
        mode="review"
      />
    );

    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();
    expect(onAdvance).not.toHaveBeenCalled();
  });

  it('shows practice content without allowing answer submission', () => {
    render(
      <NodeRenderer
        node={lesson.learningPath[7]!}
        studentState={studentState}
        quizQuestions={lesson.quiz.questions}
        onAdvance={vi.fn()}
        onSubmitQuizAttempt={vi.fn()}
        mode="review"
      />
    );

    expect(screen.getByText('Which HTML tag creates the largest heading on a page?')).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /complete the activity/i })).not.toBeInTheDocument();
  });

  it('renders quiz review without consuming attempts', () => {
    const onSubmitQuizAttempt = vi.fn();

    render(
      <NodeRenderer
        node={lesson.learningPath[9]!}
        studentState={studentState}
        quizQuestions={lesson.quiz.questions}
        onAdvance={vi.fn()}
        onSubmitQuizAttempt={onSubmitQuizAttempt}
        mode="review"
      />
    );

    expect(screen.getByText('Knowledge Check Review')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /start quiz/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /submit answers/i })).not.toBeInTheDocument();
    expect(onSubmitQuizAttempt).not.toHaveBeenCalled();
  });
});
