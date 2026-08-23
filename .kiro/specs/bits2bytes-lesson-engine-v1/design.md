# Design Document — BITS2BYTES Lesson Engine V1

## Overview

The BITS2BYTES Lesson Engine V1 is a gamified, topic-agnostic coding education engine built as a Next.js web application. It reads structured lesson content from JSON files, renders a visual learning path with five node types, manages student progress via a persistence abstraction, awards XP, enforces quiz attempt limits, and celebrates topic completion with an achievement screen.

The V1 release ships the engine plus one piece of content: **beginner-html-01 — Build Your First Web Page**. Adding future topics requires only dropping a new JSON file into the `lessons/` directory — no engine code changes.

### Tech Stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | App Router enables server-side rendering, file-based routing, and future API routes for a Supabase backend swap — none of which are available in Vite/CRA. |
| Language | **TypeScript** | Strict typing across schema, state, and component props catches contract violations at compile time, which is critical for a data-driven engine. |
| Styling | **Tailwind CSS v3** | Utility-first approach keeps visual tokens co-located with markup; no separate CSS files to maintain. Tailwind's JIT compiler keeps bundle size minimal. |
| Testing | **Vitest + fast-check** | Vitest integrates natively with the Next.js/Vite pipeline; fast-check provides property-based testing for state invariants. |
| Schema validation | **AJV (Another JSON Validator)** | Industry-standard JSON Schema Draft-7 validator; supports `allErrors: true` to collect every error rather than failing on the first one. |
| Font | **Inter (Google Fonts / next/font)** | Clean, readable, widely supported; optimised via `next/font` for zero layout shift. |

---

## Architecture

The engine is organised as four clean, non-circular layers. Each layer communicates only with the layer immediately adjacent to it.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Layer 4 — UI Components  (React, Tailwind)                         │
│  LessonEngine · LearningPath · NodeRenderer · QuizEngine            │
│  AchievementScreen · nodes/* · ui/*                                 │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ reads/writes via hook
┌──────────────────────────────▼──────────────────────────────────────┐
│  Layer 3 — State Management  (useEngineState hook)                  │
│  Single source of truth · delegates XP + progress to engine core    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ calls
┌──────────────────────────────▼──────────────────────────────────────┐
│  Layer 2 — Engine Core  (pure TypeScript, no React)                 │
│  LessonLoader · SchemaValidator · ProgressTracker · XPCalculator    │
└──────┬──────────────────────────────────────────┬───────────────────┘
       │ reads JSON                               │ load/save
┌──────▼───────────────┐              ┌───────────▼───────────────────┐
│  Layer 1             │              │  Persistence Abstraction       │
│  Lesson Content      │              │  IPersistenceAdapter           │
│  lessons/**/*.json   │              │  └─ LocalStorageAdapter (V1)   │
└──────────────────────┘              └───────────────────────────────┘
```

### Cross-cutting rule

- No layer imports from a non-adjacent layer.
- UI components never touch `localStorage`, `sessionStorage`, or any browser storage API directly — all state I/O flows through `IPersistenceAdapter`.

---

## Project Structure

```
bits2bytes-lesson-engine/
├── public/
│   └── fonts/                        # Self-hosted fallbacks if needed
├── lessons/
│   └── beginner/
│       └── html/
│           └── topic-01.json         # beginner-html-01 content
├── schemas/
│   └── lesson.schema.json            # AJV-compatible JSON Schema Draft-7
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (font, global styles)
│   │   ├── page.tsx                  # Home — topic selector
│   │   ├── globals.css
│   │   └── lesson/
│   │       └── [topicId]/
│   │           └── page.tsx          # Lesson entry point
│   ├── engine/                       # Layer 2 — pure TS, no React
│   │   ├── loader.ts                 # LessonLoader
│   │   ├── validator.ts              # SchemaValidator
│   │   ├── progress.ts               # ProgressTracker
│   │   └── xp.ts                     # XPCalculator
│   ├── persistence/                  # Persistence abstraction
│   │   ├── types.ts                  # IPersistenceAdapter interface
│   │   └── localStorageAdapter.ts    # V1 implementation
│   ├── components/                   # Layer 4 — UI
│   │   ├── LessonEngine.tsx          # Orchestrator component
│   │   ├── LearningPath/
│   │   │   ├── LearningPath.tsx
│   │   │   └── PathNode.tsx
│   │   ├── NodeRenderer/
│   │   │   └── NodeRenderer.tsx      # Registry-based dispatcher
│   │   ├── nodes/
│   │   │   ├── LessonNodeView.tsx
│   │   │   ├── CodeNodeView.tsx
│   │   │   ├── PracticeNodeView.tsx
│   │   │   ├── ChallengeNodeView.tsx
│   │   │   └── FallbackNodeView.tsx
│   │   ├── QuizEngine/
│   │   │   ├── QuizEngine.tsx
│   │   │   ├── QuizQuestion.tsx
│   │   │   └── QuizReview.tsx
│   │   ├── AchievementScreen/
│   │   │   └── AchievementScreen.tsx
│   │   └── ui/                       # Primitive shared components
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── ProgressBar.tsx
│   │       ├── XPBadge.tsx
│   │       └── ErrorScreen.tsx
│   ├── hooks/
│   │   └── useEngineState.ts         # Layer 3 — state hook
│   └── types/
│       ├── lesson.ts                 # TypeScript types for Lesson JSON
│       └── state.ts                  # StudentState, QuizAttempt types
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## Components and Interfaces

