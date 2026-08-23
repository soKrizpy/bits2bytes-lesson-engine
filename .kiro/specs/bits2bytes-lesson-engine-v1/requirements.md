# Requirements Document

## Introduction

BITS2BYTES Lesson Engine V1 is a reusable, gamified learning engine for coding education. It renders structured lesson content defined in JSON, manages student progress through a visual learning path, rewards students with XP and achievements, and enforces quiz attempt rules. The engine is designed once and reused across any number of future topics by supplying new JSON content files — no engine code changes are required to add new topics.

The V1 release ships with a single topic: **beginner-html-01 — Build Your First Web Page**.

---

## Glossary

- **Lesson_Engine**: The core application that reads lesson JSON, renders the learning experience, and manages student state.
- **Lesson_JSON**: A JSON file conforming to the Lesson Schema that defines all content for one topic.
- **Topic**: A single educational unit identified by a stable string ID (e.g. `beginner-html-01`), represented by one Lesson_JSON file.
- **Learning_Path**: The ordered sequence of nodes that a student navigates through in a topic.
- **Node**: A single step in the Learning_Path. Each node has a type and type-specific content fields.
- **Node_Type**: One of five types defined for V1: `lesson`, `code`, `practice`, `challenge`, `quiz`.
- **Student_State**: The in-memory and persisted record of a student's progress within a topic, including completed nodes, XP earned, quiz attempts, best quiz score, and topic completion status.
- **Persistence_Layer**: The abstraction that reads and writes Student_State. In V1 it uses local storage / mock data; it is designed to be swapped for a Supabase backend without UI changes.
- **XP**: Experience Points awarded to the student for completing nodes and the topic.
- **Quiz_Attempt**: One complete submission of all five quiz questions for a topic.
- **Best_Quiz_Score**: The highest score across all Quiz_Attempts for a topic, NOT the most recent score.
- **Achievement**: The visual reward shown to the student on topic completion.
- **Schema_Validator**: The module that validates a Lesson_JSON file against the Lesson Schema before the Lesson_Engine renders it.
- **Progress_Tracker**: The module that calculates and exposes the student's current progress (completed nodes, current node, remaining nodes, overall percentage).
- **XP_Calculator**: The module that totals XP earned from completed nodes and topic-level awards.
- **Topic_ID**: A stable string identifier for a topic, used to load the correct Lesson_JSON file.

---

## Requirements

---

### Requirement 1: Load and Validate Lesson Content

**User Story:** As a developer adding a new topic, I want the engine to load and validate any topic's JSON file, so that invalid content produces a clear error rather than a broken experience.

#### Acceptance Criteria

1. WHEN a Topic_ID is provided, THE Lesson_Engine SHALL locate and load the corresponding Lesson_JSON file from the `lessons/` directory using the path pattern `lessons/{level}/{category}/{topic-id}.json`.
2. WHEN a Lesson_JSON file is loaded, THE Schema_Validator SHALL validate the file against the Lesson Schema before any rendering begins.
3. IF a Lesson_JSON file is missing one or more required top-level sections (`metadata`, `learningPath`, `quiz`, `completion`), THEN THE Schema_Validator SHALL return a descriptive error message identifying ALL missing sections, not only the first one found.
4. IF a Lesson_JSON file contains a node with an unrecognised `type` value, THEN THE Schema_Validator SHALL return a descriptive error message identifying the zero-based node index and the invalid type value.
5. IF a Lesson_JSON file fails Schema_Validator checks, THEN THE Lesson_Engine SHALL display a human-readable error screen containing the specific validation error details and SHALL NOT attempt to render the lesson.
6. IF the Lesson_JSON file does not exist at the expected path, THEN THE Lesson_Engine SHALL display an error screen indicating that the file was not found at the expected path, and SHALL NOT attempt to render the lesson.
7. THE Lesson_Engine SHALL support loading any valid Lesson_JSON file without requiring modification to engine source code.

