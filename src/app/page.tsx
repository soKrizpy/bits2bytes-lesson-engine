import { TOPIC_REGISTRY } from '@/engine/topicRegistry';
import { TopicOverview } from '@/components/TopicOverview/TopicOverview';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/10 bg-background/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <span className="text-primary font-bold text-xl tracking-tight drop-shadow-sm">
            BITS2BYTES
          </span>
          <span className="ml-3 text-text-muted text-sm hidden sm:block">
            Mesin Belajar
          </span>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-10 sm:pb-14 text-center">
        <p className="text-primary text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] mb-4">Coding learning experience</p>
        <h1 className="text-4xl sm:text-5xl font-bold text-text-base mb-5 leading-tight tracking-tight">
          Ready to level up? 🚀
        </h1>
        <p className="text-text-muted text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          Pick a topic below to start your coding adventure.
        </p>
      </div>

      {/* Topic grid */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <TopicOverview topics={TOPIC_REGISTRY} />
      </div>
    </div>
  );
}
