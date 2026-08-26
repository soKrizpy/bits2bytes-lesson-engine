'use client';

// src/components/TopicReview/ChallengeSolution.tsx
// Read-only challenge solution shown after topic completion.
// Topic-agnostic: language, code, and explanation all come from lesson JSON.

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { ChallengeNode } from '@/types/lesson';

interface ChallengeSolutionProps {
  solution: ChallengeNode['solution'] | undefined;
}

export function ChallengeSolution({ solution }: ChallengeSolutionProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (solution === undefined) return;
    if (navigator.clipboard === undefined) return;
    try {
      await navigator.clipboard.writeText(solution.code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
    window.setTimeout(() => setCopied(false), 2000);
  }

  if (solution === undefined) {
    return (
      <div className="bg-card border border-white/10 rounded-2xl p-5">
        <p className="text-sm font-semibold text-text-base mb-2">
          Example Solution
        </p>
        <p className="text-sm text-text-muted leading-relaxed">
          An example solution is not available for this challenge.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-4" aria-label="Challenge example solution">
      {solution.explanation !== undefined && solution.explanation !== '' && (
        <details className="group rounded-2xl border border-primary/20 bg-primary/10">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-primary outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus [&::-webkit-details-marker]:hidden">
            <span>Why This Code Works</span>
            <span className="text-primary/70 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true">⌄</span>
          </summary>
          <p className="border-t border-primary/20 px-5 py-4 text-sm leading-relaxed text-text-base">
            {solution.explanation}
          </p>
        </details>
      )}

      <div className="code-shell">
        <div className="flex items-center justify-between gap-3 bg-white/5 px-4 py-2 border-b border-white/10">
          <span className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">
            {solution.language}
          </span>
          <Button
            onClick={() => { void handleCopy(); }}
            variant="ghost"
            size="sm"
            aria-label="Copy full solution code"
          >
            {copied ? 'Copied' : 'Copy Code'}
          </Button>
        </div>
        <pre>
          <code className="text-sm font-mono text-text-base leading-relaxed whitespace-pre">
            {solution.code}
          </code>
        </pre>
      </div>
    </section>
  );
}
