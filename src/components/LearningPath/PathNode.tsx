// src/components/LearningPath/PathNode.tsx
// A single node card in the visual game-map learning path.
// Communicates state via icon shape + colour — not colour alone (WCAG).
//
// States: completed, current, upcoming (locked), selected.
//
// Desktop layout ("game map" mode):
// - Nodes alternate left/right (zigzag) to evoke a Cut the Rope / Duolingo path.
// - A rope connector div sits between nodes: dim when upcoming, glowing when completed.
// - Locked/upcoming nodes show a 🔒 padlock and a CSS tooltip on hover.
// - The current node ring uses `animate-ring-pulse` (defined in tailwind.config.ts).
// - isNewlyUnlocked prop triggers the existing `animate-node-complete` scale bounce on mount.
//
// Mobile compact strip is unchanged — simple dots row at the bottom of the screen.

import { useEffect, useRef } from 'react';
import type { LearningNode } from '@/types/lesson';

type NodeState = 'completed' | 'current' | 'upcoming' | 'selected';

export interface PathNodeProps {
  node: LearningNode;
  state: NodeState;
  index: number;
  isLast: boolean;
  onSelect?: () => void;
  compact?: boolean;
  /** True when this node was JUST unlocked (previous advance made it current). Triggers bounce animation. */
  isNewlyUnlocked?: boolean;
  /** True when this is an even-index node in the desktop zigzag (shifts circle right). */
  isZigzagRight?: boolean;
  /** True when the connector ABOVE this node should be lit (the preceding segment is completed). */
  connectorLit?: boolean;
  /** True when the connector above this node was JUST lit (plays ropeReveal animation). */
  connectorReveal?: boolean;
}

// Node type → emoji icon
const NODE_ICONS: Record<string, string> = {
  lesson: '📖',
  code: '💻',
  practice: '✏️',
  challenge: '🏆',
  quiz: '❓',
};

function getNodeIcon(type: string): string {
  return NODE_ICONS[type] ?? '⬡';
}

