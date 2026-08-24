// src/app/lesson/[topicId]/page.tsx
// Dynamic route for any topic: /lesson/beginner-html-01, /lesson/beginner-css-01, etc.
// Server Component — extracts topicId from params and renders the LessonEngine client component.

import { LessonEngine } from '@/components/LessonEngine';
import { TOPIC_REGISTRY } from '@/engine/topicRegistry';

interface LessonPageProps {
  params: {
    topicId: string;
  };
}

export default function LessonPage({ params }: LessonPageProps) {
  return <LessonEngine topicId={params.topicId} />;
}

export function generateStaticParams() {
  return TOPIC_REGISTRY.map((entry) => ({ topicId: entry.topicId }));
}
