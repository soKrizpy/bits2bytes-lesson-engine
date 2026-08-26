# Implementation Plan: first-production-lesson

## Overview

The lesson JSON at `public/lessons/beginner/html/beginner-html-01.json` already exists. This plan verifies and finalises it as a production-ready, test-passing, schema-compliant file. No engine code, schema, TypeScript types, or React components may be modified. The only files in scope are the lesson JSON and any test files that contain hardcoded strings coupling them to lesson content.

---

## Tasks

- [x] 1. Run schema validation and fix any reported errors
  - [x] 1.1 Execute `node scripts/validate-lesson.mjs` and record its exit code and output
    - Capture the full stdout/stderr output
    - If exit code is non-zero, identify each AJV error and the field it flags
    - If exit code is 0, confirm the line "✅ Schema validation PASSED — zero errors" is present
    - _Requirements: 1.9_

  - [x] 1.2 Fix any schema validation errors in the lesson JSON
    - Correct only fields reported as invalid — do not change unrelated content
    - Re-run `node scripts/validate-lesson.mjs` after each fix to confirm the error is resolved
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [ ] 2. Verify and fix the learning path node structure
  - [x] 2.1 Confirm exactly 10 nodes are present with the correct type distribution
    - Count total nodes: must equal 10
    - Count by type: 2 × `lesson`, 5 × `code`, 1 × `practice`, 1 × `challenge`, 1 × `quiz`
    - Confirm all 10 node `id` values are unique, non-empty, and at most 100 characters
    - Expected IDs in order: `node-01-welcome`, `node-02-create-file`, `node-03-skeleton`, `node-04-heading`, `node-05-paragraph`, `node-06-image`, `node-07-link`, `node-08-mini-page`, `node-09-challenge`, `node-10-quiz`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 6.1, 6.3_

  - [x] 2.2 Verify all `code` nodes supply non-empty `code.language` and `code.content`
    - Check nodes `node-03-skeleton` through `node-07-link` (5 nodes)
    - Each must have `code.language` (non-empty string, `"html"`) and `code.content` (non-empty HTML string)
    - Verify content is incrementally additive: each code node's content builds on the previous one
    - _Requirements: 2.7, 4.4_

  - [x] 2.3 Verify the challenge node has a complete `solution` object
    - `node-09-challenge` must have `solution.language` = `"html"`, non-empty `solution.code`, and non-empty `solution.explanation`
    - No extra fields may be present on `solution` (schema uses `additionalProperties: false`)
    - _Requirements: 2.8_

  - [x] 2.4 Verify node XP values
    - Nodes `node-01-welcome` through `node-07-link`: each must have `xp: 5`
    - `node-08-mini-page`: must have `xp: 10`
    - `node-09-challenge`: must have `xp: 15`
    - `node-10-quiz`: no `xp` field required (quiz XP is handled by metadata)
    - `metadata.xp`: must equal `100`
    - _Requirements: 1.4_

- [x] 3. Verify and fix the quiz block
  - [x] 3.1 Confirm exactly 5 questions are present and each has exactly 4 options
    - `quiz.questions.length` must equal 5
    - Each question must have exactly 4 strings in `options`
    - _Requirements: 3.1, 3.2, 3.5_

  - [x] 3.2 Confirm each `correctAnswer` is byte-for-byte identical to one element of its `options` array
    - For each question, verify `question.options.includes(question.correctAnswer)` is true
    - No leading/trailing whitespace differences, no case differences
    - _Requirements: 3.3, 3.4_

  - [ ]* 3.3 Write property test for quiz question integrity
    - **Property 1: Quiz question integrity**
    - **Validates: Requirements 3.2, 3.3, 3.4**
    - Create `src/content/__tests__/beginner-html-01.content.test.ts`
    - For every question in `quiz.questions`: assert `q.options.length === 4` and `q.options.includes(q.correctAnswer)`

- [x] 4. Verify and fix the introduction block
  - [x] 4.1 Confirm the introduction block contains only schema-supported fields
    - Allowed fields: `title`, `description`, `analogy`, `prerequisites` only
    - `introduction` must NOT contain `learningObjectives` (unsupported by schema)
    - `introduction` must NOT contain `estimatedTime` (unsupported by schema; belongs inside `metadata` only)
    - _Requirements: 4.1, 4.3, 7.1, 7.2_

  - [x] 4.2 Confirm `introduction.title`, `introduction.description`, and `introduction.analogy` are non-empty Bahasa Indonesia strings
    - All three fields must be present and have `length > 0`
    - _Requirements: 4.1_

  - [ ]* 4.3 Write property test for introduction block field exclusion
    - **Property 3: Introduction block contains no unsupported fields**
    - **Validates: Requirements 4.3, 7.1, 7.2**
    - In the same test file created in 3.3: assert `!('learningObjectives' in lesson.introduction)` and `!('estimatedTime' in lesson.introduction)`

