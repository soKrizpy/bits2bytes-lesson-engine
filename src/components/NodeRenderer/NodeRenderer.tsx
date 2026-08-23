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
}

// Renderer type for simple nodes that only need node + onAdvance
type SimpleRendererFn = (props: { node: LearningNode; onAdvance: () => void }) => React.ReactElement;

const SIMPLE_RENDERERS: Record<string, SimpleRendererFn> = {
  lesson: ({ node, onAdvance }) => (
    <LessonNodeView node={node as LessonNode} onAdvance={onAdvance} />
  ),
  code: ({ node, onAdvance }) => (
    <CodeNodeView node={node as CodeNode} onAdvance={onAdvance} />
  ),
  practice: ({ node, onAdvance }) => (
    <PracticeNodeView node={node as PracticeNode} onAdvance={onAdvance} />
  ),
  challenge: ({ node, onAdvance }) => (
    <ChallengeNodeView node={node as ChallengeNode} onAdvance={onAdvance} />
  ),
};

export function NodeRenderer({
  node,
  studentState,
  quizQuestions,
  onAdvance,
  onSubmitQuizAttempt,
}: NodeRendererProps) {
  // Quiz node: needs studentState and onSubmitQuizAttempt in addition to the basics
  if (node.type === 'quiz') {
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
    return renderer({ node, onAdvance });
  }

  // Unknown node type: fallback
  return (
    <FallbackNodeView
      node={node as unknown as { type: string; title?: string; [key: string]: unknown }}
      onAdvance={onAdvance}
    />
  );
}
