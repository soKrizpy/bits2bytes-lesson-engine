# Requirements Document

## Introduction

This feature finalises `public/lessons/beginner/html/beginner-html-01.json` as the first production lesson for the BITS2BYTES Lesson Engine. The work is content-only: no engine code, no schema file, and no React component may be modified. The lesson must pass all four quality gates (`node scripts/validate-lesson.mjs`, `npx tsc --noEmit`, `npm run lint`, `npm test`) against the existing schema and test suite.

The lesson targets Indonesian middle-school to high-school students (SMP–SMA), teaches the fundamentals of HTML in a single standalone file project, and is delivered in friendly Bahasa Indonesia.

---

## Glossary

- **Lesson JSON**: The JSON file at `public/lessons/beginner/html/beginner-html-01.json` that describes a complete lesson.
- **Schema**: The JSON Schema at `schemas/lesson.schema.json` that defines the valid shape of a Lesson JSON.
- **Validator Script**: The Node.js script at `scripts/validate-lesson.mjs` that runs AJV schema validation plus semantic checks.
- **Engine**: The TypeScript source files under `src/engine/` — must not be modified.
- **Learning Node**: A single element in the `learningPath` array; must have `id`, `type`, and `title`.
- **Node Type Set**: The five valid `type` values for a Learning Node — `lesson`, `code`, `practice`, `challenge`, `quiz`.
- **Quiz Block**: The top-level `quiz` object containing exactly five `questions`.
- **Question**: An object inside `quiz.questions` with `id`, `question`, `options` (4 items), `correctAnswer`, `explanation`, and `points`.
- **Introduction Block**: The optional top-level `introduction` object with `title`, `description`, and optionally `analogy` and `prerequisites`.
- **Review Block**: The optional top-level `review` object with optional arrays `learned`, `keyConcepts`, and `takeaways`.
- **Completion Block**: The required top-level `completion` object with `title`, `message`, and `achievementName`.
- **Solution Object**: An object on a Learning Node with `language`, `code`, and optionally `explanation`.
- **schemaVersion**: A required top-level string in `MAJOR.MINOR` format; the engine supports `1.x` only.

---

## Requirements

### Requirement 1 — Schema Compliance

**User Story:** As a lesson engine, I want the Lesson JSON to satisfy every rule in `lesson.schema.json`, so that the Validator Script reports zero errors and the TypeScript type system raises no complaints.

#### Acceptance Criteria

1. THE Lesson JSON SHALL have a `schemaVersion` field whose value matches the pattern `^\d+\.\d+$` and whose MAJOR component equals `1`.
2. THE Lesson JSON SHALL have a `metadata` object containing all eight required fields: `id`, `title`, `description`, `level`, `category`, `topicNumber`, `estimatedTime`, and `xp`.
3. THE Lesson JSON SHALL have a `metadata.level` value equal to `"beginner"`.
4. THE Lesson JSON SHALL have a `metadata.xp` value of `100`.
5. THE Lesson JSON SHALL have a `metadata.estimatedTime` value of `30`.
6. THE Lesson JSON SHALL have an `objectives` array containing at least one non-empty string.
7. THE Lesson JSON SHALL have a `learningPath` array containing exactly ten Learning Nodes.
8. THE Lesson JSON SHALL have a `completion` object containing `title`, `message`, and `achievementName`.
9. WHEN the Validator Script runs, THE Validator Script SHALL exit with code `0` and print "✅ Schema validation PASSED — zero errors".

### Requirement 2 — Learning Path Composition

**User Story:** As a student, I want a varied sequence of node types, so that the lesson mixes explanation, code examples, practice, a challenge, and a quiz.

#### Acceptance Criteria

1. THE `learningPath` array SHALL contain exactly two nodes of type `lesson`.
2. THE `learningPath` array SHALL contain exactly five nodes of type `code`.
3. THE `learningPath` array SHALL contain exactly one node of type `practice`.
4. THE `learningPath` array SHALL contain exactly one node of type `challenge`.
5. THE `learningPath` array SHALL contain exactly one node of type `quiz`.
6. THE Validator Script SHALL confirm the node count is `10` after the schema check passes.
7. WHEN a Learning Node has type `code`, THE Learning Node SHALL have a `code` object containing a non-empty `language` and a non-empty `content`.
8. WHEN a Learning Node has type `challenge`, THE Learning Node SHALL have a `solution` object containing `language`, `code`, and `explanation`.