---

### Requirement 2: Lesson Schema Definition

**User Story:** As a content author, I want a clear, versioned JSON schema for lesson files, so that I can create new topics without ambiguity and without changing the engine.

#### Acceptance Criteria

1. THE Lesson_Engine SHALL define a Lesson Schema that specifies the following top-level sections: `metadata`, `introduction` (optional), `objectives`, `learningPath`, `challenge`, `quiz`, `completion`, and SHALL include a `schemaVersion` field (string in MAJOR.MINOR format) at the top level.
2. THE Lesson Schema SHALL require `metadata` to include: `id` (string of 1–100 characters), `title` (string of 1–100 characters), `description` (string of 1–500 characters), `level` (one of: `beginner`, `intermediate`, `advanced`), `category` (string of 1–100 characters), `topicNumber` (integer ≥ 1), `estimatedTime` (positive integer representing minutes), `xp` (integer between 0 and 10000 inclusive).
3. THE Lesson Schema SHALL require each node in `learningPath` to include a `type` field with one of the five V1 values: `lesson`, `code`, `practice`, `challenge`, `quiz`, and SHALL require each node to include a unique `id` field (string of 1–100 characters) within the `learningPath` array.
4. THE Lesson Schema SHALL require `quiz` to contain exactly 5 questions, each with: `id` (string of 1–100 characters), `question` (string of 1–500 characters), `options` (array of exactly 4 strings each of 1–200 characters), `correctAnswer` (string exactly matching one of the 4 option strings), `explanation` (string of 1–500 characters), `points` (integer between 0 and 100 inclusive).
5. THE Lesson Schema SHALL allow future node types to be added by extending the schema without removing or altering existing type definitions.
6. WHERE a `code` node is present, THE Lesson Schema SHALL require a `language` field (string of 1–50 characters) and a `content` field (string of 1–50000 characters), and SHALL NOT restrict the `language` value to a predefined list.
7. IF a lesson file does not conform to the Lesson Schema, THEN THE Lesson_Engine SHALL reject the file and produce an error message indicating the field name and the violated constraint, without loading any part of the lesson.
8. IF the `schemaVersion` field is absent or specifies a MAJOR version not supported by the Lesson_Engine, THEN THE Lesson_Engine SHALL reject the file and produce an error message indicating the unsupported schema version.

---

### Requirement 3: Visual Learning Path Rendering

**User Story:** As a student, I want to see my full learning path displayed visually, so that I always know where I am, what I've completed, and what is ahead.

#### Acceptance Criteria

1. THE Lesson_Engine SHALL render all nodes in the Learning_Path as a vertical visual path on the lesson screen, displaying them in their defined sequence order from top to bottom.
2. WHEN a node has been completed by the student, THE Lesson_Engine SHALL render that node with a visually distinct "completed" state (e.g. filled icon, tick mark, muted colour) that is distinguishable from the "current" and "upcoming" states.
3. WHEN a node is the student's current node, THE Lesson_Engine SHALL render that node with a visually prominent "current" state (e.g. highlighted border, bright colour, enlarged icon) that is distinguishable from the "completed" and "upcoming" states, and THE Lesson_Engine SHALL scroll the learning path to keep the current node visible within the viewport.
4. WHEN a node has not yet been reached, THE Lesson_Engine SHALL render that node with an "upcoming" state (e.g. greyed out, hollow icon) that is distinguishable from the "completed" and "current" states.
5. THE Lesson_Engine SHALL display the overall progress percentage, calculated as (number of completed nodes ÷ total nodes) × 100, rounded to the nearest integer, within the range 0% to 100% inclusive.
6. THE Lesson_Engine SHALL display the count of completed nodes and the total node count alongside the progress percentage in the format "[completed] / [total]".
7. THE Lesson_Engine SHALL be responsive and render correctly on desktop (≥ 1024px), laptop (≥ 768px), and tablet (≥ 480px) viewport widths, with all nodes, node states, and progress indicators remaining visible and non-overlapping at each breakpoint.
8. IF the Learning_Path contains zero nodes, THEN THE Lesson_Engine SHALL display an empty path with a progress percentage of 0% and a node count of "0 / 0".
9. WHEN the student's current node changes, THE Lesson_Engine SHALL update all node states and the progress percentage within 500 milliseconds without requiring a full page reload.

