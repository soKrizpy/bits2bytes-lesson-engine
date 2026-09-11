# Design Document: Mimo Lesson UI

## Overview

The Mimo Lesson UI rework replaces the sidebar-plus-content layout with a full-screen, centered card experience inspired by Mimo and Duolingo. Each learning node occupies its own focused card; a sticky top progress bar tracks position; a sticky bottom CTA bar drives navigation; the quiz presents one question at a time with instant feedback; XP gains are celebrated with a floating animation; and a `vercel.json` enables production deployment.

The rework is **additive and surgical**: it modifies `LessonEngine.tsx`, `QuizEngine.tsx`, `PracticeNodeView.tsx`, `CodeNodeView.tsx`, `ChallengeNodeView.tsx`, `LessonNodeView.tsx`, and `globals.css`, and creates two new UI components (`TopProgressBar.tsx`, `XpPopAnimation.tsx`) and one config file (`vercel.json`). No changes to the persistence layer, hook logic, lesson JSON schema, or routing are required.

---

## Architecture

### Layout Transformation

**Before:**
```
┌────────────────────────────────────────────────────┐
│ Header (sticky)                                     │
├──────────────┬─────────────────────────────────────┤
│ LearningPath │ NodeRenderer content                 │
│ sidebar      │ (scrollable)                         │
│ (sticky)     │                                      │
└──────────────┴─────────────────────────────────────┘
```

**After (active learning mode):**
```
┌────────────────────────────────────────────────────┐
│ TopProgressBar (sticky top, z-50)                  │
│  Step N of M · [topic title] · [XP pop zone]       │
├────────────────────────────────────────────────────┤
│                                                     │
│        ┌──────────────────────┐                     │
│        │   NodeCard           │                     │
│        │   max-w-lg centered  │                     │
│        │   (scrollable area)  │                     │
│        └──────────────────────┘                     │
│                                                     │
├────────────────────────────────────────────────────┤
│ StickyCtaBar (sticky bottom, z-50)                 │
│  [ Lanjut → ]  or  [ Selesai ]                     │
└────────────────────────────────────────────────────┘
```

**After (review mode — unchanged):**
The `LearningPath` sidebar is retained in review mode (`TopicReview.tsx`) exactly as before.

### Component Dependency Graph

```
LessonEngine
├── TopProgressBar
│   └── XpPopAnimation
├── NodeCard (div with slide transition)
│   └── NodeRenderer
│       ├── LessonNodeView     (no own advance button)
│       ├── CodeNodeView       (no own advance button; copy button)
│       ├── PracticeNodeView   (no own advance button; reports canAdvance)
│       ├── ChallengeNodeView  (no own advance button)
│       └── QuizEngine         (StickyCtaBar integration via onCanAdvance)
└── StickyCtaBar
```

### State Additions to LessonEngine

```typescript
// Slide transition key — incremented on each advance to re-trigger animation
const [cardKey, setCardKey] = useState(0);

// Whether the current node allows advancing (needed for practice/quiz)
const [canAdvance, setCanAdvance] = useState(true);

// XP pop trigger: stores the XP amount for the animation, null when idle
const [xpPopValue, setXpPopValue] = useState<number | null>(null);
```

The `handleAdvance` wrapper in `LessonEngine`:
1. Reads `node.xp` if > 0 → sets `xpPopValue`
2. Calls `advanceNode()`
3. Increments `cardKey` to retrigger slide animation
4. Resets `canAdvance` to `true` (new card starts interactive)

---

## Components and Interfaces

### `TopProgressBar` (`src/components/ui/TopProgressBar.tsx`)

```typescript
interface TopProgressBarProps {
  currentStep: number;      // 1-based index of current node
  totalSteps: number;       // total node count
  topicTitle: string;       // shown as secondary label
  xpPopValue: number | null; // non-null triggers XpPopAnimation
  onXpPopDone: () => void;  // resets xpPopValue to null after animation
}
```

