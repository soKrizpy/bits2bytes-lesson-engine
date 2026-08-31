import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LearningPath } from './LearningPath';
import type { LearningNode } from '@/types/lesson';
import type { StudentState } from '@/types/state';

const nodes = [
  { id: 'lesson-01', type: 'lesson', title: 'Welcome' },
  { id: 'code-01', type: 'code', title: 'First Code' },
  { id: 'quiz-01', type: 'quiz', title: 'Knowledge Check' },
] as LearningNode[];

const state: StudentState = {
  studentId: 'student-01',
  topicId: 'topic-01',
  currentNodeIndex: 1,
  completedNodes: ['lesson-01'],
  quizAttempts: [],
  bestQuizScore: 0,
  xpEarned: 0,
  topicCompleted: false,
  achievement: null,
  xpAwardedForCompletion: false,
};

describe('LearningPath active-learning navigation', () => {
  it('allows completed and current nodes, but keeps upcoming nodes locked', () => {
    const onSelect = vi.fn();
    render(
      <LearningPath
        nodes={nodes}
        studentState={state}
        selectedNodeIndex={1}
        onSelectNode={onSelect}
      />
    );

    expect(screen.getAllByRole('button', { name: /welcome — selesai/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /first code/i }).length).toBeGreaterThan(0);
    expect(screen.queryAllByRole('button', { name: /knowledge check — terkunci/i })).toHaveLength(0);

    fireEvent.click(screen.getAllByRole('button', { name: /welcome — selesai/i })[0]!);
    expect(onSelect).toHaveBeenCalledWith(0);
  });

  it('supports review selection for every node', () => {
    const onSelect = vi.fn();
    render(
      <LearningPath
        nodes={nodes}
        studentState={{ ...state, topicCompleted: true, currentNodeIndex: 3, completedNodes: nodes.map((node) => node.id) }}
        mode="review"
        selectedNodeIndex={0}
        onSelectNode={onSelect}
      />
    );

    fireEvent.click(screen.getAllByRole('button', { name: /review knowledge check/i })[0]!);
    expect(onSelect).toHaveBeenCalledWith(2);
  });
});