### Requirement 3 — Quiz Correctness

**User Story:** As a student, I want each quiz question to have exactly four options and a correct answer that I can select, so that the quiz works without any engine workaround.

#### Acceptance Criteria

1. THE Quiz Block SHALL contain exactly five Questions.
2. THE Validator Script SHALL confirm "✅ All questions have exactly 4 options" after the schema check passes.
3. THE Validator Script SHALL confirm "✅ All correctAnswers exactly match an option" after the schema check passes.
4. WHEN a Question is evaluated, THE Question's `correctAnswer` field SHALL be a string that is byte-for-byte identical to one element in the `options` array.
5. THE Quiz Block's `questions` array SHALL NOT contain fewer than five items or more than five items.

### Requirement 4 — Content Quality

**User Story:** As an Indonesian SMP–SMA student, I want lesson content in friendly Bahasa Indonesia with clear analogies and incremental code examples, so that I can follow the lesson without prior coding experience.

#### Acceptance Criteria

1. THE Lesson JSON SHALL have an `introduction` block with a non-empty `title`, a non-empty `description`, and a non-empty `analogy` field written in Bahasa Indonesia.
2. THE Lesson JSON SHALL have a `review` block containing non-empty arrays `learned`, `keyConcepts`, and `takeaways`.
3. WHERE the `introduction` block is present, THE `introduction` block SHALL use only the schema-supported fields: `title`, `description`, `analogy`, and `prerequisites`. THE `introduction` block SHALL NOT contain a `learningObjectives` field or an `estimatedTime` field (both are unsupported by the schema).
4. WHEN a `code` node is evaluated, THE `code` node's `content` field SHALL show an HTML snippet that builds incrementally on the content shown in the preceding `code` node.
5. THE `completion` block SHALL include an `achievementIcon` field.

### Requirement 5 — Automated Test Suite Compliance

**User Story:** As a developer, I want all existing tests to pass against the finalised Lesson JSON, so that no regression is introduced.

#### Acceptance Criteria

1. WHEN `npm test` is executed, THE test suite SHALL pass with zero failures.
2. THE `validator.test.ts` test "validates the real beginner-html-01 lesson with zero errors" SHALL pass, confirming `result.valid === true`, `metadata.id === 'beginner-html-01'`, `learningPath.length === 10`, and `quiz.questions.length === 5`.
3. WHEN `npx tsc --noEmit` is executed, THE TypeScript compiler SHALL report zero type errors for all files under `src/`.
4. WHEN `npm run lint` is executed, THE ESLint runner SHALL report zero errors.

### Requirement 6 — Identifier Uniqueness

**User Story:** As an engine developer, I want every node and question to have a unique identifier, so that progress tracking and XP awarding produce no collisions.

#### Acceptance Criteria

1. THE `learningPath` array SHALL contain no two nodes that share the same `id` value.
2. THE Quiz Block SHALL contain no two Questions that share the same `id` value.
3. WHEN a Learning Node `id` is evaluated, THE `id` SHALL be a non-empty string of at most 100 characters.

### Requirement 7 — Unsupported Field Constraint

**User Story:** As a lesson author, I want clear documentation of fields that the schema does NOT support, so that I do not accidentally add them and cause validation failures.

#### Acceptance Criteria

1. THE Lesson JSON SHALL NOT include a `learningObjectives` array inside the `introduction` block (this field is not defined in the schema; the top-level `objectives` array serves this purpose).
2. THE Lesson JSON SHALL NOT include an `estimatedTime` field inside the `introduction` block (this field is only valid inside `metadata`).
3. IF an unsupported field is discovered during review, THEN the Lesson JSON SHALL have the unsupported field removed rather than the schema modified.
