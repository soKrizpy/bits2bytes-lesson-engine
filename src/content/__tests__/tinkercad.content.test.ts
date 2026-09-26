import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateLesson } from '@/engine/validator';
import { TOPIC_REGISTRY } from '@/engine/topicRegistry';

const lessonDirectory = join(
  process.cwd(),
  'public',
  'lessons',
  'beginner',
  'tinkercad'
);
const lessonFiles = readdirSync(lessonDirectory)
  .filter((file) => file.endsWith('.json'))
  .sort();

describe('Tinkercad lesson content', () => {
  it('has content for all 12 registered topics', () => {
    const registeredIds = TOPIC_REGISTRY.filter(
      (topic) => topic.category === 'tinkercad'
    )
      .map((topic) => `${topic.topicId}.json`)
      .sort();

    expect(registeredIds).toHaveLength(12);
    expect(lessonFiles).toEqual(registeredIds);
  });

  it.each(lessonFiles)('%s has five valid four-choice questions', (file) => {
    const lesson = JSON.parse(
      readFileSync(join(lessonDirectory, file), 'utf8')
    ) as unknown;
    const result = validateLesson(lesson);

    expect(result.valid).toBe(true);
    if (!result.valid) return;

    expect(result.lesson.quiz.questions).toHaveLength(5);
    for (const question of result.lesson.quiz.questions) {
      expect(question.type).toBe('multiple-choice');
      if (!('options' in question)) {
        throw new Error('Expected a multiple-choice question.');
      }
      expect(question.options).toHaveLength(4);
      expect(question.options).toContain(question.correctAnswer);
    }
  });
});