### Component Hierarchy

```
app/lesson/[topicId]/page.tsx
└── LessonEngine (topicId: string)
    ├── LearningPath
    │   └── PathNode[] (one per node in learningPath)
    ├── NodeRenderer (current node)
    │   ├── LessonNodeView
    │   ├── CodeNodeView
    │   ├── PracticeNodeView
    │   ├── ChallengeNodeView
    │   ├── QuizEngine
    │   │   ├── QuizQuestion[]
    │   │   └── QuizReview
    │   └── FallbackNodeView
    ├── AchievementScreen (rendered when topicCompleted)
    ├── XPBadge (fixed position, always visible)
    └── ErrorScreen (rendered on load/validation failure)
```

### LessonEngine component

The single entry point component. Accepts `topicId: string`. On mount it:
1. Calls `LessonLoader.load(topicId)` to fetch and parse the JSON.
2. Calls `SchemaValidator.validate(lesson)` — aborts to `ErrorScreen` on failure.
3. Calls `IPersistenceAdapter.loadState(topicId)` via `useEngineState` — initialises fresh state if null.
4. Renders the split-panel layout: left sidebar (`LearningPath`) + right content area (`NodeRenderer`).

### NodeRenderer — Registry Pattern

```typescript
const NODE_RENDERERS: Record<string, React.ComponentType<NodeRendererProps>> = {
  lesson:    LessonNodeView,
  code:      CodeNodeView,
  practice:  PracticeNodeView,
  challenge: ChallengeNodeView,
  quiz:      QuizEngine,
};

function NodeRenderer({ node, ...props }: NodeRendererProps) {
  const Component = NODE_RENDERERS[node.type] ?? FallbackNodeView;
  return <Component node={node} {...props} />;
}
```

Adding a new node type in a future schema version requires only adding one entry to `NODE_RENDERERS` — no other engine files change.

### useEngineState hook

Central state manager for all runtime engine state:

```typescript
interface EngineStateActions {
  advanceNode: () => void;
  submitQuizAttempt: (answers: Record<string, string>) => void;
  resetTopic: () => void;
}

interface EngineState {
  lesson: Lesson | null;
  studentState: StudentState;
  loadError: string | null;
  isSaving: boolean;
  saveError: string | null;
}
```

The hook:
- Initialises by calling `LessonLoader` + `SchemaValidator` + `IPersistenceAdapter.loadState`.
- On `advanceNode()`: marks current node complete, calls `XPCalculator`, increments `currentNodeIndex`, persists.
- On `submitQuizAttempt()`: scores attempt, updates `bestQuizScore` = MAX(prev, current), persists. Increments attempt counter. Marks quiz node complete after any attempt.
- On topic completion: calls `XPCalculator.awardCompletionXP()`, sets `topicCompleted = true`, persists.
- Surfaces `saveError` for UI to display non-blocking persistence failure messages.

### IPersistenceAdapter interface

```typescript
interface IPersistenceAdapter {
  loadState(topicId: string): StudentState | null;
  saveState(topicId: string, state: StudentState): void;
  clearState(topicId: string): void;
}
```

`LocalStorageAdapter` V1 stores state under key `b2b_lesson_state_${topicId}` as JSON. A future `SupabaseAdapter` implementing the same interface requires zero changes to UI components or state logic.

---

## Data Models

### Lesson JSON Types (`src/types/lesson.ts`)

