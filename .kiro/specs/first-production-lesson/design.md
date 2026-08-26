# Design Document

## Feature: first-production-lesson

---

## Overview

This feature delivers the first production lesson for the BITS2BYTES Lesson Engine as a single JSON file: `public/lessons/beginner/html/beginner-html-01.json`. No engine code, schema, TypeScript types, or React components are modified. The design documents the complete structure and content of the JSON, maps every field to the UI components that consume it, and specifies correctness properties the task phase will verify with automated tests.

The lesson teaches HTML fundamentals in Bahasa Indonesia to Indonesian middle-school and high-school students (SMP–SMA). It is entirely self-contained and passes all four quality gates: `node scripts/validate-lesson.mjs`, `npx tsc --noEmit`, `npm run lint`, and `npm test`.

---

## Architecture

### Component / Data Flow

```
beginner-html-01.json
        │
        ├── validated by  → scripts/validate-lesson.mjs  (AJV + semantic checks)
        ├── typed by      → src/types/lesson.ts           (Lesson interface)
        ├── loaded by     → src/engine/loader.ts          (loadLesson)
        ├── validated by  → src/engine/validator.ts       (validateLesson)
        └── rendered by   → src/components/nodes/
                                LessonNodeView.tsx
                                CodeNodeView.tsx
                                PracticeNodeView.tsx
                                ChallengeNodeView.tsx
                                QuizEngine.tsx / QuizQuestionCard.tsx
```

The JSON file is the single source of truth. All other layers are read-only from the perspective of this feature.

---

## UI Component Field Consumption Map

This section documents exactly which JSON fields each UI component reads, so the task phase knows which fields are load-bearing.

### LessonNodeView (`type: "lesson"`)

| JSON field | Required by component | Notes |
|---|---|---|
| `id` | Yes (engine routing) | |
| `type` | Yes (dispatcher) | |
| `title` | Yes | Rendered as `<h2>` |
| `explanation` | Yes | Rendered in `.lesson-panel`; falls back to italic placeholder if absent |
| `analogy` | Optional | Rendered in blue callout if present and non-empty |
| `expectedResult` | Optional | Rendered in green callout if present and non-empty |
| `tips` | Optional | Rendered as list in yellow callout if array is non-empty |
| `xp` | Optional | Read by `awardNodeXP` in engine |

### CodeNodeView (`type: "code"`)

| JSON field | Required by component | Notes |
|---|---|---|
| `id` | Yes | |
| `type` | Yes | |
| `title` | Yes | Rendered as `<h2>` |
| `explanation` | Optional | Rendered above code block if present and non-empty |
| `code.language` | Yes | Rendered as uppercase label in code shell header |
| `code.content` | Yes | Rendered verbatim in `<pre><code>` block |
| `xp` | Optional | Read by engine |

### PracticeNodeView (`type: "practice"`)

| JSON field | Required by component | Notes |
|---|---|---|
| `id` | Yes | |
| `type` | Yes | |
| `title` | Yes | Rendered as `<h2>` |
| `instructions` | Yes | Rendered as `<p>` above interaction area |
| `interactionType` | Yes | `"multiple-choice"` renders radio buttons; `"step-completion"` renders checkboxes |
| `options` | Required when `interactionType === "multiple-choice"` | Array of 4 strings |
| `correctOption` | Required when `interactionType === "multiple-choice"` | Must be byte-identical to one element of `options` |
| `steps` | Required when `interactionType === "step-completion"` | Array of step strings |
| `xp` | Optional | Read by engine |

### ChallengeNodeView (`type: "challenge"`)

| JSON field | Required by component | Notes |
|---|---|---|
| `id` | Yes | |
| `type` | Yes | |
| `title` | Yes | Rendered as `<h2>` |
| `instructions` | Yes | Rendered in primary-colour callout box |
| `starterCode.language` | Optional | Rendered as language label in code shell |
| `starterCode.content` | Optional | Rendered verbatim if `starterCode` present |
| `expectedResult` | Optional | Rendered in green callout if present and non-empty |
| `solution` | Optional | Not rendered by ChallengeNodeView directly; read in review mode / task phase |
| `xp` | Optional | Read by engine |

