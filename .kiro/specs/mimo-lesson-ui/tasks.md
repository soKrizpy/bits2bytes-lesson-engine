# Implementation Plan: Mimo Lesson UI

## Overview

Surgical rework of the BITS2BYTES Lesson Engine UI to a full-screen centered card experience. The work is ordered to: (1) add CSS and new components, (2) update node views to remove own advance buttons and add new interactions, (3) rework QuizEngine, (4) rewire LessonEngine layout, (5) add deployment config.

## Tasks

- [ ] 1. Add slide transition CSS and new animation to `globals.css`
  - [ ] 1.1 Add `@keyframes slideInFromRight`, `.slide-in-from-right`, and `.sticky-cta-safe-area` CSS to `globals.css`
    - Define keyframe: `from { transform: translateX(100%); opacity: 0 }` → `to { transform: translateX(0); opacity: 1 }`
    - Add `.slide-in-from-right { animation: slideInFromRight 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards }`
    - Add `@media (prefers-reduced-motion: reduce) { .slide-in-from-right { animation: none } }`
    - Add `.sticky-cta-safe-area { padding-bottom: calc(1rem + env(safe-area-inset-bottom)) }`
    - _Requirements: 4.1, 4.3, 4.4_

  - [ ]* 1.2 Write example test for slide-in CSS class presence in NodeCard
    - Verify `.slide-in-from-right` class is applied to the NodeCard wrapper when `cardKey` changes
    - Verify `animation: none` is applied when `prefers-reduced-motion` mock is active
    - _Requirements: 4.1, 4.3_

- [ ] 2. Create `XpPopAnimation` component
  - [ ] 2.1 Create `src/components/ui/XpPopAnimation.tsx`
    - Accept props: `xp: number`, `visible: boolean`
    - When `visible && xp > 0`: render `span` with text `+{xp} XP ⭐` and classes `animate-xp-gain motion-reduce:animate-none motion-reduce:opacity-0 text-xpGold font-bold text-sm`
    - When `visible === false` or `xp <= 0`: return `null`
    - _Requirements: 3.1, 3.3, 3.4, 3.5_

  - [ ]* 2.2 Write property test for XpPopAnimation — visible iff xp > 0 and visible = true
    - Use `fast-check`: `fc.integer({ min: -100, max: 0 })` → assert null rendered
    - Use `fast-check`: `fc.integer({ min: 1, max: 500 })` with `visible=true` → assert `+N XP` rendered
    - Tag: `// Feature: mimo-lesson-ui, Property 3: XpPopAnimation visible iff xp > 0 and visible = true`
    - Tag: `// Feature: mimo-lesson-ui, Property 4: XpPopAnimation renders for all positive XP values`
    - _Requirements: 3.1, 3.4_

- [ ] 3. Create `TopProgressBar` component
  - [ ] 3.1 Create `src/components/ui/TopProgressBar.tsx`
    - Accept props: `currentStep: number`, `totalSteps: number`, `topicTitle: string`, `xpPopValue: number | null`, `onXpPopDone: () => void`
    - Render sticky `<header>` with `sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-white/10`
    - Left: `<span aria-live="polite">` containing `Step {currentStep} of {totalSteps}`
    - Center: topic title truncated with `text-text-muted text-sm truncate hidden sm:block`
    - Right: `<XpPopAnimation xp={xpPopValue ?? 0} visible={xpPopValue !== null} />`; call `onXpPopDone` after 2000ms via `useEffect` when `xpPopValue !== null`
    - Below header row: progress fill `<div>` with `style={{ width: \`${Math.round((currentStep / totalSteps) * 100)}%\` }}` and `transition-[width] duration-300 ease-out motion-reduce:transition-none`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 11.4_

  - [ ]* 3.2 Write property test for TopProgressBar step label
    - Use `fast-check`: generate `{ current: fc.integer({min:1, max:50}), total: fc.integer({min:1, max:50}).filter(t => t >= current) }` 
    - Assert rendered output contains `Step ${current} of ${total}`
    - Assert fill bar style width is within 1% of `(current/total)*100`
    - Assert the step label is inside an element with `aria-live="polite"`
    - Tag: `// Feature: mimo-lesson-ui, Property 1: TopProgressBar step label matches node position`
    - Tag: `// Feature: mimo-lesson-ui, Property 2: TopProgressBar fill width is proportional to step`
    - Tag: `// Feature: mimo-lesson-ui, Property 16: TopProgressBar step label in aria-live region`
    - _Requirements: 2.1, 2.2, 11.4_