```typescript
export type SchemaVersion = string; // "MAJOR.MINOR" e.g. "1.0"

export interface LessonMetadata {
  id: string;            // 1–100 chars
  title: string;         // 1–100 chars
  description: string;   // 1–500 chars
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;      // 1–100 chars
  topicNumber: number;   // integer >= 1
  estimatedTime: number; // positive integer, minutes
  xp: number;            // 0–10000
}

export interface LessonIntroduction {
  title: string;
  description: string;
  analogy?: string;
  prerequisites?: string[];
}

export type NodeType = 'lesson' | 'code' | 'practice' | 'challenge' | 'quiz';

export interface BaseNode {
  id: string;   // unique within learningPath
  type: NodeType;
  title: string;
  xp?: number;  // optional node-level XP
}

export interface LessonNode extends BaseNode {
  type: 'lesson';
  explanation: string;
  analogy?: string;
  expectedResult?: string;
  tips?: string[];
}

export interface CodeNode extends BaseNode {
  type: 'code';
  explanation?: string;
  code: {
    language: string; // not restricted to a predefined list
    content: string;  // 1–50000 chars
  };
}

export interface PracticeNode extends BaseNode {
  type: 'practice';
  instructions: string;
  interactionType: 'multiple-choice' | 'step-completion';
  options?: string[];
  correctOption?: string;
  steps?: string[];
}

export interface ChallengeNode extends BaseNode {
  type: 'challenge';
  instructions: string;
  starterCode?: {
    language: string;
    content: string;
  };
  expectedResult?: string;
}

export interface QuizNode extends BaseNode {
  type: 'quiz';
  // Questions are sourced from the top-level quiz section.
}

export type LearningNode =
  | LessonNode
  | CodeNode
  | PracticeNode
  | ChallengeNode
  | QuizNode;

export interface QuizQuestion {
  id: string;
  question: string;         // 1–500 chars
  options: [string, string, string, string]; // exactly 4, each 1–200 chars
  correctAnswer: string;    // must match one of the 4 options exactly
  explanation: string;      // 1–500 chars
  points: number;           // integer 0–100
}

export interface LessonCompletion {
  title: string;
  message: string;
  achievementName: string;
  achievementIcon?: string;
}

export interface Lesson {
  schemaVersion: SchemaVersion;
  metadata: LessonMetadata;
  introduction?: LessonIntroduction;
  objectives: string[];
  learningPath: LearningNode[];
  quiz: {
    questions: QuizQuestion[]; // exactly 5
  };
  completion: LessonCompletion;
}
```

### Student State Types (`src/types/state.ts`)

```typescript
export interface QuizAttempt {
  attemptNumber: 1 | 2;
  score: number;
  answers: Record<string, string>; // questionId -> selectedOption
  submittedAt: string;             // ISO 8601 timestamp
}

export interface StudentState {
  studentId: string;             // 1–128 chars
  topicId: string;               // 1–128 chars
  currentNodeIndex: number;      // integer >= 0
  completedNodes: string[];      // node ID strings, max 500 entries
  quizAttempts: QuizAttempt[];   // max 2 entries
  bestQuizScore: number;         // integer 0–100; MAX of all attempt scores
  xpEarned: number;              // integer >= 0
  topicCompleted: boolean;
  achievement: string | null;    // 1–100 chars or null
  xpAwardedForCompletion: boolean; // idempotency guard for topic-level XP
}

export const INITIAL_STUDENT_STATE: Omit<StudentState, 'studentId' | 'topicId'> = {
  currentNodeIndex: 0,
  completedNodes: [],
  quizAttempts: [],
  bestQuizScore: 0,
  xpEarned: 0,
  topicCompleted: false,
  achievement: null,
  xpAwardedForCompletion: false,
};
```

### JSON Schema (`schemas/lesson.schema.json`)

The schema is a JSON Schema Draft-7 document consumed by AJV. Key constraints enforced:

- `schemaVersion`: string matching pattern `^\d+\.\d+$`
- `metadata.level`: enum of `beginner | intermediate | advanced`
- `learningPath`: array of nodes, each with a `type` from the five V1 values; `id` must be unique (enforced via `uniqueItems` on a tuple projection)
- `quiz.questions`: array with `minItems: 5, maxItems: 5`
- Each `QuizQuestion.options`: array with `minItems: 4, maxItems: 4`
- AJV is configured with `allErrors: true` so every constraint violation is reported in a single pass

### Routing Design

| Route | File | Purpose |
|---|---|---|
| `/` | `src/app/page.tsx` | Home page — lists available topics (V1: just `beginner-html-01`) with a "Start Learning" button per topic. |
| `/lesson/[topicId]` | `src/app/lesson/[topicId]/page.tsx` | Extracts `topicId` from URL params; renders `<LessonEngine topicId={topicId} />`. All lesson logic lives inside `LessonEngine`. |

The dynamic segment `[topicId]` means adding a new topic is as simple as placing a JSON file in `lessons/` and navigating to `/lesson/{topic-id}` — no routing changes.

