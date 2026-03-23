# Previo — Project Documentation

> **"The bridge between thinking and building."**

---

## Apa Itu Previo?

Previo adalah **local-first pre-coding architecture workspace** — sebuah aplikasi yang membantu tim mengstrukturkan ide proyek menjadi artefak arsitektur yang siap diimplementasi, _sebelum_ menulis satu baris kode pun.

Alurnya sederhana: mulai dari brief mentah → susun requirements → buat diagram arsitektur → validasi konsistensi → hasilkan task board yang sudah terstruktur. Semua dikerjakan dalam satu workspace terpadu tanpa backend.

---

## Tujuan Dibangun

| Masalah | Solusi Previo |
|---|---|
| Brief proyek tidak terstruktur, definisi kabur | Node **Project Brief** dengan field terstandar (objectives, scope, constraints, tech stack) |
| Requirements berserakan di dokumen berbeda | Node **Requirements** dengan FR/NFR, prioritas, dan kategorisasi |
| Diagram tidak konsisten antar artefak | **Cross-validation** otomatis antar semua node |
| Task board tidak terhubung ke arsitektur | **Provenance tracking** — setiap task punya asal-usul dari node mana |
| Sulit tahu apakah proyek siap dikerjakan | **Readiness Model** tiga tier: Blockers / Coverage Gaps / Quality Warnings |

---

## Tech Stack

### Runtime & Framework
| Komponen | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| Language | TypeScript 5 |
| Package Manager | pnpm 10 |
| Node Version | Node.js 22 |

### UI & Styling
| Komponen | Teknologi |
|---|---|
| Styling | Tailwind CSS v4 + tw-animate-css |
| Component Library | shadcn/ui (`@base-ui/react`, `class-variance-authority`) |
| Icons | Lucide React |
| Theme | next-themes (dark/light mode) |

### Canvas & Diagram
| Komponen | Teknologi |
|---|---|
| Node Graph Canvas | `@xyflow/react` (React Flow v12) |
| Diagram Rendering | Mermaid v11 |
| Schema Parsing | `@dbml/core`, `@dbml/parse`, `node-sql-parser` |
| Code Editor | `@uiw/react-codemirror` + CodeMirror |

### AI
| Komponen | Teknologi |
|---|---|
| AI SDK | Vercel AI SDK v6 |
| Provider Utama | Anthropic Claude (`@ai-sdk/anthropic`) |
| Provider Alternatif | Google Gemini (`@ai-sdk/google`) |

### Storage & Export
| Komponen | Teknologi |
|---|---|
| Database | IndexedDB via Dexie v4 |
| Reaktivitas DB | `dexie-react-hooks` (`useLiveQuery`) |
| Export PDF | `jspdf` |
| Export Gambar | `html-to-image` |
| Export Lainnya | Native Blob / CSV / JSON |

---

## Database

### Engine
**IndexedDB** via **Dexie v4** — semua data tersimpan lokal di browser, tidak ada server. Database bernama `"archway"`, saat ini di schema version **9**.

### Skema Tabel

```
projects
  id, name, description, template_type, schema_version,
  delivery_mode, domain, starter_content_intensity, created_at

nodes
  id, project_id, type, status, sort_order,
  source_type, generation_status, override_status,
  imported_at, source_artifact_id

nodeContents
  id, node_id, fields (JSON), mermaid_syntax,
  content_schema_version, reviewed_at, updated_at

edges
  id, project_id, source_node_id, target_node_id

tasks
  id, project_id, source_node_id, source_node_type,
  source_item_id, task_origin, feature_name,
  priority_tier, group_key, status

attachments
  id, node_id, filename, mime_type, data (Blob), created_at

validationWarnings
  id, project_id, source_node_id, target_node_type,
  severity, rule_id, message

sourceArtifacts
  id, project_id, node_id, target_node_type,
  source_type, import_status, parser_version,
  content_schema_version, raw_content

readinessSnapshots
  id, project_id, status, model (JSON),
  computed_at, generation_version
```

### Relasi Antar Tabel

