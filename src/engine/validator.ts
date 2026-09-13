// src/engine/validator.ts
// Layer 2 — Engine Core.
// SchemaValidator validates a lesson JSON object against the Lesson Schema.
// Uses AJV with allErrors:true to collect ALL violations in one pass.
// Topic-agnostic: validates any Lesson JSON regardless of subject matter.

import Ajv from 'ajv';
import type { Lesson } from '@/types/lesson';
import lessonSchema from '../../schemas/lesson.schema.json';

/** The only MAJOR schema version this engine supports. */
const SUPPORTED_SCHEMA_MAJOR_VERSION = 1;

export type ValidationResult =
  | { valid: true; lesson: Lesson }
  | { valid: false; errors: string[] };

// Compile the schema on first use and cache the validator function.
// Keeping AJV initialization out of module evaluation avoids fragile eager
// vendor-chunk resolution during Next.js development rebuilds.
let validateFn: ReturnType<Ajv['compile']> | undefined;

function getValidator() {
  if (validateFn === undefined) {
    const ajv = new Ajv({ allErrors: true, strict: false });
    validateFn = ajv.compile(lessonSchema);
  }

  return validateFn;
}

/**
 * Validates a raw JSON object against the BITS2BYTES Lesson Schema.
 *
 * Checks performed:
 * 1. schemaVersion presence and MAJOR version compatibility
 * 2. All required fields and their constraints
 * 3. Node types are from the V1 set
 * 4. Exactly 5 quiz questions
 * 5. All other schema constraints
 *
 * Returns ALL errors found in a single pass — never just the first one.
 */
export function validateLesson(data: unknown): ValidationResult {
  // Step 1: Check schemaVersion before full AJV validation
  if (typeof data !== 'object' || data === null) {
    return { valid: false, errors: ['Lesson data must be a JSON object.'] };
  }

  const raw = data as Record<string, unknown>;

  if (!('schemaVersion' in raw) || typeof raw['schemaVersion'] !== 'string') {
    return {
      valid: false,
      errors: [
        `schemaVersion: field is missing or not a string. Engine supports schema version ${SUPPORTED_SCHEMA_MAJOR_VERSION}.x.`,
      ],
    };
  }

  const versionStr = raw['schemaVersion'] as string;
  const parts = versionStr.split('.');
  const majorStr = parts[0];
  const major = majorStr !== undefined ? parseInt(majorStr, 10) : NaN;

  if (isNaN(major) || major !== SUPPORTED_SCHEMA_MAJOR_VERSION) {
    return {
      valid: false,
      errors: [
        `schemaVersion: "${versionStr}" is not supported. Engine supports version ${SUPPORTED_SCHEMA_MAJOR_VERSION}.x only.`,
      ],
    };
  }

  // Step 2: Full AJV validation (allErrors: true collects everything)
  const validator = getValidator();
  const isValid = validator(data);

  if (!isValid && validator.errors) {
    const errors = validator.errors.map((err) => {
      const instancePath = err.instancePath ?? '';
      const field =
        instancePath !== ''
          ? instancePath.replace(/^\//, '').replace(/\//g, '.')
          : err.params != null && typeof err.params === 'object' && 'missingProperty' in err.params
            ? (err.params.missingProperty as string)
            : 'root';
      return `${field}: ${err.message ?? 'invalid value'}`;
    });
    return { valid: false, errors };
  }

  return { valid: true, lesson: data as Lesson };
}