### Design Tokens (Tailwind Config)

```typescript
// tailwind.config.ts — extend.colors
{
  primary:     { DEFAULT: '#6366f1', hover: '#4f46e5' }, // Indigo/Violet
  success:     '#10b981',   // Emerald
  warning:     '#f59e0b',   // Amber
  error:       '#f43f5e',   // Rose
  xpGold:      '#fbbf24',   // Gold
  background:  '#0f172a',   // Slate-950 — dark, space-like
  card:        '#1e293b',   // Slate-800
  'text-base': '#f8fafc',   // Slate-50
  'text-muted':'#94a3b8',   // Slate-400
}

// Animation durations
{
  micro:       '200ms',   // Button hover, icon state changes
  transition:  '300ms',   // Node content swap, practice feedback
  celebration: '500ms',   // Achievement screen entrance
}
```

Typography: `Inter` loaded via `next/font/google`. Border radius: `rounded-xl` (16px) for cards; `rounded-full` for icon circles.

### Quiz State Machine

```
                    ┌───────────────────┐
                    │       idle        │◄──── initial state (no attempt yet)
                    │  (0 attempts)     │      or between attempts (1 done, 1 remaining)
                    └────────┬──────────┘
                             │ student starts quiz
                             ▼
                    ┌───────────────────┐
                    │      active       │  student selects answers
                    │ (answering)       │
                    └────────┬──────────┘
                             │ student submits
                             ▼
                    ┌───────────────────┐
                    │    submitted      │  score calculated
                    │ (scoring)         │  bestQuizScore = MAX(prev, current)
                    └────────┬──────────┘  persisted
                             │
                             ▼
                    ┌───────────────────┐
                    │    reviewing      │  incorrect answers + explanations shown
                    │ (post-review)     │  quiz node marked complete
                    └────────┬──────────┘
                    ┌────────┴─────────────────────────────┐
                    │                                      │
       attempt < 2? │                       attempt >= 2?  │
                    ▼                                      ▼
             back to idle                         ┌──────────────┐
          (retry available)                       │   complete   │
                                                  │ (no retries) │
                                                  └──────────────┘
```

**State transition rules:**
- Entry to `active` is blocked if `quizAttempts.length >= 2`.
- `submitted → reviewing` is instant (no async gap exposed to user).
- `reviewing → idle` transition only happens if `quizAttempts.length < 2`.
- `reviewing → complete` if `quizAttempts.length >= 2` or student explicitly clicks "Continue".
- The quiz node is marked complete upon entering `reviewing` state, regardless of score (Requirement 6.9).

### XP Idempotency Logic (`src/engine/xp.ts`)

```typescript
function awardNodeXP(
  state: StudentState,
  nodeId: string,
  xpAmount: number
): StudentState {
  // Guard: do not re-award XP if this node was already completed
  if (state.completedNodes.includes(nodeId)) {
    return state;
  }
  return { ...state, xpEarned: state.xpEarned + xpAmount };
}

function awardCompletionXP(
  state: StudentState,
  topicXP: number
): StudentState {
  // Guard: topic-level XP awarded exactly once
  if (state.xpAwardedForCompletion) {
    return state;
  }
  return {
    ...state,
    xpEarned: state.xpEarned + topicXP,
    xpAwardedForCompletion: true,
  };
}
```

Both functions are pure — they take state and return new state. This makes them straightforward to property-test.

### Engine Core Modules

**`LessonLoader` (`src/engine/loader.ts`)**
- Resolves `topicId` to path: `lessons/{level}/{category}/{topic-id}.json`
- In Next.js: uses `fetch('/lessons/...')` or `fs.readFile` depending on server vs. client context.
- Returns `{ lesson: Lesson } | { error: string }`.
- Handles file-not-found (404) as a distinct error from parse failure.

**`SchemaValidator` (`src/engine/validator.ts`)**
- Instantiates AJV with `{ allErrors: true, strict: false }`.
- Compiles `lesson.schema.json` once on module load (cached).
- `validate(data: unknown): ValidationResult` where:

```typescript
type ValidationResult =
  | { valid: true; lesson: Lesson }
  | { valid: false; errors: string[] }; // ALL errors, human-readable
```

- Error messages include field path and violated constraint (e.g. `"metadata.xp: must be <= 10000"`).
- Checks `schemaVersion` MAJOR part against `SUPPORTED_SCHEMA_MAJOR_VERSION = 1`; rejects mismatches.

**`ProgressTracker` (`src/engine/progress.ts`)**
- Pure function: `calculateProgress(state: StudentState, totalNodes: number): ProgressInfo`

