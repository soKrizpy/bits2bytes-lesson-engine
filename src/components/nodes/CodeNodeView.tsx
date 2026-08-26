'use client';

// src/components/nodes/CodeNodeView.tsx
// Renders a 'code' type node.
// Displays code.content in a pre/code block preserving whitespace.
// Language label matches code.language exactly — no normalisation.
// Topic-agnostic: works for html, css, javascript, python, lua, etc.

import { Button } from '@/components/ui/Button';
import type { CodeNode } from '@/types/lesson';

interface CodeNodeViewProps {
  node: CodeNode;
  onAdvance: () => void;
  mode?: 'learning' | 'review';
}

export function CodeNodeView({ node, onAdvance, mode = 'learning' }: CodeNodeViewProps) {
  return (
    <div className="space-y-6">
      {/* Title */}
      <h2 className="text-2xl sm:text-3xl font-bold text-text-base tracking-tight">{node.title}</h2>

      {/* Optional explanation */}
      {node.explanation !== undefined && node.explanation !== '' && (
        <p className="text-text-muted leading-relaxed">{node.explanation}</p>
      )}

      {/* Code block */}
      <div className="code-shell">
        {/* Language label */}
        <div className="flex items-center justify-between bg-white/5 px-4 py-2 border-b border-white/10">
          <span className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">
            {node.code.language}
          </span>
          <span className="text-xs text-text-muted">code example</span>
        </div>
        {/* Code content — preserves whitespace and indentation */}
        <pre>
          <code className="text-sm font-mono text-text-base leading-relaxed whitespace-pre">
            {node.code.content}
          </code>
        </pre>
      </div>

      {mode === 'learning' && (
        <div className="pt-2">
          <Button onClick={onAdvance} size="lg" className="w-full sm:w-auto">
            Got it, continue →
          </Button>
        </div>
      )}
    </div>
  );
}