---

### Requirement 4: Node Content Rendering

**User Story:** As a student, I want each learning node to display its content in a clear, type-appropriate layout, so that I can absorb information in the right format for each step.

#### Acceptance Criteria

1. WHEN the current node has type `lesson`, THE Lesson_Engine SHALL display: the node's `title`, `explanation`, `analogy` (if present), `expectedResult` (if present), and `tips` (if present). IF the `explanation` field is absent, THEN THE Lesson_Engine SHALL display a placeholder message indicating no explanation is available, and SHALL NOT crash.
2. WHEN the current node has type `code`, THE Lesson_Engine SHALL display the `content` field in a styled code block that preserves whitespace and indentation, and SHALL label the block with the `language` value.
3. WHEN the current node has type `practice`, THE Lesson_Engine SHALL render an interactive element (such as a multiple-choice selector, fill-in-the-blank input, or step-completion button) as defined in the node's content fields, and SHALL display a visible state change (such as a success indicator, tick mark, or confirmation message) within 300 milliseconds of the student's submit or select action.
4. WHEN the current node has type `challenge`, THE Lesson_Engine SHALL display: the `title`, `instructions`, `starterCode` (if present) in a code block, and `expectedResult` (if present).
5. WHEN the current node has type `quiz`, THE Lesson_Engine SHALL render the quiz experience as defined in Requirement 6.
6. WHEN a node type present in Lesson_JSON is not handled by the current renderer, THE Lesson_Engine SHALL display a fallback placeholder showing the unrecognised node type value and a "not supported" message, and SHALL NOT crash.

---

### Requirement 5: Node Navigation and Progress

**User Story:** As a student, I want to move through nodes in sequence and have my progress saved, so that I can continue where I left off and track my advancement.

#### Acceptance Criteria

1. THE Lesson_Engine SHALL present a primary action button on each non-quiz node that advances the student to the next node in the Learning_Path.
2. WHEN the student activates the primary action button on a non-quiz node, THE Lesson_Engine SHALL mark that node as completed in the Student_State and SHALL persist the updated Student_State via the Persistence_Layer within 3 seconds.
3. IF the Persistence_Layer fails to persist the updated Student_State, THEN THE Lesson_Engine SHALL display an error message indicating that progress could not be saved and SHALL retain the updated Student_State in memory for the current session.
4. WHEN the student advances past a node that carries an XP value, THE XP_Calculator SHALL add that node's XP to the student's cumulative XP total for the topic and SHALL persist the updated value via the Persistence_Layer within 3 seconds.
5. WHEN the student advances past a node, THE Lesson_Engine SHALL display a visual completion animation of no more than 2 seconds in duration before rendering the next node.
6. IF the student attempts to navigate to a node beyond the next sequential node and one or more preceding nodes are not marked as completed in the Student_State, THEN THE Lesson_Engine SHALL deny the navigation and display an indication that the preceding nodes must be completed first.
7. WHEN the student opens a previously visited topic, THE Lesson_Engine SHALL restore the Student_State from the Persistence_Layer and SHALL render the node at which the student's current progress is recorded, within 3 seconds of the topic opening.

---

### Requirement 6: Quiz Experience

**User Story:** As a student, I want to take a knowledge check quiz with fair attempt rules and helpful feedback, so that I can test my understanding and learn from wrong answers without being punished.

#### Acceptance Criteria

