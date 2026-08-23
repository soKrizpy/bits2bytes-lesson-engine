// src/app/lesson/[topicId]/page.tsx
// Dynamic route for any topic: /lesson/beginner-html-01, /lesson/beginner-css-01, etc.
// Server Component — extracts topicId from params and renders the LessonEngine client component.

import { LessonEngine } from '@/components/LessonEngine';

interface LessonPageProps {
  params: {
    topicId: string;
  };
}

export default function LessonPage({ params }: LessonPageProps) {
  return <LessonEngine topicId={params.topicId} />;
}

export function generateStaticParams() {
  // Return known topic IDs for static generation at build time.
  // Add new topic IDs here as they are added to the registry.
  // This is the ONLY place that lists topic IDs for routing purposes.
  return [{ topicId: 'beginner-html-01' }];
}
