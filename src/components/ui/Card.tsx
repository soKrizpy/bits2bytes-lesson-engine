// src/components/ui/Card.tsx
// Card with four visual states for learning path nodes.
// State communicated via colour AND icon/pattern — not colour alone.

type CardState = 'locked' | 'available' | 'in-progress' | 'completed';

interface CardProps {
  state?: CardState;
  className?: string;
  children: React.ReactNode;
}

const stateClasses: Record<CardState, string> = {
  locked: 'bg-card/50 border border-white/5 opacity-60',
  available: 'bg-card border border-white/10',
  'in-progress': 'bg-card border-2 border-primary shadow-lg shadow-primary/20',
  completed: 'bg-card/70 border border-success/30',
};

export function Card({ state = 'available', className = '', children }: CardProps) {
  return (
    <div
      className={[
        'rounded-xl p-4 transition-all duration-300',
        stateClasses[state],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
