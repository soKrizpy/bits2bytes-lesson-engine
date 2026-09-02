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
  // ── Beginner Scratch Level 1 — Project Pertamaku (topics 01–07) ──────────
  { topicId: 'beginner-scratch-01', level: 'beginner', category: 'scratch' },
  { topicId: 'beginner-scratch-02', level: 'beginner', category: 'scratch' },
  { topicId: 'beginner-scratch-03', level: 'beginner', category: 'scratch' },
  { topicId: 'beginner-scratch-04', level: 'beginner', category: 'scratch' },
  { topicId: 'beginner-scratch-05', level: 'beginner', category: 'scratch' },
  { topicId: 'beginner-scratch-06', level: 'beginner', category: 'scratch' },
  { topicId: 'beginner-scratch-07', level: 'beginner', category: 'scratch' },
  // ── Beginner Scratch Level 2 — Game & Interaksi (topics 08–14) ───────────
  { topicId: 'beginner-scratch-08', level: 'beginner', category: 'scratch' },
  { topicId: 'beginner-scratch-09', level: 'beginner', category: 'scratch' },
  { topicId: 'beginner-scratch-10', level: 'beginner', category: 'scratch' },
  { topicId: 'beginner-scratch-11', level: 'beginner', category: 'scratch' },
  { topicId: 'beginner-scratch-12', level: 'beginner', category: 'scratch' },
  { topicId: 'beginner-scratch-13', level: 'beginner', category: 'scratch' },
  { topicId: 'beginner-scratch-14', level: 'beginner', category: 'scratch' },
  // ── Beginner Scratch Level 3 — Buat Duniamu Sendiri (topics 15–21) ───────
  { topicId: 'beginner-scratch-15', level: 'beginner', category: 'scratch' },
  { topicId: 'beginner-scratch-16', level: 'beginner', category: 'scratch' },
  { topicId: 'beginner-scratch-17', level: 'beginner', category: 'scratch' },
  { topicId: 'beginner-scratch-18', level: 'beginner', category: 'scratch' },
  { topicId: 'beginner-scratch-19', level: 'beginner', category: 'scratch' },
  { topicId: 'beginner-scratch-20', level: 'beginner', category: 'scratch' },
  { topicId: 'beginner-scratch-21', level: 'beginner', category: 'scratch' },
];

/**
 * Look up a topic entry by its topicId.
 * Returns undefined if the topicId is not registered.
 */
export function findTopicEntry(topicId: string): TopicRegistryEntry | undefined {
  return TOPIC_REGISTRY.find((entry) => entry.topicId === topicId);
}