```
projects
  └── nodes (project_id)
        └── nodeContents (node_id)
        └── edges (source_node_id / target_node_id)
        └── tasks (source_node_id)
        └── attachments (node_id)
        └── sourceArtifacts (node_id)
  └── validationWarnings (project_id)
  └── readinessSnapshots (project_id)
```

---

## Node Types (10 Canonical Nodes)

Setiap project adalah **graf node** yang terdiri dari 10 tipe node. Masing-masing punya klasifikasi, sumber import yang didukung, dan kemampuan auto-generate.

| Node | Klasifikasi | Import Didukung | Auto-Generate? |
|---|---|---|---|
| `project_brief` | capture_first | brief_doc, meeting_text, manual | — |
| `requirements` | import_first | requirements_doc, manual | — |
| `user_stories` | import_first | jira_csv, linear_csv, manual | — |
| `use_cases` | derived_assisted | requirements_doc, manual | Ya (dari requirements) |
| `flowchart` | import_first | mermaid, manual | — |
| `dfd` | derived_assisted | mermaid, manual | Ya (dari project data) |
| `erd` | import_first | dbml, sql_schema, manual | — |
| `sequence` | import_first | mermaid, manual | — |
| `task_board` | derived_primary | jira_csv, linear_csv | Ya (dari node content) |
| `summary` | derived_only | — | Ya (auto-derived) |

### Dua Template Project
- **Quick Start** — 5 node inti (brief, requirements, flowchart, task_board, summary)
- **Full Architecture** — semua 10 node

---

## Alur Aplikasi (End-to-End)

### 1. Membuat Project

```
User → "New Project" → CreateProjectDialog
  → pilih: nama, deskripsi, template, delivery_mode, domain
  → ProjectService.createProject()
      → Dexie transaction:
          INSERT projects
          INSERT nodes (sesuai template)
          INSERT nodeContents (kosong/starter content)
          INSERT tasks (jika starter content terisi)
      → buildProjectReadinessModel() → INSERT readinessSnapshots
  → navigate /workspace/{projectId}
```

### 2. Editing di Workspace

```
WorkspaceScreen
  → useWorkspaceData() [useLiveQuery — reaktif ke Dexie]
  → React Flow Canvas: render semua ArchwayNode dan ArchwayEdge

User klik node
  → NodeEditorPanel terbuka (right panel)
      → useNodeEditorData() — load fields dari nodeContents
      → useNodeSync() — debounce-save ke Dexie saat user mengetik
      → tiga mode: entry | editing | review
```

### 3. Import Source

```
User klik "Import source" → SourceImportDialog
  → pilih sourceType (CSV, DBML, SQL, Mermaid, dokumen teks)
  → resolveNodeImport() di sourceIntake.ts
      → routing ke parser yang sesuai
      → return ResolvedNodeImport { fields, mermaid_syntax, review_issues }
  → User review hasil parsing
  → Konfirmasi → applyResolvedImport()
      → update nodeContents.fields
      → INSERT sourceArtifacts (audit trail)
      → update nodes.source_type, generation_status, override_status
```

### 4. Validasi & Readiness

```
CrossValidationService.crossValidateAll()
  → ~17+ rule checks antar node
      contoh: "target users di brief tidak ada user stories"
              "entitas ERD tidak muncul di DFD"
              "requirements orphan (tidak ada story yang link)"
  → INSERT validationWarnings

buildProjectReadinessModel()
  → baca validationWarnings
  → hitung tiga tier:
      Blockers (severity: critical)
      Coverage Gaps (severity: warning)
      Quality Warnings (severity: info)
  → return ReadinessModel { status, blockers, gaps, warnings, nextActions }
  → INSERT readinessSnapshots
```

### 5. Task Board & Export

```
TaskBoardEditor
  → load tasks via TaskRepository
  → tampilkan kolom Kanban: backlog | in_progress | done

Export options:
  → CSV (universal)
  → JSON (raw data)
  → Linear CSV (siap import ke Linear)
  → PDF (via jspdf)
  → Diagram PNG (via html-to-image)
```

### 6. Traceability

