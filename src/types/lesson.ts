// src/types/lesson.ts
// Layer 1 data model — TypeScript types for Lesson JSON content.
// These types define the shape of lesson JSON files loaded by the engine.
// The engine is topic-agnostic; these types make NO assumptions about HTML or any specific subject.

export type SchemaVersion = string; // "MAJOR.MINOR" format, e.g. "1.0"

export interface LessonMetadata {
  /** Stable topic identifier, e.g. "beginner-html-01". 1–100 characters. */
  id: string;
  /** Human-readable topic title. 1–100 characters. */
  title: string;
  /** Short description. 1–500 characters. */
  description: string;
  /** Difficulty level. */
  level: 'beginner' | 'intermediate' | 'advanced';
  /** Subject category, e.g. "HTML", "CSS", "Python". 1–100 characters. */
  category: string;
  /** Sequential topic number within the category. Integer >= 1. */
  topicNumber: number;
  /** Estimated completion time in minutes. Positive integer. */
  estimatedTime: number;
  /** Total XP available for completing this topic. Integer 0–10000. */
  xp: number;
}

export interface LessonIntroduction {
  title: string;
  description: string;
  /** Optional analogy to help students grasp the concept. */
  analogy?: string;
  /** Optional list of prerequisite topic IDs (informational only — engine does NOT enforce unlocking). */
  prerequisites?: string[];
}

/** The five V1 node types. Architecture allows new types to be added without changing existing renderers. */
export type NodeType = 'lesson' | 'code' | 'practice' | 'challenge' | 'quiz';

export interface BaseNode {
  /** Unique identifier within this topic's learningPath. 1–100 characters. */
  id: string;
  type: NodeType;
  /** Display title for the node card. */
  title: string;
  /** Optional XP awarded when this node is completed. */
  xp?: number;
}

export interface LessonNode extends BaseNode {
  type: 'lesson';
  /** Main explanatory content for this step. */
  explanation: string;
  /** Optional analogy to aid understanding. */
  analogy?: string;
  /** Optional description of what the student should see/understand after this node. */
  expectedResult?: string;
  /** Optional list of tips. */
  tips?: string[];
}

export interface CodeNode extends BaseNode {
  type: 'code';
  /** Optional explanatory text shown above the code block. */
  explanation?: string;
  code: {
    /**
     * Programming language identifier. Not restricted to a predefined list —
     * the engine renders all languages through the same generic code component.
     * Examples: "html", "css", "javascript", "python", "lua"
     */
    language: string;
    /** The code content to display. 1–50000 characters. */
    content: string;
  };
}

export interface PracticeNode extends BaseNode {
  type: 'practice';
  /** Instructions for the student. */
  instructions: string;
  /** The type of interactive element to render. */
  interactionType: 'multiple-choice' | 'step-completion';
  /** Options for multiple-choice interaction. */
  options?: string[];
  /** The correct option for multiple-choice (must match one of `options` exactly). */
  correctOption?: string;
  /** Steps for step-completion interaction. */
  steps?: string[];
}

export interface ChallengeNode extends BaseNode {
  type: 'challenge';
  /** Challenge instructions. */
  instructions: string;
  /** Optional starter code. */
  starterCode?: {
    language: string;
    content: string;
  };
  /** Optional description of the expected output/result. */
  expectedResult?: string;
  /** Optional full solution shown only in post-completion review mode. */
  solution?: {
    language: string;
    code: string;
    explanation?: string;
  };
}

export interface QuizNode extends BaseNode {
  type: 'quiz';
  // Questions are sourced from the top-level `quiz` section of the Lesson —
  // not embedded in the node. This keeps quiz data in one place.
}

/** Discriminated union of all V1 node types. Add new node interfaces here for future node types. */
export type LearningNode =
  | LessonNode
  | CodeNode
  | PracticeNode
  | ChallengeNode
  | QuizNode;

export interface QuizQuestion {
  /** Unique identifier for this question. 1–100 characters. */
  id: string;
  /** The question text. 1–500 characters. */
  question: string;
  /** Exactly 4 answer options. Each 1–200 characters. */
  options: [string, string, string, string];
  /** Must exactly match one of the 4 options. */
  correctAnswer: string;
  /** Explanation shown to students after an incorrect answer. 1–500 characters. */
  explanation: string;
  /** Points awarded for a correct answer. Integer 0–100. */
  points: number;
}

export interface LessonCompletion {
  /** Completion screen title, e.g. "Great Job!" */
  title: string;
  /** Completion message body. */
  message: string;
  /** Achievement name displayed on the completion screen, e.g. "First Web Page Builder". */
  achievementName: string;
  /** Optional emoji or icon identifier for the achievement. */
  achievementIcon?: string;
}

export interface LessonReviewSummary {
  /** Optional summary of what the student learned in this topic. */
  learned?: string[];
  /** Optional list of key concepts covered by the topic. */
  keyConcepts?: string[];
  /** Optional useful takeaways for future reference. */
  takeaways?: string[];
}

/** Root type for a complete lesson JSON file. */
export interface Lesson {
  /** Schema version string in "MAJOR.MINOR" format. Engine validates MAJOR version compatibility. */
  schemaVersion: SchemaVersion;
  metadata: LessonMetadata;
  /** Optional introduction section shown before the learning path begins. */
  introduction?: LessonIntroduction;
  /** Learning objectives for this topic. */
  objectives: string[];
  /** Optional post-completion review summary. */
  review?: LessonReviewSummary;
  /** Ordered sequence of learning nodes the student navigates through. */
  learningPath: LearningNode[];
  quiz: {
    /** Exactly 5 questions for V1. */
    questions: [QuizQuestion, QuizQuestion, QuizQuestion, QuizQuestion, QuizQuestion];
  };
  completion: LessonCompletion;
}