```typescript
interface ProgressInfo {
  completedCount: number;
  totalCount: number;
  percentage: number; // integer, 0–100
  currentNodeIndex: number;
}
```

- Percentage = `Math.round((completedCount / totalCount) * 100)`, clamped to `[0, 100]`.
- When `totalNodes === 0`: returns `{ completedCount: 0, totalCount: 0, percentage: 0 }`.

### Topic 01 Content Overview (`lessons/beginner/html/topic-01.json`)

The V1 shipped topic. Schema-valid, 10 nodes:

| # | Type | Title | Key Content |
|---|---|---|---|
| 1 | `lesson` | Welcome to HTML | What HTML is; analogy: "skeleton of a webpage"; no prerequisites assumed |
| 2 | `lesson` | HTML Elements & Tags | Opening/closing tag structure; nesting; the concept of an element |
| 3 | `code` | Your First HTML Tags | `<h1>Hello World</h1>`, `<p>` tag with examples |
| 4 | `lesson` | The HTML Document Structure | `<!DOCTYPE html>`, `<html>`, `<head>`, `<body>` explained |
| 5 | `code` | Full HTML Boilerplate | Complete minimal HTML file a student can type out |
| 6 | `lesson` | Headings & Paragraphs | `<h1>–<h6>`, `<p>`; hierarchy and purpose |
| 7 | `code` | Headings in Action | Side-by-side `<h1>`, `<h2>`, `<h3>` rendered output |
| 8 | `practice` | Build It Yourself | `multiple-choice` — identify the correct tag to create a main heading |
| 9 | `challenge` | Build Your First Page | Write a full HTML page from scratch; `starterCode` provided as empty boilerplate |
| 10 | `quiz` | Knowledge Check | Links to top-level quiz section (5 questions) |

**Quiz Questions:**

| # | Question | Correct Answer |
|---|---|---|
| Q1 | Which tag creates the largest heading on a page? | `<h1>` |
| Q2 | What does HTML stand for? | HyperText Markup Language |
| Q3 | Which element contains the visible content of a webpage? | `<body>` |
| Q4 | Which of the following is a valid HTML tag? | `<p>` |
| Q5 | What goes inside the `<head>` element? | Page metadata and title |

All questions are scoped exclusively to concepts introduced in nodes 1–9. No prior HTML knowledge is assumed.


---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Schema Validation Reports All Violations

*For any* Lesson JSON object that violates one or more schema constraints (missing required fields, out-of-range values, invalid enum values, wrong field types, unsupported schemaVersion MAJOR, or unknown node types), `SchemaValidator.validate()` SHALL return `valid: false` with a non-empty `errors` array that contains one entry for every distinct violated constraint, each entry identifying the field path and the violated rule.

**Validates: Requirements 1.3, 1.4, 1.5, 2.2, 2.3, 2.4, 2.6, 2.7, 2.8**

---

### Property 2: Lesson Loader Path Construction

*For any* valid `(topicId, level, category)` triple, `LessonLoader` SHALL construct the load path as `lessons/{level}/{category}/{topicId}.json`, exactly matching that template with no additional segments, no URL encoding of valid identifier characters, and no trailing or leading slashes beyond the pattern.

**Validates: Requirements 1.1**

---

### Property 3: Node State Rendering Invariant

*For any* learning path of N nodes and any valid `StudentState`, each node SHALL be rendered with exactly one of three mutually exclusive visual states — `completed` (if its ID is in `completedNodes`), `current` (if its index equals `currentNodeIndex` and it is not completed), or `upcoming` (if its index is greater than `currentNodeIndex`) — and no two nodes SHALL share the same state assignment for `current`.

**Validates: Requirements 3.2, 3.3, 3.4**

---

### Property 4: Progress Calculation Correctness

*For any* `StudentState` with `completedNodes.length` equal to C and a learning path of T total nodes (T ≥ 1), `ProgressTracker.calculateProgress()` SHALL return `percentage = Math.round((C / T) * 100)` clamped to the integer range [0, 100], `completedCount = C`, and `totalCount = T`. When T = 0, the function SHALL return `percentage = 0`, `completedCount = 0`, and `totalCount = 0`.

**Validates: Requirements 3.5, 3.6, 3.8**

---

### Property 5: Lesson Node Renders All Present Fields

*For any* `LessonNode` object, `LessonNodeView` SHALL include the `title` and `explanation` in its rendered output. If `analogy`, `expectedResult`, or `tips` are present in the node, each SHALL appear in the rendered output. If `explanation` is absent, a placeholder message SHALL appear and the component SHALL not throw. No optional field that is absent SHALL produce an error or crash.

