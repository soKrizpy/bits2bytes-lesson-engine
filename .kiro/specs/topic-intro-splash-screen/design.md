# Design: Topic Intro Splash Screen

## Dominant Language

TypeScript (Next.js 14 — `.tsx`/`.ts` files dominate the codebase)

---

## Architecture Overview

The feature adds one new component (`TopicIntro`) and two small changes to the existing `LessonEngine` orchestrator. No new hooks, adapters, or data types are required — all data is already available through existing `Lesson` and `StudentState` types.

```
LessonEngine
  ├── checks adapter.loadState(topicId) synchronously on first render
  ├── hasSeenIntro: boolean  (new local state)
  │
  ├─ if (!hasSeenIntro && loadState === null && !topicCompleted)
  │     └── <TopicIntro lesson onStart onBack />
  │
  ├─ if topicCompleted → <AchievementScreen> / <TopicReview>
  └─ otherwise → existing lesson layout (LearningPath + NodeRenderer)
```

---

## Component: `TopicIntro`

**File:** `src/components/TopicIntro/TopicIntro.tsx`

### Props

```ts
interface TopicIntroProps {
  lesson: Lesson;
  onStart: () => void;
  onBack: () => void;
}
```

### State

```ts
const [visible, setVisible] = useState(false);
// Set to true after 50ms mount delay — triggers fade + slide animation
```

### Animation Strategy

Mirrors `AchievementScreen` exactly, adding a `translateY` transform:

```tsx
// Container classes
className={[
  'min-h-screen bg-background ...',
  'transition-[opacity,transform] motion-reduce:transition-[opacity_100ms]',
  visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5',
].join(' ')}
style={{ transitionDuration: visible ? '500ms' : '0ms' }}
```

Under `prefers-reduced-motion`, the global CSS override in `globals.css` already sets all transition durations to `0.01ms` and transforms off — the component does not need its own media query logic beyond the `motion-reduce:` Tailwind variant.

### Visual Layout (top to bottom)

```
┌──────────────────────────────────────────────┐
│  BITS2BYTES              (mini wordmark)      │
├──────────────────────────────────────────────┤
│                                              │
│  [Category pill]   [Level badge]             │
│                                              │
│  <h1> Topic Title                            │
│  <p>  Topic description                      │
│                                              │
│  ┌─────────┬──────────┬──────────────────┐   │
│  │ ⏱ 30 min│ ⭐ 100 XP│  📊 Beginner     │   │
│  └─────────┴──────────┴──────────────────┘   │
│                                              │
│  ── Analogy (if present) ──────────────────  │
│  │ 💡 "Think of HTML as..."               │  │
│  ─────────────────────────────────────────   │
│                                              │
│  <h2> What You'll Learn                      │
│  ✓ Objective 1                               │
│  ✓ Objective 2                               │
│  ✓ Objective 3                               │
│  ✓ Objective 4                               │
│  ✓ Objective 5                               │
│                                              │
│  [ Start Learning →  ]  (primary, full-w)    │
│  [ Maybe Later       ]  (ghost, full-w)      │
│                                              │
└──────────────────────────────────────────────┘
```

### Key Sections in Code

**Header wordmark** — small `BITS2BYTES` text at top left (same as `LessonEngine` header), gives visual continuity without a full sticky nav.

**Category + level pills** — two small `<span>` chips using `bg-primary/10 text-primary` and `bg-card text-text-muted` respectively. Level is capitalised.

**Stat cards grid** — `grid grid-cols-3 gap-3`, each card `bg-card border border-white/10 rounded-2xl p-4`:
  - Estimated time: `⏱ {estimatedTime} min`
  - XP: `⭐ {xp} XP` using `text-xpGold`
  - Level: `📊 {level}` capitalised

**Analogy callout** — only rendered when `introduction?.analogy` is defined. Uses `bg-primary/10 border-l-4 border-primary rounded-xl p-4 sm:p-5`. Prefixed with `💡` emoji (`aria-hidden`). Wrapped in `<section aria-labelledby="analogy-heading">` with an `<h2 id="analogy-heading">`.

**Objectives list** — `<section aria-labelledby="objectives-heading">` with `<h2>` and `<ul>`. Each `<li>` contains `<span aria-hidden="true">✓</span>` and the objective text. Success-green checkmark (`text-success`).

**CTA area** — full-width stacked buttons with `space-y-3`:
  1. `<Button size="lg" className="w-full" onClick={onStart}>`
  2. `<Button variant="ghost" size="lg" className="w-full" onClick={onBack}>`

---

## `LessonEngine.tsx` Changes

### New state variable

```tsx
// Tracks whether the intro has been dismissed this session
const [hasSeenIntro, setHasSeenIntro] = useState(false);
```

### New derived constant

Computed once after `lesson` and the adapter are available. Uses `adapter.loadState` synchronously — this call is safe because `LocalStorageAdapter.loadState` is synchronous and the adapter instance is stable.

```tsx
// Show intro only when no persisted state exists for this topic
const hasSavedProgress = useMemo(
  () => adapter.loadState(topicId) !== null,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [topicId] // adapter is stable (module-level const); topicId change reruns
);
```

### Intro gate — placed after the `lesson === null` loading guard and before the `topicCompleted` check

```tsx
if (
  lesson !== null &&
  !hasSeenIntro &&
  !hasSavedProgress &&
  !studentState.topicCompleted
) {
  return (
    <TopicIntro
      lesson={lesson}
      onStart={() => setHasSeenIntro(true)}
      onBack={() => router.push('/')}
    />
  );
}
```

### Ordering in `LessonEngine`

```
1. loadError guard        → ErrorScreen
2. lesson === null guard  → loading spinner
3. INTRO GATE (new)       → TopicIntro
4. topicCompleted guard   → AchievementScreen / TopicReview
5. Main lesson layout     → existing code
```

---

## File Locations

| File | Status |
|---|---|
| `src/components/TopicIntro/TopicIntro.tsx` | **New** |
| `src/components/LessonEngine.tsx` | **Modified** — add `hasSeenIntro` state, `hasSavedProgress` memo, intro gate |

---

## Correctness Properties

- **No double-show:** Once `hasSeenIntro` is `true`, the intro gate condition is permanently false for the session.
- **Returning students bypass intro:** `hasSavedProgress` checks `adapter.loadState` synchronously using the same adapter instance used by `useEngineState` — if state exists, it returns non-null and the gate is skipped.
- **Completed topics bypass intro:** `studentState.topicCompleted` check runs before the intro renders.
- **No state mutation:** `TopicIntro` is a pure display component; it has no side effects beyond calling `onStart` or `onBack`.
- **Type safety:** `TopicIntro` accepts `lesson: Lesson` — the `introduction` field is `optional` in the type; the component guards `introduction?.analogy` before rendering the analogy block.
