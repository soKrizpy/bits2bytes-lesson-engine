'use client';

// src/components/nodes/PracticeNodeView.tsx
// Renders a 'practice' type node.
// Supports two interaction types: 'multiple-choice' and 'step-completion'.
// Shows success feedback within 300ms of interaction.
// Advance button is enabled only after the interaction is complete.

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { PracticeNode } from '@/types/lesson';

interface PracticeNodeViewProps {
  node: PracticeNode;
  onAdvance: () => void;
  mode?: 'learning' | 'review';
}

export function PracticeNodeView({ node, onAdvance, mode = 'learning' }: PracticeNodeViewProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showFeedback, setShowFeedback] = useState(false);

  const isMultipleChoice = node.interactionType === 'multiple-choice';
  const isStepCompletion = node.interactionType === 'step-completion';

  const isMultipleChoiceComplete =
    isMultipleChoice && selectedOption !== null;
  const isStepCompletionComplete =
    isStepCompletion &&
    node.steps !== undefined &&
    completedSteps.size === node.steps.length &&
    node.steps.length > 0;

  const isComplete = isMultipleChoiceComplete || isStepCompletionComplete;

  function handleOptionSelect(option: string) {
    setSelectedOption(option);
    setShowFeedback(true);
  }

  function handleStepToggle(index: number) {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  const isCorrect =
    isMultipleChoice &&
    selectedOption !== null &&
    node.correctOption !== undefined &&
    selectedOption === node.correctOption;

  if (mode === 'review') {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-text-base">{node.title}</h2>

        <p className="text-text-muted leading-relaxed">{node.instructions}</p>

        {isMultipleChoice && node.options !== undefined && (
          <div className="space-y-3" aria-label={`${node.title} options`}>
            {node.options.map((option) => (
              <div
                key={option}
                className={[
                  'w-full text-left px-5 py-4 rounded-xl border text-sm font-medium',
                  option === node.correctOption
                    ? 'border-success/30 bg-success/10 text-success'
                    : 'border-white/10 bg-card text-text-base',
                ].join(' ')}
              >
                {option}
              </div>
            ))}
          </div>
        )}

        {isStepCompletion && node.steps !== undefined && (
          <ol className="space-y-3">
            {node.steps.map((step, index) => (
              <li
                key={index}
                className="px-5 py-4 rounded-xl border border-white/10 bg-card text-sm text-text-base"
              >
                {step}
              </li>
            ))}
          </ol>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <h2 className="text-2xl font-bold text-text-base">{node.title}</h2>

      {/* Instructions */}
      <p className="text-text-muted leading-relaxed">{node.instructions}</p>

      {/* Multiple choice */}
      {isMultipleChoice && node.options !== undefined && (
        <div className="space-y-3" role="radiogroup" aria-label={node.instructions}>
          {node.options.map((option) => {
            const isSelected = selectedOption === option;
            const isRight = isSelected && option === node.correctOption;
            const isWrong = isSelected && option !== node.correctOption;
            return (
              <button
                key={option}
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleOptionSelect(option)}
                disabled={selectedOption !== null}
                className={[
                  'w-full text-left px-5 py-4 rounded-xl border text-sm font-medium transition-all duration-300',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  isRight
                    ? 'border-success bg-success/10 text-success'
                    : isWrong
                    ? 'border-error bg-error/10 text-error'
                    : isSelected
                    ? 'border-primary bg-primary/10 text-text-base'
                    : 'border-white/10 bg-card text-text-base hover:border-primary/40 hover:bg-primary/5',
                  selectedOption !== null ? 'cursor-default' : 'cursor-pointer',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={[
                      'w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center text-xs',
                      isRight
                        ? 'border-success bg-success text-white'
                        : isWrong
                        ? 'border-error bg-error text-white'
                        : isSelected
                        ? 'border-primary bg-primary'
                        : 'border-white/30',
                    ].join(' ')}
                    aria-hidden="true"
                  >
                    {isRight ? '✓' : isWrong ? '✗' : ''}
                  </span>
                  {option}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Step completion */}
      {isStepCompletion && node.steps !== undefined && (
        <div className="space-y-3">
          {node.steps.map((step, index) => {
            const done = completedSteps.has(index);
            return (
              <button
                key={index}
                onClick={() => handleStepToggle(index)}
                className={[
                  'w-full text-left px-5 py-4 rounded-xl border text-sm font-medium transition-all duration-300',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  done
                    ? 'border-success/30 bg-success/10 text-text-muted line-through'
                    : 'border-white/10 bg-card text-text-base hover:border-primary/40',
                ].join(' ')}
                aria-pressed={done}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={[
                      'w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center text-xs',
                      done ? 'border-success bg-success text-white' : 'border-white/30',
                    ].join(' ')}
                    aria-hidden="true"
                  >
                    {done ? '✓' : ''}
                  </span>
                  {step}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Feedback */}
      {showFeedback && isMultipleChoice && selectedOption !== null && (
        <div
          className={[
            'rounded-xl px-5 py-4 text-sm font-medium transition-all duration-300',
            isCorrect
              ? 'bg-success/10 border border-success/20 text-success'
              : 'bg-warning/10 border border-warning/20 text-warning',
          ].join(' ')}
        >
          {isCorrect
            ? '🎉 Correct! Well done.'
            : "🤔 Not quite — but that's okay! Keep going."}
        </div>
      )}

      {/* Advance */}
      <div className="pt-2">
        <Button
          onClick={onAdvance}
          size="lg"
          disabled={!isComplete}
          className="w-full sm:w-auto"
        >
          {isComplete ? 'Continue →' : 'Complete the activity to continue'}
        </Button>
      </div>
    </div>
  );
}
