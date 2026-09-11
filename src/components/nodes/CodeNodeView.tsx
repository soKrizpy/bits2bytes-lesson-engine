'use client';

// src/components/nodes/CodeNodeView.tsx
// Renders a 'code' type node.
// Displays code.content in a pre/code block preserving whitespace.
// Language label matches code.language exactly — no normalisation.
// Topic-agnostic: works for html, css, javascript, python, lua, etc.

import { useEffect, useState } from 'react';
import type { CodeNode } from '@/types/lesson';

type CopyState = 'idle' | 'copied' | 'error';

interface CodeNodeViewProps {
  node: CodeNode;
  onAdvance: () => void;
  onCanAdvanceChange?: (canAdvance: boolean) => void;
  mode?: 'learning' | 'review';
}

export function CodeNodeView({ node, onAdvance: _onAdvance, onCanAdvanceChange, mode: _mode = 'learning' }: CodeNodeViewProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle');

  useEffect(() => {
    onCanAdvanceChange?.(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(node.code.content);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
    setTimeout(() => setCopyState('idle'), 2000);
  }

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
        {/* Language label + Copy button */}
        <div className="flex items-center justify-between bg-white/5 px-4 py-2 border-b border-white/10">
          <span className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">
            {node.code.language}
          </span>
          <button
            onClick={handleCopy}
            className="text-xs font-semibold text-text-muted hover:text-text-base transition-colors px-2 py-0.5 rounded border border-white/10 hover:border-white/30"
            aria-label="Copy code"
          >
            {{ idle: 'Copy', copied: 'Copied!', error: 'Error' }[copyState]}
          </button>
        </div>
        {/* Code content — preserves whitespace and indentation */}
        <pre>
          <code className="text-sm font-mono text-text-base leading-relaxed whitespace-pre">
            {node.code.content}
          </code>
        </pre>
      </div>
    </div>
  );
}