- [x] 5. Verify the review and completion blocks
  - [x] 5.1 Confirm the review block has non-empty `learned`, `keyConcepts`, and `takeaways` arrays
    - Each array must have at least one non-empty string
    - _Requirements: 4.2_

  - [x] 5.2 Confirm the completion block has `title`, `message`, `achievementName`, and `achievementIcon`
    - All four fields must be present and non-empty
    - `achievementIcon` must be a non-empty string (emoji is acceptable)
    - _Requirements: 1.8, 4.5_

- [x] 6. Write content-level property and unit tests
  - [x] 6.1 Write property tests for identifier uniqueness and code node completeness
    - **Property 2: Node and question identifier uniqueness and length invariant**
    - **Validates: Requirements 6.1, 6.2, 6.3**
    - In `src/content/__tests__/beginner-html-01.content.test.ts`: assert all node `id` values are unique (`new Set(ids).size === ids.length`), all `id.length >= 1 && id.length <= 100`, all question `id` values are unique
    - **Property 4: All code nodes provide non-empty language and content**
    - **Validates: Requirements 2.7**
    - In the same file: for every node where `type === "code"`, assert `node.code.language.length > 0` and `node.code.content.length > 0`

  - [x] 6.2 Write example-based unit tests for lesson metadata and structural facts
    - In the same test file: assert `metadata.id === 'beginner-html-01'`, `metadata.level === 'beginner'`, `metadata.xp === 100`, `metadata.estimatedTime === 30`
    - Assert `learningPath.length === 10` and node type counts (2 lesson, 5 code, 1 practice, 1 challenge, 1 quiz)
    - Assert `quiz.questions.length === 5`
    - Assert `introduction.title`, `introduction.description`, `introduction.analogy` are non-empty
    - Assert `review.learned.length > 0`, `review.keyConcepts.length > 0`, `review.takeaways.length > 0`
    - Assert `completion.achievementIcon` is a non-empty string
    - Assert challenge node `solution.language`, `solution.code`, `solution.explanation` are all non-empty
    - _Requirements: 1.2, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.8, 4.1, 4.2, 4.5_

- [x] 7. Checkpoint — Run all tests and confirm baseline
  - Run `npm test` and record full output
  - All tests in `validator.test.ts`, `lessonFlow.test.ts`, and `NodeRenderer.test.tsx` must pass
  - The new content tests in `beginner-html-01.content.test.ts` must pass
  - The 3 known pre-existing failures in `TopicReview.test.tsx` are out of scope and must NOT be fixed by modifying React components:
    - "reviews generic future topics without subject-specific assumptions"
    - "shows the complete challenge solution from lesson data when selected"
    - "shows existing quiz explanations in a read-only recap section"
  - Document whether these 3 tests fail with a component-level error unrelated to the lesson JSON
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Run TypeScript type check and lint
  - [x] 8.1 Run `npx tsc --noEmit` and confirm zero type errors
    - If errors appear, check whether they are caused by changes to the lesson JSON or new test files
    - Fix any type errors in test files (e.g., add type assertions for unknown imported JSON)
    - _Requirements: 5.3_

  - [x] 8.2 Run `npm run lint` and confirm zero lint errors
    - If lint errors appear in new test files, fix them (unused imports, missing semicolons, etc.)
    - Do not suppress lint rules — fix the underlying issue
    - _Requirements: 5.4_

- [x] 9. Final checkpoint — All quality gates green
  - Re-run all four quality gates in sequence:
    1. `node scripts/validate-lesson.mjs` — must exit 0 with "✅ Schema validation PASSED — zero errors"
    2. `npx tsc --noEmit` — must report zero errors
    3. `npm run lint` — must report zero errors
    4. `npm test` — all in-scope tests must pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- The lesson JSON at `public/lessons/beginner/html/beginner-html-01.json` is the only production deliverable — all tasks exist to confirm it is correct
- No engine code, schema, TypeScript types, or React components may be modified at any point
- The 3 pre-existing `TopicReview.test.tsx` failures are component-level issues; they are explicitly out of scope
- Checkpoints ensure all quality gates are validated incrementally before the final pass
- Property tests verify universal correctness invariants that hold across all nodes and questions
- Unit/example tests verify specific structural and content facts

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "2.2", "2.3", "2.4", "3.1", "3.2", "4.1", "4.2", "5.1", "5.2"] },
    { "id": 3, "tasks": ["3.3", "4.3", "6.1", "6.2"] },
    { "id": 4, "tasks": ["8.1", "8.2"] }
  ]
}
```