- [ ] 4. Checkpoint — Ensure new UI components compile and pass tests
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Update `LessonNodeView` to remove own advance button and add game-like styling
  - [ ] 5.1 Modify `src/components/nodes/LessonNodeView.tsx`
    - Add `onCanAdvanceChange?: (canAdvance: boolean) => void` to props interface
    - Call `onCanAdvanceChange?.(true)` in a `useEffect` with empty deps on mount (LessonNode is always immediately advanceable)
    - In learning mode: remove the `<div className="pt-2"><Button ...>` block entirely
    - Keep all callout styling unchanged; optionally increase `h2` size to `text-3xl sm:text-4xl` for more game-like feel
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 5.2 Write property tests for LessonNodeView rendering
    - Use `fast-check`: `fc.record({ id: fc.string(), title: fc.string({minLength:1}), type: fc.constant('lesson'), explanation: fc.string() })`
    - Assert `h2` text matches node title
    - Assert 💡 callout present iff `analogy` is a non-empty string
    - Assert ✨ callout present iff `tips` array is non-empty
    - Assert no Button rendered in learning mode
    - Tag: `// Feature: mimo-lesson-ui, Property 5: LessonNodeView always renders title in h2`
    - Tag: `// Feature: mimo-lesson-ui, Property 6: LessonNodeView renders analogy callout iff analogy is present`
    - Tag: `// Feature: mimo-lesson-ui, Property 7: LessonNodeView renders tips callout iff tips array is non-empty`
    - _Requirements: 5.1, 5.3, 5.4, 5.5_

- [ ] 6. Update `CodeNodeView` — copy button and remove own advance button
  - [ ] 6.1 Modify `src/components/nodes/CodeNodeView.tsx`
    - Add `onCanAdvanceChange?: (canAdvance: boolean) => void` to props interface
    - Call `onCanAdvanceChange?.(true)` on mount (CodeNode is always immediately advanceable)
    - Add `CopyState = 'idle' | 'copied' | 'error'` state, initialized to `'idle'`
    - Add `handleCopy` async function: `await navigator.clipboard.writeText(node.code.content)` in try/catch; on success set `'copied'`, on catch set `'error'`; `setTimeout(() => setCopyState('idle'), 2000)` in both branches
    - In the code block header, render a Copy button (right side) with label from `{ idle: 'Copy', copied: 'Copied!', error: 'Error' }` map
    - Language badge stays top-left (already present; ensure it uses `text-xs font-mono font-semibold text-primary uppercase tracking-wider`)
    - In learning mode: remove the `<div className="pt-2"><Button ...>` block entirely
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 6.2 Write example and edge-case tests for CodeNodeView copy button
    - Mock `navigator.clipboard.writeText` to resolve → assert label changes to "Copied!" → fake-timer advance 2000ms → assert reverts to "Copy"
    - Mock clipboard to reject → assert "Error" → revert after 2000ms
    - Assert no Button with "continue" text rendered in learning mode
    - Assert language badge renders with node's language string
    - Tag: `// Feature: mimo-lesson-ui, Property 8: CodeNodeView renders language badge for all code nodes`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 6.3 Write property test for CodeNodeView language badge
    - Use `fast-check`: `fc.record({ language: fc.string({minLength:1}), content: fc.string() })`
    - Assert rendered header contains the language string
    - _Requirements: 6.1_

- [ ] 7. Update `PracticeNodeView` — Duolingo-style answer buttons, remove own advance button
  - [ ] 7.1 Modify `src/components/nodes/PracticeNodeView.tsx`
    - Add `onCanAdvanceChange?: (canAdvance: boolean) => void` to props interface
    - In `handleOptionSelect`: after setting selected option, call `onCanAdvanceChange?.(true)`
    - All step-completion paths: call `onCanAdvanceChange?.(true)` when `isStepCompletionComplete` becomes true
    - In learning mode: remove the `<div className="pt-2"><Button ...>` advance block
    - Increase option button height to `min-h-[3.5rem]` (h-14) and font to `text-base`
    - WHEN incorrect answer selected: also add success styling to the `node.correctOption` button
    - Expand feedback section below options to show explanation text from `node` if available (use `node.instructions` as fallback context label)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

  - [ ]* 7.2 Write property tests for PracticeNodeView
    - Use `fast-check`: generate practice nodes with random `options` arrays and a `correctOption`
    - For any incorrect selection: assert correct answer button has success class AND incorrect button has error class
    - For any option set: assert each button has `w-full` class
    - Tag: `// Feature: mimo-lesson-ui, Property 9: PracticeNodeView correct answer always highlighted green after wrong selection`
    - Tag: `// Feature: mimo-lesson-ui, Property 10: PracticeNodeView all options are full-width buttons`
    - _Requirements: 7.1, 7.4_

  - [ ]* 7.3 Write example tests for PracticeNodeView state transitions
    - Assert advance button NOT rendered in learning mode
    - Assert `onCanAdvanceChange(true)` called after selection
    - Assert `onCanAdvanceChange(false)` NOT called after mount (starts false implicitly via parent)
    - _Requirements: 7.6, 7.7, 7.8_

