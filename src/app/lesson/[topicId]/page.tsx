// src/app/lesson/[topicId]/page.tsx
// Dynamic route: /lesson/beginner-html-01 or (via LMS proxy) /learning/lesson/beginner-html-01
// Server Component -- awaits params (Next.js 15 requirement), injects ThemeScript.

import { LessonEngine } from '@/components/LessonEngine';
import { ThemeScript } from './ThemeScript';
import { TOPIC_REGISTRY } from '@/engine/topicRegistry';

interface LessonPageProps {
  params: Promise<{ topicId: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { topicId } = await params;
  return (
    <>
      <ThemeScript />
      <LessonEngine topicId={topicId} />
    </>
  );
}

export async function generateStaticParams() {
  return TOPIC_REGISTRY.map((entry) => ({ topicId: entry.topicId }));
}