1. WHEN the student reaches the quiz node, THE Lesson_Engine SHALL render all 5 quiz questions on a single screen, each with its 4 answer options selectable exactly once per attempt.
2. WHEN the student submits a Quiz_Attempt, THE Lesson_Engine SHALL calculate the attempt score as the sum of `points` for each correctly answered question.
3. WHEN the student submits a Quiz_Attempt, THE Lesson_Engine SHALL update the Best_Quiz_Score in Student_State to the maximum of the previous Best_Quiz_Score and the current attempt score, and SHALL persist this value via the Persistence_Layer.
4. WHEN the student submits a Quiz_Attempt, THE Lesson_Engine SHALL display a post-submission review showing, for each incorrectly answered question, the correct answer and the question's `explanation` text.
5. THE Lesson_Engine SHALL permit a maximum of 2 Quiz_Attempts per topic per student.
6. WHEN the student has used both Quiz_Attempts, THE Lesson_Engine SHALL disable the quiz retry action and SHALL display a message indicating no further attempts remain.
7. IF the student attempts to trigger a third Quiz_Attempt, THEN THE Lesson_Engine SHALL block the attempt and SHALL display a message indicating the attempt limit has been reached.
8. THE Lesson_Engine SHALL display the following information on the quiz screen: before any attempt — current attempt number (0), maximum attempts allowed (2), most recent score ("no attempt recorded"), Best_Quiz_Score (0), and attempt availability (available); after each submission — updated current attempt number, most recent score, updated Best_Quiz_Score, and remaining attempt availability.
9. WHEN the student completes a Quiz_Attempt (regardless of score), THE Lesson_Engine SHALL mark the quiz node as completed in Student_State and SHALL allow the student to proceed to the next node.
10. IF the Persistence_Layer fails to persist the quiz attempt score or Best_Quiz_Score, THEN THE Lesson_Engine SHALL display an error message indicating that the score could not be saved and SHALL retain the quiz attempt data in memory for the current session.

---

### Requirement 7: Topic Completion and Achievement

**User Story:** As a student, I want a rewarding completion screen when I finish a topic, so that I feel a strong sense of accomplishment and am motivated to continue learning.

#### Acceptance Criteria

1. WHEN the student reaches the end of the Learning_Path (the completion node), THE Lesson_Engine SHALL set `topicCompleted` to `true` in Student_State and SHALL persist this value via the Persistence_Layer.
2. WHEN `topicCompleted` is set to `true`, THE Lesson_Engine SHALL display a full Achievement screen featuring: a celebration animation lasting between 2 and 5 seconds, the topic title, total XP earned during the topic, Best_Quiz_Score as a percentage between 0 and 100, number of nodes completed, and a named Achievement for completing the topic.
3. THE Lesson_Engine SHALL NOT require the student to achieve a minimum quiz score to trigger topic completion.
4. THE Lesson_Engine SHALL NOT automatically navigate the student to another topic upon completion.
5. WHEN the Achievement screen is displayed, THE Lesson_Engine SHALL provide an action button labelled "Return to Overview" or "Go to Home" that navigates the student away from the lesson experience.
6. IF the Persistence_Layer fails to persist `topicCompleted`, THEN THE Lesson_Engine SHALL display the Achievement screen regardless, show an error message indicating that completion status could not be saved, and retain `topicCompleted = true` in memory for the current session.

---

### Requirement 8: XP and Gamification

**User Story:** As a student, I want to earn XP as I progress through a topic, so that I can see a quantified reward for my effort and feel motivated to keep going.

#### Acceptance Criteria

