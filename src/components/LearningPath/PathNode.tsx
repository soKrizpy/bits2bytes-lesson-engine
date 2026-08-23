// src/components/LearningPath/PathNode.tsx
// A single node card in the visual learning path.
// Communicates state via icon shape + colour — not colour alone (WCAG).
// Three states: completed, current, upcoming.

import type { LearningNode } from '@/types/lesson';

type NodeState = 'completed' | 'current' | 'upcoming';

interface PathNodeProps {
  node: LearningNode;
  state: NodeState;
  index: number;
  isLast: boolean;
}

// Node type → emoji icon
const NODE_ICONS: Record<string, string> = {
  lesson: '📖',
  code: '💻',
  practice: '✏️',
  challenge: '🏆',
  quiz: '❓',
};

function getNodeIcon(type: string): string {
  return NODE_ICONS[type] ?? '⬡';
}

export function PathNode({ node, state, index, isLast }: PathNodeProps) {
  const isCompleted = state === 'completed';
  const isCurrent = state === 'current';
    return (
    <li className="relative flex items-start gap-3">
      {/* Connector line (not shown on last node) */}
      {!isLast && (
        <div
          className={[
            'absolute left-4 top-10 w-0.5 h-full -translate-x-0.5',
            isCompleted ? 'bg-success/40' : 'bg-white/10',
          ].join(' ')}
          aria-hidden="true"
        />
      )}

      {/* Node circle */}
      <div
        className={[
          'relative z-10 flex items-center justify-center rounded-full shrink-0 transition-all duration-300',
          isCurrent
            ? 'w-10 h-10 bg-primary shadow-lg shadow-primary/30 ring-4 ring-primary/20'
            : isCompleted
            ? 'w-8 h-8 bg-success/20 border-2 border-success'
            : 'w-8 h-8 bg-white/5 border-2 border-white/20',
        ].join(' ')}
        aria-hidden="true"
      >
        {isCompleted ? (
          <span className="text-success text-sm font-bold">✓</span>
        ) : isCurrent ? (
          <span className="text-base">{getNodeIcon(node.type)}</span>
        ) : (
          <span className="text-text-muted text-xs">{index + 1}</span>
        )}
      </div>

      {/* Node label */}
      <div
        className={[
          'pb-6 min-w-0 flex-1 pt-1',
          isCurrent ? 'mt-0' : isCompleted ? '-mt-1' : '-mt-1',
        ].join(' ')}
      >
        <p
          className={[
            'text-sm font-medium leading-snug truncate transition-colors duration-200',
            isCurrent
              ? 'text-text-base font-semibold'
              : isCompleted
              ? 'text-text-muted'
              : 'text-text-muted/60',
          ].join(' ')}
          title={node.title}
        >
          {node.title}
        </p>
        <p
          className={[
            'text-xs mt-0.5 capitalize',
            isCompleted ? 'text-success/70' : isCurrent ? 'text-primary/80' : 'text-text-muted/40',
          ].join(' ')}
        >
          {isCompleted ? 'completed' : isCurrent ? 'current' : node.type}
        </p>
      </div>
    </li>
  );
}
