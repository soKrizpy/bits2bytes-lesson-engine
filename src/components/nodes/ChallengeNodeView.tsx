'use client';

// src/components/nodes/ChallengeNodeView.tsx
// Renders a 'challenge' type node.
// Shows: title, instructions, optional starterCode block, optional expectedResult.
// Absent optional fields produce no visible error.

import { Button } from '@/components/ui/Button';
import type { ChallengeNode } from '@/types/lesson';

interface ChallengeNodeViewProps {
  node: ChallengeNode;
  onAdvance: () => void;
  mode?: 'learning' | 'review';
}

export function ChallengeNodeView({ node, onAdvance, mode = 'learning' }: ChallengeNodeViewProps) {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">🏆</span>
        <h2 className="text-2xl sm:text-3xl font-bold text-text-base tracking-tight">{node.title}</h2>
      </div>

      {/* Instructions */}
      <div className="lesson-callout bg-primary/10 border-primary/20">
        <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">Your Challenge</p>
        <p className="text-text-base leading-relaxed whitespace-pre-wrap">{node.instructions}</p>
      </div>

      {/* Starter code */}
      {node.starterCode !== undefined && (
        <div className="code-shell">
          <div className="flex items-center justify-between bg-white/5 px-4 py-2 border-b border-white/10">
            <span className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">
              {node.starterCode.language}
            </span>
            <span className="text-xs text-text-muted">starter code</span>
          </div>
          <pre>
            <code className="text-sm font-mono text-text-base leading-relaxed whitespace-pre">
              {node.starterCode.content}
            </code>
          </pre>
        </div>
      )}

      {/* Expected result */}
      {node.expectedResult !== undefined && node.expectedResult !== '' && (
        <div className="lesson-callout bg-success/10 border-success/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg" aria-hidden="true">🎯</span>
            <span className="text-success text-sm font-semibold uppercase tracking-wide">Expected result</span>
          </div>
          <p className="text-text-base text-sm leading-relaxed">{node.expectedResult}</p>
        </div>
      )}

      {mode === 'learning' && (
        <div className="pt-2">
          <Button onClick={onAdvance} size="lg" className="w-full sm:w-auto">
            Challenge Complete →
          </Button>
        </div>
      )}
    </div>
  );
}
