import { Lesson, QuizQuestion, LearningNode } from '@/types/lesson';
import { StudentState } from '@/types/state';

export interface EngineLayoutProps {
  lesson: Lesson;
  studentState: StudentState;
  quizQuestions: QuizQuestion[];
  advanceNode: () => void;
  submitQuizAttempt: (answers: Record<string, string>) => void;
  saveError: string | null;
  onReturnToDashboard: () => void;
  
  // Navigation State
  isRetakingQuiz: boolean;
  setIsRetakingQuiz: (value: boolean) => void;
  selectedLearningNodeIndex: number | null;
  setSelectedLearningNodeIndex: (index: number | null) => void;
  cardKey: number;
  setCardKey: (value: number | ((prev: number) => number)) => void;
  canAdvance: boolean;
  setCanAdvance: (value: boolean) => void;
  xpPopValue: number | null;
  setXpPopValue: (value: number | null) => void;
  currentNode: LearningNode | undefined;
  currentNodeIndex: number;
  isCompletedSelection: boolean;
  nodeMode: 'learning' | 'review';
  totalNodes: number;
  isLastNode: boolean;
  canContinue: boolean;
  isNextDisabled: boolean;
  handleAdvance: () => void;
  handlePrevious: () => void;
}
