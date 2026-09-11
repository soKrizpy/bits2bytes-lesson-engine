# Requirements Document

## Introduction

This feature replaces the sidebar-plus-content layout of the BITS2BYTES Lesson Engine with a full-screen, centered card experience inspired by Mimo and Duolingo. Each learning node occupies its own card screen; navigation is driven by a sticky top progress bar and a sticky bottom CTA button. The quiz experience is reworked to present one question per card with instant answer feedback. An XP celebration animation fires whenever a node awards XP. A `vercel.json` config enables production deployment.

## Glossary

- **LessonEngine**: The root React component that orchestrates the full lesson experience (`LessonEngine.tsx`).
- **NodeCard**: The centered, full-screen content card that renders the current learning node.
- **TopProgressBar**: The sticky header bar showing "Step N of M", a colored fill bar, and the XP pop-up zone.
- **XpPopAnimation**: The brief floating "+N XP ⭐" animation rendered near the TopProgressBar when a node awards XP.
- **StickyCtaBar**: The sticky bottom bar containing the primary "Lanjut →" or "Selesai" action button.
- **LearningPath**: The existing zigzag sidebar component, retained only in review mode.
- **QuizEngine**: The component managing the quiz experience, reworked to a one-question-per-card flow.
- **PracticeNodeView**: The multiple-choice practice interaction component.
- **CodeNodeView**: The code-display node component.
- **LessonNodeView**: The explanatory lesson node component.
- **ChallengeNodeView**: The challenge task node component.
- **NodeRenderer**: The dispatcher that routes to per-type node view components.
- **SlideTransition**: The CSS-driven slide-in-from-right animation applied when advancing to the next node.
- **ReviewMode**: The post-completion state in which the LearningPath sidebar is shown alongside a node detail panel.
- **prefers-reduced-motion**: The OS/browser accessibility preference that disables animations.
- **XP**: Experience points awarded for completing nodes and the overall topic.

---

## Requirements

### Requirement 1: Full-Screen Centered Card Layout

**User Story:** As a student, I want each lesson step to fill the screen as a focused card, so that I can concentrate on one concept at a time without sidebar distractions.

#### Acceptance Criteria

1. WHEN the lesson is in active learning mode, THE LessonEngine SHALL render a single centered NodeCard with `max-width: 32rem` (max-w-lg) and generous padding, replacing the sidebar-plus-content layout.
2. WHEN the lesson is in active learning mode, THE LessonEngine SHALL NOT render the LearningPath sidebar.
3. WHEN the lesson is in review mode (after topic completion), THE LessonEngine SHALL render the LearningPath sidebar alongside the node detail panel.
4. THE LessonEngine SHALL render a TopProgressBar as a sticky element at the top of the viewport during active learning mode.
5. THE LessonEngine SHALL render a StickyCtaBar as a sticky element at the bottom of the viewport during active learning mode.
6. WHEN the student is on the last learning node, THE StickyCtaBar SHALL display a "Selesai" label; WHILE on any other node, THE StickyCtaBar SHALL display "Lanjut →".
7. WHEN the current node requires interaction before advancing (practice, quiz), THE StickyCtaBar button SHALL be disabled until the interaction is complete.
8. THE NodeCard SHALL fill the available vertical space between TopProgressBar and StickyCtaBar with internal scroll when content overflows.

---

### Requirement 2: Top Progress Bar

**User Story:** As a student, I want to see my progress through the lesson steps, so that I know how far along I am and feel motivated to continue.

#### Acceptance Criteria

1. THE TopProgressBar SHALL display a "Step N of M" label where N is the current 1-based node index and M is the total node count.
2. THE TopProgressBar SHALL render a colored fill bar whose width equals `(N / M) × 100%`.
3. THE TopProgressBar SHALL be sticky at `top: 0` with a z-index above the NodeCard content.
4. WHEN the XpPopAnimation is triggered, THE TopProgressBar area SHALL serve as the anchor zone for the floating XP label.
5. THE TopProgressBar SHALL display the topic title as a secondary text label alongside the step counter.

---

### Requirement 3: XP Celebration Animation

**User Story:** As a student, I want to see a brief "+N XP ⭐" pop-up when I complete a node, so that I feel rewarded for my progress.

