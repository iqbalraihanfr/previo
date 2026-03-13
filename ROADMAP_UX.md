# Archway UX Roadmap — Next Phase

> Solo dev & small team focus. No enterprise ceremony. Every change must reduce friction, not add it.

---

## A · Live Node Cards on Canvas ✅

**Problem:** Canvas nodes are static dead boxes. User can't tell at a glance what's inside without clicking.

**Solution:** Each node renders a live mini-dashboard pulled from IndexedDB via `useLiveQuery`.

### Per-node content preview

| Node | Preview content |
|------|----------------|
| Project Brief | Project name · N objectives · N scope items |
| Requirements | N FR · N NFR · "N Must unaddressed" warning |
| ERD | N entities · N relationships · entity name pills |
| Flowchart | N flows · flow names |
| Sequence | N participants · N messages |
| DFD | N processes · N data stores |
| Task Board | N todo · N in progress · N done · progress bar |
| Summary | Coverage % · N warnings · "Ready / Not Ready" |

### Node card anatomy

```
┌─────────────────────────────────┐
│ [icon] Requirements    ● In Progress │
│ ───────────────────────────────── │
│  11 FR  ·  5 NFR  ·  ⚠ 2 Must    │
│  ████████░░  Scope: 5/5 covered   │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ [icon] ERD             ● In Progress │
│ ───────────────────────────────── │
│  6 entities  ·  7 relationships   │
│  USERS · PLANS · WORKSPACES +3…  │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ [icon] Task Board      ● In Progress │
│ ───────────────────────────────── │
│  23 tasks  ·  0 done              │
│  ░░░░░░░░░░  0% complete          │
└─────────────────────────────────┘
```

### Implementation notes
- Use `useLiveQuery` in the canvas node component — reactive to DB changes
- Node card click still opens the editor panel (unchanged behavior)
- Status dot color: grey = Empty, amber = In Progress, green = Done

---

## B · Semantic Edge Colors ✅

**Problem:** Arrows between nodes are purely decorative. They carry no information.

**Solution:** Edge color reflects the upstream node's state. Instantly tells the user what's blocking what.

### Color semantics

| Upstream node status | Edge color | Meaning |
|---|---|---|
| Empty | `--muted` (grey dashed) | Upstream not started — downstream may be blocked |
| In Progress | `--warning` (amber) | Upstream active — downstream can begin |
| Done | `--success` (green) | Flow unlocked — downstream has full context |

### Edge tooltip on hover
```
Requirements → ERD
⚠ Upstream In Progress
"11 FR defined. Schema can be drafted but requirements may still change."
```

```
ERD → Task Board
✓ Upstream Done
"6 entities, 7 relationships ready. Tasks generated."
```

### Implementation notes
- Edges are rendered in `WorkspaceOverlays` or the ReactFlow canvas layer
- Read upstream node status from `useLiveQuery(db.nodes.where(...))`
- Animate: dashed animation for Empty, solid pulse for In Progress, solid static for Done

---

## C · Tab Reduction (Content + Meta only) ✅

**Problem:** Up to 5 tabs (Guided · Diagram · SQL Notes · Notes · Files) is too many. Creates decision paralysis.

**Solution:** Collapse to 2 visible tabs max. Everything else is secondary.

### New tab structure

**Diagram nodes (Flowchart, DFD, Sequence, ERD):**
```
[ Content ]  [ Notes & Files ▾ ]
```
- "Content" = Mermaid editor (primary input) OR guided form (secondary, accessible via toggle inside the tab)
- "Notes & Files" = collapsible section, not a full tab — keeps focus on the diagram

**Document nodes (Brief, Requirements, User Stories, Use Cases):**
```
[ Content ]  [ Notes & Files ▾ ]
```
- "Content" = the guided form editor (unchanged)
- No "Diagram" tab — these nodes don't need it

**ERD specifically:**
```
[ Content ]  [ Notes & Files ▾ ]
```
- "Content" = guided entity/attribute form with "Import Schema" button prominent at top
- Remove "SQL Notes" as a tab — put it inside Notes & Files

### What gets removed
- `SQL Notes` tab → moved into Notes section
- Standalone `Notes` tab → merged into `Notes & Files`
- Standalone `Files` tab → merged into `Notes & Files`

---

## D · Semantic Arrows — Deeper Meaning (Phase 2)

> Builds on top of B. After color semantics are in, add richer interaction.

**Problem:** Arrows show intended workflow order, but don't reflect actual data relationships.

**Solution:** Arrow label + tooltip shows what data is expected to flow between connected nodes.

### Edge label system

| Connection | Label | What it validates |
|---|---|---|
| Brief → Requirements | "defines scope" | Scope items from Brief should have matching FRs |
| Requirements → ERD | "drives schema" | FR categories should be reflected in entity names |
| Requirements → Task Board | "becomes tasks" | Each Must FR should have ≥1 task |
| ERD → Task Board | "generates work" | Each entity should have migration + model task |
| Sequence → Task Board | "defines APIs" | API calls in Sequence should appear as tasks |

### Click-to-inspect
Clicking an arrow opens a small popover:
```
┌──────────────────────────────────────┐
│ Requirements → ERD                   │
│ ─────────────────────────────────    │
│ ✓ 5/5 scope items have FR coverage  │
│ ⚠ 3 FRs have no matching entity yet │
│ ✓ Must requirements: 6 defined       │
└──────────────────────────────────────┘
```

---

## E · Task Format — Feature-Based, Not Node-Based

