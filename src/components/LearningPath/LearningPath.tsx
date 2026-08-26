'use client';

// src/components/LearningPath/LearningPath.tsx
// Visual learning path sidebar — game-map edition (desktop) + dot strip (mobile).
//
// Desktop ("game map"):
// - Nodes are arranged in a zigzag: even-index circles nudge right, odd nudge left.
// - Each node (except the first) owns its own rope connector segment rendered inside PathNode.
// - The connector segment is "lit" (success green glow) when the PRECEDING node is completed.
// - When currentNodeIndex advances, the newly-current node receives isNewlyUnlocked=true
//   (triggers scale bounce) and its connector receives connectorReveal=true (ropeReveal animation).
//
// Mobile: compact dot strip at the bottom — unchanged from original.
//
// Respects prefers-reduced-motion for scroll behaviour.

import { useEffect, useRef, useState } from 'react';
import { PathNode } from './PathNode';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { calculateProgress } from '@/engine/progress';
import type { LearningNode } from '@/types/lesson';
import type { StudentState } from '@/types/state';

interface LearningPathProps {
  nodes: LearningNode[];
  studentState: StudentState;
  mode?: 'learning' | 'review';
  selectedNodeIndex?: number;
  onSelectNode?: (index: number) => void;
}

type NodeState = 'completed' | 'current' | 'upcoming' | 'selected';

function getNodeState(
  nodeId: string,
  index: number,
  studentState: StudentState
): NodeState {
  if (studentState.completedNodes.includes(nodeId)) return 'completed';
  if (index === studentState.currentNodeIndex) return 'current';
  return 'upcoming';
}

function canSelectNode(index: number, nodeId: string, studentState: StudentState) {
  return index === studentState.currentNodeIndex || studentState.completedNodes.includes(nodeId);
}

export function LearningPath({
  nodes,
  studentState,
  mode = 'learning',
  selectedNodeIndex,
  onSelectNode,
}: LearningPathProps) {
  const currentNodeRef = useRef<HTMLLIElement | null>(null);
  const progress = calculateProgress(studentState, nodes.length);
  const isReviewMode = mode === 'review';

  // Track the PREVIOUS currentNodeIndex so we can detect a freshly-unlocked node.
  // We use a ref (not state) so the comparison doesn't cause a second render cycle.
  const prevCurrentIndexRef = useRef<number>(studentState.currentNodeIndex);
  const [newlyUnlockedIndex, setNewlyUnlockedIndex] = useState<number | null>(null);
  const [revealedConnectorIndex, setRevealedConnectorIndex] = useState<number | null>(null);

  useEffect(() => {
    const prev = prevCurrentIndexRef.current;
    const next = studentState.currentNodeIndex;

    if (next !== prev && next > prev) {
      // A node was just advanced: index `next` is the new current node.
      setNewlyUnlockedIndex(next);
      setRevealedConnectorIndex(next); // connector above the newly-current node animates in

      // Clear the animation flags after the animation finishes
      // (nodeComplete = 350ms, ropeReveal = 400ms → clear at 450ms)
      const timer = setTimeout(() => {
        setNewlyUnlockedIndex(null);
        setRevealedConnectorIndex(null);
      }, 450);

      prevCurrentIndexRef.current = next;
      return () => clearTimeout(timer);
    }

    prevCurrentIndexRef.current = next;
  }, [studentState.currentNodeIndex]);

  // Scroll current node into view whenever currentNodeIndex changes
  useEffect(() => {
    if (currentNodeRef.current === null) return;

    const prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (typeof currentNodeRef.current.scrollIntoView !== 'function') return;
    currentNodeRef.current.scrollIntoView({
      behavior: prefersReduced ? 'auto' : 'smooth',
      block: 'nearest',
    });
  }, [studentState.currentNodeIndex, selectedNodeIndex]);

  if (nodes.length === 0) {
    return (
      <div className="p-4 space-y-4">
        <ProgressBar value={0} completed={0} total={0} />
        <p className="text-text-muted text-sm text-center">No checkpoints in this topic yet.</p>
      </div>
    );
  }

  return (
    <nav aria-label={isReviewMode ? 'Review learning path' : 'Learning path'} className="flex flex-col h-full">
      {/* Progress bar header — desktop only */}
      <div className="hidden px-4 pt-4 pb-3 border-b border-white/10 lg:block">
        <ProgressBar
          value={progress.percentage}
          completed={progress.completedCount}
          total={progress.totalCount}
        />
      </div>

      {/* ── Mobile compact strip ─────────────────────────────────────────────
          Unchanged from original: dots row pinned to bottom of screen.        */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-background/95 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgb(0_0_0_/_0.2)] backdrop-blur lg:hidden">
        <ol className="flex items-start gap-1 overflow-x-auto pb-1" role="list">
          {nodes.map((node, index) => {
            const nodeState: NodeState =
              isReviewMode && selectedNodeIndex === index
                ? 'selected'
                : !isReviewMode && selectedNodeIndex === index
                ? 'selected'
                : getNodeState(node.id, index, studentState);
            const selectable = isReviewMode || canSelectNode(index, node.id, studentState);

            return (
              <li key={node.id} className="shrink-0">
                <PathNode
                  node={node}
                  state={nodeState}
                  index={index}
                  isLast={true}
                  compact
                  {...(selectable && onSelectNode !== undefined
                    ? { onSelect: () => { onSelectNode(index); } }
                    : {})}
                />
              </li>
            );
          })}
        </ol>
      </div>

      {/* ── Desktop game-map node list ───────────────────────────────────────
          Nodes are laid out top-to-bottom.
          Each PathNode renders its own rope connector (index > 0) above the circle.
          Zigzag: even-index → isZigzagRight=true (pl-6), odd-index → pl-0 (pr-6).  */}
      <ol
        className="hidden lg:flex lg:flex-1 lg:flex-col lg:w-full lg:min-w-0 lg:overflow-x-hidden lg:overflow-y-auto px-4 pt-4 pb-6 space-y-0"
        role="list"
      >
        {nodes.map((node, index) => {
          const nodeState: NodeState =
            isReviewMode && selectedNodeIndex === index
              ? 'selected'
              : !isReviewMode && selectedNodeIndex === index
              ? 'selected'
              : getNodeState(node.id, index, studentState);

          const isCurrent = nodeState === 'current' || nodeState === 'selected';

          // Connector above this node is "lit" when the PRECEDING node is completed.
          const precedingNode = nodes[index - 1];
          const connectorLit =
            index > 0 &&
            precedingNode !== undefined &&
            studentState.completedNodes.includes(precedingNode.id);

          // Connector reveal animation fires only on the freshly-advanced node.
          const connectorReveal = revealedConnectorIndex === index;

          // Zigzag: even indices go right
          const isZigzagRight = index % 2 === 0;

          const isNewlyUnlocked = newlyUnlockedIndex === index;

          const selectable =
            isReviewMode || canSelectNode(index, node.id, studentState);

          return (
            <li
              key={node.id}
              ref={isCurrent ? currentNodeRef : null}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <PathNode
                node={node}
                state={nodeState}
                index={index}
                isLast={index === nodes.length - 1}
                isZigzagRight={isZigzagRight}
                isNewlyUnlocked={isNewlyUnlocked}
                connectorLit={connectorLit}
                connectorReveal={connectorReveal}
                {...(selectable && onSelectNode !== undefined
                  ? { onSelect: () => { onSelectNode(index); } }
                  : {})}
              />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
