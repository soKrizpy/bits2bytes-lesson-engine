import type { LearningNode } from '@/types/lesson';

interface NodeStageHeaderProps {
  node: LearningNode;
  nodeIndex: number;
  totalNodes: number;
  isRevisit: boolean;
}

const NODE_IDENTITY: Record<string, { icon: string; label: string }> = {
  lesson: { icon: '📖', label: 'Lesson' },
  code: { icon: '💻', label: 'Coding' },
  practice: { icon: '✏️', label: 'Practice' },
  challenge: { icon: '🏆', label: 'Challenge' },
  quiz: { icon: '❓', label: 'Quiz' },
};

export function NodeStageHeader({
  node,
  nodeIndex,
  totalNodes,
  isRevisit,
}: NodeStageHeaderProps) {
  const identity = NODE_IDENTITY[node.type] ?? { icon: '⬡', label: 'Checkpoint' };
  const contextLabel = isRevisit ? 'Reviewing' : 'Current Stage';

  return (
    <section
      className={[
        'relative overflow-hidden rounded-2xl border p-5 sm:p-6',
        isRevisit
          ? 'border-white/10 bg-card/70'
          : 'border-primary/30 bg-primary/10 shadow-sm shadow-primary/10',
      ].join(' ')}
      aria-label={`${contextLabel}: ${node.title}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={[
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-2xl',
            isRevisit
              ? 'border-white/15 bg-white/5'
              : 'border-primary/30 bg-primary/15',
          ].join(' ')}
          aria-hidden="true"
        >
          {identity.icon}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
            <span className={isRevisit ? 'text-text-muted' : 'text-primary'}>
              {contextLabel}
            </span>
            <span className="text-text-muted/60" aria-hidden="true">•</span>
            <span className="text-text-muted">Checkpoint {nodeIndex + 1} of {totalNodes}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold leading-tight text-text-base sm:text-xl">
              {node.title}
            </h1>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-text-muted">
              {identity.label}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
