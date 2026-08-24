'use client';

// src/components/LearningPath/LearningPath.tsx
// Visual learning path sidebar.
// Shows all nodes as a vertical journey with completed/current/upcoming states.
// Scrolls to the current node on mount and on currentNodeIndex change.
// Respects prefers-reduced-motion for scroll behaviour.

import { useEffect, useRef } from 'react';
import { PathNode } from './PathNode';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { calculateProgress } from '@/engine/progress';
import type { LearningNode } from '@/types/lesson';
import type { StudentState } from '@/types/state';

interface LearningPathProps {
  nodes: LearningNode[];
  studentState: StudentState;
  mode?: 'learning' | 'review';
  selectedNodeIndex?: number;
  onSelectNode?: (index: number) => void;
}

type NodeState = 'completed' | 'current' | 'upcoming' | 'selected';

function getNodeState(
  nodeId: string,
  index: number,
  studentState: StudentState
): NodeState {
  if (studentState.completedNodes.includes(nodeId)) return 'completed';
  if (index === studentState.currentNodeIndex) return 'current';
  return 'upcoming';
}

export function LearningPath({
  nodes,
  studentState,
  mode = 'learning',
  selectedNodeIndex,
  onSelectNode,
}: LearningPathProps) {
  const currentNodeRef = useRef<HTMLLIElement | null>(null);
  const progress = calculateProgress(studentState, nodes.length);
  const isReviewMode = mode === 'review';

  // Scroll current node into view whenever currentNodeIndex changes
  useEffect(() => {
    if (currentNodeRef.current === null) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    currentNodeRef.current.scrollIntoView({
      behavior: prefersReduced ? 'auto' : 'smooth',
      block: 'nearest',
    });
  }, [studentState.currentNodeIndex, selectedNodeIndex]);

  if (nodes.length === 0) {
    return (
      <div className="p-4 space-y-4">
        <ProgressBar value={0} completed={0} total={0} />
        <p className="text-text-muted text-sm text-center">No nodes in this topic.</p>
      </div>
    );
  }

  return (
    <nav aria-label={isReviewMode ? 'Review learning path' : 'Learning path'} className="flex flex-col h-full">
      {/* Progress bar header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/10">
        <ProgressBar
          value={progress.percentage}
          completed={progress.completedCount}
          total={progress.totalCount}
        />
      </div>

      {/* Node list */}
      <ol className="flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-0" role="list">
        {nodes.map((node, index) => {
          const nodeState: NodeState =
            isReviewMode && selectedNodeIndex === index
              ? 'selected'
              : getNodeState(node.id, index, studentState);
          const isCurrent = nodeState === 'current' || nodeState === 'selected';

          return (
            <li
              key={node.id}
              ref={isCurrent ? currentNodeRef : null}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <PathNode
                node={node}
                state={nodeState}
                index={index}
                isLast={index === nodes.length - 1}
                {...(isReviewMode && onSelectNode !== undefined
                  ? { onSelect: () => { onSelectNode(index); } }
                  : {})}
              />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
