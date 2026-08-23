// src/engine/loader.ts
// Layer 2 — Engine Core.
// LessonLoader: fetches and validates lesson JSON files.
//
// Lesson files are served as static assets from public/lessons/:
//   public/lessons/{level}/{category}/{topicId}.json
//
// The fetch path resolves to:
//   /lessons/{level}/{category}/{topicId}.json
//
// Topic-agnostic: loads any topic registered in topicRegistry.ts.
// Adding Topic 02 = add one registry entry + place JSON file. No engine changes.

import { validateLesson } from './validator';
import { findTopicEntry } from './topicRegistry';
import type { Lesson } from '@/types/lesson';

export type LoadResult =
  | { success: true; lesson: Lesson }
  | { success: false; error: string };

/**
 * Constructs the fetch path for a lesson JSON file.
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
 * Loads and validates a lesson by topicId.
 *
 * Steps:
 * 1. Look up topicId in the topic registry.
 * 2. Construct the public path and fetch the JSON.
 * 3. Validate the JSON against the lesson schema.
 * 4. Return a typed result (success or error).
 *
 * Error cases handled:
 * - topicId not in registry    → descriptive error
 * - HTTP 404                   → "not found at path" error
 * - Malformed JSON             → "could not be read" error
 * - Schema validation failure  → lists ALL validation errors
 */
export async function loadLesson(topicId: string): Promise<LoadResult> {
  // Step 1: Look up topic in registry
  const entry = findTopicEntry(topicId);
  if (entry === undefined) {
    return {
      success: false,
      error: `Topic "${topicId}" was not found. Add it to src/engine/topicRegistry.ts and place the JSON file in public/lessons/.`,
    };
  }

  const path = resolveLessonPath(entry.level, entry.category, topicId);

  // Step 2: Fetch the JSON file
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

  // Step 3: Validate schema
  const result = validateLesson(data);
  if (!result.valid) {
    return {
      success: false,
      error: `Topic "${topicId}" failed schema validation:\n${result.errors.join('\n')}`,
    };
  }

  return { success: true, lesson: result.lesson };
}