Renders:
- `<header>` with `position: sticky; top: 0; z-index: 50`
- Left: `"Step {currentStep} of {totalSteps}"` in an `aria-live="polite"` span
- Center: topic title (truncated, hidden on smallest breakpoint)
- Right: `XpPopAnimation` component
- Below the header row: progress fill bar (`<div>` with `width: {pct}%; transition: width 300ms ease`)

### `XpPopAnimation` (`src/components/ui/XpPopAnimation.tsx`)

```typescript
interface XpPopAnimationProps {
  xp: number;      // XP amount to display
  visible: boolean; // true = play animation, false = hidden
}
```

Uses the existing `animate-xp-gain` keyframe from `tailwind.config.ts`:
```
xpGain: { "0%": {opacity:"0", transform:"translateY(0)"}, "20%": {opacity:"1"}, "80%": {opacity:"1"}, "100%": {opacity:"0", transform:"translateY(-40px)"} }
```
When `visible && xp > 0`: renders `+{xp} XP ⭐` with `animate-xp-gain motion-reduce:animate-none motion-reduce:opacity-0`.
When `visible === false`: renders nothing.

### `StickyCtaBar` (inline in `LessonEngine.tsx`)

Rendered as a `<div>` fixed to the bottom with `position: sticky; bottom: 0; z-index: 50; background: var(--bg-page)/90 backdrop-blur`.

Props sourced from `LessonEngine` local state:
- `isLastNode`: `currentNodeIndex === totalNodes - 1`
- `canAdvance`: derived from interaction state forwarded by node views
- `onClick`: calls `handleAdvance()`

Label: `"Selesai"` when `isLastNode`, `"Lanjut →"` otherwise.

### Node View Interface Change

All node views receive a new optional prop to signal readiness:

```typescript
interface NodeViewSharedProps {
  onAdvance: () => void;       // called by StickyCtaBar, not the node view
  onCanAdvanceChange?: (canAdvance: boolean) => void; // signals readiness
  mode?: 'learning' | 'review';
}
```

In learning mode, each node view:
- Does **not** render its own `<Button>` for advancing
- Calls `onCanAdvanceChange(true/false)` when interaction state changes
- `LessonNodeView` and `CodeNodeView` call `onCanAdvanceChange(true)` immediately (always ready)
- `PracticeNodeView` calls `onCanAdvanceChange(false)` initially, then `(true)` after selection
- `ChallengeNodeView` calls `onCanAdvanceChange(true)` immediately
- `QuizEngine` manages its own internal advance through questions; signals `onCanAdvanceChange(true)` when the current quiz sub-step is answerable (after an answer is selected, or on summary screen)

### `CodeNodeView` — Copy Button

New state:
```typescript
type CopyState = 'idle' | 'copied' | 'error';
const [copyState, setCopyState] = useState<CopyState>('idle');
```

Copy handler:
```typescript
async function handleCopy() {
  try {
    await navigator.clipboard.writeText(node.code.content);
    setCopyState('copied');
  } catch {
    setCopyState('error');
  }
  setTimeout(() => setCopyState('idle'), 2000);
}
```

Label map: `{ idle: 'Copy', copied: 'Copied!', error: 'Error' }`.

### `QuizEngine` — One Question Per Card

New phase type:
```typescript
type QuizPhase = 'idle' | 'active' | 'summary' | 'reviewing';
```

New state additions to `QuizEngine`:
```typescript
const [questionIndex, setQuestionIndex] = useState(0);
const [perQuestionAnswer, setPerQuestionAnswer] = useState<string | null>(null);
const [perQuestionSubmitted, setPerQuestionSubmitted] = useState(false);
const [allAnswers, setAllAnswers] = useState<Record<string, string>>({});
```

State machine transitions:
```
idle ──[Start]──► active (questionIndex=0)
active
  ──[Select answer]──► perQuestionSubmitted=true, update allAnswers
  ──[Lanjut, not last question]──► questionIndex++, perQuestionSubmitted=false
  ──[Lanjut, last question]──► submit allAnswers to onSubmitAttempt → summary
summary
  ──[Lanjut]──► onAdvance()
idle (max attempts used) ──[Lanjut]──► onAdvance()
```

