import { useState, useCallback, useEffect } from 'react';
import { EngineLayoutProps } from './EngineTypes';
import { NodeRenderer } from '@/components/NodeRenderer/NodeRenderer';
import { ChevronRight, ChevronLeft, Presentation, Maximize2 } from 'lucide-react';
import { TopProgressBar } from '@/components/ui/TopProgressBar';
import { useEngineTranslations } from '@/hooks/useEngineTranslations';

export function SlideEngine({
  lesson,
  studentState,
  quizQuestions,
  handleAdvance,
  submitQuizAttempt,
  saveError,
  isRetakingQuiz,
  setCanAdvance,
  xpPopValue,
  setXpPopValue,
  currentNode,
  currentNodeIndex,
  isCompletedSelection,
  nodeMode,
  totalNodes,
  isLastNode,
  canContinue,
  isNextDisabled,
  handlePrevious
}: EngineLayoutProps) {
  const t = useEngineTranslations();

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && canContinue && !isLastNode) {
        handleAdvance();
      } else if (e.key === 'ArrowLeft' && currentNodeIndex > 0) {
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAdvance, handlePrevious, canContinue, isLastNode, currentNodeIndex]);

  // Color accent per slide for variety
  const getSlideAccent = () => {
    const accents = [
      { bg: 'from-blue-600 to-indigo-700', text: 'text-blue-100', dot: 'bg-blue-400' },
      { bg: 'from-emerald-600 to-teal-700', text: 'text-emerald-100', dot: 'bg-emerald-400' },
      { bg: 'from-purple-600 to-violet-700', text: 'text-purple-100', dot: 'bg-purple-400' },
      { bg: 'from-orange-600 to-red-700', text: 'text-orange-100', dot: 'bg-orange-400' },
      { bg: 'from-cyan-600 to-blue-700', text: 'text-cyan-100', dot: 'bg-cyan-400' },
    ];
    return accents[currentNodeIndex % accents.length] || { bg: 'from-blue-600 to-indigo-700', text: 'text-blue-100', dot: 'bg-blue-400' };
  };

  const accent = getSlideAccent();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative">
      {/* ── Top Bar ──────────── */}
      <div className="relative z-20 bg-slate-900 border-b border-slate-800 px-4 py-2">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Presentation size={16} className="text-slate-400" />
            <span className="text-slate-300 text-sm font-medium truncate max-w-[200px] sm:max-w-none">
              {lesson.metadata.title}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-500 text-xs tabular-nums">
              Slide {currentNodeIndex + 1} / {totalNodes}
            </span>
          </div>
        </div>
      </div>

      {saveError !== null && (
        <div className="bg-red-500/80 text-white px-4 py-2 text-xs text-center relative z-20">
          ⚠️ {saveError}
        </div>
      )}

      {/* ── Slide Area ──────────── */}
      <main className="flex-1 relative z-10 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-5xl">
          {/* Slide Frame (16:9 aspect ratio) */}
          <div className="relative bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-800">
            {/* Slide Header Accent */}
            <div className={`h-1.5 bg-gradient-to-r ${accent.bg}`}></div>

            {/* Slide Number Badge */}
            <div className="absolute top-6 right-6 z-10">
              <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${accent.bg} text-white text-sm font-bold shadow-lg`}>
                {currentNodeIndex + 1}
              </span>
            </div>

            {/* Slide Content */}
            <div className="min-h-[50vh] sm:min-h-[60vh] p-8 sm:p-12 lg:p-16 flex items-center">
              {currentNode !== undefined ? (
                <div className="prose prose-invert prose-lg max-w-none w-full
                  prose-headings:text-white prose-headings:font-semibold
                  prose-p:text-slate-300 prose-p:leading-relaxed prose-p:text-lg
                  prose-strong:text-white
                  prose-code:text-emerald-400 prose-code:bg-slate-800/80 prose-code:rounded
                  prose-a:text-blue-400
                  prose-li:text-slate-300
                  prose-img:rounded-xl prose-img:shadow-lg">
                  <NodeRenderer
                    node={currentNode}
                    studentState={studentState}
                    quizQuestions={quizQuestions}
                    onAdvance={handleAdvance}
                    onSubmitQuizAttempt={isCompletedSelection ? () => {} : submitQuizAttempt}
                    onCanAdvanceChange={(v) => setCanAdvance(v)}
                    mode={nodeMode}
                  />
                </div>
              ) : (
                <div className="text-center w-full py-20">
                  <p className="text-slate-500 text-xl">{t('lesson.loading')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Slide dots / thumbnail strip */}
          <div className="flex items-center justify-center gap-1.5 mt-6 flex-wrap">
            {lesson.learningPath.map((node, i) => {
              const isCompleted = i < studentState.currentNodeIndex;
              const isActive = i === currentNodeIndex;
              return (
                <div
                  key={node.id}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isActive
                      ? `w-8 ${accent.dot}`
                      : isCompleted
                        ? 'w-3 bg-slate-500'
                        : 'w-3 bg-slate-700'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </main>

      {/* ── Bottom Navigation ──────────── */}
      <div className="relative z-10 border-t border-slate-800 bg-slate-900/80 backdrop-blur px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {currentNodeIndex > 0 ? (
            <button
              onClick={handlePrevious}
              className="group flex items-center gap-2 px-5 py-2.5 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-xl transition-all"
            >
              <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
              Sebelumnya
            </button>
          ) : (
            <div />
          )}

          {/* Center: keyboard hint */}
          <div className="hidden sm:flex items-center gap-2 text-slate-600 text-xs">
            <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-slate-400 text-[10px]">←</kbd>
            <span>atau</span>
            <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-slate-400 text-[10px]">→</kbd>
            <span>untuk navigasi</span>
          </div>

          {!isLastNode ? (
            <button
              onClick={handleAdvance}
              disabled={isNextDisabled}
              className={`group flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all ${
                canContinue
                  ? `bg-gradient-to-r ${accent.bg} text-white shadow-lg hover:shadow-xl hover:brightness-110`
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
              }`}
            >
              Selanjutnya
              <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : canContinue ? (
            <button
              onClick={handleAdvance}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold bg-gradient-to-r ${accent.bg} text-white shadow-lg hover:shadow-xl hover:brightness-110 transition-all`}
            >
              Selesai
              <ChevronRight size={18} />
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
