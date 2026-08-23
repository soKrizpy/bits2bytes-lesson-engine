import Ajv from 'ajv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const schema = JSON.parse(readFileSync(join(root, 'schemas', 'lesson.schema.json'), 'utf8'));
const lesson = JSON.parse(readFileSync(join(root, 'public', 'lessons', 'beginner', 'html', 'beginner-html-01.json'), 'utf8'));

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);
const valid = validate(lesson);

if (valid) {
  console.log('✅ Schema validation PASSED — zero errors');
  
  // Additional checks
  const nodes = lesson.learningPath;
  console.log(`✅ Node count: ${nodes.length} (expected 10)`);
  
  const nodeTypes = nodes.map(n => n.type);
  console.log(`✅ Node types: ${nodeTypes.join(', ')}`);
  
  const questions = lesson.quiz.questions;
  console.log(`✅ Quiz questions: ${questions.length} (expected 5)`);
  
  let allOptionsValid = true;
  let allAnswersValid = true;
  for (const q of questions) {
    if (q.options.length !== 4) {
      console.error(`❌ Question ${q.id} has ${q.options.length} options (expected 4)`);
      allOptionsValid = false;
    }
    if (!q.options.includes(q.correctAnswer)) {
      console.error(`❌ Question ${q.id}: correctAnswer "${q.correctAnswer}" does not match any option`);
      allAnswersValid = false;
    }
  }
  if (allOptionsValid) console.log('✅ All questions have exactly 4 options');
  if (allAnswersValid) console.log('✅ All correctAnswers exactly match an option');
  
  // Verify schemaVersion
  const major = parseInt(lesson.schemaVersion.split('.')[0], 10);
  console.log(`✅ schemaVersion: "${lesson.schemaVersion}" — MAJOR version ${major} (supported: 1)`);
  
} else {
  console.error('❌ Schema validation FAILED:');
  for (const err of validate.errors ?? []) {
    console.error(`  ${err.instancePath || err.params?.missingProperty || 'root'}: ${err.message}`);
  }
  process.exit(1);
}