**Validates: Requirements 4.1**

---

### Property 6: Code Node Renders Content and Language Label

*For any* `CodeNode` object, `CodeNodeView` SHALL render the `code.content` inside a code block that preserves whitespace, and SHALL display a label containing the `code.language` value. The language label SHALL exactly match the value from the node (no normalisation, no truncation).

**Validates: Requirements 4.2**

---

### Property 7: Challenge Node Renders All Present Fields

*For any* `ChallengeNode` object, `ChallengeNodeView` SHALL include `title` and `instructions` in its rendered output. If `starterCode` is present it SHALL be rendered in a code block. If `expectedResult` is present it SHALL appear in the output. Absent optional fields SHALL neither crash the component nor produce empty/undefined visible text.

**Validates: Requirements 4.4**

---

### Property 8: Fallback Renderer Shows Unknown Type

*For any* node object whose `type` value is not one of the five registered V1 types, `NodeRenderer` SHALL render `FallbackNodeView` and its output SHALL contain the unrecognised `type` string value and a "not supported" message. The component SHALL not throw.

**Validates: Requirements 4.6**

---

### Property 9: Advancing Nodes Accumulates Completed Set

*For any* sequence of `advanceNode()` calls starting from any valid `StudentState`, each advanced node's ID SHALL be appended to `completedNodes` exactly once. Repeated `advanceNode()` calls SHALL NOT produce duplicate entries in `completedNodes` for the same node.

**Validates: Requirements 5.2**

---

### Property 10: Quiz Score Calculation

*For any* set of quiz answers submitted as a `Record<questionId, selectedOption>` and any corresponding array of `QuizQuestion` objects, the calculated attempt score SHALL equal the sum of `points` for each question where `answers[question.id] === question.correctAnswer`, and SHALL equal 0 for questions where the answer is absent, wrong, or the question has `points = 0`.

**Validates: Requirements 6.2**

---

### Property 11: Best Quiz Score is Always the Maximum

*For any* sequence of up to two `QuizAttempt` submissions with scores S₁ and S₂, `StudentState.bestQuizScore` after all submissions SHALL equal `Math.max(S₁, S₂)`. After the first submission alone it SHALL equal S₁. The value SHALL never decrease between submissions.

**Validates: Requirements 6.3**

---

### Property 12: Quiz Attempt Count is Bounded at 2

*For any* sequence of quiz submission actions — including edge cases such as rapid re-submission, page reload, or state restoration — `StudentState.quizAttempts.length` SHALL always be in the integer range [0, 2]. Any submission action triggered when `quizAttempts.length >= 2` SHALL be blocked and SHALL leave `quizAttempts` unchanged.

**Validates: Requirements 6.5, 6.7**

---

### Property 13: Any Quiz Submission Marks Quiz Node Complete

*For any* quiz submission (regardless of score, even 0 points), after the submission is processed the quiz node's ID SHALL appear in `StudentState.completedNodes`. This SHALL hold for both attempt 1 and attempt 2.

**Validates: Requirements 6.9**

---

### Property 14: XP Idempotency — Node and Completion Awards

*For any* node ID `n` and XP amount `x`: (a) `awardNodeXP(state, n, x)` applied to a state where `n` is already in `completedNodes` SHALL return a state with the same `xpEarned` value — XP is not double-awarded. (b) `awardCompletionXP(state, topicXP)` called any number of times on the same state SHALL result in `xpEarned` increasing by exactly `topicXP` once — never more than once, regardless of how many times the function is called. For any node with no `xp` field, advancing past it SHALL leave `xpEarned` unchanged.

**Validates: Requirements 5.4, 8.3, 8.4, 8.5**

---

### Property 15: Persistence Round-Trip Preserves Student State

*For any* valid `StudentState` object, calling `LocalStorageAdapter.saveState(topicId, state)` followed by `LocalStorageAdapter.loadState(topicId)` SHALL return an object deeply equal to the saved state — every field including nested arrays and objects SHALL be preserved with identical values and types. Consecutive save-load cycles SHALL be idempotent.

**Validates: Requirements 9.4**

---

### Property 16: Achievement Screen Renders All Required Fields

*For any* `StudentState` where `topicCompleted = true` combined with any valid `Lesson`, the `AchievementScreen` component SHALL render all of: the topic title, total XP earned (`xpEarned`), `bestQuizScore` expressed as a percentage in [0, 100], count of completed nodes, and the achievement name from `lesson.completion.achievementName`. No field SHALL be absent, undefined, or display a raw object reference.

**Validates: Requirements 7.2**


---

## Error Handling

### Error Surface Map

