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

AI-backed features can use either Anthropic or Google models.

Example `.env.local`:

```bash
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_key
ANTHROPIC_MODEL=claude-sonnet-4-6

# or
AI_PROVIDER=google
GOOGLE_GENERATIVE_AI_API_KEY=your_key
GOOGLE_MODEL=gemini-3-flash-preview
```

If AI keys are not configured, local-first workspace features still remain the primary architecture flow.

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
