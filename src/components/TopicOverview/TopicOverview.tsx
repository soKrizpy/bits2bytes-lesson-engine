'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadLesson } from '@/engine/loader';
import { LocalStorageAdapter } from '@/persistence/localStorageAdapter';
import type { TopicRegistryEntry } from '@/engine/topicRegistry';
import type { Lesson } from '@/types/lesson';
import type { StudentState } from '@/types/state';

type TopicStatus = 'new' | 'in-progress' | 'completed';

interface TopicOverviewProps {
  topics: TopicRegistryEntry[];
}

interface TopicCardData {
  entry: TopicRegistryEntry;
  lesson: Lesson | null;
  state: StudentState | null;
}

const adapter = new LocalStorageAdapter();

function getStatus(state: StudentState | null): TopicStatus {
  if (state?.topicCompleted === true) return 'completed';
  if (state !== null && (state.currentNodeIndex > 0 || state.completedNodes.length > 0)) {
    return 'in-progress';
  }
  return 'new';
}

const STATUS_COPY: Record<TopicStatus, { label: string; action: string }> = {
  new: { label: 'Not started', action: 'Start Learning' },
  'in-progress': { label: 'In progress', action: 'Continue Learning' },
  completed: { label: 'Completed', action: 'Review Topic' },
};

export function TopicOverview({ topics }: TopicOverviewProps) {
  const [cards, setCards] = useState<TopicCardData[]>(() =>
    topics.map((entry) => ({ entry, lesson: null, state: null }))
  );

  useEffect(() => {
    let cancelled = false;

    async function loadCards() {
      const loaded = await Promise.all(
        topics.map(async (entry) => {
          const result = await loadLesson(entry.topicId);
          return {
            entry,
            lesson: result.success ? result.lesson : null,
            state: adapter.loadState(entry.topicId),
          };
        })
      );

      if (!cancelled) setCards(loaded);
    }

    void loadCards();
    return () => {
      cancelled = true;
    };
  }, [topics]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map(({ entry, lesson, state }) => {
        const status = getStatus(state);
        const copy = STATUS_COPY[status];

        return (
          <Link
            key={entry.topicId}
            href={`/lesson/${entry.topicId}`}
            className="group flex flex-col bg-card border border-white/10 rounded-2xl p-6 space-y-4 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={`${copy.action}: ${lesson?.metadata.title ?? entry.topicId}`}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full uppercase tracking-wide">
                  {lesson?.metadata.category ?? entry.category}
                </span>
                <span className="text-xs font-semibold border px-2.5 py-1 rounded-full capitalize bg-white/5 text-text-muted border-white/10">
                  {lesson?.metadata.level ?? entry.level}
                </span>
              </div>
              <span className={status === 'completed' ? 'text-xs text-success' : status === 'in-progress' ? 'text-xs text-primary' : 'text-xs text-text-muted'}>
                {copy.label}
              </span>
            </div>

            <div>
              <h2 className="text-text-base font-semibold text-lg leading-snug">
                {lesson?.metadata.title ?? entry.topicId}
              </h2>
              <p className="text-text-muted text-sm mt-2 line-clamp-3">
                {lesson?.metadata.description ?? 'Open this topic to begin learning.'}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm mt-auto pt-2">
              <span className="text-text-muted">
                {lesson?.metadata.estimatedTime !== undefined ? `${lesson.metadata.estimatedTime} min` : 'Self-paced'}
              </span>
              <span className="text-primary font-semibold group-hover:translate-x-1 transition-transform duration-200">
                {copy.action} <span aria-hidden="true">→</span>
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