### QuizEngine / QuizQuestionCard (`type: "quiz"` node + top-level `quiz` object)

The `quiz` node in `learningPath` carries only `id`, `type`, and `title`. All question data comes from the top-level `quiz.questions` array.

| JSON field | Required by component | Notes |
|---|---|---|
| `quiz.questions[n].id` | Yes | Used as key for answer tracking |
| `quiz.questions[n].question` | Yes | Rendered as question text |
| `quiz.questions[n].options` | Yes | Exactly 4 strings; rendered as radio buttons |
| `quiz.questions[n].correctAnswer` | Yes | Must be byte-identical to one element of `options`; used for scoring |
| `quiz.questions[n].explanation` | Yes | Shown in QuizReview after submission |
| `quiz.questions[n].points` | Yes | Used for score calculation; `maxScore = sum(points)` |

---

## Complete JSON Structure Design

### Top-Level Shape

```json
{
  "schemaVersion": "1.0",
  "metadata": { ... },
  "introduction": { ... },
  "objectives": [ ... ],
  "review": { ... },
  "learningPath": [ ... 10 nodes ... ],
  "quiz": { "questions": [ ... 5 questions ... ] },
  "completion": { ... }
}
```

---

### Metadata Block

```json
{
  "id": "beginner-html-01",
  "title": "Build Your First Web Page",
  "description": "Pelajari struktur dasar HTML dan buat halaman web mini pribadimu sendiri dari nol.",
  "level": "beginner",
  "category": "HTML",
  "topicNumber": 1,
  "estimatedTime": 30,
  "xp": 100
}
```

Constraints satisfied:
- `description` is 79 characters — well within the 500-character limit
- `level` is one of the three valid enum values
- `xp: 100` satisfies the 0–10000 range
- `estimatedTime: 30` is a positive integer
- `topicNumber: 1` is an integer ≥ 1

---

### Introduction Block

Schema allows only four fields: `title`, `description`, `analogy`, `prerequisites`. The `introduction` object uses `additionalProperties: false`, so `learningObjectives` and `estimatedTime` are forbidden.

```json
{
  "title": "Selamat Datang di HTML!",
  "description": "HTML adalah bahasa yang digunakan untuk membangun setiap halaman web di internet. Di topik ini kamu akan belajar cara membuat file HTML, memahami strukturnya, menambahkan teks, gambar, dan link — lalu menyatukan semuanya menjadi halaman web mini pribadimu.",
  "analogy": "Bayangkan HTML seperti kerangka sebuah rumah. Sebelum ada cat atau perabotan, kamu butuh rangka yang kokoh dulu. HTML adalah rangka itu — ia memberi bentuk dan struktur pada halaman web."
}
```

---

### Objectives Array (top-level)

Seven non-empty strings in Bahasa Indonesia:

```json
[
  "Membuat file HTML dasar",
  "Memahami struktur dokumen HTML",
  "Menggunakan heading dan paragraf",
  "Menambahkan gambar ke halaman web",
  "Menambahkan hyperlink ke halaman web",
  "Menggabungkan elemen-elemen menjadi halaman web mini pribadi",
  "Memahami bahwa HTML memberikan struktur dan konten pada halaman web"
]
```

---

### Review Block

```json
{
  "learned": [
    "HTML adalah bahasa markup yang memberi struktur pada halaman web.",
    "Setiap dokumen HTML lengkap memiliki <!DOCTYPE html>, <html>, <head>, dan <body>.",
    "Tag <h1> sampai <h6> digunakan untuk heading, <p> untuk paragraf.",
    "Tag <img> digunakan untuk menampilkan gambar dengan atribut src dan alt.",
    "Tag <a> digunakan untuk membuat hyperlink dengan atribut href."
  ],
  "keyConcepts": [
    "Markup language",
    "Struktur dokumen HTML",
    "Heading dan paragraf",
    "Tag gambar <img>",
    "Tag link <a> dan atribut href"
  ],
  "takeaways": [
    "Semua konten yang terlihat oleh pengunjung diletakkan di dalam <body>.",
    "Gunakan satu <h1> sebagai judul utama halaman.",
    "Atribut alt pada <img> penting untuk aksesibilitas.",
    "Atribut href pada <a> menentukan ke mana link akan menuju."
  ]
}
```