1. THE Lesson_Engine SHALL display the student's current total XP earned for the active topic in a fixed on-screen location that remains visible without scrolling at all times during the lesson experience.
2. WHEN the student completes a node that has an XP value defined, THE XP_Calculator SHALL add that node's XP value to the student's total XP earned for the topic and update the displayed total immediately.
3. IF the student completes a node that has no XP value defined, THEN THE XP_Calculator SHALL leave the student's total XP for the topic unchanged.
4. WHEN the student completes the topic for the first time, THE XP_Calculator SHALL add the topic-level `xp` value from `metadata` to the student's total XP earned for the topic.
5. IF the student's topic completion XP for a given topic has already been awarded, THEN THE XP_Calculator SHALL NOT add the topic-level `xp` value again and SHALL leave the student's total XP unchanged.
6. WHEN XP is added to the student's total, THE Lesson_Engine SHALL display a visual animation indicating the XP gain amount (e.g. "+10 XP") for a duration between 1 and 3 seconds before dismissing automatically.
7. THE Lesson_Engine SHALL NOT implement leaderboards, coins, a shop, avatars, streaks, lives, hearts, social features, multiplayer, cross-topic unlocking, or badge management in V1.

---

### Requirement 9: Student State Model and Persistence Abstraction

**User Story:** As a developer, I want a clean separation between the UI and the persistence layer, so that swapping local storage for Supabase in a future version does not require rewriting UI components.

#### Acceptance Criteria

1. THE Lesson_Engine SHALL maintain a Student_State record for each topic containing: `studentId` (string of 1–128 characters), `topicId` (string of 1–128 characters), `currentNodeIndex` (integer ≥ 0), `completedNodes` (array of node ID strings, max 500 entries), `quizAttempts` (array of attempt records, max 50 entries), `bestQuizScore` (integer between 0 and 100 inclusive), `xpEarned` (integer ≥ 0), `topicCompleted` (boolean), `achievement` (string of 1–100 characters or null).
2. THE Lesson_Engine SHALL access Student_State exclusively through the Persistence_Layer interface and SHALL NOT directly access localStorage, sessionStorage, cookies, IndexedDB, or any other browser or platform storage API from UI components or state logic.
3. THE Persistence_Layer SHALL expose the following operations: `loadState(topicId): Student_State | null`, `saveState(topicId, state): void`, `clearState(topicId): void`.
4. THE Persistence_Layer V1 implementation SHALL store and retrieve Student_State using browser local storage, keyed by Topic_ID, such that a `saveState` call followed by a `loadState` call for the same Topic_ID returns a Student_State equal to the saved value.
5. WHEN `loadState(topicId)` returns null (no previously saved state exists), THE Lesson_Engine SHALL initialise a new Student_State with `currentNodeIndex` = 0, `completedNodes` = [], `quizAttempts` = [], `bestQuizScore` = 0, `xpEarned` = 0, `topicCompleted` = false, and `achievement` = null.
6. IF the Persistence_Layer encounters a storage failure (such as quota exceeded or unparseable stored data) during `loadState` or `saveState`, THEN THE Persistence_Layer SHALL return null (for `loadState`) or silently fail (for `saveState`), and THE Lesson_Engine SHALL display an error message indicating that state persistence is unavailable for the current session.
7. WHEN the Persistence_Layer implementation is replaced with an alternative adapter (e.g. a Supabase adapter), THE Lesson_Engine UI components and state logic SHALL require no modification, provided the adapter exposes the same `loadState`, `saveState`, and `clearState` function signatures and return types as defined in Criterion 3.
8. THE Lesson_Engine SHALL NOT call Supabase, any external API, or any authentication service in V1.

---

### Requirement 10: Topic 01 — Build Your First Web Page

**User Story:** As a beginner student, I want a friendly, beginner-appropriate HTML introduction topic, so that I can learn how to build my first web page step by step.

#### Acceptance Criteria

