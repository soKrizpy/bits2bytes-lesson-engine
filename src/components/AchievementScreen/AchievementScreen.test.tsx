import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AchievementScreen } from './AchievementScreen';
import type { Lesson } from '@/types/lesson';
import type { StudentState } from '@/types/state';
import { INITIAL_STUDENT_STATE } from '@/types/state';
import lessonData from '../../../public/lessons/beginner/html/beginner-html-01.json';

const lesson = lessonData as unknown as Lesson;

function completedState(): StudentState {
  return {
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
}

describe('AchievementScreen', () => {
  it('calls onReview when Review Topic is selected', () => {
    const onReview = vi.fn();
    const onReturn = vi.fn();

    render(
      <AchievementScreen
        lesson={lesson}
        studentState={completedState()}
        onReview={onReview}
        onReturn={onReturn}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /review completed topic/i }));

    expect(onReview).toHaveBeenCalledTimes(1);
    expect(onReturn).not.toHaveBeenCalled();
  });

  it('offers the registry-provided next topic when available', () => {
    const onNextTopic = vi.fn();

    render(
      <AchievementScreen
        lesson={lesson}
        studentState={completedState()}
        onReview={vi.fn()}
        onReturn={vi.fn()}
        nextTopic={{ topicId: 'beginner-css-01', title: 'beginner-css-01' }}
        onNextTopic={onNextTopic}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /start next topic/i }));
    expect(onNextTopic).toHaveBeenCalledTimes(1);
  });
});
