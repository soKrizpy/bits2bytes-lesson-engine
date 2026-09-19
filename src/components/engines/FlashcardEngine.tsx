import { useState } from 'react';
import { EngineLayoutProps } from './EngineTypes';
import { NodeRenderer } from '@/components/NodeRenderer/NodeRenderer';
import { RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { TopProgressBar } from '@/components/ui/TopProgressBar';
import { useEngineTranslations } from '@/hooks/useEngineTranslations';

export function FlashcardEngine({
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
  const [isFlipped, setIsFlipped] = useState(false);

  // Reset flip state when navigating
  const handleNext = () => {
    setIsFlipped(false);
    handleAdvance();
  };

  const handleBack = () => {
    setIsFlipped(false);
    handlePrevious();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-950 via-fuchsia-950 to-purple-950 flex flex-col relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-64 h-64 bg-pink-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-purple-500 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-fuchsia-500 rounded-full blur-2xl"></div>
      </div>

      {/* Progress Bar */}
      <div className="relative z-20">
        <TopProgressBar
          currentStep={currentNodeIndex + 1}
          totalSteps={totalNodes}
          topicTitle={lesson.metadata.title}
          xpPopValue={xpPopValue}
          onXpPopDone={() => setXpPopValue(null)}
        />
      </div>

      {saveError !== null && (
        <div className="relative z-20 bg-red-500/80 backdrop-blur text-white px-4 py-2 text-xs text-center">
          ⚠️ {saveError}
        </div>
      )}

      {/* Card Counter */}
      <div className="relative z-10 text-center mt-6">
        <span className="text-sm font-mono text-pink-300/70 tracking-wider uppercase">
          Kartu {currentNodeIndex + 1} / {totalNodes}
        </span>
      </div>

      {/* Main Card Area */}
      <main className="flex-1 relative z-10 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md perspective-1000">
          {/* Flip Card Container */}
          <div
            className={`relative w-full min-h-[420px] transition-transform duration-700 transform-style-3d cursor-pointer ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
            onClick={() => setIsFlipped(!isFlipped)}
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Front of Card */}
            <div
              className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-purple-600 p-1 shadow-2xl shadow-pink-500/30"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="w-full h-full bg-pink-950/90 rounded-[22px] p-6 sm:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                {/* Decorative corner dots */}
                <div className="absolute top-4 left-4 w-3 h-3 bg-pink-500 rounded-full opacity-40"></div>
                <div className="absolute top-4 right-4 w-3 h-3 bg-fuchsia-500 rounded-full opacity-40"></div>
                <div className="absolute bottom-4 left-4 w-3 h-3 bg-purple-500 rounded-full opacity-40"></div>
                <div className="absolute bottom-4 right-4 w-3 h-3 bg-pink-500 rounded-full opacity-40"></div>

                <div className="flex-1 flex items-center justify-center w-full">
                  {currentNode?.type === 'quiz' ? (
                    <div className="text-pink-200 text-lg font-bold">
                      🎯 Tantangan Kuis! <br/>
                      <span className="text-sm font-normal text-pink-400 mt-2 block">Balik kartu untuk mengerjakan →</span>
                    </div>
                  ) : (
                    <div className="prose prose-invert prose-pink max-w-none">
                      {currentNode !== undefined && (
                        <NodeRenderer
                          node={currentNode}
                          studentState={studentState}
                          quizQuestions={quizQuestions}
                          onAdvance={handleNext}
                          onSubmitQuizAttempt={isCompletedSelection ? () => {} : submitQuizAttempt}
                          onCanAdvanceChange={(v) => setCanAdvance(v)}
                          mode={nodeMode}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Tap hint */}
                <div className="mt-4 flex items-center gap-2 text-pink-400/60 text-xs">
                  <RotateCcw size={14} />
                  <span>Ketuk untuk balik</span>
                </div>
              </div>
            </div>

            {/* Back of Card */}
            <div
              className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-600 via-fuchsia-500 to-pink-500 p-1 shadow-2xl shadow-purple-500/30"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <div className="w-full h-full bg-purple-950/90 rounded-[22px] p-6 sm:p-8 flex flex-col items-center justify-center text-center overflow-y-auto">
                {currentNode !== undefined ? (
                  <div className="prose prose-invert prose-purple max-w-none w-full">
                    {currentNode.type === 'quiz' ? (
                      <NodeRenderer
                        node={currentNode}
                        studentState={studentState}
                        quizQuestions={quizQuestions}
                        onAdvance={handleNext}
                        onSubmitQuizAttempt={isCompletedSelection ? () => {} : submitQuizAttempt}
                        onCanAdvanceChange={(v) => setCanAdvance(v)}
                        mode={nodeMode}
                      />
                    ) : (
                      <div className="space-y-4">
                        <p className="text-purple-200 text-lg">✅ Materi sudah dibaca!</p>
                        <p className="text-purple-400 text-sm">Lanjut ke kartu berikutnya?</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-purple-400">{t('lesson.loading')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <div className="relative z-10 p-4 sm:p-6 flex items-center justify-between max-w-md mx-auto w-full">
        {currentNodeIndex > 0 ? (
          <button
            onClick={handleBack}
            className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
        ) : (
          <div className="w-14" />
        )}

        {/* Flip Button */}
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-600 hover:from-pink-400 hover:to-fuchsia-500 text-white flex items-center justify-center shadow-lg shadow-pink-500/40 transition-all hover:scale-105"
        >
          <RotateCcw size={28} />
        </button>

        {!isLastNode ? (
          <button
            onClick={handleNext}
            disabled={isNextDisabled}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              canContinue
                ? 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-600/40'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
          >
            <ChevronRight size={24} />
          </button>
        ) : (
          <div className="w-14" />
        )}
      </div>
    </div>
  );
}
