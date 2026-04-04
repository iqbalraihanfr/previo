# Previo — Claude Code Context

## What is Previo

Import-first pre-coding documentation workspace. Transforms scattered project artifacts (briefs, ERDs, flowcharts) into validated structure, task plans, and review-ready summaries. **Not** a whiteboard, task manager, or AI chatbot.

Position in workflow: `[Scattered Docs] → Previo (import, validate, generate tasks) → [Task Management] → [Coding]`

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript + React 19
- **Styling**: Tailwind CSS 4 + shadcn/ui (CVA variants)
- **Canvas**: @xyflow/react (React Flow)
- **Database**: Dexie.js (IndexedDB) — offline-first, no backend DB
- **State**: Zustand (minimal) + `useLiveQuery` (reactive DB reads)
- **Diagrams**: Mermaid.js (derived from structured data, not SSOT)
- **AI**: Vercel AI SDK + Anthropic/Google via thin server routes
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Package manager**: pnpm

## Architecture

### Directory Layout

```
src/
├── app/                    # Thin routing shells + AI API routes ONLY
│   └── api/ai/             # assist, import-document, parse-sql, status
├── features/
│   ├── dashboard/          # Dashboard screen, hooks, selectors, components
│   └── workspace/          # Workspace screen, hooks, selectors, components
├── components/
│   ├── editors/            # Node editor panels (one per node type)
│   ├── layout/             # Shared workspace overlays/dialogs
│   ├── ui/                 # shadcn primitives (zero business logic)
│   ├── ArchwayNode.tsx     # Custom React Flow node
│   └── ArchwayEdge.tsx     # Custom React Flow edge
├── lib/
│   ├── ai/                 # Model config, prompt builders, JSON parsers
│   ├── db.ts               # Dexie schema — MIGRATION SSOT (9 versions)
│   ├── canonical.ts        # 10 node types + all structured field interfaces
│   ├── canonicalContent.ts # Content record creation helpers
│   ├── sourceIntake.ts     # Multi-format parser (Mermaid, DBML, SQL, MD, CSV)
│   ├── diagramGenerators/  # Mermaid output per diagram type
│   ├── contentTemplates.ts # Domain-specific starter content
│   └── exportEngine.ts     # PDF/Markdown/CSV/JSON export
├── repositories/           # Dexie query wrappers per entity
├── services/
│   ├── ProjectService.ts   # Project lifecycle orchestration
│   ├── CrossValidationService.ts  # 18 cross-node validation rules
│   ├── ValidationService.ts
│   ├── NodeValidationService.ts
│   └── taskEngine/         # Deterministic task generation from nodes
└── stores/
    └── workspaceStore.ts   # Minimal Zustand (activeProject, activeNode)
```

### Data Flow

```
READ:  Dexie (IndexedDB) → useLiveQuery() → React state → UI
WRITE: Editor UI (debounced) → db.transaction() → Dexie → useLiveQuery auto-updates UI
AI:    Client → app/api/ai/* → lib/ai/* prompt builder → AI Provider → JSON → structured fields
```

### Import Rules (enforced by ESLint)

```
✅ features/*            → components/ui/, components/layout/, services/, lib/*
✅ components/editors/   → lib/db.ts, services/, components/ui/
✅ components/ui/        → lib/utils.ts ONLY
❌ app/page.tsx          → db.ts, repositories, services, React Flow, dexie-react-hooks
❌ components/ui/        → db.ts, repositories, dexie-react-hooks
❌ features/*/components → repositories, dexie-react-hooks
```

### Core Patterns

- **Guided Tab = SSOT**: Structured fields are the single source of truth. Mermaid/SQL are derived views only.
- **Reactive reads**: Always use `useLiveQuery` from `dexie-react-hooks`, never `useEffect` + manual fetch from Dexie.
- **Thin pages**: `app/page.tsx` and `app/workspace/[id]/page.tsx` only mount feature entry components.
- **Repository pattern**: All Dexie access goes through `repositories/*.ts`.
- **Deterministic task generation**: Node structured fields → task engine → TaskData[]. No LLM in this path.

## 10 Canonical Nodes

`project_brief → requirements → user_stories → use_cases → flowchart → dfd → erd → sequence → task_board → summary`

Two workflow templates:
- **Quick Start** (5 nodes): Brief → Requirements → ERD → Task Board → Summary
- **Full Architecture** (10 nodes): all 10

Node input priority: **Import existing** > Generate draft > Fill manually

## Key Decisions (do NOT change without discussion)

1. **Dexie.js stays** — no migration to Supabase/Firebase/Prisma
2. **No custom nodes** in v1 — only 10 canonical types
3. **No free text as primary input** — all node input must be structured/parseable
4. **Canvas = navigation layer** — not a relational editor (no user-drawn connections)
5. **No `'use server'`** — workspace state is entirely client-side
6. **No new dependencies** without explicit discussion

## Commands

```bash
pnpm dev              # Dev server
pnpm build            # Production build
pnpm typecheck        # next typegen && tsc --noEmit
pnpm lint             # ESLint
pnpm test:unit        # Vitest (22 files, 68 tests)
pnpm test:e2e         # Playwright
```

## Conventions

- **Commits**: Conventional Commits (`feat(workspace): add validation engine`)
- **Branches**: kebab-case (`feat/task-generation`, `fix/edge-rendering`)
- **Comments**: EN/ID bilingual
- **User-facing text**: English or Indonesian
- **Dev logs**: English only
- **TypeScript**: strict — minimize `any` (some legacy `eslint-disable` in taskEngine and diagramGenerators)

## AI Context Files

Detailed documentation lives in `ai-context/`. Reference when needed:

| File | When to read |
|------|-------------|
| `00-master-context.md` | Project identity, data flow, decisions log |
| `01-product-context.md` | Adding pages/features, domain model |
| `02-architecture-context.md` | Creating/moving files, import rules, patterns |
| `05-testing-qa-context.md` | Writing tests, coverage strategy |

## Do NOT

- Add dependencies without discussion
- Suggest stack/library migrations
- Refactor or rename existing files unless asked
- Make Mermaid tab writeable to structured fields (it's read-only/derived)
- Put orchestration logic in route pages
- Use `useEffect` for Dexie reads (use `useLiveQuery`)
- Use `'use server'` anywhere
- Create top-level folders outside existing structure
