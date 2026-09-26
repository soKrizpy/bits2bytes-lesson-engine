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

  it.each(lessonFiles)('%s has a complete 30-minute Mimo lesson', (file) => {
    const lesson = JSON.parse(
      readFileSync(join(lessonDirectory, file), 'utf8')
    ) as unknown;
    const result = validateLesson(lesson);

    expect(result.valid).toBe(true);
    if (!result.valid) return;

    const topicNumber = result.lesson.metadata.topicNumber;
    const expectedLevel =
      topicNumber <= 4
        ? 'beginner'
        : topicNumber <= 8
          ? 'intermediate'
          : 'advanced';
    expect(result.lesson.metadata.estimatedTime).toBe(30);
    expect(result.lesson.metadata.engineStyle).toBe('mimo');
    expect(result.lesson.metadata.level).toBe(expectedLevel);
    expect(result.lesson.learningPath.length).toBeGreaterThanOrEqual(8);
    const firstLessonNode = result.lesson.learningPath.find(
      (node) => node.type === 'lesson'
    );
    expect(firstLessonNode && 'imageUrl' in firstLessonNode).toBe(true);
    expect(
      result.lesson.learningPath.some((node) => node.type === 'practice')
    ).toBe(true);
    expect(
      result.lesson.learningPath.some((node) => node.type === 'challenge')
    ).toBe(true);
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
