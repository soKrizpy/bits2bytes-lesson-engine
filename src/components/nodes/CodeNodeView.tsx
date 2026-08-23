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
}

export function CodeNodeView({ node, onAdvance }: CodeNodeViewProps) {
  return (
    <div className="space-y-6">
      {/* Title */}
      <h2 className="text-2xl font-bold text-text-base">{node.title}</h2>

      {/* Optional explanation */}
      {node.explanation !== undefined && node.explanation !== '' && (
        <p className="text-text-muted leading-relaxed">{node.explanation}</p>
      )}

      {/* Code block */}
      <div className="rounded-xl overflow-hidden border border-white/10">
        {/* Language label */}
        <div className="flex items-center justify-between bg-white/5 px-4 py-2 border-b border-white/10">
          <span className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">
            {node.code.language}
          </span>
          <span className="text-xs text-text-muted">code example</span>
        </div>
        {/* Code content — preserves whitespace and indentation */}
        <pre className="bg-slate-900 p-5 overflow-x-auto">
          <code className="text-sm font-mono text-text-base leading-relaxed whitespace-pre">
            {node.code.content}
          </code>
        </pre>
      </div>

      {/* Advance */}
      <div className="pt-2">
        <Button onClick={onAdvance} size="lg" className="w-full sm:w-auto">
          Got it! Continue →
        </Button>
      </div>
    </div>
  );
}
