import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TopicOverview } from './TopicOverview';
import { loadLesson } from '@/engine/loader';
import type { TopicRegistryEntry } from '@/engine/topicRegistry';
import type { Lesson } from '@/types/lesson';
import { INITIAL_STUDENT_STATE } from '@/types/state';
import lessonData from '../../../public/lessons/beginner/html/beginner-html-01.json';

vi.mock('@/engine/loader', () => ({
  loadLesson: vi.fn(),
}));

const lesson = lessonData as unknown as Lesson;
const mockedLoadLesson = vi.mocked(loadLesson);

const topics: TopicRegistryEntry[] = [
  { topicId: 'topic-new', level: 'beginner', category: 'html' },
  { topicId: 'topic-progress', level: 'beginner', category: 'html' },
  { topicId: 'topic-complete', level: 'beginner', category: 'html' },
];

beforeEach(() => {
  localStorage.clear();
  mockedLoadLesson.mockResolvedValue({ success: true, lesson });
});

describe('TopicOverview', () => {
  it('shows a new topic with a Start Learning action', async () => {
    render(<TopicOverview topics={[topics[0]!]} />);

    await waitFor(() => expect(screen.getByText('Start Learning')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /start learning/i })).toHaveAttribute(
      'href',
      '/lesson/topic-new'
    );
    expect(screen.getByText('Not started')).toBeInTheDocument();
  });

  it('shows an in-progress topic with a Continue Learning action', async () => {
    localStorage.setItem(
      'b2b_lesson_state_topic-progress',
      JSON.stringify({
        ...INITIAL_STUDENT_STATE,
        studentId: 'student-01',
        topicId: 'topic-progress',
        currentNodeIndex: 2,
        completedNodes: ['node-01'],
      })
    );

    render(<TopicOverview topics={[topics[1]!]} />);

    await waitFor(() => expect(screen.getByText('Continue Learning')).toBeInTheDocument());
    expect(screen.getByText('In progress')).toBeInTheDocument();
  });

  it('shows a completed topic with a Review Topic action', async () => {
    localStorage.setItem(
      'b2b_lesson_state_topic-complete',
      JSON.stringify({
        ...INITIAL_STUDENT_STATE,
        studentId: 'student-01',
        topicId: 'topic-complete',
        currentNodeIndex: lesson.learningPath.length,
        completedNodes: lesson.learningPath.map((node) => node.id),
        topicCompleted: true,
      })
    );

    render(<TopicOverview topics={[topics[2]!]} />);

    await waitFor(() => expect(screen.getByText('Review Topic')).toBeInTheDocument());
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('keeps navigation UI read-only and does not modify the saved state', async () => {
    const savedState = {
      ...INITIAL_STUDENT_STATE,
      studentId: 'student-01',
      topicId: 'topic-progress',
      currentNodeIndex: 1,
      completedNodes: ['node-01'],
    };
    localStorage.setItem('b2b_lesson_state_topic-progress', JSON.stringify(savedState));

    render(<TopicOverview topics={[topics[1]!]} />);
    await waitFor(() => expect(screen.getByText('Continue Learning')).toBeInTheDocument());

    expect(JSON.parse(localStorage.getItem('b2b_lesson_state_topic-progress')!)).toEqual(savedState);
  });
});
