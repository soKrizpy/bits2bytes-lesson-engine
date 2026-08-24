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
    await navigator.clipboard.writeText(solution.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  if (solution === undefined) {
    return (
      <div className="bg-card border border-white/10 rounded-xl p-5">
        <p className="text-sm font-semibold text-text-base mb-2">
          Full Solution
        </p>
        <p className="text-sm text-text-muted leading-relaxed">
          No full solution is available for this challenge yet.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-4" aria-label="Challenge solution">
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-5">
        <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-2">
          Full Solution
        </p>
        {solution.explanation !== undefined && solution.explanation !== '' && (
          <p className="text-sm text-text-base leading-relaxed">
            {solution.explanation}
          </p>
        )}
      </div>

      <div className="rounded-xl overflow-hidden border border-white/10">
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
        <pre className="bg-slate-900 p-5 overflow-x-auto">
          <code className="text-sm font-mono text-text-base leading-relaxed whitespace-pre">
            {solution.code}
          </code>
        </pre>
      </div>
    </section>
  );
}
