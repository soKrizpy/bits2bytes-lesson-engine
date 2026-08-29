// src/engine/topicRegistry.ts
// Registry of available topics and their content locations.
// To add a new topic: add one entry here and place the JSON file in public/lessons/.
// No engine code changes required beyond this registry entry.

export interface TopicRegistryEntry {
  topicId: string;
  level: string;
  category: string;
}

export const TOPIC_REGISTRY: TopicRegistryEntry[] = [
  // ── Beginner HTML (topics 01–10) ─────────────────────────────────────────
  { topicId: 'beginner-html-01', level: 'beginner', category: 'html' },
  { topicId: 'beginner-html-02', level: 'beginner', category: 'html' },
  { topicId: 'beginner-html-03', level: 'beginner', category: 'html' },
  { topicId: 'beginner-html-04', level: 'beginner', category: 'html' },
  { topicId: 'beginner-html-05', level: 'beginner', category: 'html' },
  { topicId: 'beginner-html-06', level: 'beginner', category: 'html' },
  { topicId: 'beginner-html-07', level: 'beginner', category: 'html' },
  { topicId: 'beginner-html-08', level: 'beginner', category: 'html' },
  { topicId: 'beginner-html-09', level: 'beginner', category: 'html' },
  { topicId: 'beginner-html-10', level: 'beginner', category: 'html' },
  // ── Beginner CSS (topics 11–17) ──────────────────────────────────────────
  { topicId: 'beginner-html-11', level: 'beginner', category: 'css' },
  { topicId: 'beginner-html-12', level: 'beginner', category: 'css' },
  { topicId: 'beginner-html-13', level: 'beginner', category: 'css' },
  { topicId: 'beginner-html-14', level: 'beginner', category: 'css' },
  { topicId: 'beginner-html-15', level: 'beginner', category: 'css' },
  { topicId: 'beginner-html-16', level: 'beginner', category: 'css' },
  { topicId: 'beginner-html-17', level: 'beginner', category: 'css' },
  // ── Beginner JavaScript (topics 18–24) ───────────────────────────────────
  { topicId: 'beginner-html-18', level: 'beginner', category: 'javascript' },
  { topicId: 'beginner-html-19', level: 'beginner', category: 'javascript' },
  { topicId: 'beginner-html-20', level: 'beginner', category: 'javascript' },
  { topicId: 'beginner-html-21', level: 'beginner', category: 'javascript' },
  { topicId: 'beginner-html-22', level: 'beginner', category: 'javascript' },
  { topicId: 'beginner-html-23', level: 'beginner', category: 'javascript' },
  { topicId: 'beginner-html-24', level: 'beginner', category: 'javascript' },
];

/**
 * Look up a topic entry by its topicId.
 * Returns undefined if the topicId is not registered.
 */
export function findTopicEntry(topicId: string): TopicRegistryEntry | undefined {
  return TOPIC_REGISTRY.find((entry) => entry.topicId === topicId);
}
