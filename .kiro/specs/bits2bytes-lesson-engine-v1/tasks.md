# Implementation Plan: BITS2BYTES Lesson Engine V1

## Overview

A gamified, topic-agnostic coding education engine built with Next.js 14 (App Router), TypeScript, Tailwind CSS v3, AJV, Vitest, and fast-check. The engine reads structured lesson JSON, renders a five-node-type visual learning path, manages student state via a persistence abstraction, awards XP, enforces quiz attempt limits, and displays a topic completion achievement screen. V1 ships with one topic: `beginner-html-01`.

Implementation proceeds in 15 groups ordered by dependency: project scaffold → types → engine core → persistence → state hook → UI primitives → node renderers → learning path → quiz engine → achievement screen → orchestrator → pages → content → tests → build verification.

---

## Tasks

- [x] 1. Initialize project scaffold and configuration
  - [x] 1.1 Bootstrap Next.js 14 App Router project with TypeScript and Tailwind CSS
    - Run `npx create-next-app@latest bits2bytes-lesson-engine --typescript --tailwind --app --eslint --src-dir --no-import-alias` (or equivalent) inside the repo root.
    - Verify `src/app/layout.tsx`, `src/app/page.tsx`, `tailwind.config.ts`, `tsconfig.json`, and `next.config.ts` are generated.
    - _Requirements: 11.1, 12.4_
    - _Design: Architecture, Project Structure_

  - [x] 1.2 Install additional dependencies
    - Install production deps: `ajv`
    - Install dev deps: `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`, `fast-check`
    - Add `vitest.config.ts` configured for jsdom environment, `@testing-library/jest-dom` setup file, and path aliases matching `tsconfig.json`.
    - _Requirements: 11.1_
    - _Design: Tech Stack_

  - [x] 1.3 Configure `tailwind.config.ts` with design tokens
    - Extend `colors` with: `primary` (`#6366f1`, hover `#4f46e5`), `success` (`#10b981`), `warning` (`#f59e0b`), `error` (`#f43f5e`), `xpGold` (`#fbbf24`), `background` (`#0f172a`), `card` (`#1e293b`), `text-base` (`#f8fafc`), `text-muted` (`#94a3b8`).
    - Extend `transitionDuration` / `animation` with: `micro` (200ms), `transition` (300ms), `celebration` (500ms).
    - _Requirements: 12.1, 12.3_
    - _Design: Design Tokens_

  - [x] 1.4 Configure `tsconfig.json` for strict mode
    - Ensure `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, and path alias `@/*` → `./src/*`.
    - _Requirements: 11.1_
    - _Design: Tech Stack_

- [x] 2. Define TypeScript types
  - [x] 2.1 Create `src/types/lesson.ts`
    - Define and export: `SchemaVersion`, `LessonMetadata`, `LessonIntroduction`, `NodeType` union, `BaseNode`, `LessonNode`, `CodeNode`, `PracticeNode`, `ChallengeNode`, `QuizNode`, `LearningNode` discriminated union, `QuizQuestion`, `LessonCompletion`, `Lesson`.
    - All field constraints documented via JSDoc comments matching the schema (e.g. `id: 1–100 chars`).
    - `CodeNode.code.language` must NOT be restricted to a predefined list.
    - `QuizQuestion.options` typed as `[string, string, string, string]` (tuple of exactly 4).
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_
    - _Design: Data Models — Lesson JSON Types_

  - [x] 2.2 Create `src/types/state.ts`
    - Define and export: `QuizAttempt` (with `attemptNumber: 1 | 2`, `score`, `answers`, `submittedAt`), `StudentState`, `INITIAL_STUDENT_STATE` (omits `studentId`/`topicId`), `EngineState` (with `lesson`, `studentState`, `loadError`, `isSaving`, `saveError`).
    - Include `xpAwardedForCompletion: boolean` idempotency guard on `StudentState`.
    - _Requirements: 9.1, 9.5_
    - _Design: Data Models — Student State Types_

- [x] 3. Create JSON Schema
  - [x] 3.1 Create `schemas/lesson.schema.json`
    - JSON Schema Draft-7 document, AJV-compatible.
    - Enforce: `schemaVersion` pattern `^\d+\.\d+$`; `metadata` required fields with min/max lengths and numeric ranges as specified in Requirement 2.2; `metadata.level` enum `["beginner","intermediate","advanced"]`; `learningPath` array with node `type` enum of five V1 values and unique `id` per node; `quiz.questions` with `minItems: 5, maxItems: 5`; each question's `options` with `minItems: 4, maxItems: 4`; `correctAnswer` present; all string length constraints from Requirements 2.2–2.6.
    - `code` node: require `language` (1–50 chars) and `content` (1–50000 chars); do NOT restrict `language` to an enum.
    - Schema must be extensible: no `additionalProperties: false` at node `type` level that would prevent future node types.
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_
    - _Design: JSON Schema_

- [x] 4. Implement engine core (Layer 2 — pure TypeScript, no React)
  - [x] 4.1 Create `src/engine/validator.ts`
    - Export `SchemaValidator` with a `validate(data: unknown): ValidationResult` method.
    - Use AJV with `{ allErrors: true, strict: false }` to collect ALL errors in one pass.
    - Compile `lesson.schema.json` once on module load (cached).
    - Check `schemaVersion` MAJOR part against `SUPPORTED_SCHEMA_MAJOR_VERSION = 1`; if absent or MAJOR !== 1, return `{ valid: false, errors: ["Schema version ..."] }`.
    - On failure, return `{ valid: false, errors: string[] }` where each string identifies field path and violated constraint.
    - On success, return `{ valid: true; lesson: Lesson }`.
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 2.7, 2.8_
    - _Design: Engine Core — SchemaValidator_

  - [x] 4.2 Create `src/engine/loader.ts`
    - Export `LessonLoader` with:
      - `resolvePath(topicId: string, level: string, category: string): string` — returns `lessons/{level}/{category}/{topicId}.json` with no extra slashes or URL encoding of valid identifier characters.
      - `load(topicId: string): Promise<{ lesson: Lesson } | { error: string }>` — fetches JSON using `fetch` (client) or `fs.readFile` (server), parses JSON, passes through `SchemaValidator`; returns distinct errors for file-not-found (404 / ENOENT) vs. parse failure vs. validation failure.
    - Path resolution must match the pattern `lessons/{level}/{category}/{topic-id}.json` using metadata from the JSON or a directory scan.
    - _Requirements: 1.1, 1.6, 1.7_
    - _Design: Engine Core — LessonLoader, Routing Design_

  - [x] 4.3 Create `src/engine/progress.ts`
    - Export `ProgressTracker` with pure function `calculateProgress(state: StudentState, totalNodes: number): ProgressInfo`.
    - `ProgressInfo`: `{ completedCount: number; totalCount: number; percentage: number; currentNodeIndex: number }`.
    - `percentage = Math.round((completedCount / totalCount) * 100)` clamped to `[0, 100]`.
    - When `totalNodes === 0`: return `{ completedCount: 0, totalCount: 0, percentage: 0, currentNodeIndex: 0 }`.
    - _Requirements: 3.5, 3.6, 3.8_
    - _Design: Engine Core — ProgressTracker_

  - [x] 4.4 Create `src/engine/xp.ts`
    - Export `XPCalculator` with two pure functions:
      - `awardNodeXP(state: StudentState, nodeId: string, xpAmount: number): StudentState` — no-op if `nodeId` already in `completedNodes`; if node has no `xp` field (xpAmount === 0 or undefined), leave `xpEarned` unchanged.
      - `awardCompletionXP(state: StudentState, topicXP: number): StudentState` — no-op if `xpAwardedForCompletion === true`; otherwise adds `topicXP` and sets `xpAwardedForCompletion = true`.
    - Both functions return a new state object (immutable).
    - _Requirements: 5.4, 8.2, 8.3, 8.4, 8.5_
    - _Design: XP Idempotency Logic_

- [x] 5. Implement persistence layer
  - [x] 5.1 Create `src/persistence/types.ts`
    - Export `IPersistenceAdapter` interface with: `loadState(topicId: string): StudentState | null`, `saveState(topicId: string, state: StudentState): void`, `clearState(topicId: string): void`.
    - _Requirements: 9.2, 9.3, 9.7_
    - _Design: IPersistenceAdapter interface_

  - [x] 5.2 Create `src/persistence/localStorageAdapter.ts`
    - Export `LocalStorageAdapter` implementing `IPersistenceAdapter`.
    - Storage key: `b2b_lesson_state_${topicId}`.
    - `saveState`: serialise `StudentState` to JSON and call `localStorage.setItem`; catch any thrown error (quota exceeded, etc.) and swallow silently (caller surfaces via `saveError`).
    - `loadState`: call `localStorage.getItem`, parse JSON; if key absent return `null`; if parse throws return `null`.
    - `clearState`: call `localStorage.removeItem`.
    - Guard all localStorage access with `typeof window !== 'undefined'` to support SSR.
    - _Requirements: 9.2, 9.4, 9.6_
    - _Design: IPersistenceAdapter interface, LocalStorageAdapter_

- [x] 6. Implement `useEngineState` hook (Layer 3)
  - [x] 6.1 Create `src/hooks/useEngineState.ts`
    - Accept `topicId: string` and `adapter: IPersistenceAdapter`.
    - On mount: call `LessonLoader.load(topicId)` → on error set `loadError`; call `SchemaValidator.validate()` → on error set `loadError`; call `adapter.loadState(topicId)` → if null, initialise from `INITIAL_STUDENT_STATE` with generated `studentId` and given `topicId`.
    - Expose `EngineState` (`lesson`, `studentState`, `loadError`, `isSaving`, `saveError`) and `EngineStateActions`:
      - `advanceNode()`: verify sequential navigation (block if preceding nodes not completed — Req 5.6); mark current node complete; call `XPCalculator.awardNodeXP`; increment `currentNodeIndex`; on reaching last node call `XPCalculator.awardCompletionXP` and set `topicCompleted = true`, `achievement`; persist; set `saveError` on persistence failure.
      - `submitQuizAttempt(answers: Record<string, string>)`: block if `quizAttempts.length >= 2`; score attempt; update `bestQuizScore = Math.max(prev, current)`; append attempt to `quizAttempts`; mark quiz node complete; persist; set `saveError` on persistence failure.
      - `resetTopic()`: call `adapter.clearState(topicId)` and reset to `INITIAL_STUDENT_STATE`.
    - Persist all state mutations within 3 seconds (synchronous localStorage calls satisfy this).
    - Surface `saveError` as non-null string on any persistence failure; retain in-memory state in the session.
    - _Requirements: 5.2, 5.3, 5.4, 5.6, 5.7, 6.3, 6.5, 6.7, 6.9, 6.10, 7.1, 8.4, 8.5, 9.2, 9.5, 9.6_
    - _Design: useEngineState hook, Error State_

- [x] 7. Build shared UI primitives (Layer 4)
  - [x] 7.1 Create `src/components/ui/Button.tsx`
    - Variants: `primary`, `secondary`, `ghost`. Sizes: `sm`, `md`, `lg`.
    - Disabled state with reduced opacity; visible focus ring (2px outline, 3:1 contrast — Req 12.6).
    - Tailwind classes; forwards `ref`.
    - _Requirements: 12.5, 12.6_

  - [x] 7.2 Create `src/components/ui/Card.tsx`
    - Four visual states: `locked`, `available`, `in-progress`, `completed` (Req 12.2).
    - Rounded (`rounded-xl`), uses `card` background token.
    - State communicated via both colour AND icon/pattern (not colour alone — Req 12.2).
    - _Requirements: 12.1, 12.2_

  - [x] 7.3 Create `src/components/ui/ProgressBar.tsx`
    - Props: `value: number` (0–100), `completed: number`, `total: number`.
    - Renders filled bar proportional to `value`; displays `"{completed} / {total}"` and `"{value}%"` labels.
    - Animated fill transition (300ms, respects `prefers-reduced-motion`).
    - _Requirements: 3.5, 3.6, 12.3, 12.7_

  - [x] 7.4 Create `src/components/ui/XPBadge.tsx`
    - Fixed position (top-right or per design), always visible without scrolling.
    - Displays current `xpEarned` total.
    - Shows `"+{amount} XP"` gain animation (1–3s, auto-dismissing, respects `prefers-reduced-motion`) when `xpEarned` increases.
    - _Requirements: 8.1, 8.6, 12.3, 12.7_

  - [x] 7.5 Create `src/components/ui/ErrorScreen.tsx`
    - Props: `message: string`, optional `title?: string`.
    - Full-width error display; lists all validation error strings if `message` contains newlines.
    - _Requirements: 1.5, 1.6, 2.7, 11.6_

- [x] 8. Implement node renderer components
  - [x] 8.1 Create `src/components/nodes/LessonNodeView.tsx`
    - Props: `node: LessonNode`, `onAdvance: () => void`.
    - Render: `title`, `explanation` (or placeholder `"No explanation available for this step."` if absent — Req 4.1), optional `analogy`, optional `expectedResult`, optional `tips` list.
    - Never crash when any optional field is absent.
    - Primary action button advances the node.
    - _Requirements: 4.1_
    - _Design: Properties P5_

  - [x] 8.2 Create `src/components/nodes/CodeNodeView.tsx`
    - Props: `node: CodeNode`, `onAdvance: () => void`.
    - Render `code.content` in a `<pre><code>` block that preserves whitespace and indentation.
    - Display language label exactly matching `code.language` value (no normalisation, no truncation).
    - Primary action button advances the node.
    - _Requirements: 4.2_
    - _Design: Property P6_

  - [x] 8.3 Create `src/components/nodes/PracticeNodeView.tsx`
    - Props: `node: PracticeNode`, `onAdvance: () => void`.
    - Support `interactionType: 'multiple-choice'` — render selectable options; show success indicator within 300ms of selection.
    - Support `interactionType: 'step-completion'` — render step list with checkboxes; show confirmation when all steps marked.
    - Primary action button (enabled once interaction complete) advances the node.
    - _Requirements: 4.3_

  - [x] 8.4 Create `src/components/nodes/ChallengeNodeView.tsx`
    - Props: `node: ChallengeNode`, `onAdvance: () => void`.
    - Render: `title`, `instructions`, optional `starterCode` in a code block (with language label), optional `expectedResult`.
    - Absent optional fields produce no visible error.
    - Primary action button advances the node.
    - _Requirements: 4.4_
    - _Design: Property P7_

  - [x] 8.5 Create `src/components/nodes/FallbackNodeView.tsx`
    - Props: `node: { type: string; [key: string]: unknown }`.
    - Displays the `type` string value and a "not supported" message.
    - Never throws regardless of node shape.
    - _Requirements: 4.6_
    - _Design: Property P8_

  - [x] 8.6 Create `src/components/NodeRenderer/NodeRenderer.tsx`
    - Registry object `NODE_RENDERERS: Record<string, React.ComponentType<NodeRendererProps>>` mapping `lesson|code|practice|challenge|quiz` to their view components.
    - `NodeRenderer` looks up `node.type` in the registry; falls back to `FallbackNodeView` for unrecognised types.
    - Adding a new node type requires only one registry entry — no other file changes.
    - _Requirements: 4.5, 4.6_
    - _Design: NodeRenderer — Registry Pattern_

- [x] 9. Implement learning path components
  - [x] 9.1 Create `src/components/LearningPath/PathNode.tsx`
    - Props: `node: LearningNode`, `state: 'completed' | 'current' | 'upcoming'`, `index: number`.
    - Three visually distinct states: `completed` (filled icon, tick, muted colour), `current` (highlighted border, bright colour, enlarged icon), `upcoming` (greyed out, hollow icon).
    - State communicated via icon/shape AND colour — not colour alone (Req 12.2).
    - Visible focus indicator on interactive element (2px outline, 3:1 contrast).
    - _Requirements: 3.2, 3.3, 3.4, 12.2, 12.6_
    - _Design: Property P3_

  - [x] 9.2 Create `src/components/LearningPath/LearningPath.tsx`
    - Props: `nodes: LearningNode[]`, `studentState: StudentState`.
    - Renders all nodes vertically in sequence order (top to bottom).
    - Passes correct `state` prop to each `PathNode`: `completed` if node ID in `completedNodes`, `current` if index === `currentNodeIndex` and not completed, `upcoming` otherwise.
    - Exactly one node can be `current`; no two nodes share the same `current` state.
    - Scrolls to keep current node in viewport (`scrollIntoView` with `behavior: 'smooth'`, respects `prefers-reduced-motion`).
    - Renders `ProgressBar` with live percentage and `"{completed} / {total}"` count.
    - If `nodes.length === 0`: renders `ProgressBar` at 0% with "0 / 0".
    - Updates node states and progress within 500ms on `studentState` change (React re-render is synchronous — no extra async step needed).
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_
    - _Design: Property P3, P4_

- [x] 10. Implement quiz engine components
  - [x] 10.1 Create `src/components/QuizEngine/QuizQuestion.tsx`
    - Props: `question: QuizQuestion`, `selectedAnswer: string | null`, `onSelect: (answer: string) => void`, `disabled: boolean`.
    - Renders question text and all 4 option strings as selectable items (radio-style).
    - Each option selectable exactly once per attempt (re-selection replaces previous selection; `disabled` prevents all interaction).
    - Accessible: `role="radiogroup"`, `aria-checked` on selected option.
    - _Requirements: 6.1_

  - [x] 10.2 Create `src/components/QuizEngine/QuizReview.tsx`
    - Props: `questions: QuizQuestion[]`, `answers: Record<string, string>`.
    - For each incorrectly answered question: display correct answer and `explanation` text.
    - Correctly answered questions may be shown with a success indicator.
    - _Requirements: 6.4_

  - [x] 10.3 Create `src/components/QuizEngine/QuizEngine.tsx`
    - Props: `questions: QuizQuestion[]`, `studentState: StudentState`, `quizNodeId: string`, `onSubmitAttempt: (answers: Record<string, string>) => void`, `onAdvance: () => void`.
    - Implements the full quiz state machine: `idle → active → submitted → reviewing → complete` (or back to `idle` if attempts < 2).
    - Entry to `active` blocked if `quizAttempts.length >= 2`.
    - Renders `QuizQuestion` components for all 5 questions when `active`.
    - On submit: transition to `submitted` (score calculated in hook), then immediately to `reviewing` with `QuizReview`.
    - From `reviewing`: if `quizAttempts.length < 2` show retry button (returns to `idle`); if `>= 2` disable retry and show "no further attempts remain" message.
    - Displays before any attempt: attempt count `0`, max `2`, score "no attempt recorded", best score `0`, status "available".
    - Displays after each submission: updated attempt count, most recent score, updated best score, remaining attempts.
    - If third attempt triggered: block and display "attempt limit has been reached" (Req 6.7).
    - After any attempt, quiz node is marked complete via `onAdvance`.
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_
    - _Design: Quiz State Machine_

- [x] 11. Implement achievement screen
  - [x] 11.1 Create `src/components/AchievementScreen/AchievementScreen.tsx`
    - Props: `lesson: Lesson`, `studentState: StudentState`, `onReturn: () => void`.
    - Celebration animation lasting 2–5 seconds on mount.
    - Renders: topic title, total XP earned (`xpEarned`), best quiz score as a percentage `Math.round((bestQuizScore / maxPossibleScore) * 100)` in range [0, 100], count of completed nodes, achievement name from `lesson.completion.achievementName`.
    - "Return to Overview" or "Go to Home" action button calling `onReturn`.
    - No field may be absent, undefined, or display a raw object reference.
    - Animation disabled/replaced with ≤100ms opacity fade when `prefers-reduced-motion` is active.
    - _Requirements: 7.2, 7.4, 7.5, 12.3, 12.7_
    - _Design: Property P16_

- [x] 12. Implement lesson engine orchestrator
  - [x] 12.1 Create `src/components/LessonEngine.tsx`
    - Single entry-point component accepting `topicId: string` (1–128 chars).
    - On mount: calls `useEngineState(topicId, new LocalStorageAdapter())`.
    - If `loadError` is non-null: renders `<ErrorScreen message={loadError} />` and returns early — no lesson UI mounts.
    - If `saveError` is non-null: renders a non-blocking banner (toast/alert) above the lesson content; lesson continues uninterrupted.
    - Main layout: split-panel — left sidebar `<LearningPath>` + right content area `<NodeRenderer current node>`.
    - Renders `<XPBadge xpEarned={studentState.xpEarned} />` in a fixed position, always visible.
    - When `studentState.topicCompleted === true`: renders `<AchievementScreen>` instead of the normal layout.
    - Node completion animation (≤2s duration) shown between `advanceNode()` call and rendering next node; respects `prefers-reduced-motion`.
    - Responsive layout at 480px, 768px, 1024px (no content clipping or overlapping — Req 12.4).
    - _Requirements: 5.5, 5.7, 7.1, 7.6, 9.2, 11.2, 11.4, 11.5, 11.6, 12.4_
    - _Design: LessonEngine component, Component Hierarchy, Error State_

- [x] 13. Create Next.js pages and routing
  - [x] 13.1 Create `src/app/globals.css`
    - `@tailwind base; @tailwind components; @tailwind utilities;`
    - Set `html, body` background to `#0f172a` (slate-950).
    - _Requirements: 12.1_

  - [x] 13.2 Create `src/app/layout.tsx`
    - Root layout with `Inter` loaded via `next/font/google` (zero layout shift).
    - Sets `<html>` `lang="en"`, applies dark background, Inter font class.
    - Imports `globals.css`.
    - _Requirements: 12.1_
    - _Design: Design Tokens, Routing Design_

  - [x] 13.3 Create `src/app/page.tsx` (home page)
    - Lists available topics — V1: `beginner-html-01` only.
    - Displays: topic title, description, XP value, level, estimated time, and a "Start Learning" `<Link href="/lesson/beginner-html-01">` button.
    - Responsive layout; accessible heading structure.
    - _Requirements: 11.2, 12.1_
    - _Design: Routing Design_

  - [x] 13.4 Create `src/app/lesson/[topicId]/page.tsx`
    - Server component: extracts `topicId` from `params`.
    - Renders `<LessonEngine topicId={topicId} />` (client component).
    - _Requirements: 11.2, 11.3_
    - _Design: Routing Design_

- [x] 14. Create topic-01 lesson content
  - [x] 14.1 Create `lessons/beginner/html/topic-01.json`
    - A fully authored, schema-valid JSON file for `beginner-html-01`.
    - `metadata`: `id = "beginner-html-01"`, `title = "Build Your First Web Page"`, `level = "beginner"`, `category = "HTML"`, `topicNumber = 1`, `estimatedTime` (positive integer), `xp = 100`.
    - `learningPath`: exactly 10 nodes in the order: (1) `lesson` — Welcome to HTML; (2) `lesson` — HTML Elements & Tags; (3) `code` — Your First HTML Tags; (4) `lesson` — The HTML Document Structure; (5) `code` — Full HTML Boilerplate; (6) `lesson` — Headings & Paragraphs; (7) `code` — Headings in Action; (8) `practice` — Build It Yourself (multiple-choice, correct tag for main heading); (9) `challenge` — Build Your First Page (starterCode = empty HTML boilerplate); (10) `quiz` — Knowledge Check.
    - `quiz.questions`: exactly 5 questions scoped to concepts from nodes 1–9. Q1: largest heading tag → `<h1>`; Q2: HTML stands for → `HyperText Markup Language`; Q3: element containing visible content → `<body>`; Q4: valid HTML tag → `<p>`; Q5: what goes in `<head>` → page metadata and title. Each question includes `id`, `question`, `options` (4), `correctAnswer` (must exactly match one option), `explanation`, `points`.
    - `completion`: `title`, `message`, `achievementName`.
    - `schemaVersion: "1.0"`.
    - Must pass `SchemaValidator.validate()` with zero errors.
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
    - _Design: Topic 01 Content Overview_

- [x] 15. Checkpoint — wire up and smoke test
  - Ensure `src/app/lesson/[topicId]/page.tsx` renders `LessonEngine`, which loads `topic-01.json` via `LessonLoader`, validates via `SchemaValidator`, and renders `LearningPath` + `NodeRenderer`.
  - Ensure `XPBadge` is visible at all times.
  - Confirm no TypeScript compilation errors (`tsc --noEmit`).
  - Ask the user if questions arise before proceeding to tests.

- [x] 16. Write engine core tests
  - [x] 16.1 Create `src/engine/validator.test.ts`
    - Unit tests: missing `metadata` section; missing `quiz` section; exactly 5 quiz questions passes; 4 questions fails with descriptive error; `schemaVersion "2.0"` rejected; `schemaVersion "1.5"` accepted; valid complete lesson object passes; missing `schemaVersion` rejected; node with unknown `type` fails with index + type in error message; multiple violations produce multiple errors (not just first).
    - _Requirements: 1.3, 1.4, 2.7, 2.8_

  - [x] 16.2 Write property test for SchemaValidator (P1)
    - **Property 1: Schema Validation Reports All Violations**
    - Use `fc.subarray` of required field names to remove them from a valid lesson; assert `valid: false` with `errors.length >= 1` and each error identifies a field path and violated rule.
    - Use `fc.string` for invalid enum values (e.g., `metadata.level = "expert"`); assert rejected.
    - Minimum 100 iterations.
    - **Validates: Requirements 1.3, 1.4, 1.5, 2.2, 2.3, 2.4, 2.6, 2.7, 2.8**
    - _Design: Property P1, Testing Strategy_

  - [x] 16.3 Create `src/engine/loader.test.ts`
    - Unit tests: file not found returns `{ error: "... not found at ..." }`; malformed JSON returns `{ error: "... could not be read ..." }`; valid file returns `{ lesson: Lesson }`.

  - [x] 16.4 Write property test for LessonLoader path construction (P2)
    - **Property 2: Lesson Loader Path Construction**
    - Use `fc.string` for `topicId`, `level`, `category`; assert constructed path equals `lessons/{level}/{category}/{topicId}.json` with no extra segments or slashes.
    - **Validates: Requirements 1.1**
    - _Design: Property P2, Testing Strategy_

  - [x] 16.5 Create `src/engine/progress.test.ts`
    - Unit tests: `totalNodes = 0` → 0%; `3 / 10` → 30%; `10 / 10` → 100%; rounding (e.g., 1/3 → 33%); completedCount > totalNodes clamped to 100%.

  - [x] 16.6 Write property test for ProgressTracker (P4)
    - **Property 4: Progress Calculation Correctness**
    - Use `fc.nat` for `completedCount` (0–T) and `totalCount` (T ≥ 1); assert `percentage = Math.round((C/T)*100)` clamped to `[0,100]` and `completedCount`/`totalCount` returned correctly.
    - **Validates: Requirements 3.5, 3.6, 3.8**
    - _Design: Property P4, Testing Strategy_

  - [x] 16.7 Create `src/engine/xp.test.ts`
    - Unit tests: `awardNodeXP` on already-completed node → `xpEarned` unchanged; `awardNodeXP` on new node → `xpEarned` increases; node with no XP → `xpEarned` unchanged; `awardCompletionXP` once → increases by `topicXP`; `awardCompletionXP` twice → second call is no-op.

  - [x] 16.8 Write property test for XP idempotency (P14)
    - **Property 14: XP Idempotency — Node and Completion Awards**
    - (a) `fc.string` (nodeId) + `fc.nat` (xpAmount): call `awardNodeXP` on state where node is already in `completedNodes`; assert `xpEarned` unchanged.
    - (b) `fc.nat` (topicXP): call `awardCompletionXP` N > 1 times; assert `xpEarned` increases by exactly `topicXP` once.
    - **Validates: Requirements 5.4, 8.3, 8.4, 8.5**
    - _Design: Property P14, Testing Strategy_

- [x] 17. Write persistence layer tests
  - [x] 17.1 Create `src/persistence/localStorageAdapter.test.ts`
    - Unit tests: `saveState` then `loadState` same topicId returns equal state; `loadState` with no prior save returns null; `loadState` with unparseable stored data returns null; `clearState` causes subsequent `loadState` to return null; `saveState` with simulated quota error does not throw.

  - [x] 17.2 Write property test for persistence round-trip (P15)
    - **Property 15: Persistence Round-Trip Preserves Student State**
    - Use `fc.record` matching `StudentState` shape (including nested `quizAttempts` array, `completedNodes` array); call `saveState` then `loadState`; assert deep equality.
    - Consecutive save-load cycles must be idempotent.
    - **Validates: Requirements 9.4**
    - _Design: Property P15, Testing Strategy_

- [x] 18. Write component tests
  - [x] 18.1 Create `src/components/LearningPath/LearningPath.test.tsx`
    - Unit tests: empty path shows 0% and "0 / 0"; 3/10 nodes completed shows 30% and "3 / 10"; current node has `aria` or class indicating current; completed nodes have distinct class from upcoming.

  - [x] 18.2 Write property test for node state rendering (P3)
    - **Property 3: Node State Rendering Invariant**
    - Use `fc.array` of node IDs + `fc.nat` for `currentNodeIndex`; render `LearningPath`; assert each node has exactly one of `completed|current|upcoming`; assert at most one node is `current`.
    - **Validates: Requirements 3.2, 3.3, 3.4**
    - _Design: Property P3, Testing Strategy_

  - [x] 18.3 Create `src/components/nodes/LessonNodeView.test.tsx`
    - Unit tests: renders `title` and `explanation`; when `explanation` absent renders placeholder; renders `analogy` when present; does not render `analogy` element when absent; renders `tips` list when present; does not crash when all optional fields absent.

  - [x] 18.4 Write property test for LessonNodeView (P5)
    - **Property 5: Lesson Node Renders All Present Fields**
    - Use `fc.record` with optional fields (`analogy`, `expectedResult`, `tips`) randomly present/omitted; assert present fields appear in render output; absent fields produce no error/crash.
    - **Validates: Requirements 4.1**
    - _Design: Property P5, Testing Strategy_

  - [x] 18.5 Create `src/components/nodes/CodeNodeView.test.tsx`
    - Unit tests: renders `code.content` in a code block; preserves whitespace (content appears inside `<pre>` or equivalent); language label exactly matches `code.language`; no normalisation or truncation of language value.

  - [x] 18.6 Write property test for CodeNodeView (P6)
    - **Property 6: Code Node Renders Content and Language Label**
    - Use `fc.record` with arbitrary `code.language` and `code.content` strings; assert language label equals the input value exactly and content is present in rendered output.
    - **Validates: Requirements 4.2**
    - _Design: Property P6, Testing Strategy_

  - [x] 18.7 Create `src/components/nodes/ChallengeNodeView.test.tsx`
    - Unit tests: renders `title` and `instructions`; renders `starterCode` in code block when present; renders `expectedResult` when present; no crash when optional fields absent.

  - [x] 18.8 Write property test for ChallengeNodeView (P7)
    - **Property 7: Challenge Node Renders All Present Fields**
    - Use `fc.record` with optional `starterCode` and `expectedResult` randomly present/absent; assert correct render behaviour in all combinations.
    - **Validates: Requirements 4.4**
    - _Design: Property P7, Testing Strategy_

  - [x] 18.9 Create `src/components/NodeRenderer/NodeRenderer.test.tsx`
    - Unit tests: renders `LessonNodeView` for `type = 'lesson'`; renders `FallbackNodeView` for unknown type; `FallbackNodeView` output contains the unknown type string and "not supported" text; does not throw for any unknown type.

  - [x] 18.10 Write property test for FallbackNodeView (P8)
    - **Property 8: Fallback Renderer Shows Unknown Type**
    - Use `fc.string` filtered to exclude the five V1 type values; render `NodeRenderer` with that type; assert `FallbackNodeView` is rendered, output contains the type string, output contains "not supported", no throw.
    - **Validates: Requirements 4.6**
    - _Design: Property P8, Testing Strategy_

  - [x] 18.11 Create `src/components/QuizEngine/QuizEngine.test.tsx`
    - Unit tests: idle state shows attempt 0 / max 2 / "no attempt recorded"; submit transitions to reviewing; review shows wrong answers with explanations; after 2 attempts retry button hidden and "no further attempts remain" shown; third submit blocked.

  - [x] 18.12 Write property test for quiz score calculation (P10)
    - **Property 10: Quiz Score Calculation**
    - Use `fc.array` of `QuizQuestion` + random answer selection per question; assert score equals sum of `points` for matching answers, 0 contribution for non-matching or absent answers.
    - **Validates: Requirements 6.2**
    - _Design: Property P10, Testing Strategy_

  - [x] 18.13 Create `src/components/AchievementScreen/AchievementScreen.test.tsx`
    - Unit tests: renders topic title; renders `xpEarned`; renders best score as percentage; renders completed node count; renders `achievementName`; "Return to Overview" button is present; no field is undefined or raw object.

  - [x] 18.14 Write property test for AchievementScreen (P16)
    - **Property 16: Achievement Screen Renders All Required Fields**
    - Use `fc.record` for `StudentState` with `topicCompleted = true` + `fc.record` for `Lesson`; assert all six required fields are present in render output with non-undefined, non-object-string values.
    - **Validates: Requirements 7.2**
    - _Design: Property P16, Testing Strategy_

- [x] 19. Write hook and integration tests
  - [x] 19.1 Create `src/hooks/useEngineState.test.ts`
    - Unit tests: `loadState(null)` initialises with `INITIAL_STUDENT_STATE`; `advanceNode()` on last node sets `topicCompleted = true`; `saveError` set when persistence throws; `submitQuizAttempt` blocked when `quizAttempts.length >= 2`.

  - [x] 19.2 Write property test for completed nodes accumulation (P9)
    - **Property 9: Advancing Nodes Accumulates Completed Set**
    - Use `fc.array` of node sequences; simulate repeated `advanceNode()` calls; assert each node ID appended to `completedNodes` exactly once with no duplicates.
    - **Validates: Requirements 5.2**
    - _Design: Property P9, Testing Strategy_

  - [x] 19.3 Write property test for best score MAX invariant (P11)
    - **Property 11: Best Quiz Score is Always the Maximum**
    - Use `fc.tuple(fc.nat({ max: 100 }), fc.nat({ max: 100 }))` for scores S1, S2; simulate two submissions; assert `bestQuizScore === Math.max(S1, S2)` and value never decreases.
    - **Validates: Requirements 6.3**
    - _Design: Property P11, Testing Strategy_

  - [x] 19.4 Write property test for quiz attempt count bounded at 2 (P12)
    - **Property 12: Quiz Attempt Count is Bounded at 2**
    - Use `fc.nat({ min: 3, max: 20 })` for submission count; simulate N submissions; assert `quizAttempts.length` always in `[0, 2]` and submissions beyond 2 are blocked.
    - **Validates: Requirements 6.5, 6.7**
    - _Design: Property P12, Testing Strategy_

  - [x] 19.5 Write property test for any quiz submission marks node complete (P13)
    - **Property 13: Any Quiz Submission Marks Quiz Node Complete**
    - Use `fc.record` for random quiz answers + random quiz node ID; simulate submission; assert quiz node ID appears in `completedNodes` after any attempt (including score-0 submissions).
    - **Validates: Requirements 6.9**
    - _Design: Property P13, Testing Strategy_

  - [x] 19.6 Create `src/integration/lessonFlow.test.ts`
    - Integration tests:
      - Load `topic-01.json` end-to-end: `SchemaValidator` reports zero errors; all 10 nodes render.
      - Invalid lesson blocks render: `ErrorScreen` mounts; no `LearningPath` or `NodeRenderer` in DOM.
      - Node advance persists state: after `advanceNode()`, `LocalStorageAdapter.loadState()` returns state with updated `completedNodes`.
      - Quiz: two submissions with S1 < S2; `bestQuizScore === S2`.
      - Topic completion flow: advancing through all nodes sets `topicCompleted = true` and renders `AchievementScreen`.
      - Persistence failure degrades gracefully: mock `setItem` to throw; assert non-blocking banner rendered and lesson continues.
    - _Requirements: 1.7, 5.2, 6.3, 7.1, 9.6, 10.5, 11.3_

- [x] 20. Final checkpoint — build verification and smoke test
  - Run `tsc --noEmit` and fix all TypeScript errors.
  - Run `vitest --run` and fix any failing tests.
  - Programmatically validate `topic-01.json` against `lesson.schema.json` (write a one-off Node.js script or use the smoke test in `lessonFlow.test.ts`) and confirm zero errors.
  - Run `next build` and confirm exit code 0.
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP, but are strongly recommended for correctness guarantees on the state machine invariants.
- Each task references specific requirements for traceability and specific design properties where applicable.
- Checkpoints at tasks 15 and 20 ensure incremental validation and catch integration issues early.
- Property tests validate universal correctness properties (16 total across P1–P16 in the design); unit tests validate specific examples and edge cases.
- The persistence abstraction (`IPersistenceAdapter`) means all state tests can run with a mock adapter — no real `localStorage` needed for unit/hook tests.
- `next build` is the canonical build verification step; `tsc --noEmit` catches type errors earlier in the cycle.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4"] },
    { "id": 2, "tasks": ["2.1", "2.2", "3.1", "13.1", "13.2"] },
    { "id": 3, "tasks": ["4.1", "4.3", "4.4", "5.1"] },
    { "id": 4, "tasks": ["4.2", "5.2"] },
    { "id": 5, "tasks": ["6.1", "7.1", "7.2", "7.3", "7.4", "7.5"] },
    { "id": 6, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5"] },
    { "id": 7, "tasks": ["8.6", "9.1", "10.1", "10.2"] },
    { "id": 8, "tasks": ["9.2", "10.3", "11.1"] },
    { "id": 9, "tasks": ["12.1", "14.1"] },
    { "id": 10, "tasks": ["13.3", "13.4"] },
    { "id": 11, "tasks": ["16.1", "16.3", "16.5", "16.7", "17.1", "18.1", "18.3", "18.5", "18.7", "18.9", "18.11", "18.13", "19.1"] },
    { "id": 12, "tasks": ["16.2", "16.4", "16.6", "16.8", "17.2", "18.2", "18.4", "18.6", "18.8", "18.10", "18.12", "18.14", "19.2", "19.3", "19.4", "19.5"] },
    { "id": 13, "tasks": ["19.6"] }
  ]
}
```