- [ ] 8. Update `ChallengeNodeView` — remove own advance button
  - [ ] 8.1 Modify `src/components/nodes/ChallengeNodeView.tsx`
    - Add `onCanAdvanceChange?: (canAdvance: boolean) => void` to props interface
    - Call `onCanAdvanceChange?.(true)` on mount
    - In learning mode: remove `<div className="pt-2"><Button ...>` block
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 8.2 Write property tests for ChallengeNodeView
    - Use `fast-check`: generate challenge nodes with optional `starterCode` and `expectedResult`
    - Assert code-shell block present iff `starterCode` defined
    - Assert success callout present iff `expectedResult` is a non-empty string
    - Assert no advance Button in learning mode
    - Tag: `// Feature: mimo-lesson-ui, Property 11: ChallengeNodeView renders starterCode block iff starterCode present`
    - Tag: `// Feature: mimo-lesson-ui, Property 12: ChallengeNodeView renders expectedResult callout iff field is present`
    - _Requirements: 8.2, 8.3, 8.4_

- [ ] 9. Checkpoint — All node views updated; run full test suite
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Rework `QuizEngine` to one-question-per-card flow
  - [ ] 10.1 Modify `src/components/QuizEngine/QuizEngine.tsx`
    - Add `onCanAdvanceChange?: (canAdvance: boolean) => void` to `QuizEngineProps`
    - Add new state: `questionIndex`, `perQuestionAnswer`, `perQuestionSubmitted`, `allAnswers`
    - Add `'summary'` to `QuizPhase` type
    - Rework `active` phase: show single `QuizQuestionCard` for `questions[questionIndex]`
    - After answer selected: set `perQuestionSubmitted = true`, add to `allAnswers`, show color feedback + explanation
    - "Lanjut" in active phase: if not last question → increment `questionIndex` + reset `perQuestionSubmitted`; if last question → call `onSubmitAttempt(allAnswers)` → set `phase = 'summary'`
    - `summary` phase: render score summary (score / maxScore, correct count / total), "Lanjut" calls `onAdvance()`
    - Signal `onCanAdvanceChange`: `false` when phase=active and `!perQuestionSubmitted`; `true` after answer selected or on summary/idle
    - Keep `idle` and `reviewing` phases for backward compatibility; retain max-attempt guard
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 9.11_

  - [ ]* 10.2 Write property tests for QuizEngine per-question feedback
    - Use `fast-check`: generate `QuizQuestion` arrays with random question/option/correct data
    - For any question, selecting the correct answer → assert success-styled button for that option
    - For any question, selecting an incorrect answer → assert error-styled button for selected option
    - For any question, after selecting any answer → assert explanation text in DOM
    - Tag: `// Feature: mimo-lesson-ui, Property 13: QuizEngine correct/incorrect feedback for all questions`
    - Tag: `// Feature: mimo-lesson-ui, Property 14: QuizEngine explanation shown for any answered question`
    - _Requirements: 9.3, 9.4, 9.5_

  - [ ]* 10.3 Write property test for QuizEngine submit-on-last-question
    - Use `fast-check`: generate quiz arrays of length 1–5
    - Simulate answering all N questions; assert `onSubmitAttempt` called exactly once, immediately before summary screen
    - Tag: `// Feature: mimo-lesson-ui, Property 15: QuizEngine submits answers exactly once after last question`
    - _Requirements: 9.10_

  - [ ]* 10.4 Write example tests for QuizEngine state machine
    - Assert summary screen shown after all questions answered
    - Assert `onAdvance` called when Lanjut pressed on summary
    - Assert exhausted-attempts panel when `attemptsUsed >= MAX_ATTEMPTS`
    - Assert `onCanAdvanceChange(false)` called initially; `(true)` after answer selected
    - _Requirements: 9.6, 9.7, 9.8, 9.11_