---

### Learning Path — 10 Nodes

Node type distribution: 2 lesson · 5 code · 1 practice · 1 challenge · 1 quiz = 10 total.

XP budget: nodes 01–07 carry 5 XP each (35 total), node-08-practice carries 10, node-09-challenge carries 15. Combined node XP = 60. Completion XP from `metadata.xp = 100`. Grand total possible = 160 XP.

#### Node 01 — `node-01-welcome` (lesson)

```json
{
  "id": "node-01-welcome",
  "type": "lesson",
  "title": "Apa Itu HTML?",
  "xp": 5,
  "explanation": "HTML singkatan dari HyperText Markup Language. Ini adalah bahasa yang digunakan untuk membangun setiap halaman web yang pernah kamu kunjungi. Saat kamu membuka sebuah website, browser membaca file HTML dan menampilkannya sebagai halaman yang kamu lihat.\n\nHTML bukan bahasa pemrograman seperti Python atau JavaScript. HTML adalah bahasa markup — artinya kamu menandai (mark up) konten untuk memberitahu browser bagaimana cara menampilkannya.\n\nKamu tidak perlu software khusus. Cukup teks editor (seperti Notepad atau VS Code) dan browser.",
  "analogy": "Bayangkan kamu sedang mengirim surat ke tukang cetak dengan instruksi khusus: 'cetak kata ini tebal', 'mulai paragraf baru di sini'. HTML persis seperti itu — instruksi yang dibungkus di sekitar kontenmu.",
  "tips": [
    "HTML bukan bahasa pemrograman — kamu tidak menulis logika, kamu menulis struktur.",
    "Setiap halaman web yang pernah kamu lihat dibangun dengan HTML sebagai pondasinya."
  ]
}
```

Fields consumed by LessonNodeView: `title`, `explanation` (rendered in lesson panel), `analogy` (blue callout), `tips` (yellow callout list).

#### Node 02 — `node-02-create-file` (lesson)

```json
{
  "id": "node-02-create-file",
  "type": "lesson",
  "title": "Buat File HTML Pertamamu",
  "xp": 5,
  "explanation": "File HTML adalah file teks biasa dengan ekstensi .html. Kamu bisa membuatnya di mana saja di komputermu.\n\nCara membuat file HTML:\n1. Buka teks editor (VS Code, Notepad, atau teks editor lainnya)\n2. Buat file baru\n3. Simpan dengan nama index.html\n4. Buka file tersebut di browser untuk melihat hasilnya\n\nNama file index.html adalah konvensi standar untuk halaman utama sebuah website.",
  "expectedResult": "Kamu memahami bahwa file HTML adalah file teks biasa dengan ekstensi .html yang bisa dibuka di browser.",
  "tips": [
    "Selalu gunakan huruf kecil untuk nama file HTML — hindari spasi, gunakan tanda hubung jika perlu.",
    "Simpan file dengan ekstensi .html, bukan .txt."
  ]
}
```

Fields consumed: `title`, `explanation`, `expectedResult` (green callout), `tips`.

#### Node 03 — `node-03-skeleton` (code) — Baseline

This is the foundation. Every subsequent code node adds to this skeleton.

```json
{
  "id": "node-03-skeleton",
  "type": "code",
  "title": "Kerangka Dokumen HTML",
  "xp": 5,
  "explanation": "Setiap file HTML yang valid harus memiliki kerangka dasar ini. Anggap ini seperti 'boilerplate' — template awal yang selalu kamu gunakan.\n\nBagian-bagiannya:\n• <!DOCTYPE html> — memberitahu browser ini adalah dokumen HTML5\n• <html> — seperti pagar yang membungkus seluruh halaman\n• <head> — berisi informasi tentang halaman (tidak terlihat di layar)\n• <title> — judul yang muncul di tab browser\n• <body> — semua konten yang terlihat oleh pengunjung ada di sini",
  "code": {
    "language": "html",
    "content": "<!DOCTYPE html>\n<html lang=\"id\">\n  <head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Halaman Web Pertamaku</title>\n  </head>\n  <body>\n    <!-- Konten halaman akan ditulis di sini -->\n  </body>\n</html>"
  }
}
```