```
WorkspaceTraceabilityPanel
  → traceability.ts: buildTraceabilityMatrix()
      → matrix: Brief scope → Requirements → User Stories
                → Use Cases → Diagrams
      → status tiap baris: linked | missing | unresolved
```

---

## Arsitektur & Struktur Folder

```
src/
├── app/                    # Next.js App Router
│   ├── api/ai/             # AI API routes (thin proxies)
│   │   ├── assist/         # AI writing assistance per brief section
│   │   ├── import-document/# AI document extraction
│   │   ├── parse-sql/      # AI SQL parser fallback
│   │   └── status/         # AI provider availability check
│   ├── layout.tsx
│   └── page.tsx
│
├── features/
│   ├── dashboard/          # Project list, creation wizard, filters, stats
│   └── workspace/          # Main canvas, panels, navigation intent
│
├── components/
│   ├── ArchwayNode.tsx     # Custom React Flow node card
│   ├── ArchwayEdge.tsx     # Custom animated edge
│   ├── NodeLivePreview.tsx # Inline diagram preview on node
│   └── editors/            # Semua editor panel per node type
│       ├── NodeEditorPanel.tsx      # Shell/router editor
│       ├── ProjectBriefEditor.tsx
│       ├── RequirementEditor.tsx
│       ├── UserStoryEditor.tsx
│       ├── UseCaseEditor.tsx
│       ├── FlowchartEditor.tsx
│       ├── DFDEditor.tsx
│       ├── ERDEditor.tsx
│       ├── SequenceEditor.tsx
│       ├── TaskBoardEditor.tsx
│       ├── SummaryNodeEditor.tsx
│       └── ValidationSummaryPanel.tsx
│
├── services/
│   ├── ProjectService.ts           # Project lifecycle
│   ├── CrossValidationService.ts   # Cross-node validation rules
│   └── taskEngine/                 # Task generation logic
│
├── repositories/           # Data access layer (Repository pattern)
│   ├── NodeRepository.ts
│   ├── TaskRepository.ts
│   ├── ProjectRepository.ts
│   ├── SourceArtifactRepository.ts
│   ├── ReadinessRepository.ts
│   ├── MiscRepository.ts
│   └── EdgeRepository.ts
│
└── lib/
    ├── db.ts               # Dexie database definition + migrasi
    ├── canonical.ts        # TypeScript interfaces semua node field
    ├── nodeCapabilities.ts # Registry kapabilitas per node type
    ├── sourceIntake.ts     # Pipeline parsing semua format import
    ├── readiness.ts        # buildProjectReadinessModel()
    ├── exportEngine.ts     # Export ke CSV/JSON/PDF/PNG
    ├── nodeDerivations.ts  # Auto-generation logic
    ├── methodologyEngine.ts# Agile/waterfall/hybrid content logic
    ├── projectStarters.ts  # Starter content per domain
    ├── workspaceEngine.ts  # Node position persistence
    ├── parseDbml.ts        # DBML → ERD fields parser
    ├── parseSql.ts         # SQL → ERD fields parser
    └── ai/
        ├── config.ts       # Provider selection (Anthropic / Google)
        ├── model.ts        # Model instance factory
        ├── prompts.ts      # Structured AI prompts (multilingual)
        └── json.ts         # Robust JSON extractor dari AI response
```

---

## Pola Arsitektur Utama

### 1. Local-First
Tidak ada backend. Semua data di IndexedDB. AI features opsional via env keys, diproxy melalui Next.js API routes.

### 2. Reactive Data Flow
Semua data workspace menggunakan `useLiveQuery()` dari Dexie — perubahan di satu panel langsung terefleksi di canvas tanpa state propagation manual.

### 3. Provenance Tracking
Setiap node dan task membawa metadata asal: `source_type`, `generation_status`, `override_status`, `task_origin`, `generation_rule`, `upstream_refs`. Ini yang memungkinkan Traceability Panel mengaudit lineage dari brief hingga task.

### 4. Two-Phase Import (Resolve → Apply)
Import source melalui dua tahap:
1. `resolveNodeImport()` — parsing dan return hasil + review issues (belum commit)
2. `applyResolvedImport()` — commit ke DB setelah user konfirmasi

