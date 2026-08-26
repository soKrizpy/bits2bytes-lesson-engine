# Implementation Plan: Topic Intro Splash Screen

## Overview

Implement the full-screen topic intro splash screen for the BITS2BYTES lesson engine. Two files change: a new `TopicIntro` component and targeted additions to `LessonEngine.tsx`.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3"] },
    { "id": 3, "tasks": ["1.4"] },
    { "id": 4, "tasks": ["1.5", "1.6", "1.7"] },
    { "id": 5, "tasks": ["1.8", "1.9", "1.10"] },
    { "id": 6, "tasks": ["1.11", "1.12"] },
    { "id": 7, "tasks": ["2.1"] },
    { "id": 8, "tasks": ["2.2", "2.3"] },
    { "id": 9, "tasks": ["2.4"] },
    { "id": 10, "tasks": ["2.5"] },
    { "id": 11, "tasks": ["3.1"] },
    { "id": 12, "tasks": ["3.2", "3.3", "3.4", "3.5"] },
    { "id": 13, "tasks": ["3.6"] },
    { "id": 14, "tasks": ["3.7"] }
  ]
}
```

## Tasks

### 1. Create `TopicIntro` component

**File:** `src/components/TopicIntro/TopicIntro.tsx`

- [x] 1.1 Scaffold the component file with `'use client'` directive, correct imports (`useState`, `useEffect`, `Button`, `Lesson` type), and the `TopicIntroProps` interface (`lesson: Lesson`, `onStart: () => void`, `onBack: () => void`)
- [x] 1.2 Implement fade + slide-up entrance animation: `useState(false)` for `visible`, `useEffect` with 50ms `setTimeout` to flip it true, `transitionDuration` inline style matching `AchievementScreen`
- [x] 1.3 Add the `role="main"` container with `aria-label="Topic introduction"` and transition classes (`opacity`, `translate-y-5 → translate-y-0`, `motion-reduce:transition-[opacity_100ms]`)
- [x] 1.4 Render the mini `BITS2BYTES` wordmark at the top (visual continuity, no navigation functionality needed)
- [x] 1.5 Render category pill (`bg-primary/10 text-primary`) and level badge (`bg-card text-text-muted`) side by side
- [x] 1.6 Render `<h1>` with `lesson.metadata.title` and `<p>` with `lesson.metadata.description`
- [x] 1.7 Render a `grid grid-cols-3` stat cards row: estimated time (⏱), XP in `text-xpGold` (⭐), level (📊) — card style matching `AchievementScreen` stat cards
- [x] 1.8 Conditionally render the analogy callout (`bg-primary/10 border-l-4 border-primary`) only when `lesson.introduction?.analogy` is defined; wrap in `<section aria-labelledby="analogy-heading">` with `<h2 id="analogy-heading">` titled "How to Think About It"
- [x] 1.9 Render objectives `<section aria-labelledby="objectives-heading">` with `<h2>` "What You'll Learn", `<ul>`, and `<li>` items with `text-success ✓` prefix (`aria-hidden`)
- [x] 1.10 Render the CTA area: primary `<Button size="lg" className="w-full">Start Learning →</Button>` with `aria-label` including topic title, and ghost `<Button variant="ghost" size="lg" className="w-full">Maybe Later</Button>`
- [x] 1.11 Ensure all decorative emoji elements have `aria-hidden="true"`
- [x] 1.12 Verify the component renders correctly when `lesson.introduction` is `undefined` (no analogy block, no crash)

### 2. Update `LessonEngine.tsx`

**File:** `src/components/LessonEngine.tsx`

- [x] 2.1 Add import for `TopicIntro` from `@/components/TopicIntro/TopicIntro`
- [x] 2.2 Add `hasSeenIntro` state: `const [hasSeenIntro, setHasSeenIntro] = useState(false)`
- [x] 2.3 Add `hasSavedProgress` memo: `useMemo(() => adapter.loadState(topicId) !== null, [topicId])` — add `useMemo` to the existing React import
- [x] 2.4 Insert the intro gate block after the `lesson === null` loading guard and before the `topicCompleted` check
- [x] 2.5 Confirm the render order is: `loadError` → loading spinner → intro gate → `topicCompleted` → main lesson layout

### 3. Verification

- [x] 3.1 Navigate to `/lesson/beginner-html-01` with no localStorage entry for the topic — confirm the intro screen appears with title, description, stats, analogy, and objectives
- [x] 3.2 Click "Start Learning →" — confirm the intro dismisses and node 0 (`node-01-welcome`) renders immediately
- [x] 3.3 Refresh the page after starting the lesson (localStorage now has saved state) — confirm the intro is skipped and the engine resumes at the current node
- [x] 3.4 Navigate to a completed topic — confirm the intro is skipped and the AchievementScreen appears
- [x] 3.5 Click "Maybe Later" from the intro — confirm navigation to `/`
- [x] 3.6 Run `npx tsc --noEmit` — confirm zero TypeScript errors
- [x] 3.7 Check the intro screen at 375px viewport width — confirm no horizontal overflow, readable text, and usable button targets

## Notes

- `TopicIntro` is topic-agnostic — it reads all display data from the `Lesson` type, no hardcoded content.
- The intro gate uses two independent signals: `hasSeenIntro` (session state) and `hasSavedProgress` (localStorage check). Either one being true skips the intro, making the gate robust on refresh.
- `introduction?.analogy` is optional in the `Lesson` type — the analogy callout only renders when the field is present.
- All decorative emojis carry `aria-hidden="true"` so screen readers skip them and only announce the adjacent text values.
