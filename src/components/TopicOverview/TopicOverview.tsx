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

  const sections = [
    {
      id: 'scratch',
      title: 'Scratch',
      description: 'Belajar membuat game dan animasi dengan blok visual.',
      cards: cards.filter(({ entry }) => entry.category === 'scratch'),
    },
    {
      id: 'web-development',
      title: 'HTML, CSS & JavaScript',
      description: 'Bangun fondasi untuk membuat website interaktif.',
      cards: cards.filter(({ entry }) => entry.category !== 'scratch'),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {sections.map((section) => (
        <details key={section.id} open className="group rounded-2xl border border-white/10 bg-card/40">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset sm:p-6">
            <span>
              <span className="block text-lg font-semibold text-text-base sm:text-xl">{section.title}</span>
              <span className="mt-1 block text-sm text-text-muted">{section.description}</span>
            </span>
            <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-text-muted transition-transform group-open:rotate-180">
              ↓
            </span>
          </summary>

          <div className="grid grid-cols-1 gap-5 border-t border-white/10 p-4 sm:grid-cols-2 sm:gap-6 sm:p-6 lg:grid-cols-3">
            {section.cards.map(({ entry, lesson, state }) => {
              const status = getStatus(state);
              const copy = STATUS_COPY[status];

              return (
                <Link
                  key={entry.topicId}
                  href={`/lesson/${entry.topicId}`}
                  className="group flex min-h-64 flex-col space-y-4 rounded-2xl border border-white/10 bg-card/90 p-5 shadow-sm shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-lg hover:shadow-primary/10 motion-reduce:transform-none motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:p-6"
                  aria-label={`${copy.action}: ${lesson?.metadata.title ?? entry.topicId}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                        {lesson?.metadata.category ?? entry.category}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold capitalize text-text-muted">
                        {lesson?.metadata.level ?? entry.level}
                      </span>
                    </div>
                    <span className={['text-xs font-semibold', status === 'completed' ? 'text-success' : status === 'in-progress' ? 'text-primary' : 'text-text-muted'].join(' ')}>
                      {copy.label}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold leading-snug text-text-base">{lesson?.metadata.title ?? entry.topicId}</h2>
                    <p className="mt-2 line-clamp-3 text-sm text-text-muted">{lesson?.metadata.description ?? 'Open this topic to start learning.'}</p>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-3 pt-2 text-sm">
                    <span className="text-text-muted">{lesson?.metadata.estimatedTime !== undefined ? `${lesson.metadata.estimatedTime} min` : 'Self-paced'}</span>
                    <span className="font-semibold text-primary transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none">{copy.action} <span aria-hidden="true">→</span></span>
                  </div>
                </Link>
              );
            })}
          </div>
        </details>
      ))}
    </div>
  );
}
