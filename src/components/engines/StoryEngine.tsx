import { EngineLayoutProps } from './EngineTypes';
import { NodeRenderer } from '@/components/NodeRenderer/NodeRenderer';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useEngineTranslations } from '@/hooks/useEngineTranslations';
import { TopProgressBar } from '@/components/ui/TopProgressBar';

export function StoryEngine({ 
  lesson, 
  studentState, 
  quizQuestions, 
  handleAdvance, 
  submitQuizAttempt,
  saveError,
  isRetakingQuiz,
  selectedLearningNodeIndex,
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

  // Pick a background based on topic difficulty or ID as a placeholder
  const getBackgroundGradient = () => {
    if (lesson.metadata.id.includes('beginner')) return 'from-indigo-900 via-purple-900 to-black';
    if (lesson.metadata.id.includes('intermediate')) return 'from-emerald-900 via-teal-900 to-black';
    return 'from-slate-900 via-gray-900 to-black';
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBackgroundGradient()} flex flex-col relative overflow-hidden`}>
      {/* Background decorations for the visual novel feel */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay"></div>
      
      {/* ── Top progress bar ──────────── */}
      <div className="relative z-50">
        <TopProgressBar
          currentStep={currentNodeIndex + 1}
          totalSteps={totalNodes}
          topicTitle={lesson.metadata.title}
          xpPopValue={xpPopValue}
          onXpPopDone={() => setXpPopValue(null)}
        />
      </div>

      {saveError !== null && (
        <div className="relative z-50 bg-red-500/80 backdrop-blur text-white px-4 py-2 text-xs text-center">
          ⚠️ {saveError}
        </div>
      )}

      {/* Main Content Area - Avatars could go here in the future */}
      <main className="flex-1 relative w-full max-w-4xl mx-auto flex items-end pb-4 px-4 sm:px-6">
        
        {/* Dialogue Box (Glassmorphism) */}
        <div className="w-full relative z-40 bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-6 sm:p-8 transform transition-all">
          {currentNode !== undefined ? (
            <div className="prose prose-invert prose-lg max-w-none text-shadow-sm">
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
            <div className="text-center space-y-4 py-10">
              <p className="text-white/60 text-sm">{t('lesson.completing')}</p>
            </div>
          )}
          
          {/* Internal Navigation (Replaces the bottom sticky bar from Mimo) */}
          <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4">
            {currentNode?.type !== 'quiz' && currentNodeIndex > 0 ? (
              <button
                type="button"
                onClick={handlePrevious}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
              >
                <ArrowLeft size={18} />
                Kembali
              </button>
            ) : (
              <div />
            )}
            
            {!isLastNode && (
              <button
                type="button"
                onClick={handleAdvance}
                disabled={isNextDisabled}
                className={`inline-flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${
                  canContinue
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/50'
                    : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'
                }`}
              >
                Selanjutnya
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