export function PathNode({
  node,
  state,
  index,
  isLast,
  onSelect,
  compact = false,
  isNewlyUnlocked = false,
  isZigzagRight = false,
  connectorLit = false,
  connectorReveal = false,
}: PathNodeProps) {
  const isCompleted = state === 'completed';
  const isCurrent = state === 'current';
  const isSelected = state === 'selected';
  const isUpcoming = state === 'upcoming';
  const isInteractive = onSelect !== undefined;

  // Ref for the node circle — apply unlock animation class on mount when isNewlyUnlocked
  const circleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isNewlyUnlocked || circleRef.current === null) return;
    const el = circleRef.current;
    el.classList.add('animate-node-complete');
    const timer = setTimeout(() => {
      el.classList.remove('animate-node-complete');
    }, 350);
    return () => clearTimeout(timer);
  }, [isNewlyUnlocked]);

  // ── Compact (mobile strip) — unchanged from original ─────────────────────
  if (compact) {
    const compactButton = (
      <span
        className={[
          'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm transition-all duration-200 motion-reduce:transition-none',
          isSelected
            ? 'border-primary bg-primary/20 text-primary ring-2 ring-primary/30'
            : isCurrent
            ? 'border-primary bg-primary text-white shadow-md shadow-primary/25'
            : isCompleted
            ? 'border-success/60 bg-success/15 text-success'
            : 'border-white/20 bg-white/5 text-text-muted/60',
        ].join(' ')}
        aria-hidden="true"
      >
        {isCompleted ? '✓' : isCurrent || isSelected ? getNodeIcon(node.type) : index + 1}
      </span>
    );

    if (isInteractive) {
      return (
        <button
          type="button"
          onClick={onSelect}
          className="group flex shrink-0 flex-col items-center gap-1 rounded-xl p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={isSelected ? `Review ${node.title}` : `${node.title} — ${isCompleted ? 'completed' : isCurrent ? 'current stage' : 'locked'}`}
          aria-current={isCurrent ? 'step' : undefined}
          aria-pressed={isSelected}
        >
          {compactButton}
          <span className="max-w-16 truncate text-[10px] text-text-muted group-hover:text-text-base" title={node.title}>
            {node.title}
          </span>
        </button>
      );
    }

    return (
      <span className="flex shrink-0 flex-col items-center gap-1 p-1" aria-label={`${node.title} — locked`}>
        {compactButton}
        <span className="max-w-16 truncate text-[10px] text-text-muted/50" title={node.title}>
          {node.title}
        </span>
      </span>
    );
  }

  // ── Desktop game-map node ─────────────────────────────────────────────────
  //
  // Structure (top-to-bottom):
  //   [RopeConnector] ← dim or lit vertical bar (not shown on first node)
  //   [NodeRow]       ← zigzag-offset circle + label
  //
  // The zigzag is achieved by pushing the entire row left or right with margin.

  // Circle appearance
  const circleClasses = [
    'relative z-10 flex items-center justify-center rounded-full shrink-0 transition-all duration-300 motion-reduce:transition-none',
    // Size: current/selected = 48px, completed/upcoming = 40px
    isCurrent || isSelected ? 'w-12 h-12' : 'w-10 h-10',
    isSelected
      ? 'bg-primary/20 border-2 border-primary'
      : isCurrent
      ? 'bg-primary shadow-lg shadow-primary/40'
      : isCompleted
      ? 'bg-success/20 border-2 border-success/70'
      : 'bg-white/5 border-2 border-white/20 opacity-50',
  ].join(' ');

  // Ring around current node — separate element so it can pulse without
  // affecting the circle itself (avoids layout jank on scale animation).
  const showPulseRing = isCurrent;

  // Icon inside circle
  const circleIcon = isCompleted ? (
    <span className="text-success text-sm font-bold">✓</span>
  ) : isCurrent || isSelected ? (
    <span className="text-lg">{getNodeIcon(node.type)}</span>
  ) : isUpcoming ? (
    <span className="text-text-muted/50 text-sm" aria-hidden="true">🔒</span>
  ) : (
    <span className="text-text-muted text-xs">{index + 1}</span>
  );

  // Label text colours
  const titleClass = [
    'text-sm font-medium leading-snug truncate transition-colors duration-200',
    isSelected
      ? 'text-primary font-semibold'
      : isCurrent
      ? 'text-text-base font-semibold'
      : isCompleted
      ? 'text-text-muted'
      : 'text-text-muted/40',
  ].join(' ');

  const subtitleClass = [
    'text-xs mt-0.5 capitalize',
    isSelected
      ? 'text-primary/80'
      : isCompleted
      ? 'text-success/70'
      : isCurrent
      ? 'text-primary/80'
      : 'text-text-muted/30',
  ].join(' ');

  const subtitleText = isSelected
    ? 'selected'
    : isCompleted
    ? 'completed'
    : isCurrent
    ? 'current stage'
    : 'locked';

  // Zigzag: even-index nodes nudge right, odd-index nudge left.
  // We use padding-left / padding-right rather than margin so the full row
  // remains clickable edge-to-edge.
  const rowAlignClass = isZigzagRight ? 'pl-6' : 'pr-6';

  // Locked tooltip via title attribute (CSS ::after pseudo would require
  // arbitrary Tailwind classes; title is simpler and accessible).
  const lockedTitle = isUpcoming
    ? 'Complete the previous checkpoint to unlock'
    : undefined;

  const nodeRow = (
    <div className={['flex items-center gap-3 py-1 w-full', rowAlignClass].join(' ')}>
      {/* Circle wrapper — holds the pulse ring + the circle itself */}
      <div className="relative shrink-0 flex items-center justify-center">
        {/* Pulsing ring on current node (ring-pulse animation, not the circle) */}
        {showPulseRing && (
          <span
            className="absolute inset-0 rounded-full ring-4 ring-primary/30 animate-ring-pulse motion-reduce:animate-none"
            aria-hidden="true"
          />
        )}
        <div ref={circleRef} className={circleClasses} aria-hidden="true">
          {circleIcon}
        </div>
      </div>

      {/* Label */}
      <div className="min-w-0 flex-1">
        <p className={titleClass} title={node.title}>
          {node.title}
        </p>
        <p className={subtitleClass}>{subtitleText}</p>
      </div>
    </div>
  );

  const wrapperBase =
    'group relative flex flex-col items-stretch w-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background';

  // Rope connector segment (sits ABOVE each node except the first)
  // Centred horizontally within the node row, aligned with the circle centre.
  // Height is fixed at 32px — enough gap between circles to show the rope.
  const connectorClasses = [
    'rope-connector h-8 mx-auto',
    // Centre the rope under the circle centre.
    // The circle is 48px (isCurrent) or 40px, so we approximate centre with ml.
    isZigzagRight ? 'ml-[calc(1.5rem+1.25rem)]' : 'ml-[1.25rem]',
    connectorLit ? 'rope-connector-lit' : '',
    connectorReveal ? 'rope-connector-reveal' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const innerContent = (
    <>
      {/* Rope connector (shown above every node except the first) */}
      {index !== 0 && (
        <div className={connectorClasses} aria-hidden="true" />
      )}
      {nodeRow}
    </>
  );

  if (isInteractive) {
    return (
      <button
        type="button"
        onClick={onSelect}
        title={lockedTitle}
        className={wrapperBase}
        aria-label={
          isUpcoming
            ? `${node.title} — locked. Complete the previous checkpoint to unlock.`
            : isSelected
            ? `Reviewing ${node.title}`
            : `Review ${node.title}`
        }
        aria-pressed={isSelected}
        aria-current={isCurrent ? 'step' : undefined}
        aria-disabled={isUpcoming ? true : undefined}
      >
        {innerContent}
      </button>
    );
  }

  return (
    <div
      className={wrapperBase}
      title={lockedTitle}
      aria-label={`${node.title} — locked`}
    >
      {innerContent}
    </div>
  );
}