| Error Condition | Where Detected | User-Visible Response | Recovery |
|---|---|---|---|
| Lesson file not found at expected path | `LessonLoader` (404 / fs error) | `ErrorScreen`: "Topic '{topicId}' was not found at `lessons/{path}`." | None — stay on error screen |
| Lesson JSON parse failure (malformed JSON) | `LessonLoader` (JSON.parse throws) | `ErrorScreen`: "Topic file could not be read — the file may be corrupted." | None |
| Schema validation failure | `SchemaValidator` | `ErrorScreen`: lists ALL validation errors with field paths | None |
| Unsupported schema MAJOR version | `SchemaValidator` | `ErrorScreen`: "Schema version X.Y is not supported. Engine supports version 1.x." | None |
| Persistence `loadState` failure (quota, parse error) | `LocalStorageAdapter` | Non-blocking banner: "Progress could not be loaded. Starting fresh session." | Continue with blank state |
| Persistence `saveState` failure | `LocalStorageAdapter` (caught) | Non-blocking toast/banner: "Progress could not be saved. Your progress is available for this session only." | Retain in-memory state, continue |
| Persistence `topicCompleted` persist failure | `LocalStorageAdapter` | Same save-failure banner; Achievement screen still renders | Retain in-memory |
| Quiz attempt persist failure | `LocalStorageAdapter` | Save-failure banner; quiz data retained in-memory | Continue |
| Unknown node type at render time | `NodeRenderer` | `FallbackNodeView` with type label and "not supported" message | Continue lesson (other nodes unaffected) |
| `explanation` field absent on `lesson` node | `LessonNodeView` | Placeholder: "No explanation available for this step." | Continue |

### Error Handling Principles

1. **Hard errors (load/validate)** block rendering entirely via `ErrorScreen`. All validation errors are collected and shown together — never just the first one.
2. **Soft errors (persistence)** are surfaced as non-blocking banners and never interrupt the student's learning flow. State is always retained in-memory for the current session.
3. **Render errors (unknown node type, missing optional field)** are isolated — only the affected node degrades gracefully; the rest of the lesson is unaffected.
4. **No error swallowing** — every caught error is either shown to the user or logged to the console in development mode.
5. **No Supabase, external API, or auth calls** in V1. Any network-related error handling in the persistence layer is deferred to the Supabase adapter phase.

### Error State in `useEngineState`

```typescript
interface EngineState {
  lesson: Lesson | null;
  studentState: StudentState;
  loadError: string | null;   // Non-null → render ErrorScreen, skip lesson
  isSaving: boolean;
  saveError: string | null;   // Non-null → show non-blocking banner
}
```

The `LessonEngine` component checks `loadError` first. If non-null, it renders `<ErrorScreen message={loadError} />` and returns early — no lesson UI mounts.

---

## Testing Strategy

### Overview

The engine uses a **dual testing approach**: property-based tests for universal invariants and example-based unit tests for specific behaviors and edge cases. Integration tests verify orchestration between layers. No E2E framework is set up in V1 (deferred).

### Property-Based Testing with fast-check

**Library**: `fast-check` (TypeScript-native PBT library)
**Runner**: Vitest
**Minimum iterations per property**: 100

Each property test references its design property using a tag comment:
```typescript
// Feature: bits2bytes-lesson-engine-v1, Property 11: Best quiz score is always the maximum
```

**Properties to implement as fast-check tests:**

| Property | Target Module | Generator Strategy |
|---|---|---|
| P1: Schema validates all violations | `SchemaValidator` | `fc.subarray` of required field names → remove them; `fc.string` for invalid enum values |
| P2: Loader path construction | `LessonLoader.resolvePath()` | `fc.string` for topicId/level/category; assert template match |
| P3: Node state rendering | `LearningPath` / `PathNode` | `fc.array` of node IDs + random `currentNodeIndex` |
| P4: Progress calculation | `ProgressTracker` | `fc.nat` for completedCount and totalCount (totalCount >= completedCount) |
| P5: LessonNode field rendering | `LessonNodeView` | `fc.record` with optional fields either present or omitted |
| P6: CodeNode rendering | `CodeNodeView` | `fc.record` with `code.language` and `code.content` |
| P7: ChallengeNode rendering | `ChallengeNodeView` | `fc.record` with optional fields randomly present/absent |
| P8: Fallback renderer | `NodeRenderer` | `fc.string` filtered to not match the five V1 types |
| P9: Completed nodes accumulation | `useEngineState` / state logic | `fc.array` of node sequences |
| P10: Quiz score calculation | `XPCalculator` / quiz scorer | `fc.array` of `QuizQuestion` + random answer selection per question |
| P11: Best score MAX invariant | `useEngineState` / quiz submission | `fc.tuple(fc.nat, fc.nat)` for two attempt scores |
| P12: Attempt count bounded at 2 | `useEngineState` / quiz gate | `fc.nat` for submission count > 2 |
| P13: Any submission marks node complete | `useEngineState` | random quiz answers + quiz node ID |
| P14: XP idempotency | `XPCalculator` | `fc.string` (nodeId) + `fc.nat` (xpAmount) + repeated calls |
| P15: Persistence round-trip | `LocalStorageAdapter` | `fc.record` matching `StudentState` shape |
| P16: Achievement screen fields | `AchievementScreen` | random `StudentState` with `topicCompleted=true` + random `Lesson` |