Contains: `<!DOCTYPE html>`, `<html>`, `<head>`, `<body>`.

#### Node 04 — `node-04-heading` (code) — Adds h1/h2/h3

Incremental addition: all of node-03 skeleton + heading tags inside `<body>`.

```json
{
  "id": "node-04-heading",
  "type": "code",
  "title": "Tambahkan Heading",
  "xp": 5,
  "explanation": "Heading digunakan untuk judul dan sub-judul. HTML menyediakan 6 level heading dari <h1> (paling besar) sampai <h6> (paling kecil).\n\nGunakan <h1> untuk judul utama halaman — hanya satu per halaman. Gunakan <h2> untuk judul bagian, <h3> untuk sub-bagian, dan seterusnya.\n\nAnggap <h1> seperti judul besar di poster — langsung menarik perhatian dan menjelaskan topik utama halaman.",
  "code": {
    "language": "html",
    "content": "<!DOCTYPE html>\n<html lang=\"id\">\n  <head>\n    <meta charset=\"UTF-8\">\n    <title>Halaman Web Pertamaku</title>\n  </head>\n  <body>\n    <h1>Halo, Dunia!</h1>\n    <h2>Tentang Saya</h2>\n    <h3>Hobi Saya</h3>\n  </body>\n</html>"
  }
}
```

Adds over node-03: `<h1>`, `<h2>`, `<h3>` inside `<body>`.

#### Node 05 — `node-05-paragraph` (code) — Adds p tags

Incremental addition: node-04 base + paragraph tags.

```json
{
  "id": "node-05-paragraph",
  "type": "code",
  "title": "Tambahkan Paragraf",
  "xp": 5,
  "explanation": "Tag <p> digunakan untuk paragraf teks biasa. Browser secara otomatis menambahkan jarak antar paragraf, jadi kamu tidak perlu menekan Enter berkali-kali.\n\nBayangkan <p> seperti paragraf di dalam sebuah buku — setiap blok teks yang menyampaikan satu ide dibungkus dalam tag <p>.",
  "code": {
    "language": "html",
    "content": "<!DOCTYPE html>\n<html lang=\"id\">\n  <head>\n    <meta charset=\"UTF-8\">\n    <title>Halaman Web Pertamaku</title>\n  </head>\n  <body>\n    <h1>Halo, Dunia!</h1>\n    <p>Nama saya Budi. Saya sedang belajar membuat halaman web dengan HTML.</p>\n\n    <h2>Tentang Saya</h2>\n    <p>Saya adalah pelajar SMP yang tertarik dengan dunia teknologi dan coding.</p>\n  </body>\n</html>"
  }
}
```

Adds over node-04: `<p>` elements alongside existing headings.

#### Node 06 — `node-06-image` (code) — Adds img

```json
{
  "id": "node-06-image",
  "type": "code",
  "title": "Tambahkan Gambar",
  "xp": 5,
  "explanation": "Tag <img> digunakan untuk menampilkan gambar di halaman web. Berbeda dengan tag lain, <img> adalah self-closing tag — tidak ada tag penutup.\n\nDua atribut penting:\n• src — sumber gambar (URL atau path file)\n• alt — teks alternatif yang ditampilkan jika gambar gagal dimuat (penting untuk aksesibilitas)\n\nBayangkan <img> seperti menempelkan foto ke sebuah poster — kamu perlu tahu dari mana fotonya (src) dan apa keterangan fotonya (alt).",
  "code": {
    "language": "html",
    "content": "<!DOCTYPE html>\n<html lang=\"id\">\n  <head>\n    <meta charset=\"UTF-8\">\n    <title>Halaman Web Pertamaku</title>\n  </head>\n  <body>\n    <h1>Halo, Dunia!</h1>\n    <p>Nama saya Budi. Saya sedang belajar membuat halaman web.</p>\n\n    <h2>Foto Saya</h2>\n    <img src=\"foto-saya.jpg\" alt=\"Foto profil Budi\">\n  </body>\n</html>"
  }
}
```

