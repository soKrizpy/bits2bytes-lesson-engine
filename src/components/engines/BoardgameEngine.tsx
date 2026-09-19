import { useState } from 'react';
import { EngineLayoutProps } from './EngineTypes';
import { NodeRenderer } from '@/components/NodeRenderer/NodeRenderer';
import { ArrowLeft, ArrowRight, X, Star, Lock, MapPin } from 'lucide-react';
import { TopProgressBar } from '@/components/ui/TopProgressBar';
import { useEngineTranslations } from '@/hooks/useEngineTranslations';

export function BoardgameEngine({ 
  lesson, 
  studentState, 
  quizQuestions, 
  handleAdvance, 
  submitQuizAttempt,
  saveError,
  isRetakingQuiz,
  selectedLearningNodeIndex,
  setSelectedLearningNodeIndex,
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  // When clicking on a node on the map
  const handleNodeClick = (index: number) => {
    // Only allow clicking if the node is completed or if it's the current active node
    const isCompleted = index < studentState.currentNodeIndex;
    const isActive = index === studentState.currentNodeIndex;
    
    if (isCompleted || isActive) {
      setSelectedLearningNodeIndex(index);
      setIsModalOpen(true);
    }
  };

  const handleNextClick = () => {
    handleAdvance();
    // Keep modal open unless they finished the lesson
    if (isLastNode && canContinue) {
      setIsModalOpen(false);
    }
  };

  // Generate a snake-like path for the board game
  const getNodePosition = (index: number) => {
    const row = Math.floor(index / 3);
    const isEvenRow = row % 2 === 0;
    const colInRow = index % 3;
    
    // X goes left to right on even rows, right to left on odd rows
    const x = isEvenRow ? 20 + (colInRow * 30) : 80 - (colInRow * 30);
    // Y goes down
    const y = 20 + (row * 20);
    
    return { left: `${x}%`, top: `${y}%` };
  };

  // Build SVG path data connecting the nodes
  const buildSvgPath = () => {
    if (totalNodes <= 1) return '';
    let path = `M ${getNodePosition(0).left.replace('%', '')} ${getNodePosition(0).top.replace('%', '')}`;
    for (let i = 1; i < totalNodes; i++) {
      const pos = getNodePosition(i);
      path += ` L ${pos.left.replace('%', '')} ${pos.top.replace('%', '')}`;
    }
    return path;
  };

  // Get total height required for the board
  const rows = Math.ceil(totalNodes / 3);
  const minHeight = Math.max(100, rows * 20 + 20);

  return (
    <div className="min-h-screen bg-green-50 flex flex-col relative">
      {/* ── Top progress bar ──────────── */}
      <div className="relative z-20 bg-white shadow-sm">
        <TopProgressBar
          currentStep={studentState.currentNodeIndex + 1}
          totalSteps={totalNodes}
          topicTitle={lesson.metadata.title}
          xpPopValue={xpPopValue}
          onXpPopDone={() => setXpPopValue(null)}
        />
      </div>

      {saveError !== null && (
        <div className="bg-red-500 text-white px-4 py-2 text-xs text-center relative z-20">
          ⚠️ {saveError}
        </div>
      )}

      {/* ── Map Area ──────────── */}
      <main className="flex-1 w-full max-w-2xl mx-auto p-4 overflow-y-auto relative">
        <div 
          className="relative w-full rounded-3xl bg-green-200 border-4 border-green-700 shadow-inner overflow-hidden"
          style={{ height: `${minHeight}vh` }}
        >
          {/* Decorative Background Elements */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-green-300 rounded-full opacity-50 blur-xl"></div>
          <div className="absolute bottom-20 right-10 w-32 h-32 bg-green-300 rounded-full opacity-50 blur-xl"></div>
          <div className="absolute top-1/2 left-1/4 w-40 h-40 bg-green-100 rounded-full opacity-30 blur-2xl"></div>

          {/* SVG Connection Path */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
            <path 
              d={buildSvgPath()}
              fill="none" 
              stroke="#047857" // green-700
              strokeWidth="4"
              strokeDasharray="8 8"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Map Nodes */}
          {lesson.learningPath.map((node, index) => {
            const isCompleted = index < studentState.currentNodeIndex;
            const isActive = index === studentState.currentNodeIndex;
            const isLocked = index > studentState.currentNodeIndex;
            const pos = getNodePosition(index);

            return (
              <div 
                key={node.id}
                className="absolute w-16 h-16 -ml-8 -mt-8 flex flex-col items-center justify-center transform transition-transform hover:scale-110 z-10"
                style={pos}
              >
                <button
                  onClick={() => handleNodeClick(index)}
                  disabled={isLocked}
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-4 shadow-lg transition-colors ${
                    isActive 
                      ? 'bg-yellow-400 border-yellow-600 animate-bounce' 
                      : isCompleted 
                        ? 'bg-green-500 border-green-700' 
                        : 'bg-gray-300 border-gray-500 opacity-60 cursor-not-allowed'
                  }`}
                >
                  {isActive && <MapPin className="text-yellow-800" size={24} />}
                  {isCompleted && <Star className="text-white" size={20} />}
                  {isLocked && <Lock className="text-gray-500" size={20} />}
                </button>
                <span className="mt-2 text-xs font-bold text-green-900 bg-white/80 px-2 py-1 rounded-full shadow-sm whitespace-nowrap">
                  {node.type === 'quiz' ? 'Kuis' : `Tahap ${index + 1}`}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Call to action for active node */}
        <div className="mt-8 mb-12 flex justify-center">
          <button
            onClick={() => handleNodeClick(studentState.currentNodeIndex)}
            className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-xl shadow-green-600/30 text-lg flex items-center gap-3 transform transition hover:-translate-y-1"
          >
            Mulai Belajar <ArrowRight />
          </button>
        </div>
      </main>

      {/* ── Content Modal ──────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b bg-slate-50 flex items-center justify-between sticky top-0 z-10">
              <h3 className="font-bold text-slate-800">
                {currentNode?.type === 'quiz' ? 'Tantangan Kuis' : `Materi Pembelajaran`}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {currentNode !== undefined ? (
                <NodeRenderer
                  node={currentNode}
                  studentState={studentState}
                  quizQuestions={quizQuestions}
                  onAdvance={handleAdvance}
                  onSubmitQuizAttempt={isCompletedSelection ? () => {} : submitQuizAttempt}
                  onCanAdvanceChange={(v) => setCanAdvance(v)}
                  mode={nodeMode}
                />
              ) : (
                <div className="text-center py-10 text-slate-500">
                  {t('lesson.loading')}
                </div>
              )}
            </div>
            
            {/* Modal Footer (Navigation) */}
            <div className="p-4 sm:p-6 border-t bg-slate-50 flex items-center justify-between sticky bottom-0 z-10">
              {currentNodeIndex > 0 ? (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="flex items-center gap-2 px-4 py-2 text-slate-600 font-semibold hover:bg-slate-200 rounded-xl transition-colors"
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
                  onClick={handleNextClick}
                  disabled={isNextDisabled}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-colors ${
                    canContinue
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-md'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Selanjutnya
                  <ArrowRight size={18} />
                </button>
              )}
              
              {isLastNode && canContinue && (
                <button
                  type="button"
                  onClick={() => {
                    handleAdvance();
                    setIsModalOpen(false);
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-yellow-500 hover:bg-yellow-600 text-white shadow-md transition-colors"
                >
                  Selesai
                  <Star size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
