// src/components/LearningPath/PathNode.tsx
// A single node card in the visual learning path.
// Communicates state via icon shape + colour — not colour alone (WCAG).
// States: completed, current, upcoming, selected.

import type { LearningNode } from '@/types/lesson';

type NodeState = 'completed' | 'current' | 'upcoming' | 'selected';

interface PathNodeProps {
  node: LearningNode;
  state: NodeState;
  index: number;
  isLast: boolean;
  onSelect?: () => void;
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

export function PathNode({ node, state, index, isLast, onSelect }: PathNodeProps) {
  const isCompleted = state === 'completed';
  const isCurrent = state === 'current';
  const isSelected = state === 'selected';
  const isInteractive = onSelect !== undefined;

  const content = (
    <>
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
          isSelected
            ? 'w-10 h-10 bg-primary/20 border-2 border-primary ring-4 ring-primary/20'
            : isCurrent
            ? 'w-10 h-10 bg-primary shadow-lg shadow-primary/30 ring-4 ring-primary/20'
            : isCompleted
            ? 'w-8 h-8 bg-success/20 border-2 border-success'
            : 'w-8 h-8 bg-white/5 border-2 border-white/20',
        ].join(' ')}
        aria-hidden="true"
      >
        {isCompleted ? (
          <span className="text-success text-sm font-bold">✓</span>
        ) : isCurrent || isSelected ? (
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
            isSelected
              ? 'text-primary font-semibold'
              : isCurrent
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
            isSelected ? 'text-primary/80' : isCompleted ? 'text-success/70' : isCurrent ? 'text-primary/80' : 'text-text-muted/40',
          ].join(' ')}
        >
          {isSelected ? 'selected' : isCompleted ? 'completed' : isCurrent ? 'current' : node.type}
        </p>
      </div>
    </>
  );

  if (isInteractive) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className="relative flex items-start gap-3 w-full text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={`Review ${node.title}`}
        aria-pressed={isSelected}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="relative flex items-start gap-3">
      {content}
    </div>
  );
}
