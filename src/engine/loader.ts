// src/engine/loader.ts
// Layer 2 — Engine Core.
// LessonLoader: fetches and validates lesson JSON files.
//
// Resolution order (Phase C — LMS content bridge):
//   1. If lmsOrigin URL param is present:
//      GET {lmsOrigin}/api/lesson-content/{topicId}
//      → If the topic has published lesson_content in LMS, return it.
//      → On any failure (404, network error, not published), fall through to step 2.
//   2. Filesystem fallback (original behavior):
//      Fetch /lessons/{level}/{category}/{topicId}.json from public/
//      → Used for all 24 pre-authored lessons and dev mode.
//
// This means:
// - All existing lessons (01–24) continue to work unchanged.
// - New teacher-authored lessons published in LMS are automatically resolved.
// - Adding a new LMS-published topic requires NO code change, NO topicRegistry entry.
//   (topicRegistry is still used for SSG and "next topic" navigation.)

import { validateLesson } from './validator';
import { findTopicEntry } from './topicRegistry';
import type { Lesson } from '@/types/lesson';

export type LoadResult =
  | { success: true; lesson: Lesson; source: 'lms' | 'filesystem' }
  | { success: false; error: string };

/**
 * Constructs the fetch path for a lesson JSON file (filesystem).
 * Path pattern: /lessons/{level}/{category}/{topicId}.json
 */
export function resolveLessonPath(
  level: string,
  category: string,
  topicId: string
): string {
  return `/lessons/${level}/${category}/${topicId}.json`;
}

/**
 * Attempts to load lesson content from LMS via the content resolution API.
 * Returns null if lmsOrigin is absent, the topic is not published, or any
 * network/parse error occurs — callers should fall back to filesystem.
 */
async function loadFromLms(
  topicId: string,
  lmsOrigin: string
): Promise<{ lesson: Lesson } | null> {
  try {
    // Sanitise lmsOrigin — must be a valid HTTP/HTTPS origin
    const origin = new URL(lmsOrigin).origin;
    const url = `${origin}/api/lesson-content/${encodeURIComponent(topicId)}`;

    const response = await fetch(url, {
      // Short timeout so a slow/unreachable LMS doesn't block lesson load
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null; // 404 = not published, fall back to filesystem

    const data: unknown = await response.json();
    const result = validateLesson(data);
    if (!result.valid) return null; // Invalid content from LMS — fall through

    return { lesson: result.lesson };
  } catch {
    // Network error, AbortError, URL parse error, JSON parse error — all fall through
    return null;
  }
}

/**
 * Loads and validates a lesson by topicId.
 *
 * Resolution order:
 *   1. LMS content API (if lmsOrigin URL param is present and topic is published)
 *   2. Filesystem public/lessons/ (original behavior, always available as fallback)
 *
 * Error cases handled:
 * - topicId not in registry AND not in LMS → descriptive error
 * - HTTP 404 from filesystem               → "not found at path" error
 * - Malformed JSON                          → "could not be read" error
 * - Schema validation failure              → lists ALL validation errors
 */
export async function loadLesson(
  topicId: string,
  options?: { lmsOrigin?: string | null }
): Promise<LoadResult> {
  // ── Step 1: Try LMS content resolution (Phase C) ──────────────────────────
  const lmsOrigin = options?.lmsOrigin ?? null;
  if (lmsOrigin !== null && lmsOrigin !== '') {
    const lmsResult = await loadFromLms(topicId, lmsOrigin);
    if (lmsResult !== null) {
      return { success: true, lesson: lmsResult.lesson, source: 'lms' };
    }
    // Fall through to filesystem
  }

  // ── Step 2: Filesystem fallback (original behavior) ───────────────────────
  const entry = findTopicEntry(topicId);
  if (entry === undefined) {
    return {
      success: false,
      error: `Topic "${topicId}" was not found. Add it to src/engine/topicRegistry.ts and place the JSON file in public/lessons/.`,
    };
  }

  const path = resolveLessonPath(entry.level, entry.category, topicId);

  let data: unknown;
  try {
    const response = await fetch(path);

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: `Topic "${topicId}" was not found at "${path}". Make sure the JSON file exists in public/lessons/.`,
        };
      }
      return {
        success: false,
        error: `Failed to load topic "${topicId}" from "${path}": HTTP ${response.status.toString()} ${response.statusText}.`,
      };
    }

    data = (await response.json()) as unknown;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Topic "${topicId}" could not be read from "${path}". The file may be malformed or inaccessible. Details: ${message}`,
    };
  }

  const result = validateLesson(data);
  if (!result.valid) {
    return {
      success: false,
      error: `Topic "${topicId}" failed schema validation:\n${result.errors.join('\n')}`,
    };
  }

  return { success: true, lesson: result.lesson, source: 'filesystem' };
}