#### Acceptance Criteria

1. WHEN `onAdvance` is called for a node with `xp > 0`, THE XpPopAnimation SHALL render a floating "+N XP ⭐" label near the TopProgressBar.
2. THE XpPopAnimation label SHALL animate from opacity 0 and translateY(0) to opacity 1, then fade to opacity 0 while translating upward, completing within 2 000 ms.
3. WHEN `prefers-reduced-motion` is active, THE XpPopAnimation SHALL NOT play the keyframe animation and SHALL remain invisible (`opacity: 0`).
4. WHEN `onAdvance` is called for a node with `xp` equal to 0 or undefined, THE XpPopAnimation SHALL NOT be rendered.
5. THE XpPopAnimation SHALL be implemented as a standalone React component (`XpPopAnimation.tsx`) that accepts `xp` (number) and `visible` (boolean) as props.

---

### Requirement 4: Slide Transition Animation

**User Story:** As a student, I want a smooth slide-in animation when I advance to the next node, so that the experience feels fluid and game-like.

#### Acceptance Criteria

1. WHEN the student advances to a new node, THE NodeCard SHALL animate into view from the right using a CSS `translateX` transition (from `translateX(100%)` to `translateX(0)`).
2. THE SlideTransition SHALL complete within 300 ms.
3. WHEN `prefers-reduced-motion` is active, THE SlideTransition SHALL NOT play and the new card SHALL appear instantly.
4. THE SlideTransition CSS classes SHALL be defined in `globals.css` using a `@keyframes` rule named `slideInFromRight`.

---

### Requirement 5: Lesson Node Visual Polish

**User Story:** As a student, I want the lesson explanation card to feel vibrant and game-like, so that reading content is engaging rather than plain.

#### Acceptance Criteria

1. THE LessonNodeView SHALL render the node title as an `h2` element with large, bold typography.
2. THE LessonNodeView SHALL render the explanation text inside a styled card panel.
3. WHEN a node has an `analogy` field, THE LessonNodeView SHALL render it inside a colored callout box with a 💡 icon.
4. WHEN a node has `tips`, THE LessonNodeView SHALL render them inside a yellow callout box with a ✨ icon.
5. THE LessonNodeView's advance action SHALL be delegated to the StickyCtaBar; THE LessonNodeView SHALL NOT render its own advance Button in learning mode.

---

### Requirement 6: Code Node Enhancements

**User Story:** As a student, I want to easily copy code examples and see the language at a glance, so that I can experiment with the code in my own editor.

#### Acceptance Criteria

1. THE CodeNodeView SHALL display a language badge in the top-left corner of the code block header.
2. THE CodeNodeView SHALL render a "Copy" button in the top-right corner of the code block header.
3. WHEN the student clicks the Copy button, THE CodeNodeView SHALL write the code content to the system clipboard using the Clipboard API.
4. WHEN the copy operation succeeds, THE CodeNodeView SHALL display a "Copied!" confirmation label for 2 000 ms, then revert to "Copy".
5. IF the Clipboard API is unavailable or throws, THE CodeNodeView SHALL display an "Error" label for 2 000 ms.
6. THE CodeNodeView's advance action SHALL be delegated to the StickyCtaBar; THE CodeNodeView SHALL NOT render its own advance Button in learning mode.

---

### Requirement 7: Practice Node — Duolingo-Style Answer Buttons

**User Story:** As a student, I want large, tappable answer buttons with instant visual feedback, so that multiple-choice practice feels interactive and immediate.

#### Acceptance Criteria

1. THE PracticeNodeView SHALL render each answer option as a full-width button with minimum height of 3.5rem (h-14).
2. WHEN the student selects a correct answer, THE PracticeNodeView SHALL immediately apply a green (`success`) border and background to the selected button.
3. WHEN the student selects an incorrect answer, THE PracticeNodeView SHALL immediately apply a red (`error`) border and background to the selected button.
4. WHEN the student selects an incorrect answer, THE PracticeNodeView SHALL also highlight the correct answer button in green.
5. WHEN an answer has been selected, THE PracticeNodeView SHALL display an explanation section below the options showing whether the answer was correct and providing context.
6. WHEN an answer has been selected, THE StickyCtaBar advance button SHALL be enabled.
7. WHEN no answer has been selected, THE StickyCtaBar advance button SHALL be disabled.
8. THE PracticeNodeView SHALL NOT render its own advance Button in learning mode; the StickyCtaBar SHALL handle advancement.

