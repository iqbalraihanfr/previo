# Previo

Previo is a local-first architecture workspace for turning rough project ideas into structured implementation assets before coding starts.

It helps you move from brief and requirements into diagrams, validation, task planning, and summary output inside one workspace.

## Highlights

- Local-first project storage with IndexedDB
- Visual node-based workspace for project architecture
- Import-first editors for structured sources
- Derived validation, task board, and summary flows
- Mermaid, DBML, SQL, and CSV-oriented ingestion paths
- Export support for documentation and task handoff

## Core Workflow

Previo is built around a connected node graph:

- `Project Brief`
- `Requirements`
- `User Stories`
- `Use Cases`
- `Flowchart`
- `DFD`
- `ERD`
- `Sequence`
- `Task Board`
- `Summary`

The intended flow is:

1. Capture or import source material.
2. Normalize it into structured nodes.
3. Validate coverage and consistency across nodes.
4. Generate implementation tasks.
5. Review the final project summary before coding.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Dexie / IndexedDB
- Mermaid
- Vitest
- Playwright
- Node.js 22
- pnpm

## Getting Started

### Prerequisites

- Node.js 22
- pnpm 10+

### Install

```bash
pnpm install
```

### Run locally

```bash
pnpm dev
```

Open `http://localhost:3000`.

## AI Setup

Previo has two feature categories:

- `Local-first features`
  Project storage, canonical nodes, traceability, validation, task planning, summary review, exports, and deterministic parsers such as CSV, DBML, Mermaid, and most structured imports.
- `AI-assisted features`
  Document extraction, writing assistance, and SQL fallback parsing when deterministic parsing is not enough.

If you want AI-assisted features, copy the example env file and add your own provider key:

```bash
cp .env.example .env.local
```

Supported providers:

```bash
# Anthropic
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_key
ANTHROPIC_MODEL=claude-sonnet-4-6

# or Google
AI_PROVIDER=google
GOOGLE_GENERATIVE_AI_API_KEY=your_key
GOOGLE_MODEL=gemini-3-flash-preview
```

Restart `pnpm dev` after updating `.env.local`.

Without an AI key, the app still works for the local-first planning flow, but these AI-assisted paths remain unavailable:

- project brief document extraction
- AI writing assistance
- SQL parsing fallback when the local parser cannot resolve the schema

## Available Scripts

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:e2e
pnpm build
pnpm start
pnpm test:e2e:prod
```

## Environment

Use [`.env.example`](.env.example) as the starting point for local configuration.

Important:

- never commit real provider keys
- keep secrets in `.env.local`
- rotate any key that has ever been pasted into a tracked or shared file

## Quality Gates

The expected local verification flow is:

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm build
pnpm test:e2e
pnpm test:e2e:prod
```

CI is defined in [`.github/workflows/pipeline.yml`](.github/workflows/pipeline.yml) and uses `pnpm` on Node 22.

## Docker

Development and production Dockerfiles are included:

- [`Dockerfile.dev`](Dockerfile.dev)
- [`Dockerfile.prod`](Dockerfile.prod)

## Project Structure

```text
src/
  app/           Next.js app entrypoints
  components/    Shared UI and editor components
  features/      Dashboard and workspace feature modules
  lib/           Parsers, adapters, export, AI, and helpers
  repositories/  Persistence access
  services/      Domain services and task engine
  stores/        Client state
tests/
  unit/          Vitest suites
  *.spec.ts      Playwright flows
```

## License

This project is licensed under the MIT License. See [`LICENSE`](LICENSE).