- [ ] 11. Rewire `LessonEngine` to full-screen card layout
  - [ ] 11.1 Modify `src/components/LessonEngine.tsx` — state additions and handleAdvance wrapper
    - Add state: `cardKey` (number, init 0), `canAdvance` (boolean, init true), `xpPopValue` (number | null, init null)
    - Create `handleAdvance()`: reads `currentNode?.xp ?? 0`, if > 0 sets `xpPopValue`; calls `advanceNode()`; increments `cardKey`; resets `canAdvance(true)`
    - Create `handleCanAdvanceChange(v: boolean)`: sets `canAdvance(v)`
    - Pass `handleAdvance` where `onAdvance` was previously passed to `NodeRenderer`
    - _Requirements: 1.1, 3.1_

  - [ ] 11.2 Modify `src/components/LessonEngine.tsx` — replace main layout structure
    - Remove the `<aside>` LearningPath block from the learning-mode layout entirely
    - Remove existing `<header>` sticky top bar (the BITS2BYTES branding header)
    - Remove existing inline XP badge in header and floating `<XPBadge>` component
    - Render `<TopProgressBar currentStep={currentNodeIndex + 1} totalSteps={lesson.learningPath.length} topicTitle={lesson.metadata.title} xpPopValue={xpPopValue} onXpPopDone={() => setXpPopValue(null)} />`
    - Wrap `<NodeRenderer ...>` in a `<div key={cardKey} className="slide-in-from-right">` centered card: `max-w-lg mx-auto w-full px-4 sm:px-6 py-8 flex-1 overflow-y-auto`
    - Pass `onCanAdvanceChange={handleCanAdvanceChange}` to `NodeRenderer` (and thread through to node views)
    - Add `StickyCtaBar` at the bottom: `sticky bottom-0 z-50 bg-background/90 backdrop-blur border-t border-white/10 sticky-cta-safe-area px-4 py-3 flex justify-center`
    - StickyCtaBar contains `<Button size="lg" disabled={!canAdvance} onClick={handleAdvance}>{isLastNode ? 'Selesai' : 'Lanjut →'}</Button>`
    - Retain the `saveError` banner, TopicIntro, AchievementScreen, and TopicReview renders unchanged
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 1.7, 2.1–2.5, 11.3_

  - [ ]* 11.3 Write integration example tests for LessonEngine layout
    - Render LessonEngine with a minimal mock lesson (2 nodes, one practice, one lesson)
    - Assert LearningPath sidebar NOT in DOM during active learning
    - Assert TopProgressBar IS in DOM during active learning
    - Assert StickyCtaBar IS in DOM with "Lanjut →" on node 0, "Selesai" on last node
    - Assert StickyCtaBar button disabled when practice node not yet answered
    - _Requirements: 1.2, 1.4, 1.5, 1.6, 1.7_

- [ ] 12. Update `NodeRenderer` to thread `onCanAdvanceChange` prop
  - [ ] 12.1 Modify `src/components/NodeRenderer/NodeRenderer.tsx`
    - Add `onCanAdvanceChange?: (canAdvance: boolean) => void` to `NodeRendererProps`
    - Pass `onCanAdvanceChange` to all `SIMPLE_RENDERERS` entries and to `QuizEngine`
    - Update `SIMPLE_RENDERERS` type signature to include the new optional prop
    - _Requirements: 1.7, 7.6, 7.7, 9.9_

- [ ] 13. Create `vercel.json`
  - [ ] 13.1 Create `vercel.json` at repository root
    - Content: `{ "framework": "nextjs", "buildCommand": "next build", "outputDirectory": ".next" }`
    - _Requirements: 10.1, 10.2, 10.3_

- [ ] 14. Final checkpoint — full test suite and build verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All property tests use `fast-check` (already installed at `^3.23.2`) with Vitest
- The `onCanAdvanceChange` prop pattern is the key interface between node views and `StickyCtaBar`
- The `LearningPath` sidebar is intentionally preserved in `TopicReview` — no changes to review mode flow
- `XPBadge.tsx` (the fixed-position badge) is superseded by `XpPopAnimation` inside `TopProgressBar`; the old badge should be removed from `LessonEngine` to avoid duplication
- Checkpoint tasks are not included in the dependency graph

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1"] },
    { "id": 1, "tasks": ["1.2", "2.2", "3.2", "5.1", "6.1", "7.1", "8.1"] },
    { "id": 2, "tasks": ["5.2", "5.3", "6.2", "6.3", "7.2", "7.3", "8.2", "10.1"] },
    { "id": 3, "tasks": ["10.2", "10.3", "10.4", "12.1"] },
    { "id": 4, "tasks": ["11.1"] },
    { "id": 5, "tasks": ["11.2", "13.1"] },
    { "id": 6, "tasks": ["11.3"] }
  ]
}
```
