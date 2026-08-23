// src/engine/topicRegistry.ts
// Registry of available topics and their content locations.
// To add a new topic: add one entry here and place the JSON file in public/lessons/.
// No engine code changes required beyond this registry entry.

export interface TopicRegistryEntry {
  topicId: string;
  level: string;
  category: string;
}

// V1 registry — single topic
export const TOPIC_REGISTRY: TopicRegistryEntry[] = [
  {
    topicId: 'beginner-html-01',
    level: 'beginner',
    category: 'html',
  },
];

/**
 * Look up a topic entry by its topicId.
 * Returns undefined if the topicId is not registered.
 */
export function findTopicEntry(topicId: string): TopicRegistryEntry | undefined {
  return TOPIC_REGISTRY.find((entry) => entry.topicId === topicId);
}
