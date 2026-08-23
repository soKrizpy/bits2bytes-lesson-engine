'use client';

// src/components/nodes/LessonNodeView.tsx
// Renders a 'lesson' type node.
// Shows: title, explanation (or placeholder), optional analogy, expectedResult, tips.
// Topic-agnostic — works for any lesson content.

import { Button } from '@/components/ui/Button';
import type { LessonNode } from '@/types/lesson';

interface LessonNodeViewProps {
  node: LessonNode;
  onAdvance: () => void;
}

export function LessonNodeView({ node, onAdvance }: LessonNodeViewProps) {
  return (
    <div className="space-y-6">
      {/* Title */}
      <h2 className="text-2xl font-bold text-text-base">{node.title}</h2>

      {/* Explanation */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/10">
        <p className="text-text-base leading-relaxed whitespace-pre-wrap">
          {node.explanation ?? (
            <span className="text-text-muted italic">No explanation available for this step.</span>
          )}
        </p>
      </div>

      {/* Analogy */}
      {node.analogy !== undefined && node.analogy !== '' && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg" aria-hidden="true">💡</span>
            <span className="text-primary text-sm font-semibold uppercase tracking-wide">Think of it this way</span>
          </div>
          <p className="text-text-base leading-relaxed">{node.analogy}</p>
        </div>
      )}

      {/* Expected Result */}
      {node.expectedResult !== undefined && node.expectedResult !== '' && (
        <div className="bg-success/10 border border-success/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg" aria-hidden="true">🎯</span>
            <span className="text-success text-sm font-semibold uppercase tracking-wide">What you&apos;ll achieve</span>
          </div>
          <p className="text-text-base leading-relaxed">{node.expectedResult}</p>
        </div>
      )}

      {/* Tips */}
      {node.tips !== undefined && node.tips.length > 0 && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg" aria-hidden="true">✨</span>
            <span className="text-warning text-sm font-semibold uppercase tracking-wide">Tips</span>
          </div>
          <ul className="space-y-2">
            {node.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-text-base text-sm">
                <span className="text-warning mt-0.5 shrink-0">→</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Advance */}
      <div className="pt-2">
        <Button onClick={onAdvance} size="lg" className="w-full sm:w-auto">
          Got it! Continue →
        </Button>
      </div>
    </div>
  );
}
