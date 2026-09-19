import { useState, useCallback, useEffect } from 'react';
import { Lesson } from '@/types/lesson';
import { StudentState } from '@/types/state';

interface UseEngineNavigationProps {
  lesson: Lesson | null;
  studentState: StudentState;
  advanceNode: () => void;
}

export function useEngineNavigation({ lesson, studentState, advanceNode }: UseEngineNavigationProps) {
  const [isRetakingQuiz, setIsRetakingQuiz] = useState(false);
  const [selectedLearningNodeIndex, setSelectedLearningNodeIndex] = useState<number | null>(null);
  const [cardKey, setCardKey] = useState(0);
  const [canAdvance, setCanAdvance] = useState(true);
  const [xpPopValue, setXpPopValue] = useState<number | null>(null);

  useEffect(() => {
    if (studentState.topicCompleted) return;
    setSelectedLearningNodeIndex(studentState.currentNodeIndex);
  }, [studentState.currentNodeIndex, studentState.topicCompleted]);

  const selectedLearningNode = (lesson !== null && selectedLearningNodeIndex !== null)
    ? lesson.learningPath[selectedLearningNodeIndex]
    : undefined;
    
  const currentNode = lesson !== null
    ? (selectedLearningNode ?? lesson.learningPath[studentState.currentNodeIndex])
    : undefined;
    
  const currentNodeIndex = selectedLearningNodeIndex ?? studentState.currentNodeIndex;
  
  const isCompletedSelection = currentNode !== undefined &&
    currentNodeIndex !== studentState.currentNodeIndex &&
    studentState.completedNodes.includes(currentNode.id);
    
  const nodeMode = (isCompletedSelection && !isRetakingQuiz ? 'review' : 'learning') as 'review' | 'learning';

  const totalNodes = lesson?.learningPath.length ?? 0;
  const isLastNode = currentNodeIndex === totalNodes - 1;
  const canContinue = canAdvance || isCompletedSelection;
  const isNextDisabled = currentNode?.type === 'quiz' && !canContinue;

  const handleAdvance = useCallback(() => {
    if (isRetakingQuiz && currentNode?.type === 'quiz') {
      setIsRetakingQuiz(false);
      setSelectedLearningNodeIndex(null);
      setCanAdvance(true);
      setCardKey((key) => key + 1);
      return;
    }

    if (selectedLearningNodeIndex !== null && selectedLearningNodeIndex < studentState.currentNodeIndex) {
      setSelectedLearningNodeIndex(selectedLearningNodeIndex + 1);
      setCardKey((k) => k + 1);
      setCanAdvance(true);
      return;
    }

    const xp = currentNode?.xp ?? 0;
    if (xp > 0) setXpPopValue(xp);
    advanceNode();
    setCardKey((k) => k + 1);
    setCanAdvance(true);
  }, [currentNode, advanceNode, isRetakingQuiz, selectedLearningNodeIndex, studentState.currentNodeIndex]);

  const handlePrevious = useCallback(() => {
    if (currentNodeIndex === 0) return;
    setSelectedLearningNodeIndex(currentNodeIndex - 1);
    setCardKey((k) => k + 1);
    setCanAdvance(true);
  }, [currentNodeIndex]);

  return {
    isRetakingQuiz,
    setIsRetakingQuiz,
    selectedLearningNodeIndex,
    setSelectedLearningNodeIndex,
    cardKey,
    setCardKey,
    canAdvance,
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
    handleAdvance,
    handlePrevious
  };
}