Adds over node-05: `<img>` tag with `src` and `alt`.

#### Node 07 — `node-07-link` (code) — Adds a href

```json
{
  "id": "node-07-link",
  "type": "code",
  "title": "Tambahkan Hyperlink",
  "xp": 5,
  "explanation": "Tag <a> digunakan untuk membuat hyperlink — tautan yang bisa diklik untuk berpindah ke halaman lain atau website lain.\n\nAtribut href (hypertext reference) menentukan ke mana link akan menuju. Teks di antara tag pembuka dan penutup adalah teks yang terlihat dan bisa diklik.\n\nBayangkan <a> seperti pintu di sebuah ruangan — pintu itu membawamu ke tempat lain. href adalah alamat tempat tujuannya.",
  "code": {
    "language": "html",
    "content": "<!DOCTYPE html>\n<html lang=\"id\">\n  <head>\n    <meta charset=\"UTF-8\">\n    <title>Halaman Web Pertamaku</title>\n  </head>\n  <body>\n    <h1>Halo, Dunia!</h1>\n    <p>Nama saya Budi. Saya sedang belajar membuat halaman web.</p>\n\n    <h2>Link Favorit Saya</h2>\n    <p>Kunjungi <a href=\"https://www.google.com\">Google</a> untuk mencari informasi.</p>\n  </body>\n</html>"
  }
}
```

Adds over node-06: `<a href="...">` tag. This is the final "complete individual element" code node. The challenge node builds on all elements shown in nodes 03–07.

#### Node 08 — `node-08-mini-page` (practice)

Multiple-choice question. The `correctOption` must be byte-identical to one element of `options`.

```json
{
  "id": "node-08-mini-page",
  "type": "practice",
  "title": "Rakit Halaman Web Mini",
  "xp": 10,
  "instructions": "Elemen mana yang digunakan untuk menampilkan gambar di halaman web?",
  "interactionType": "multiple-choice",
  "options": [
    "<picture>",
    "<img>",
    "<image>",
    "<photo>"
  ],
  "correctOption": "<img>"
}
```

PracticeNodeView reads: `title`, `instructions`, `interactionType`, `options`, `correctOption`.

Design rationale for distractors:
- `<picture>` — exists in HTML5 but is not the basic image tag
- `<image>` — common misconception (SVG uses `<image>`)
- `<photo>` — plausible but non-existent

#### Node 09 — `node-09-challenge` (challenge)

The challenge synthesises all five code nodes. The `solution` object uses the schema-supported shape: `language`, `code`, `explanation`.

