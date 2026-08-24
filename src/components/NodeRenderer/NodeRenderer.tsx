'use client';

// src/components/NodeRenderer/NodeRenderer.tsx
// Registry-based node renderer dispatcher.
// Maps node.type to the appropriate renderer component.
//
// Adding a new node type = add ONE entry to SIMPLE_RENDERERS.
// Quiz and fallback are handled explicitly due to their extra props.

import type { LearningNode, QuizQuestion } from '@/types/lesson';
import type { StudentState } from '@/types/state';
import { LessonNodeView } from '@/components/nodes/LessonNodeView';
import { CodeNodeView } from '@/components/nodes/CodeNodeView';
import { PracticeNodeView } from '@/components/nodes/PracticeNodeView';
import { ChallengeNodeView } from '@/components/nodes/ChallengeNodeView';
import { FallbackNodeView } from '@/components/nodes/FallbackNodeView';
import { QuizEngine } from '@/components/QuizEngine/QuizEngine';
import type {
  LessonNode,
  CodeNode,
  PracticeNode,
  ChallengeNode,
} from '@/types/lesson';

export interface NodeRendererProps {
  node: LearningNode;
  studentState: StudentState;
  quizQuestions: QuizQuestion[];
  onAdvance: () => void;
  onSubmitQuizAttempt: (answers: Record<string, string>) => void;
  mode?: 'learning' | 'review';
}

// Renderer type for simple nodes that only need node + onAdvance
type SimpleRendererFn = (props: {
  node: LearningNode;
  onAdvance: () => void;
  mode: 'learning' | 'review';
}) => React.ReactElement;

const SIMPLE_RENDERERS: Record<string, SimpleRendererFn> = {
  lesson: ({ node, onAdvance, mode }) => (
    <LessonNodeView node={node as LessonNode} onAdvance={onAdvance} mode={mode} />
  ),
  code: ({ node, onAdvance, mode }) => (
    <CodeNodeView node={node as CodeNode} onAdvance={onAdvance} mode={mode} />
  ),
  practice: ({ node, onAdvance, mode }) => (
    <PracticeNodeView node={node as PracticeNode} onAdvance={onAdvance} mode={mode} />
  ),
  challenge: ({ node, onAdvance, mode }) => (
    <ChallengeNodeView node={node as ChallengeNode} onAdvance={onAdvance} mode={mode} />
  ),
};

export function NodeRenderer({
  node,
  studentState,
  quizQuestions,
  onAdvance,
  onSubmitQuizAttempt,
  mode = 'learning',
}: NodeRendererProps) {
  // Quiz node: needs studentState and onSubmitQuizAttempt in addition to the basics
  if (node.type === 'quiz') {
    if (mode === 'review') {
      return <QuizReviewOnly questions={quizQuestions} studentState={studentState} />;
    }

    return (
      <QuizEngine
        questions={quizQuestions}
        studentState={studentState}
        onSubmitAttempt={onSubmitQuizAttempt}
        onAdvance={onAdvance}
      />
    );
  }

  // Simple nodes: look up in registry
  const renderer = SIMPLE_RENDERERS[node.type];
  if (renderer !== undefined) {
    return renderer({ node, onAdvance, mode });
  }

  // Unknown node type: fallback
  return (
    <FallbackNodeView
      node={node as unknown as { type: string; title?: string; [key: string]: unknown }}
      onAdvance={onAdvance}
      mode={mode}
    />
  );
}

function QuizReviewOnly({
  questions,
  studentState,
}: {
  questions: QuizQuestion[];
  studentState: StudentState;
}) {
  const maxScore = questions.reduce((sum, question) => sum + question.points, 0);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-text-base">Knowledge Check Review</h2>
        <p className="text-text-muted text-sm">
          {questions.length} questions · best saved score {studentState.bestQuizScore} / {maxScore}
        </p>
      </div>

      <div className="space-y-4">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className="rounded-xl border border-white/10 bg-card p-5 space-y-3"
          >
            <p className="text-text-base text-sm font-semibold leading-snug">
              {index + 1}. {question.question}
            </p>
            <p className="text-success text-sm">
              Correct answer:{' '}
              <span className="font-semibold">{question.correctAnswer}</span>
            </p>
            <p className="text-text-muted text-sm leading-relaxed">
              {question.explanation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
