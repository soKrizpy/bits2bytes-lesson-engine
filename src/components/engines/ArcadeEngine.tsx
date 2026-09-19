import { useState, useEffect, useRef } from 'react';
import { EngineLayoutProps } from './EngineTypes';
import { NodeRenderer } from '@/components/NodeRenderer/NodeRenderer';
import { Zap, Heart, Trophy, ChevronRight, Timer, Gamepad2 } from 'lucide-react';
import { TopProgressBar } from '@/components/ui/TopProgressBar';
import { useEngineTranslations } from '@/hooks/useEngineTranslations';

export function ArcadeEngine({
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
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [comboCount, setComboCount] = useState(0);
  const [showCombo, setShowCombo] = useState(false);

  // Simulate score gain on advance
  const prevNodeIndex = useRef(currentNodeIndex);
  useEffect(() => {
    if (currentNodeIndex > prevNodeIndex.current) {
      const gained = 100 * (comboCount + 1);
      setScore(prev => prev + gained);
      setComboCount(prev => prev + 1);
      setShowCombo(true);
      const timer = setTimeout(() => setShowCombo(false), 1200);
      prevNodeIndex.current = currentNodeIndex;
      return () => clearTimeout(timer);
    }
  }, [currentNodeIndex, comboCount]);

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden font-mono">
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-30 opacity-5"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.1) 2px, rgba(0,255,0,0.1) 4px)',
        }}
      />

      {/* Neon glow backgrounds */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-blue-500/20 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[150px] bg-purple-500/10 rounded-full blur-[80px]"></div>

      {/* ── HUD (Heads Up Display) ──────────── */}
      <div className="relative z-20 bg-gray-950 border-b-2 border-blue-500/50 px-4 py-2">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          {/* Lives */}
          <div className="flex items-center gap-1">
            {[...Array(3)].map((_, i) => (
              <Heart
                key={i}
                size={20}
                className={i < lives ? 'text-red-500 fill-red-500' : 'text-gray-700'}
              />
            ))}
          </div>

          {/* Level/Stage */}
          <div className="flex items-center gap-2">
            <Gamepad2 size={16} className="text-blue-400" />
            <span className="text-blue-400 text-sm font-bold tracking-wider uppercase">
              Stage {currentNodeIndex + 1}/{totalNodes}
            </span>
          </div>

          {/* Score */}
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-yellow-400" />
            <span className="text-yellow-400 text-sm font-bold tabular-nums">
              {score.toLocaleString()} PTS
            </span>
          </div>
        </div>

        {/* Mini progress bar under HUD */}
        <div className="max-w-3xl mx-auto mt-2">
          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500"
              style={{ width: `${((currentNodeIndex + 1) / totalNodes) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {saveError !== null && (
        <div className="relative z-20 bg-red-900/80 text-red-300 px-4 py-2 text-xs text-center border-b border-red-700">
          ⚠️ {saveError}
        </div>
      )}

      {/* Combo Popup */}
      {showCombo && comboCount > 1 && (
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-yellow-500 text-black font-bold text-2xl px-6 py-3 rounded-lg shadow-lg shadow-yellow-500/50 transform rotate-[-3deg]">
            🔥 {comboCount}x COMBO!
          </div>
        </div>
      )}

      {/* ── Main Game Area ──────────── */}
      <main className="flex-1 relative z-10 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl">
          {/* Stage Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full">
              <Trophy size={14} className="text-blue-400" />
              <span className="text-blue-300 text-xs uppercase tracking-widest">
                {currentNode?.type === 'quiz' ? 'BOSS FIGHT' : `LEVEL ${currentNodeIndex + 1}`}
              </span>
            </div>
          </div>

          {/* Content Terminal */}
          <div className="bg-gray-950 border-2 border-blue-500/40 rounded-xl shadow-2xl shadow-blue-500/10 overflow-hidden">
            {/* Terminal header */}
            <div className="bg-gray-900 border-b border-blue-500/20 px-4 py-2 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              <span className="ml-2 text-gray-500 text-xs font-mono">
                {lesson.metadata.title} — level_{currentNodeIndex + 1}.exe
              </span>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8">
              {currentNode !== undefined ? (
                <div className="prose prose-invert prose-sm max-w-none
                  prose-headings:text-blue-300 prose-headings:font-mono
                  prose-p:text-gray-300
                  prose-code:text-green-400 prose-code:bg-gray-800
                  prose-strong:text-yellow-400">
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
                  <p className="text-green-400 animate-pulse font-mono">LOADING...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── Bottom Controls ──────────── */}
      <div className="relative z-10 border-t-2 border-blue-500/30 bg-gray-950/90 backdrop-blur px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {currentNodeIndex > 0 ? (
            <button
              onClick={handlePrevious}
              className="px-4 py-2 text-sm text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-500 rounded-lg transition-colors font-mono uppercase tracking-wider"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {!isLastNode ? (
            <button
              onClick={handleAdvance}
              disabled={isNextDisabled}
              className={`group px-8 py-3 rounded-lg font-bold font-mono uppercase tracking-wider text-sm flex items-center gap-2 transition-all ${
                canContinue
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'
              }`}
            >
              Next Level
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          ) : canContinue ? (
            <button
              onClick={handleAdvance}
              className="px-8 py-3 rounded-lg font-bold font-mono uppercase tracking-wider text-sm bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black shadow-lg shadow-yellow-500/30 flex items-center gap-2 transition-all"
            >
              <Trophy size={18} />
              GAME CLEAR!
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