```json
{
  "id": "node-09-challenge",
  "type": "challenge",
  "title": "Mini Challenge: Halaman Web Pribadimu",
  "xp": 15,
  "instructions": "Sekarang saatnya kamu membangun halaman web mini pribadimu!\n\nTugasmu: Lengkapi kode di bawah ini dengan menambahkan:\n1. Satu heading baru bernama 'My Hobbies' menggunakan tag <h2>\n2. Satu paragraf yang menjelaskan hobby kamu menggunakan tag <p>\n\nGunakan kode starter di bawah sebagai titik awalmu.",
  "starterCode": {
    "language": "html",
    "content": "<!DOCTYPE html>\n<html lang=\"id\">\n  <head>\n    <meta charset=\"UTF-8\">\n    <title>Halaman Web Pertamaku</title>\n  </head>\n  <body>\n    <h1>Halo! Nama Saya [Namamu]</h1>\n    <p>Saya adalah pelajar yang sedang belajar membuat halaman web dengan HTML.</p>\n\n    <img src=\"foto-saya.jpg\" alt=\"Foto profil saya\">\n\n    <p>Kunjungi <a href=\"https://www.google.com\">Google</a> untuk mencari informasi.</p>\n\n    <!-- Tambahkan heading dan paragraf hobby kamu di sini -->\n\n  </body>\n</html>"
  },
  "expectedResult": "Halaman web dengan h1, dua paragraf, satu gambar, satu link, dan satu h2 bernama 'My Hobbies' beserta paragraf yang mendeskripsikan hobby kamu.",
  "solution": {
    "language": "html",
    "code": "<!DOCTYPE html>\n<html lang=\"id\">\n  <head>\n    <meta charset=\"UTF-8\">\n    <title>Halaman Web Pertamaku</title>\n  </head>\n  <body>\n    <h1>Halo! Nama Saya [Namamu]</h1>\n    <p>Saya adalah pelajar yang sedang belajar membuat halaman web dengan HTML.</p>\n\n    <img src=\"foto-saya.jpg\" alt=\"Foto profil saya\">\n\n    <p>Kunjungi <a href=\"https://www.google.com\">Google</a> untuk mencari informasi.</p>\n\n    <h2>My Hobbies</h2>\n    <p>Hobi saya adalah membaca buku, bermain bola, dan belajar coding.</p>\n  </body>\n</html>",
    "explanation": "Kita menambahkan <h2>My Hobbies</h2> sebagai judul bagian baru dan tag <p> berisi deskripsi hobby. Keduanya diletakkan di dalam <body> agar terlihat di halaman."
  }
}
```

Schema validation notes:
- `solution.language` — required, non-empty string ≤ 50 chars: `"html"` ✓
- `solution.code` — required, non-empty string ≤ 50000 chars: full HTML ✓
- `solution.explanation` — optional, non-empty string ≤ 1000 chars: Indonesian explanation ✓
- `solution` uses `additionalProperties: false` — no extra fields allowed

#### Node 10 — `node-10-quiz` (quiz)

```json
{
  "id": "node-10-quiz",
  "type": "quiz",
  "title": "Uji Pengetahuanmu"
}
```

The quiz node carries no question data — all questions live in the top-level `quiz.questions` array, sourced by QuizEngine.

---

### Quiz Block — 5 Questions

All questions are in Bahasa Indonesia. Each has exactly 4 options, and `correctAnswer` is byte-identical to one option.

Total points: 5 × 20 = 100 points.

#### Question 01 — HTML purpose

```json
{
  "id": "q01",
  "question": "Apa fungsi utama HTML dalam pembuatan halaman web?",
  "options": [
    "Memberikan tampilan warna dan gaya pada halaman web",
    "Menjalankan logika dan perhitungan di halaman web",
    "Memberikan struktur dan konten pada halaman web",
    "Menghubungkan halaman web ke database"
  ],
  "correctAnswer": "Memberikan struktur dan konten pada halaman web",
  "explanation": "HTML (HyperText Markup Language) adalah bahasa markup yang bertugas memberikan struktur dan konten pada halaman web. Tampilan (warna, font) adalah tugas CSS, sedangkan logika adalah tugas JavaScript.",
  "points": 20
}
```

#### Question 02 — h1 tag

```json
{
  "id": "q02",
  "question": "Apa fungsi tag <h1> dalam HTML?",
  "options": [
    "Membuat teks menjadi tebal",
    "Membuat judul utama halaman yang paling besar",
    "Membuat hyperlink ke halaman lain",
    "Menampilkan gambar di halaman web"
  ],
  "correctAnswer": "Membuat judul utama halaman yang paling besar",
  "explanation": "Tag <h1> digunakan untuk judul utama halaman dan menampilkan teks paling besar di antara semua level heading (h1–h6). Sebaiknya hanya ada satu <h1> di setiap halaman karena itu adalah judul utama.",
  "points": 20
}
```

#### Question 03 — p tag

