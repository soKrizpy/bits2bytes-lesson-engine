'use client';

// src/components/nodes/FallbackNodeView.tsx
// Displayed when a node type is not handled by any registered renderer.
// Shows the unknown type string and a "not supported" message.
// Never throws regardless of node shape.

import { useEngineTranslations } from '@/hooks/useEngineTranslations';

interface FallbackNodeViewProps {
  node: { type: string; title?: string; [key: string]: unknown };
  onAdvance: () => void;
  mode?: 'learning' | 'review';
}

export function FallbackNodeView({ node, onAdvance, mode = 'learning' }: FallbackNodeViewProps) {
  const t = useEngineTranslations();

  return (
    <div className="space-y-4">
      <div className="lesson-callout bg-warning/10 border-warning/20 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">⚙️</span>
          <span className="text-warning font-semibold">{t('review.nodeUnsupported')}</span>
        </div>
        <p className="text-text-muted text-sm">
          {t('node.unsupported', { type: node.type })}
        </p>
        {node.title !== undefined && (
          <p className="text-text-muted text-sm">
            {t('node.unsupportedTitle')} <span className="text-text-base">{node.title}</span>
          </p>
        )}
      </div>
      {mode === 'learning' && (
        <button
          onClick={onAdvance}
          className="text-sm text-text-muted hover:text-text-base underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          {t('node.skipAndContinue')}
        </button>
      )}
    </div>
  );
}
