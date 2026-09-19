import { useState } from 'react';
import { EngineLayoutProps } from './EngineTypes';
import { NodeRenderer } from '@/components/NodeRenderer/NodeRenderer';
import { Scroll, ChevronRight, ChevronLeft, Compass, Shield, Sparkles, Swords } from 'lucide-react';
import { TopProgressBar } from '@/components/ui/TopProgressBar';
import { useEngineTranslations } from '@/hooks/useEngineTranslations';

export function QuestEngine({
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

  // Character level based on progress
  const characterLevel = Math.floor((studentState.currentNodeIndex / totalNodes) * 10) + 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-yellow-950 to-stone-950 flex flex-col relative overflow-hidden">
      {/* Parchment texture overlay */}
      <div
        className="absolute inset-0 opacity-10 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4a373' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Warm light effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-amber-500/10 rounded-full blur-[80px]"></div>

      {/* ── Quest HUD ──────────── */}
      <div className="relative z-20 bg-stone-950/80 backdrop-blur border-b-2 border-amber-700/40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Character */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 border-2 border-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Shield size={18} className="text-amber-200" />
            </div>
            <div>
              <p className="text-amber-300 text-xs font-bold">Petualang</p>
              <p className="text-amber-500/60 text-[10px]">Level {characterLevel}</p>
            </div>
          </div>

          {/* Quest Progress */}
          <div className="flex items-center gap-2">
            <Compass size={14} className="text-amber-400" />
            <span className="text-amber-400 text-xs font-bold">
              Misi {currentNodeIndex + 1} dari {totalNodes}
            </span>
          </div>

          {/* XP */}
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-yellow-400" />
            <span className="text-yellow-400 text-xs font-bold">
              {studentState.xpEarned || 0} XP
            </span>
          </div>
        </div>

        {/* Quest progress bar */}
        <div className="max-w-3xl mx-auto px-4 pb-2">
          <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden border border-amber-900/30">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-yellow-500 transition-all duration-700 rounded-full"
              style={{ width: `${((currentNodeIndex + 1) / totalNodes) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {saveError !== null && (
        <div className="relative z-20 bg-red-900/60 text-red-300 px-4 py-2 text-xs text-center border-b border-red-800/50">
          ⚠️ {saveError}
        </div>
      )}

      {/* XP popup */}
      {xpPopValue !== null && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-yellow-500 text-black font-bold text-lg px-5 py-2 rounded-full shadow-lg shadow-yellow-500/40">
            +{xpPopValue} XP ✨
          </div>
        </div>
      )}

      {/* ── Main Quest Area ──────────── */}
      <main className="flex-1 relative z-10 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl">
          {/* Quest chapter header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-600/30">
              {currentNode?.type === 'quiz' ? (
                <>
                  <Swords size={14} className="text-red-400" />
                  <span className="text-red-300 text-xs uppercase tracking-widest font-bold">Pertempuran</span>
                </>
              ) : (
                <>
                  <Scroll size={14} className="text-amber-400" />
                  <span className="text-amber-300 text-xs uppercase tracking-widest font-bold">Bab {currentNodeIndex + 1}</span>
                </>
              )}
            </div>
          </div>

          {/* Parchment Scroll Content */}
          <div className="relative">
            {/* Scroll roll top */}
            <div className="h-4 bg-gradient-to-b from-amber-800 to-amber-900 rounded-t-xl border-x-4 border-t-4 border-amber-700 shadow-inner"></div>

            {/* Content */}
            <div
              className="bg-gradient-to-b from-[#f4e4bc] to-[#e8d5a4] border-x-4 border-amber-700 px-6 sm:px-10 py-8 relative"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23f4e4bc'/%3E%3Cpath d='M0 0h1v1H0zM2 2h1v1H2z' fill='%23e8d5a4' fill-opacity='0.3'/%3E%3C/svg%3E")`,
              }}
            >
              {currentNode !== undefined ? (
                <div className="prose prose-stone max-w-none
                  prose-headings:text-amber-900 prose-headings:font-serif
                  prose-p:text-stone-800 prose-p:font-serif prose-p:leading-relaxed
                  prose-strong:text-amber-800
                  prose-code:text-emerald-800 prose-code:bg-amber-200/60
                  prose-a:text-amber-700">
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
                <div className="text-center py-10">
                  <p className="text-amber-700 font-serif italic">{t('lesson.loading')}</p>
                </div>
              )}
            </div>

            {/* Scroll roll bottom */}
            <div className="h-4 bg-gradient-to-t from-amber-800 to-amber-900 rounded-b-xl border-x-4 border-b-4 border-amber-700 shadow-inner"></div>
          </div>
        </div>
      </main>

      {/* ── Bottom Navigation ──────────── */}
      <div className="relative z-10 border-t-2 border-amber-700/30 bg-stone-950/80 backdrop-blur px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {currentNodeIndex > 0 ? (
            <button
              onClick={handlePrevious}
              className="flex items-center gap-2 px-4 py-2 text-amber-400 hover:text-amber-300 border border-amber-700/40 hover:border-amber-600 rounded-lg transition-colors font-serif"
            >
              <ChevronLeft size={18} />
              Kembali
            </button>
          ) : (
            <div />
          )}

          {!isLastNode ? (
            <button
              onClick={handleAdvance}
              disabled={isNextDisabled}
              className={`group flex items-center gap-2 px-8 py-3 rounded-lg font-bold font-serif transition-all ${
                canContinue
                  ? 'bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white shadow-lg shadow-amber-600/30'
                  : 'bg-stone-800 text-stone-600 cursor-not-allowed border border-stone-700'
              }`}
            >
              Lanjut Misi
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          ) : canContinue ? (
            <button
              onClick={handleAdvance}
              className="flex items-center gap-2 px-8 py-3 rounded-lg font-bold font-serif bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-500 hover:to-amber-400 text-white shadow-lg shadow-yellow-500/30 transition-all"
            >
              <Sparkles size={18} />
              Selesai!
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