```json
{
  "id": "q03",
  "question": "Apa fungsi tag <p> dalam HTML?",
  "options": [
    "Membuat heading atau judul",
    "Menampilkan gambar",
    "Membuat blok teks paragraf",
    "Membuat tombol yang bisa diklik"
  ],
  "correctAnswer": "Membuat blok teks paragraf",
  "explanation": "Tag <p> mendefinisikan sebuah paragraf teks. Browser secara otomatis menambahkan jarak (margin) di atas dan bawah setiap paragraf, sehingga konten teks terlihat rapi dan terpisah dengan jelas.",
  "points": 20
}
```

#### Question 04 — img and src

```json
{
  "id": "q04",
  "question": "Apa fungsi tag <img> dan atribut src pada HTML?",
  "options": [
    "Membuat link yang bisa diklik menuju halaman lain",
    "Menampilkan gambar; src menentukan sumber atau lokasi file gambar",
    "Menampilkan video; src menentukan format videonya",
    "Membuat kotak input untuk pengguna mengisi teks"
  ],
  "correctAnswer": "Menampilkan gambar; src menentukan sumber atau lokasi file gambar",
  "explanation": "Tag <img> digunakan untuk menampilkan gambar di halaman web. Atribut src (source) menentukan lokasi file gambar — bisa berupa path file lokal atau URL gambar online. Jangan lupa juga menambahkan atribut alt untuk aksesibilitas.",
  "points": 20
}
```

#### Question 05 — a and href

```json
{
  "id": "q05",
  "question": "Apa fungsi tag <a> dan atribut href dalam HTML?",
  "options": [
    "Membuat gambar yang bisa di-zoom saat diklik",
    "Membuat teks berwarna merah sebagai penanda penting",
    "Membuat hyperlink; href menentukan alamat tujuan link",
    "Membuat heading dengan garis bawah otomatis"
  ],
  "correctAnswer": "Membuat hyperlink; href menentukan alamat tujuan link",
  "explanation": "Tag <a> (anchor) digunakan untuk membuat hyperlink. Atribut href (hypertext reference) menentukan ke mana pengguna akan diarahkan saat mengklik link tersebut — bisa berupa URL website lain atau path ke halaman lain di website yang sama.",
  "points": 20
}
```

---

### Completion Block

```json
{
  "title": "Topik Selesai!",
  "message": "Keren! Kamu baru saja membuat halaman web pertamamu. Setiap website di internet dimulai persis dari tempat kamu berada sekarang.",
  "achievementName": "Web Builder Pertama",
  "achievementIcon": "🌐"
}
```

Schema allows `achievementIcon` as an optional string — present here as required by Requirement 4.5.

---

## Schema Compliance Checklist

| Rule | Value | Status |
|---|---|---|
| `schemaVersion` matches `^\d+\.\d+$` | `"1.0"` | ✓ |
| `schemaVersion` MAJOR = 1 | `1` | ✓ |
| `metadata` has all 8 required fields | id, title, description, level, category, topicNumber, estimatedTime, xp | ✓ |
| `metadata.level` is valid enum | `"beginner"` | ✓ |
| `metadata.xp` 0–10000 | `100` | ✓ |
| `metadata.estimatedTime` positive int | `30` | ✓ |
| `objectives` non-empty array of non-empty strings | 7 strings | ✓ |
| `learningPath` length | 10 | ✓ |
| `learningPath` type distribution | 2 lesson, 5 code, 1 practice, 1 challenge, 1 quiz | ✓ |
| All `code` nodes have `code.language` + `code.content` | nodes 03–07 | ✓ |
| `challenge` node has `solution.language` + `solution.code` | node-09 | ✓ |
| `quiz.questions` exactly 5 | 5 questions | ✓ |
| All questions have exactly 4 options | q01–q05 | ✓ |
| All `correctAnswer` values match an option byte-for-byte | q01–q05 | ✓ |
| `introduction` uses only schema-supported fields | title, description, analogy | ✓ |
| `introduction` does NOT contain `learningObjectives` | absent | ✓ |
| `introduction` does NOT contain `estimatedTime` | absent | ✓ |
| `completion` has title, message, achievementName | all present | ✓ |
| `completion` has `achievementIcon` | `"🌐"` | ✓ |
| All node `id` values are unique | 10 distinct ids | ✓ |
| All question `id` values are unique | q01–q05 | ✓ |
| All `id` lengths 1–100 chars | longest is "node-09-challenge" (17 chars) | ✓ |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Quiz question integrity

