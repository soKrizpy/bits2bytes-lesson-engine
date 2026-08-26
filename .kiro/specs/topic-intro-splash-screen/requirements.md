# Requirements: Topic Intro Splash Screen

## Overview

Add a full-screen intro splash screen to the BITS2BYTES lesson engine that appears before the learning path begins for brand-new topics. The screen surfaces the lesson's existing `introduction` field data (currently unused) alongside metadata and objectives, giving students a clear preview before they commit to starting.

---

## Functional Requirements

### 1. Intro Screen Display

**1.1** The engine MUST show the intro splash screen when a student navigates to a lesson topic URL and no persisted state exists in localStorage for that topic.

**1.2** The intro screen MUST be skipped (engine goes straight to the learning path) when any persisted state is found in localStorage for the topic — regardless of how far along that state is.

**1.3** The intro screen MUST be skipped when `studentState.topicCompleted` is `true`.

**1.4** The intro screen MUST display the following content from the lesson JSON:
- Topic title (`metadata.title`)
- Topic description (`metadata.description`)
- Analogy (`introduction.analogy`), if present
- All learning objectives (`objectives` array)
- Estimated time (`metadata.estimatedTime`)
- Total XP available (`metadata.xp`)
- Difficulty level (`metadata.level`)
- Category (`metadata.category`)

**1.5** The intro screen MUST be a single scrollable page — all content is visible on one continuous screen, no pagination required.

---

### 2. Navigation Actions

**2.1** A primary "Start Learning →" button MUST be present. Clicking it dismisses the intro screen and begins the lesson at node index 0.

**2.2** A secondary "Maybe Later" button MUST be present. Clicking it navigates the user back to the home page (`/`).

**2.3** After "Start Learning →" is clicked, the engine MUST NOT show the intro screen again for the duration of the session (managed via `hasSeenIntro` state in `LessonEngine`).

---

### 3. Animation

**3.1** The intro screen MUST enter with a fade-in + slide-up animation: opacity 0 → 1 and translateY ~20px → 0, triggered after a 50ms mount delay.

**3.2** The animation MUST respect `prefers-reduced-motion`. When reduced motion is set, the transition duration MUST be 0ms (or ≤ 100ms) and the slide transform MUST be omitted.

---

### 4. Component Architecture

**4.1** The intro screen MUST be implemented as a standalone component at `src/components/TopicIntro/TopicIntro.tsx`.

**4.2** `LessonEngine.tsx` MUST manage a `hasSeenIntro: boolean` local state variable to gate the intro screen.

**4.3** The intro screen display logic in `LessonEngine.tsx` MUST check for persisted state by calling `adapter.loadState(topicId)` synchronously before rendering — the intro is shown only when `loadState` returns `null`.

**4.4** `TopicIntro` MUST accept the following props:
- `lesson: Lesson` — the loaded lesson data
- `onStart: () => void` — callback when student clicks "Start Learning"
- `onBack: () => void` — callback when student clicks "Maybe Later"

---

### 5. Visual Design

**5.1** The intro screen MUST use the same full-screen layout pattern as `AchievementScreen`: `min-h-screen bg-background flex items-center justify-center`.

**5.2** All design tokens in use MUST be drawn from the existing Tailwind config: `bg-background`, `bg-card`, `text-text-base`, `text-text-muted`, `text-primary`, `text-success`, `border-white/10`, `bg-primary/10`, `border-primary/20`, `xpGold`.

**5.3** Metadata stats (estimated time, XP, level) MUST be displayed in a horizontal grid of stat cards, visually consistent with the stats grid in `AchievementScreen`.

**5.4** The analogy block, when present, MUST be visually distinguished from the main description — rendered in a callout card with a left accent or distinct background.

**5.5** The objectives list MUST use a checkmark-style list (`✓` prefix) matching the "What you learned" list in `AchievementScreen`.

**5.6** The component MUST be responsive: single-column layout on mobile, optionally wider on desktop, with appropriate padding at all breakpoints.

---

### 6. Accessibility

**6.1** The intro screen MUST have a `role="main"` and a descriptive `aria-label` (e.g. `"Topic introduction"`).

**6.2** The "Start Learning" button MUST have an `aria-label` that includes the topic title (e.g. `"Start learning: Build Your First Web Page"`).

**6.3** Decorative emoji/icon elements MUST have `aria-hidden="true"`.

**6.4** The objectives list MUST be a semantic `<ul>` with `<li>` elements.

**6.5** Heading hierarchy MUST be correct: one `<h1>` for the topic title, `<h2>` for section headings (Objectives, Analogy).
