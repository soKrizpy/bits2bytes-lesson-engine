import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QuizEngine } from './QuizEngine';
import type { QuizQuestion } from '@/types/lesson';
import { INITIAL_STUDENT_STATE, type StudentState } from '@/types/state';

const questions: QuizQuestion[] = [
  { id: 'q1', question: 'Satu?', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A', explanation: 'A benar.', points: 20 },
  { id: 'q2', question: 'Dua?', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A', explanation: 'A benar.', points: 20 },
  { id: 'q3', question: 'Tiga?', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A', explanation: 'A benar.', points: 20 },
];

const oneAttemptState: StudentState = {
  ...INITIAL_STUDENT_STATE,
  studentId: 'student-1',
  topicId: 'topic-1',
  quizAttempts: [{ attemptNumber: 1, score: 20, answers: { q1: 'A' }, submittedAt: '2026-01-01T00:00:00Z' }],
  bestQuizScore: 20,
};

describe('QuizEngine retry flow', () => {
  it('starts attempt two directly after selecting retry', () => {
    const onCanAdvanceChange = vi.fn();
    render(
      <QuizEngine
        questions={questions}
        studentState={oneAttemptState}
        onSubmitAttempt={vi.fn()}
        onAdvance={vi.fn()}
        onCanAdvanceChange={onCanAdvanceChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /ulang kuis/i }));
    expect(screen.getByText('Percobaan 2 dari 2')).toBeInTheDocument();

    // The quiz retains control of navigation during the retry.
    expect(onCanAdvanceChange).toHaveBeenLastCalledWith(false);
  });
});