*For any* question in `quiz.questions`, the question SHALL have exactly 4 options and its `correctAnswer` field SHALL be a string that is byte-for-byte identical to one element in its `options` array.

**Validates: Requirements 3.2, 3.3, 3.4**

### Property 2: Node and question identifier uniqueness and length invariant

*For any* two nodes in `learningPath` with different array indices, their `id` values SHALL differ. *For all* nodes, `id` SHALL be a non-empty string of at most 100 characters. The same uniqueness invariant SHALL hold for all question `id` values in `quiz.questions`.

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 3: Introduction block contains no unsupported fields

*For any* version of the lesson JSON that includes an `introduction` block, the `introduction` object SHALL NOT contain a `learningObjectives` key or an `estimatedTime` key.

**Validates: Requirements 4.3, 7.1, 7.2**

### Property 4: All code nodes provide non-empty language and content

*For any* node in `learningPath` whose `type` is `"code"`, the node SHALL have a `code` object with a non-empty `language` string and a non-empty `content` string.

**Validates: Requirements 2.7**

---

## Error Handling

Since this feature is content-only, error handling is entirely delegated to existing engine layers:

- **Schema validation errors**: `validateLesson` returns `{ valid: false, errors: string[] }` listing all AJV violations. The validator uses `allErrors: true` to surface all issues in one pass.
- **Missing required fields**: AJV schema with `required` arrays on all objects catches missing fields.
- **Wrong `schemaVersion`**: The engine's MAJOR version check in `validator.ts` rejects versions other than `1.x` before AJV runs.
- **`additionalProperties: false`** on `metadata`, `introduction`, `quiz.questions[n]`, `completion`, and `solution` ensures no forbidden fields are accepted silently.
- **Incremental code content**: No engine validation — correctness is ensured by the design (each code node's content visibly contains all elements from prior nodes) and verified by the task-phase tests.

---

## Testing Strategy

### Dual Testing Approach

Unit/example tests verify specific structural and content facts about the lesson JSON. Property tests verify universal invariants across all nodes and questions.

### Example-Based Tests (task phase will implement)

These cover the concrete single-value assertions:

- `metadata.id === 'beginner-html-01'`
- `metadata.level === 'beginner'`
- `metadata.xp === 100`
- `metadata.estimatedTime === 30`
- `learningPath.length === 10`
- Node type counts: 2 lesson, 5 code, 1 practice, 1 challenge, 1 quiz
- `quiz.questions.length === 5`
- `introduction.title`, `introduction.description`, `introduction.analogy` are non-empty
- `review.learned.length > 0`, `review.keyConcepts.length > 0`, `review.takeaways.length > 0`
- `completion.achievementIcon` is a non-empty string
- Challenge node `solution.language`, `solution.code`, `solution.explanation` are non-empty

### Property-Based Tests (task phase will implement)

Four properties from the Correctness Properties section above, each verified by iterating over all nodes/questions in the lesson JSON:

**Property 1** — Quiz question integrity:
```typescript
// For every question q in quiz.questions:
// q.options.length === 4
// q.options.includes(q.correctAnswer)
```

**Property 2** — Identifier uniqueness and length:
```typescript
// All node ids are unique: new Set(ids).size === ids.length
// All node ids: id.length >= 1 && id.length <= 100
// All question ids are unique: new Set(qIds).size === qIds.length
```

**Property 3** — Introduction block field exclusion:
```typescript
// !('learningObjectives' in lesson.introduction)
// !('estimatedTime' in lesson.introduction)
```

**Property 4** — Code node completeness:
```typescript
// For every node n where n.type === 'code':
// n.code.language.length > 0
// n.code.content.length > 0
```

The existing `validator.test.ts` real-lesson test ("validates the real beginner-html-01 lesson with zero errors") covers Requirements 1.1–1.9, 5.2 holistically, and is not duplicated.