**Problem (current):** Tasks are grouped by the node that generated them — "Database", "Flowchart", "Sequence". This is an internal implementation artifact, not how developers think about work.

```
❌ Current format (node-based):
Database
  - Create USERS migration + model [Must]
  - Create PLANS migration + model [Must]
  - Setup USERS ↔ WORKSPACES relationship [Must]
  - Create USERS validation [Should]
  - Create seed data for USERS [Could]
  ... 18 more database tasks
```

A solo dev looks at this and has no idea where to start. All tasks look the same. No vertical slice. No feature context.

---

**Solution (feature-based):** Tasks grouped by **feature/epic**, each containing the full vertical slice from DB → API → Frontend → DoD.

Each feature has:
- A **priority tier** (P0 = must ship for MVP, P1 = important, P2 = nice to have)
- Tasks that **span multiple layers** (DB, API, UI, Test)
- A **Definition of Done** checklist at the bottom of each group

---

### Example: SaaS template task output

```
──────────────────────────────────────────────
P0 · 🔐 Authentication & Access               [6/8 tasks]
──────────────────────────────────────────────
  ○ Create USERS table migration               [DB]
  ○ User registration endpoint POST /auth/register  [API]
  ○ Email verification flow                    [API]
  ○ Login / logout with JWT session            [API]
  ○ Role-based access middleware (RBAC)        [API]
  ○ Registration & login UI                    [UI]
  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
  Definition of Done:
  □ User can register and receive verification email
  □ User can login and receive JWT token
  □ Protected routes reject unauthenticated requests
  □ Role checks enforced on admin routes

──────────────────────────────────────────────
P0 · 💳 Billing & Subscriptions               [0/7 tasks]
──────────────────────────────────────────────
  ○ Create PLANS, SUBSCRIPTIONS, PAYMENTS migrations  [DB]
  ○ Stripe PaymentIntent flow                  [API]
  ○ Webhook handler for billing events         [API]
  ○ Subscription creation & upgrade flow       [API]
  ○ Billing dashboard page                     [UI]
  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
  Definition of Done:
  □ User can select plan and enter payment details
  □ Successful payment creates subscription record
  □ Failed payment shows actionable error
  □ Billing history visible in dashboard

──────────────────────────────────────────────
P0 · 🏢 Workspace & Multi-tenancy             [0/5 tasks]
──────────────────────────────────────────────
  ○ Create WORKSPACES, WORKSPACE_MEMBERS migrations  [DB]
  ○ Workspace creation endpoint                [API]
  ○ Member invitation by email                 [API]
  ○ Workspace switcher UI                      [UI]
  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
  Definition of Done:
  □ User can create a workspace
  □ User can invite members by email
  □ Member sees only their workspace's data

──────────────────────────────────────────────
P1 · 📊 Core Dashboard                        [0/3 tasks]
──────────────────────────────────────────────
  ○ Usage metrics API endpoint                 [API]
  ○ Dashboard UI with charts                   [UI]
  ○ Admin panel: user list + overrides         [UI]
  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
  Definition of Done:
  □ Dashboard loads within 2s
  □ Admin can see all users and their plan status

──────────────────────────────────────────────
P1 · 📧 Notifications                         [0/2 tasks]
──────────────────────────────────────────────
  ○ Email service integration (Resend/SES)     [API]
  ○ Billing event email templates              [API]
  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
  Definition of Done:
  □ User receives email on subscription renewal, failure, cancellation

──────────────────────────────────────────────
P2 · 🧪 Quality & Infrastructure             [0/4 tasks]
──────────────────────────────────────────────
  ○ Seed data scripts for all entities         [DB]
  ○ Input validation for all entities          [API]
  ○ Error monitoring setup                     [Infra]
  ○ CI/CD pipeline                             [Infra]
```

---

### Why this works for solo dev / small team

| Node-based (current) | Feature-based (proposed) |
|---|---|
| "Create USERS migration" — what for? | "Authentication · Create USERS migration" — clear context |
| All DB tasks lumped together | DB + API + UI per feature = one vertical slice |
| No definition of done | DoD per feature = clear finish line |
| Sorted by node type | Sorted by P0 → P1 → P2 = natural sprint order |
| User has to mentally map task → feature | Feature grouping is already the mental model |
| 23 identical-looking tasks | 5 features with 3-8 tasks each = scannable |

### How tasks are generated

Tasks should be generated from **requirements (FR)**, not from nodes:
- FR-001 "User registration" → generates Authentication feature tasks
- FR-005 "Subscription plan selection" → generates Billing feature tasks
- FR-008 "Core dashboard" → generates Dashboard feature tasks
- ERD entities → added as DB-layer tasks **inside** the relevant feature, not as standalone tasks
- Sequence messages → extracted as API-layer tasks **inside** features

**Feature detection logic:**
- FR `category` field (Authentication, Billing, etc.) → becomes the feature/epic group
- ERD entities with FK to USERS → map to the feature whose FRs mention user management
- Must FRs → P0 features, Should FRs → P1, Could FRs → P2

---

## Implementation Order

```
Week 1: B (edge colors) + C (tab reduction)   ✅ DONE
Week 2: A (live node cards)                   ✅ DONE
Week 3: E (feature-based tasks)               ← next: requires task engine rewrite
Week 4: D (semantic arrows click-to-inspect)  ← builds on A + B
```

---

## Non-goals (explicitly out of scope)

- Assignee / time tracking — this is not a PM tool
- Comments / collaboration — async is out of scope for v1
- Custom node types — power user feature, later
- Mobile UI — desktop-first by design