### 5. Repository Pattern
Semua akses data diabstraksi ke repository classes, memisahkan service/component layer dari implementasi Dexie.

### 6. Dynamic Imports untuk Panel Berat
`WorkspaceScreen` menggunakan `next/dynamic` dengan `ssr: false` untuk `NodeEditorPanel`, `ValidationSummaryPanel`, dan `WorkspaceTraceabilityPanel`.

---

## Testing

### Unit Tests (Vitest)
```bash
pnpm test:unit
```
Lokasi: `tests/unit/` — 18 file test mencakup:
- `taskEngine`, `readiness`, `nodeCapabilities`
- `sourceIntake`, `exportEngine`, `methodologyEngine`
- `nodeDerivations`, `workflowRegistry`, `erd`
- `aiJson`, `aiPrompts`, `taskProvenance`
- `projectStarters`, `sourceArtifacts`, `nodeValidation`

### E2E Tests (Playwright)
```bash
pnpm test:e2e        # dev (port 3000)
pnpm test:e2e:prod   # production build (port 3001)
```
Lokasi: `tests/*.spec.ts` — 8 spec file:
- `smoke.spec.ts` — basic project creation
- `features.spec.ts` — fitur utama (wizard, filters, validation, editors)
- `editor-ux.spec.ts` — editor UX flows
- `phase3-workspace.spec.ts` — workspace interaction
- `accessibility.spec.ts` — a11y checks
- `visual-regression.spec.ts` — screenshot comparison
- `release-readiness.spec.ts` — pre-release smoke
- `prod-smoke.spec.ts` — production smoke

### CI/CD
GitHub Actions di `.github/workflows/pipeline.yml` pada Node 22.
Pre-commit hooks via Husky.

---

## Cara Menjalankan

```bash
# Install dependencies
pnpm install

# Development
pnpm dev          # http://localhost:3000

# Build production
pnpm build
pnpm start        # http://localhost:3000

# Testing
pnpm test:unit    # unit tests
pnpm test:e2e     # E2E tests (perlu dev server berjalan)

# Type checking
pnpm type-check
```

### Environment Variables (Opsional untuk AI)
```env
ANTHROPIC_API_KEY=sk-ant-...      # Untuk Claude
GOOGLE_GENERATIVE_AI_API_KEY=...  # Untuk Gemini (alternatif)
```

---

## File Kunci

| File | Fungsi |
|---|---|
| [src/lib/db.ts](src/lib/db.ts) | Database schema dan semua migrasi |
| [src/lib/canonical.ts](src/lib/canonical.ts) | TypeScript interfaces semua node field type |
| [src/lib/nodeCapabilities.ts](src/lib/nodeCapabilities.ts) | Registry kapabilitas per node type |
| [src/lib/sourceIntake.ts](src/lib/sourceIntake.ts) | Pipeline parsing semua format import (file terbesar, 41.5KB) |
| [src/lib/readiness.ts](src/lib/readiness.ts) | `buildProjectReadinessModel()` |
| [src/features/workspace/WorkspaceScreen.tsx](src/features/workspace/WorkspaceScreen.tsx) | Main workspace shell |
| [src/features/dashboard/DashboardScreen.tsx](src/features/dashboard/DashboardScreen.tsx) | Dashboard utama |
| [src/components/editors/NodeEditorPanel.tsx](src/components/editors/NodeEditorPanel.tsx) | Editor shell / router ke semua editor |
| [src/services/ProjectService.ts](src/services/ProjectService.ts) | Project lifecycle |
| [src/services/CrossValidationService.ts](src/services/CrossValidationService.ts) | Cross-node validation rules |
| [src/services/taskEngine/index.ts](src/services/taskEngine/index.ts) | Task generation logic |
| [src/features/dashboard/projectTemplates.ts](src/features/dashboard/projectTemplates.ts) | Workflow template definitions |
| [src/features/workspace/traceability.ts](src/features/workspace/traceability.ts) | Traceability matrix logic |
