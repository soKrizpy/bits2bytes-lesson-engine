// src/engine/csvImport.ts
// CSV to Lesson JSON importer.
// CLI: npx ts-node src/engine/csvImport.ts <file.csv>
// Node range: 5-50 per lesson. Quiz questions: 3-20 per lesson.

import fs from 'fs';
import path from 'path';

interface CsvLessonRow {
  type: 'LESSON'; lessonId: string; title: string; description: string;
  level: 'beginner'|'intermediate'|'advanced'; category: string;
  topicNumber: number; estimatedTime: number; xp: number;
}
interface CsvNodeRow {
  type: 'NODE'; lessonId: string; nodeId: string;
  nodeType: 'lesson'|'code'|'practice'|'challenge'|'quiz';
  title: string; xp: number; content: string;
  language?: string; codeContent?: string;
  options?: string; correctOption?: string;
}
interface CsvQuizRow {
  type: 'QUIZ'; lessonId: string; questionId: string; question: string;
  optionA: string; optionB: string; optionC: string; optionD: string;
  correctAnswer: string; explanation: string; points: number;
}
type CsvRow = CsvLessonRow | CsvNodeRow | CsvQuizRow;

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = ''; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i+1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQ = false; }
      else { cur += ch; }
    } else {
      if (ch === '"') { inQ = true; }
      else if (ch === ',') { fields.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
  }
  fields.push(cur.trim());
  return fields;
}

function parseRow(cols: string[]): CsvRow | null {
  const t = cols[0]?.toUpperCase();
  if (t === 'LESSON' && cols.length >= 9) {
    return { type:'LESSON', lessonId:cols[1]??'', title:cols[2]??'', description:cols[3]??'',
      level:(cols[4]??'beginner') as CsvLessonRow['level'], category:cols[5]??'',
      topicNumber:parseInt(cols[6]??'1',10), estimatedTime:parseInt(cols[7]??'30',10),
      xp:parseInt(cols[8]??'100',10) };
  }
  if (t === 'NODE' && cols.length >= 7) {
    const row: CsvNodeRow = { type:'NODE', lessonId:cols[1]??'', nodeId:cols[2]??'',
      nodeType:(cols[3]??'lesson') as CsvNodeRow['nodeType'],
      title:cols[4]??'', xp:parseInt(cols[5]??'0',10), content:cols[6]??'' };
    if (cols[7]) row.language = cols[7];
    if (cols[8]) row.codeContent = cols[8];
    if (cols[11]) row.options = cols[11];
    if (cols[12]) row.correctOption = cols[12];
    return row;
  }
  if (t === 'QUIZ' && cols.length >= 11) {
    return { type:'QUIZ', lessonId:cols[1]??'', questionId:cols[2]??'',
      question:cols[3]??'', optionA:cols[4]??'', optionB:cols[5]??'',
      optionC:cols[6]??'', optionD:cols[7]??'', correctAnswer:cols[8]??'',
      explanation:cols[9]??'', points:parseInt(cols[10]??'20',10) };
  }
  return null;
}

function buildNode(row: CsvNodeRow): object {
  const base = { id:row.nodeId, type:row.nodeType, title:row.title, xp:row.xp };
  switch (row.nodeType) {
    case 'lesson': return { ...base, explanation:row.content };
    case 'code': return { ...base, explanation:row.content||undefined,
      code:{ language:row.language??'html', content:row.codeContent??'' } };
    case 'practice': {
      const opts = row.options ? row.options.split('|').map(o=>o.trim()) : [];
      return { ...base, instructions:row.content, interactionType:'multiple-choice',
        options:opts, correctOption:row.correctOption??'' };
    }
    case 'challenge': return { ...base, instructions:row.content };
    default: return base;
  }
}

export interface ImportResult { lessonId:string; outputPath:string; success:boolean; error?:string; }

export function importCsv(csvPath: string, outDir?: string): ImportResult[] {
  const baseDir = outDir ?? path.join(process.cwd(),'public','lessons');
  const lines = fs.readFileSync(csvPath,'utf-8').split('\n');
  const allRows: CsvRow[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const row = parseRow(parseCsvLine(t));
    if (row) allRows.push(row);
  }
  const lessons = new Map<string,CsvLessonRow>();
  const nodes = new Map<string,CsvNodeRow[]>();
  const quizzes = new Map<string,CsvQuizRow[]>();
  for (const row of allRows) {
    if (row.type==='LESSON') { lessons.set(row.lessonId,row); }
    else if (row.type==='NODE') { const a=nodes.get(row.lessonId)??[]; a.push(row); nodes.set(row.lessonId,a); }
    else { const a=quizzes.get(row.lessonId)??[]; a.push(row); quizzes.set(row.lessonId,a); }
  }
  const results: ImportResult[] = [];
  for (const [id, lesson] of Array.from(lessons.entries())) {
    const ns = nodes.get(id)??[]; const qs = quizzes.get(id)??[];
    try {
      if (ns.length<5) throw new Error(`Min 5 nodes (got ${ns.length})`);
      if (ns.length>50) throw new Error(`Max 50 nodes (got ${ns.length})`);
      if (qs.length<3) throw new Error(`Min 3 quiz questions (got ${qs.length})`);
      if (qs.length>20) throw new Error(`Max 20 quiz questions (got ${qs.length})`);
      const json = {
        schemaVersion:'1.0',
        metadata:{ id:lesson.lessonId, title:lesson.title, description:lesson.description,
          level:lesson.level, category:lesson.category, topicNumber:lesson.topicNumber,
          estimatedTime:lesson.estimatedTime, xp:lesson.xp },
        objectives:[`Memahami ${lesson.title}`],
        learningPath: ns.map(buildNode),
        quiz:{ questions: qs.map(q=>({ id:q.questionId, question:q.question,
          options:[q.optionA,q.optionB,q.optionC,q.optionD],
          correctAnswer:q.correctAnswer, explanation:q.explanation, points:q.points })) },
        completion:{ title:'Selesai!',
          message:`Kamu telah menyelesaikan topik ${lesson.title}. Kerja bagus!`,
          achievementName:`${lesson.title} - Completed`, achievementIcon:'🎯' }
      };
      const out = path.join(baseDir,lesson.level,lesson.category.toLowerCase(),`${id}.json`);
      fs.mkdirSync(path.dirname(out),{recursive:true});
      fs.writeFileSync(out,JSON.stringify(json,null,2),'utf-8');
      console.log(`OK  ${id}  ->  ${out}`);
      results.push({lessonId:id,outputPath:out,success:true});
    } catch(e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`ERR ${id}: ${msg}`);
      results.push({lessonId:id,outputPath:'',success:false,error:msg});
    }
  }
  return results;
}

if (require.main===module) {
  const args = process.argv.slice(2);
  if (!args[0]) { console.error('Usage: npx ts-node src/engine/csvImport.ts <file.csv>'); process.exit(1); }
  const p = path.resolve(args[0]);
  if (!fs.existsSync(p)) { console.error(`Not found: ${p}`); process.exit(1); }
  const res = importCsv(p);
  if (res.some(r=>!r.success)) process.exit(1);
}