'use client';

// src/components/nodes/PracticeNodeView.tsx
// Renders a 'practice' type node.
// Supports two interaction types: 'multiple-choice' and 'step-completion'.
// Shows success feedback within 300ms of interaction.
// Advance button is enabled only after the interaction is complete.

import { useState } from 'react';
import type { PracticeNode } from '@/types/lesson';

interface PracticeNodeViewProps {
  node: PracticeNode;
  onAdvance: () => void;
  onCanAdvanceChange?: (canAdvance: boolean) => void;
  mode?: 'learning' | 'review';
}

export function PracticeNodeView({ node, onAdvance: _onAdvance, onCanAdvanceChange, mode = 'learning' }: PracticeNodeViewProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showFeedback, setShowFeedback] = useState(false);

  const isMultipleChoice = node.interactionType === 'multiple-choice';
  const isStepCompletion = node.interactionType === 'step-completion';
  const isImageChoice = node.interactionType === 'image-choice';

  const _isMultipleChoiceComplete =
    isMultipleChoice && selectedOption !== null;
  const _isStepCompletionComplete =
    isStepCompletion &&
    node.steps !== undefined &&
    completedSteps.size === node.steps.length &&
    node.steps.length > 0;

  const _isImageChoiceComplete =
    isImageChoice && selectedOption !== null;

  function handleOptionSelect(option: string) {
    setSelectedOption(option);
    setShowFeedback(true);
    onCanAdvanceChange?.(true);
  }

  function handleStepToggle(index: number) {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      const willBeComplete = node.steps !== undefined && next.size === node.steps.length && node.steps.length > 0;
      if (willBeComplete) onCanAdvanceChange?.(true);
      return next;
    });
  }

  const isCorrect =
    (isMultipleChoice &&
      selectedOption !== null &&
      node.correctOption !== undefined &&
      selectedOption === node.correctOption) ||
    (isImageChoice &&
      selectedOption !== null &&
      node.correctOptionId !== undefined &&
      selectedOption === node.correctOptionId);

  if (mode === 'review') {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-text-base tracking-tight">{node.title}</h2>

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

        {isImageChoice && node.imageOptions !== undefined && (
          <div className="grid grid-cols-2 gap-4" aria-label={`${node.title} image options`}>
            {node.imageOptions.map((opt) => (
              <div
                key={opt.id}
                className={[
                  'w-full flex flex-col items-center justify-center p-4 rounded-xl border text-sm font-medium',
                  opt.id === node.correctOptionId
                    ? 'border-success/30 bg-success/10 text-success'
                    : 'border-white/10 bg-card text-text-base',
                ].join(' ')}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={opt.imageUrl} alt={opt.label || opt.id} className="w-full max-w-[150px] aspect-square object-contain rounded-lg mb-2" />
                {opt.label && <span className="text-center">{opt.label}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <h2 className="text-2xl sm:text-3xl font-bold text-text-base tracking-tight">{node.title}</h2>

      {/* Instructions */}
      <p className="text-text-muted leading-relaxed">{node.instructions}</p>

      {/* Multiple choice */}
      {isMultipleChoice && node.options !== undefined && (
        <div className="space-y-3" role="radiogroup" aria-label={node.instructions}>
          {node.options.map((option) => {
            const isSelected = selectedOption === option;
            const isRight = isSelected && option === node.correctOption;
            const isWrong = isSelected && option !== node.correctOption;
            const isCorrectUnselected =
              option === node.correctOption &&
              selectedOption !== null &&
              selectedOption !== node.correctOption;
            return (
              <button
                key={option}
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleOptionSelect(option)}
                disabled={selectedOption !== null}
                className={[
                  'w-full text-left px-5 py-4 rounded-xl border text-base font-medium transition-all duration-300 min-h-[3.5rem]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  isRight
                    ? 'border-success bg-success/10 text-success'
                    : isWrong
                    ? 'border-error bg-error/10 text-error'
                    : isCorrectUnselected
                    ? 'border-success/50 bg-success/10 text-success'
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
                        : isCorrectUnselected
                        ? 'border-success bg-success text-white'
                        : isSelected
                        ? 'border-primary bg-primary'
                        : 'border-white/30',
                    ].join(' ')}
                    aria-hidden="true"
                  >
                    {isRight || isCorrectUnselected ? '✓' : isWrong ? '✗' : ''}
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
                  'w-full text-left px-5 py-4 rounded-xl border text-base font-medium transition-all duration-300 min-h-[3.5rem]',
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

      {/* Image choice */}
      {isImageChoice && node.imageOptions !== undefined && (
        <div className="grid grid-cols-2 gap-4" role="radiogroup" aria-label={node.instructions}>
          {node.imageOptions.map((opt) => {
            const isSelected = selectedOption === opt.id;
            const isRight = isSelected && opt.id === node.correctOptionId;
            const isWrong = isSelected && opt.id !== node.correctOptionId;
            const isCorrectUnselected =
              opt.id === node.correctOptionId &&
              selectedOption !== null &&
              selectedOption !== node.correctOptionId;
            return (
              <button
                key={opt.id}
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleOptionSelect(opt.id)}
                disabled={selectedOption !== null}
                className={[
                  'w-full flex flex-col items-center justify-center p-4 rounded-xl border text-base font-medium transition-all duration-300',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  isRight
                    ? 'border-success bg-success/10 text-success'
                    : isWrong
                    ? 'border-error bg-error/10 text-error'
                    : isCorrectUnselected
                    ? 'border-success/50 bg-success/10 text-success'
                    : isSelected
                    ? 'border-primary bg-primary/10 text-text-base'
                    : 'border-white/10 bg-card text-text-base hover:border-primary/40 hover:bg-primary/5',
                  selectedOption !== null ? 'cursor-default' : 'cursor-pointer',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className="relative w-full aspect-square mb-3 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={opt.imageUrl} alt={opt.label || opt.id} className="max-w-full max-h-full object-contain rounded-lg" />
                  
                  {/* Status Indicator Icon overlay */}
                  {(isRight || isWrong || isCorrectUnselected) && (
                    <div className={[
                      'absolute top-0 right-0 translate-x-2 -translate-y-2 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold shadow-sm',
                      isRight || isCorrectUnselected ? 'border-white bg-success text-white' : 'border-white bg-error text-white'
                    ].join(' ')}>
                      {isRight || isCorrectUnselected ? '✓' : '✗'}
                    </div>
                  )}
                </div>
                {opt.label && <span className="text-center w-full truncate">{opt.label}</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Feedback */}
      {showFeedback && (isMultipleChoice || isImageChoice) && selectedOption !== null && (
        <div className={['rounded-xl px-5 py-4 space-y-1 text-sm', isCorrect ? 'bg-success/10 border border-success/20' : 'bg-error/10 border border-error/20'].join(' ')}>
          <p className={['font-semibold', isCorrect ? 'text-success' : 'text-error'].join(' ')}>
            {isCorrect ? '✓ Benar!' : '✗ Belum tepat'}
          </p>
          {isMultipleChoice && node.correctOption !== undefined && !isCorrect && (
            <p className="text-text-muted text-xs">
              Jawaban yang benar: <span className="font-semibold text-success">{node.correctOption}</span>
            </p>
          )}
          {isImageChoice && node.correctOptionId !== undefined && !isCorrect && (
            <p className="text-text-muted text-xs">
              Jawaban yang benar adalah gambar yang ditandai ceklis hijau.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
