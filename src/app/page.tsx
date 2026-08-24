import { TOPIC_REGISTRY } from '@/engine/topicRegistry';
import { TopicOverview } from '@/components/TopicOverview/TopicOverview';

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
        <TopicOverview topics={TOPIC_REGISTRY} />
      </div>
    </div>
  );
}
