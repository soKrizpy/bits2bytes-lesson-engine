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
      const target = resolveTarget();
      if (target === null) return;
      const origin = originRef.current ?? window.location.origin;
      const event: LmsEvent = {
        source: 'bits2bytes-lesson-engine',
        type, topicId, studentId, payload,
        sentAt: new Date().toISOString(),
      };
      try { target.postMessage(event, origin); } catch { /* swallow */ }
    },
    [topicId, studentId, resolveTarget],
  );

  const sendLessonComplete = useCallback(
    (xpEarned: number, bestQuizScore: number) =>
      send('LESSON_COMPLETE', { xpEarned, bestQuizScore }),
    [send],
  );
  const sendQuizSubmitted = useCallback(
    (score: number, attemptNumber: number, bestScore: number) =>
      send('QUIZ_SUBMITTED', { score, attemptNumber, bestScore }),
    [send],
  );
  const sendXpUpdate = useCallback(
    (xpEarned: number) => send('XP_UPDATE', { xpEarned }),
    [send],
  );

  return { sendLessonComplete, sendQuizSubmitted, sendXpUpdate };
}