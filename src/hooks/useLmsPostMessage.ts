'use client';

// src/hooks/useLmsPostMessage.ts
// postMessage bridge: sends lesson events to the parent LMS window.

import { useCallback, useRef } from 'react';

export type LmsEventType = 'LESSON_COMPLETE' | 'QUIZ_SUBMITTED' | 'XP_UPDATE';

export interface LmsEvent {
  source: 'bits2bytes-lesson-engine';
  type: LmsEventType;
  topicId: string;
  studentId: string | null;
  payload: Record<string, unknown>;
  sentAt: string;
}

export function useLmsPostMessage(
  topicId: string,
  studentId: string | null,
  lmsOrigin: string | null,
) {
  const originRef = useRef(lmsOrigin);
  originRef.current = lmsOrigin;

  const resolveTarget = useCallback((): Window | null => {
    if (typeof window === 'undefined') return null;
    if (window.opener && window.opener !== window) return window.opener as Window;
    if (window.parent && window.parent !== window) return window.parent as Window;
    return null;
  }, []);

  const send = useCallback(
    (type: LmsEventType, payload: Record<string, unknown>) => {
      const origin = originRef.current ?? window.location.origin;
      const event: LmsEvent = {
        source: 'bits2bytes-lesson-engine',
        type, topicId, studentId, payload,
        sentAt: new Date().toISOString(),
      };

      // Lessons normally open in a separate browser tab. In that case there is
      // no parent/opener page listening for postMessage, but the /learning
      // proxy makes this tab same-origin with the LMS and its auth cookies.
      if (
        origin === window.location.origin &&
        (type === 'LESSON_COMPLETE' || type === 'QUIZ_SUBMITTED')
      ) {
        void fetch(`${origin}/api/student/engine-sync`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, topicId, studentId, payload }),
        }).catch(() => {
          // postMessage below remains available for embedded lessons.
        });
      }

      const target = resolveTarget();
      if (target === null) return;
      try { target.postMessage(event, origin); } catch { /* swallow */ }
    },
    [topicId, studentId, resolveTarget],
  );

  const sendLessonComplete = useCallback(
    (xpEarned: number, bestQuizScore: number, achievementName?: string, achievementIcon?: string) =>
      send('LESSON_COMPLETE', {
        xpEarned,
        bestQuizScore,
        achievementName,
        achievementIcon,
      }),
    [send],
  );
  const sendQuizSubmitted = useCallback(
    (score: number, attemptNumber: number, bestScore: number, totalQuestions: number) =>
      send('QUIZ_SUBMITTED', {
        score,
        attemptNumber,
        bestScore,
        totalQuestions,
      }),
    [send],
  );
  const sendXpUpdate = useCallback(
    (xpEarned: number) => send('XP_UPDATE', { xpEarned }),
    [send],
  );

  return { sendLessonComplete, sendQuizSubmitted, sendXpUpdate };
}