### Unit Tests (Vitest — Example-Based)

**Scope**: Specific scenarios, edge cases, and integration points that PBT does not cover well.

| Test Area | Key Examples |
|---|---|
| `LessonLoader` | File not found (404); malformed JSON; valid file loads correctly |
| `SchemaValidator` | Missing `metadata`; missing `quiz`; exactly 5 quiz questions passes; 4 questions fails; schemaVersion "2.0" rejected; schemaVersion "1.5" accepted |
| `PracticeNodeView` | Multiple-choice renders all options; selecting an option shows success state; step-completion marks all steps |
| `QuizEngine` | Idle state renders attempt count 0/2; submitting transitions to reviewing; reviewing shows incorrect answers with explanations; retry button hidden after 2 attempts |
| `AchievementScreen` | Renders all required fields; "Return to Overview" button present |
| `useEngineState` | `loadState(null)` initialises with `INITIAL_STUDENT_STATE`; `advanceNode()` on last node sets `topicCompleted=true`; `saveError` set on persistence failure |
| Persistence | `saveState` then `loadState` with known state object; `loadState` with unparseable stored data returns null |
| Progress display | "0 / 0" shown for empty path; "3 / 10" format matches |
| XP badge | XP display updates immediately on node completion; "+X XP" animation element present |

### Integration Tests

**Scope**: Verify layer boundaries and orchestration flows.

| Scenario | What is verified |
|---|---|
| Load topic-01.json end-to-end | SchemaValidator reports zero errors; all 10 nodes render |
| Invalid lesson blocks render | `ErrorScreen` mounts; no `LearningPath` or `NodeRenderer` in DOM |
| Node advance persists state | After `advanceNode()`, `LocalStorageAdapter.loadState()` returns state with updated `completedNodes` |
| Quiz submission updates best score | Two submissions with S1 < S2; `bestQuizScore` === S2 |
| Topic completion flow | Advancing through all nodes sets `topicCompleted=true` and renders `AchievementScreen` |
| Persistence failure degrades gracefully | Mock storage to throw on `setItem`; assert banner rendered, lesson continues |

### Smoke Tests

| Check | What is verified |
|---|---|
| `lesson.schema.json` is valid JSON Schema Draft-7 | AJV compiles it without errors |
| `topic-01.json` passes schema validation | Zero validation errors |
| Next.js build compiles without TypeScript errors | `next build` exits 0 |

### Accessibility Testing

WCAG 2.1 AA compliance (Requirement 12.5, 12.6) requires manual validation with assistive technologies in addition to automated checks. Automated checks via `axe-core` (via `@axe-core/react` or Vitest integration) will be used to catch obvious violations:
- Colour contrast (4.5:1 normal text, 3:1 large text and UI boundaries)
- Visible focus indicators on all interactive elements
- `prefers-reduced-motion` disables animations

Full WCAG validation requires manual testing with screen readers (NVDA, VoiceOver) and expert review — this is not fully coverable by automated tools alone.

### Test File Locations

```
src/
├── engine/
│   ├── loader.test.ts
│   ├── validator.test.ts
│   ├── progress.test.ts
│   └── xp.test.ts
├── persistence/
│   └── localStorageAdapter.test.ts
├── components/
│   ├── LearningPath/LearningPath.test.tsx
│   ├── NodeRenderer/NodeRenderer.test.tsx
│   ├── nodes/
│   │   ├── LessonNodeView.test.tsx
│   │   ├── CodeNodeView.test.tsx
│   │   ├── PracticeNodeView.test.tsx
│   │   ├── ChallengeNodeView.test.tsx
│   │   └── FallbackNodeView.test.tsx
│   ├── QuizEngine/QuizEngine.test.tsx
│   └── AchievementScreen/AchievementScreen.test.tsx
├── hooks/
│   └── useEngineState.test.ts
└── integration/
    └── lessonFlow.test.ts
```