Per-question card renders:
1. Question text + 4 option buttons
2. After `perQuestionSubmitted`: color feedback + explanation box
3. "Lanjut" button (disabled until answer selected)

Score summary card renders:
- Score fraction: `{score} / {maxScore}`
- Correct count: `{correctCount} / {questions.length}`
- Primary "Lanjut" button → `onAdvance()`

---

## Data Models

No changes to `lesson.ts`, `state.ts`, or any persistence types.

### CSS Custom Properties Used

All from existing `globals.css` / `tailwind.config.ts`:
- Colors: `--color-primary`, `--color-success`, `--color-error`, `--color-warning`, `--color-xpgold`
- Background: `--bg-page`, `--bg-card`
- Animations: `xp-gain` (existing), new `slideInFromRight` (added to `globals.css`)

### New CSS in `globals.css`

```css
@keyframes slideInFromRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.slide-in-from-right {
  animation: slideInFromRight 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@media (prefers-reduced-motion: reduce) {
  .slide-in-from-right {
    animation: none;
  }
}

/* Safe-area padding for StickyCtaBar on mobile */
.sticky-cta-safe-area {
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
}
```

### `vercel.json`

```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "outputDirectory": ".next"
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: TopProgressBar step label matches node position

*For any* currentStep value between 1 and totalSteps inclusive, the TopProgressBar rendered output SHALL contain the string `"Step {currentStep} of {totalSteps}"`.

**Validates: Requirements 2.1**

### Property 2: TopProgressBar fill width is proportional to step

*For any* (currentStep, totalSteps) pair where 1 ≤ currentStep ≤ totalSteps, the fill bar inline style width SHALL equal `Math.round((currentStep / totalSteps) * 100)` percent (within ±1 due to rounding).

**Validates: Requirements 2.2**

### Property 3: XpPopAnimation visible iff xp > 0 and visible = true

*For any* xp value ≤ 0 or visible = false, the XpPopAnimation component SHALL render no visible DOM element (returns null or a zero-opacity element).

**Validates: Requirements 3.4**

### Property 4: XpPopAnimation renders for all positive XP values

*For any* positive integer xp value with visible = true, the XpPopAnimation SHALL render an element containing the string `"+{xp} XP"`.

**Validates: Requirements 3.1**

### Property 5: LessonNodeView always renders title in h2

*For any* LessonNode with any title string, the rendered output SHALL contain an `h2` element whose text content equals the node title.

**Validates: Requirements 5.1**

### Property 6: LessonNodeView renders analogy callout iff analogy is present

*For any* LessonNode, a 💡 callout element SHALL appear in the rendered output if and only if the node's `analogy` field is a non-empty string.

**Validates: Requirements 5.3**

### Property 7: LessonNodeView renders tips callout iff tips array is non-empty

*For any* LessonNode, the ✨ tips callout SHALL appear in the rendered output if and only if the node's `tips` array is non-empty.

**Validates: Requirements 5.4**

### Property 8: CodeNodeView renders language badge for all code nodes

*For any* CodeNode with any language string, the rendered output SHALL contain an element displaying that language string in the code block header.

**Validates: Requirements 6.1**

### Property 9: PracticeNodeView correct answer always highlighted green after wrong selection

*For any* PracticeNode with a `correctOption`, when any incorrect option is selected, the button corresponding to `correctOption` SHALL have success-colored styling in the rendered output.

**Validates: Requirements 7.4**

### Property 10: PracticeNodeView all options are full-width buttons

*For any* PracticeNode with any number of options, each rendered option button SHALL have the `w-full` class applied.

**Validates: Requirements 7.1**

### Property 11: ChallengeNodeView renders starterCode block iff starterCode present

*For any* ChallengeNode, a code-shell block SHALL appear in the rendered output if and only if the node's `starterCode` field is defined.

**Validates: Requirements 8.2**

### Property 12: ChallengeNodeView renders expectedResult callout iff field is present

*For any* ChallengeNode, the expected-result callout SHALL appear if and only if `expectedResult` is a non-empty string.

**Validates: Requirements 8.3**

### Property 13: QuizEngine correct/incorrect feedback for all questions

*For any* quiz question in any QuizEngine instance, when the correct answer is selected the option button SHALL receive success styling, and when any incorrect answer is selected that button SHALL receive error styling.

**Validates: Requirements 9.3**

### Property 14: QuizEngine explanation shown for any answered question

*For any* quiz question, after any answer is selected (correct or incorrect), the question's `explanation` text SHALL appear in the rendered output.

**Validates: Requirements 9.4, 9.5**

### Property 15: QuizEngine submits answers exactly once after last question

*For any* quiz with N questions, the `onSubmitAttempt` callback SHALL be called exactly once, immediately after the Nth question is answered (before the summary screen is shown).

**Validates: Requirements 9.10**

### Property 16: TopProgressBar step label in aria-live region

*For any* TopProgressBar render with any currentStep and totalSteps, the element containing the "Step N of M" text SHALL be a descendant of an element with `aria-live="polite"`.

**Validates: Requirements 11.4**

---

## Error Handling

| Scenario | Handling |
|---|---|
| Clipboard API unavailable (`navigator.clipboard` undefined) | Caught in try/catch; `copyState` set to `'error'`; "Error" label shown for 2000ms |
| Clipboard write rejected (permission denied) | Same as above |
| XP pop triggered with `xp = 0` | Component renders nothing; `onXpPopDone` not called |
| QuizEngine reaches summary with no stored `latestAttempt` (race) | Score displays 0; onAdvance still callable |
| Node with unknown type in learning mode | `FallbackNodeView` renders; `onCanAdvanceChange(true)` assumed |

---

## Testing Strategy

This feature is primarily UI rendering and interaction logic. The test suite uses **Vitest + @testing-library/react**.

**Unit Testing:**
- Test each new/modified component in isolation with mocked props
- Use `vi.useFakeTimers()` for clipboard feedback timeout (2000ms) and XP pop visibility
- Mock `navigator.clipboard` for copy button tests
- Mock `window.matchMedia` to simulate `prefers-reduced-motion: reduce`

**Property-Based Testing (fast-check):**
The feature includes a number of universal properties over component inputs. The project already has `fast-check` installed. Properties target pure rendering logic (no I/O side effects).

PBT IS appropriate for this feature because:
- Several components have rendering logic that must hold for *all valid inputs* (any node title, any step count, any XP value)
- Input variation (different XP values, different option counts, different step counts) genuinely exercises different code paths
- Tests are pure/in-memory rendering — 100 iterations is inexpensive

**PBT library:** `fast-check` (already installed, `^3.23.2`)
**Tag format:** `// Feature: mimo-lesson-ui, Property {N}: {property_text}`
**Minimum iterations:** 100 (fast-check default)

**Testing of Property-Based Properties:**
- Property 1, 2: `fc.integer({ min: 1, max: 50 })` generators for step counts
- Property 3, 4: `fc.integer({ min: -100, max: 0 })` and `fc.integer({ min: 1, max: 500 })` for XP
- Properties 5–8: `fc.record({ title: fc.string(), analogy: fc.option(fc.string()) })` etc.
- Property 9, 10, 11, 12: `fc.record(...)` generating practice/challenge nodes with random option sets
- Properties 13–15: Generate random quiz question sets and simulate answer selections
- Property 16: Check DOM structure for aria-live attribute

**Integration Testing:**
- `LessonEngine` integration: render with a minimal mock lesson, verify sidebar absent in learning mode, present in review mode (1–2 examples)
- StickyCtaBar label switching: example test for last-node vs. non-last-node

**No property-based tests for:**
- CSS animation timing (not testable in jsdom)
- Sticky positioning (not testable in jsdom)
- `vercel.json` contents (static config, not code logic)