1. THE Lesson_Engine SHALL load the topic identified by `beginner-html-01` from the file `lessons/beginner/html/topic-01.json`.
2. THE topic-01.json file SHALL include a Learning_Path of 8–10 nodes covering, in order: an introduction/welcome node, a conceptual explanation of HTML, a file creation guide, the basic HTML document structure, adding a heading, adding a paragraph, a practice node (requiring the student to produce an output by applying skills from preceding nodes), a challenge node (requiring the student to solve a problem without step-by-step guidance), a quiz node (5 questions), and a completion node.
3. THE topic-01.json `quiz` section SHALL contain exactly 5 questions, each limited in scope to concepts introduced within the nodes of this topic and requiring no prior HTML knowledge beyond what those nodes teach.
4. THE topic-01.json `metadata` SHALL specify: `id` = `"beginner-html-01"`, `level` = `"beginner"`, `category` = `"HTML"`, `topicNumber` = `1`, `xp` = `100`.
5. WHEN the Schema_Validator validates topic-01.json against the Lesson_Schema, THE Schema_Validator SHALL report zero errors.

---

### Requirement 11: Architecture — Data, UI, and State Separation

**User Story:** As a developer, I want a layered architecture with clear module boundaries, so that engine, content, and persistence can evolve independently and new topics never require engine changes.

#### Acceptance Criteria

1. THE Lesson_Engine SHALL be structured into four distinct layers: Lesson Content (JSON files), UI Components (rendering), Student State (logic), and Persistence_Layer (storage), where each layer exposes its functionality only through a defined interface and no layer imports directly from a non-adjacent layer.
2. THE Lesson_Engine SHALL expose a single entry-point component or function that accepts a Topic_ID string of 1 to 128 characters and renders the complete lesson experience.
3. WHEN a new topic JSON file is placed in the correct `lessons/` subdirectory and a valid Topic_ID is supplied to the entry point, THE Lesson_Engine SHALL render the new topic without any modification to engine source files.
4. WHEN a Lesson_JSON is loaded, THE Lesson_Engine SHALL validate it against the Schema_Validator before rendering, and IF the Lesson_JSON fails Schema_Validator validation, THEN THE Lesson_Engine SHALL display an error message indicating which topic failed and the reason, halt rendering of that topic, and preserve all previously loaded Student_State without modification.
5. WHEN a UI component needs to read or write Student_State, THE UI component SHALL call the Persistence_Layer interface and SHALL NOT directly access local storage, cookies, or any browser or platform storage API.
6. IF a Topic_ID supplied to the entry point does not match any loaded Lesson_JSON, THEN THE Lesson_Engine SHALL display an error message indicating the Topic_ID was not found and SHALL NOT render a partial or blank lesson view.

---

### Requirement 12: Visual Design and Accessibility

**User Story:** As a student, I want a modern, friendly, and game-like visual experience, so that learning feels engaging and rewarding rather than dry and academic.

#### Acceptance Criteria

1. THE Lesson_Engine SHALL apply a consistent visual design using rounded UI components, icon-based node navigation, and a cohesive colour palette, and SHALL NOT replicate the exact visual identity (colour schemes, mascots, iconography, or layouts) of any proprietary branded learning application.
2. THE Lesson_Engine SHALL use cards with distinct visual states (locked, available, in-progress, completed), icons, and progress indicators to communicate node state and student progress at a glance, and SHALL NOT rely solely on colour to differentiate node states.
3. THE Lesson_Engine SHALL apply animations for node completion, XP gain, quiz result display, and topic completion achievement, each with a duration between 200ms and 500ms, playing once and completing non-blocking (not preventing user interaction after playback ends).
4. THE Lesson_Engine SHALL render without layout breakage (no content clipping, element overlapping, or unintended horizontal scrolling) on viewport widths of 480px, 768px, and 1024px.
5. THE Lesson_Engine SHALL meet WCAG 2.1 AA colour contrast requirements: a minimum contrast ratio of 4.5:1 for normal body text and a minimum contrast ratio of 3:1 for large text and UI component boundaries.
6. THE Lesson_Engine SHALL provide visible focus indicators on all interactive elements with a minimum 2px outline width and a minimum contrast ratio of 3:1 between the indicator and adjacent colours.
7. WHEN the user's system or browser has `prefers-reduced-motion` enabled, THE Lesson_Engine SHALL disable or minimise all animations and transitions, replacing them with instant state changes or opacity fades of no more than 100ms.
