import Link from 'next/link';
import { TOPIC_REGISTRY } from '@/engine/topicRegistry';

// Level badge colour
const LEVEL_COLOURS: Record<string, string> = {
  beginner: 'bg-success/10 text-success border-success/20',
  intermediate: 'bg-warning/10 text-warning border-warning/20',
  advanced: 'bg-error/10 text-error border-error/20',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/10 bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center">
          <span className="text-primary font-bold text-xl tracking-tight">
            BITS2BYTES
          </span>
          <span className="ml-3 text-text-muted text-sm hidden sm:block">
            Lesson Engine
          </span>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-text-base mb-4 leading-tight">
          Ready to level up? 🚀
        </h1>
        <p className="text-text-muted text-lg max-w-xl mx-auto">
          Pick a topic below and start your coding adventure.
        </p>
      </div>

      {/* Topic grid */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOPIC_REGISTRY.map((entry) => (
            <TopicCard
              key={entry.topicId}
              topicId={entry.topicId}
              level={entry.level}
              category={entry.category}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Individual topic card — metadata shown from registry only.
// The full lesson title/description is loaded when the engine opens the lesson.
function TopicCard({
  topicId,
  level,
  category,
}: {
  topicId: string;
  level: string;
  category: string;
}) {
  const levelColour =
    LEVEL_COLOURS[level] ?? 'bg-white/5 text-text-muted border-white/10';

  return (
    <Link
      href={`/lesson/${topicId}`}
      className={[
        'group flex flex-col bg-card border border-white/10 rounded-2xl p-6 space-y-4',
        'hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10',
        'transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      ].join(' ')}
    >
      {/* Category + level badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full uppercase tracking-wide">
          {category}
        </span>
        <span
          className={[
            'text-xs font-semibold border px-2.5 py-1 rounded-full capitalize',
            levelColour,
          ].join(' ')}
        >
          {level}
        </span>
      </div>

      {/* Topic ID displayed as the title until engine loads metadata */}
      <div>
        <p className="text-text-muted text-xs mb-1">Topic ID</p>
        <p className="text-text-base font-mono text-sm">{topicId}</p>
      </div>

      {/* CTA */}
      <div className="flex items-center gap-2 text-primary text-sm font-semibold group-hover:gap-3 transition-all duration-200 mt-auto pt-2">
        <span>Start Learning</span>
        <span aria-hidden="true">→</span>
      </div>
    </Link>
  );
}