---

### Requirement 8: Challenge Node Display

**User Story:** As a student, I want the challenge card to clearly present the task and starter code, so that I can attempt it without confusion.

#### Acceptance Criteria

1. THE ChallengeNodeView SHALL render the challenge instructions inside a styled callout card.
2. WHEN a challenge node has `starterCode`, THE ChallengeNodeView SHALL render it in a syntax-highlighted code block using the same code-shell styling as CodeNodeView.
3. WHEN a challenge node has `expectedResult`, THE ChallengeNodeView SHALL render it in a success-colored callout box.
4. THE ChallengeNodeView's advance action SHALL be delegated to the StickyCtaBar; THE ChallengeNodeView SHALL NOT render its own advance Button in learning mode.

---

### Requirement 9: Quiz — One Question Per Card

**User Story:** As a student, I want quiz questions presented one at a time with immediate feedback, so that I can focus on each question and learn from my answers.

#### Acceptance Criteria

1. WHEN the quiz enters the active phase, THE QuizEngine SHALL display one question at a time, replacing the current all-questions-at-once layout.
2. THE QuizEngine SHALL maintain a `questionIndex` integer state (0-based) tracking which question is currently shown.
3. WHEN a student selects an answer option, THE QuizEngine SHALL immediately render visual feedback: green for correct, red for incorrect.
4. WHEN a student selects a correct answer, THE QuizEngine SHALL display the question's `explanation` field below the options.
5. WHEN a student selects an incorrect answer, THE QuizEngine SHALL display the question's `explanation` field below the options AND highlight the correct answer in green.
6. AFTER the student answers a question, THE QuizEngine SHALL enable a "Lanjut" button to advance to the next question.
7. WHEN the student advances past the last question, THE QuizEngine SHALL display a score summary screen showing the score, maxScore, and count of correct answers.
8. WHEN the student clicks "Lanjut" on the score summary screen, THE QuizEngine SHALL call `onAdvance` to advance the lesson node.
9. THE QuizEngine's per-question advance button SHALL be rendered within the StickyCtaBar when in one-question-per-card mode.
10. THE QuizEngine SHALL submit the complete answers record to `onSubmitAttempt` immediately after the student answers the final question (before showing the summary screen).
11. IF the quiz has already been attempted the maximum number of times, THE QuizEngine SHALL display the exhausted-attempts panel and an advance button, unchanged from the current idle phase behavior.

---

### Requirement 10: Vercel Deployment Configuration

**User Story:** As a developer, I want a `vercel.json` file in the engine root, so that deploying the lesson engine to Vercel requires no manual configuration.

#### Acceptance Criteria

1. THE Repository SHALL contain a `vercel.json` file at the repository root.
2. THE `vercel.json` SHALL specify the framework as `"nextjs"` and set the build output directory to `.next`.
3. WHEN Vercel reads `vercel.json`, THE Deployment SHALL use the `next build` command as the build command without additional overrides.

---

### Requirement 11: Accessibility and Reduced-Motion Compliance

**User Story:** As a student with motion sensitivity or who uses assistive technology, I want the lesson UI to remain fully usable without animations, so that I can learn without discomfort.

#### Acceptance Criteria

1. WHEN `prefers-reduced-motion: reduce` is active, THE LessonEngine SHALL disable all CSS keyframe animations defined for the mimo-lesson-ui feature.
2. THE TopProgressBar fill bar transition SHALL use `transition-none` class or equivalent when `prefers-reduced-motion: reduce` is active.
3. THE StickyCtaBar advance button SHALL be keyboard-focusable and operable via the Enter or Space key.
4. THE TopProgressBar "Step N of M" label SHALL be wrapped in an `aria-live="polite"` region so screen readers announce step changes.
5. THE PracticeNodeView answer buttons SHALL use `role="radio"` and `aria-checked` attributes consistent with the existing implementation.
6. THE QuizEngine per-question answer buttons SHALL use `role="radio"` and `aria-checked` attributes.
