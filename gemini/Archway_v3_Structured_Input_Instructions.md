# Archway — v3 Structured Input & Cross-Validation Overhaul

## Context & Philosophy

This is a **fundamental architectural shift** for Archway. Based on the DMBOK principle that "data quality must be enforced at the point of input, not cleaned after," we are:

1. **Removing all free-text input** — every field is structured and parseable
2. **Adding per-node validation** — warning system when minimum criteria not met
3. **Adding cross-node validation** — detecting gaps between nodes (e.g., ERD entity without matching DFD data store)
4. **Auto-generating diagrams from structured data** — user fills structured fields, Mermaid diagrams are auto-generated (no manual syntax writing needed)
5. **Progressive task generation** — tasks auto-suggested as each node is saved

Reference the existing codebase and update accordingly.

---

## Architecture: Validation System

### Per-Node Validation

Each node has a `getValidationWarnings(nodeContent)` function that returns an array of warnings:

```typescript
interface ValidationWarning {
  nodeId: string;
  nodeType: string;
  severity: 'error' | 'warning';  // error = can't mark Done, warning = can mark Done but badge shown
  message: string;
  field?: string;
}
```

- **Severity "warning"**: Node CAN be marked Done, but shows ⚠ badge on the node in pipeline
- **Severity "error"**: Prevents marking as Done (e.g., required field empty)
- Warnings displayed inside the editor panel AND as badge on the node in React Flow canvas

### Cross-Node Validation

A global `crossValidate(allNodes)` function runs whenever any node is saved. It checks references between nodes:

```typescript
interface CrossValidationWarning {
  sourceNodeType: string;
  targetNodeType: string;
  message: string;
  sourceItem?: string;  // e.g., "FR-005"
  suggestion?: string;  // e.g., "Create a User Story for FR-005"
}
```

Cross-validation results displayed in:
1. **Badge on affected nodes** — yellow ⚠ with count
2. **Validation Summary Panel** — accessible via a button in the toolbar, lists ALL warnings across all nodes

### Validation Summary Panel UI

```
┌─────────────────────────────────────┐
│ Validation Summary           [✕]    │
├─────────────────────────────────────┤
│ Total warnings: 7                   │
│                                     │
│ Project Brief (0) ✅                │
│ Requirements (1) ⚠                 │
│  • FR-009 has no linked User Story  │
│ User Stories (0) ✅                 │
│ Use Cases (2) ⚠                    │
│  • UC-004 has no Sequence Diagram   │
│  • UC-005 has no Sequence Diagram   │
│ Flowcharts (0) ✅                   │
│ DFD (1) ⚠                          │
│  • DS-002 has no matching ERD entity│
│ ERD (2) ⚠                          │
│  • CATEGORY entity is orphan        │
│  • Flowchart mentions "payment"     │
│    but no PAYMENT entity exists     │
│ Sequence Diagrams (1) ⚠            │
│  • UC-004 has no sequence diagram   │
│ Task Board (0) ✅                   │
│ Summary: auto-calculated            │
└─────────────────────────────────────┘
```

---

## Node 1: Project Brief

### Remove free-text. Replace with these structured fields:

```typescript
interface ProjectBrief {
  projectName: string;              // required, max 100 chars
  background: string;               // required, max 300 chars, "why does this project exist?"
  objectives: string[];             // required, min 1 item, max 200 chars each
  targetUsers: string[];            // required, min 1, tag/chip input
  scopeIn: string[];                // required, min 1, "what IS included"
  scopeOut: string[];               // required, min 1, "what is NOT included"
  successMetrics: Array<{           // required, min 1
    metric: string;                 // e.g., "Page load time"
    target: string;                 // e.g., "< 3 seconds"
  }>;
  constraints: string[];            // optional, list items
  techStack: string[];              // optional, tag/chip input
  references: Array<{               // optional
    name: string;                   // e.g., "Tokopedia"
    url: string;                    // optional URL
  }>;
}
```

### Validation:
- projectName, background filled
- At least 1 objective, 1 targetUser, 1 scopeIn, 1 scopeOut, 1 successMetric

### Cross-validation outputs (used by other nodes):
- `targetUsers` → feeds Role dropdowns in User Stories, Actor dropdowns in Use Case
- `scopeIn` → checked against Requirements (every scope item should have ≥1 FR)

---

## Node 2: Requirements

### Two tabs: Functional | Non-Functional

```typescript
interface FunctionalRequirement {
  id: string;                       // auto: "FR-001", "FR-002"...
  category: string;                 // dropdown, user can add custom: "Auth", "Product", "Order", "Payment", "Admin", "Notification"
  description: string;              // required, max 200 chars
  priority: 'Must' | 'Should' | 'Could' | 'Wont';  // required, MoSCoW
  relatedScopeItem?: string;        // dropdown from Project Brief scopeIn
}

interface NonFunctionalRequirement {
  id: string;                       // auto: "NFR-001"
  category: string;                 // dropdown: "Performance", "Security", "Usability", "Reliability", "Scalability", "Compatibility"
  description: string;              // required, max 200
  metric: string;                   // required, e.g., "Page load time"
  target: string;                   // required, e.g., "< 3 seconds on 4G"
  priority: 'Must' | 'Should' | 'Could' | 'Wont';
}
```

### Bottom of editor shows summary:
```
Summary: 5 Must, 3 Should, 2 Could, 1 Won't
```

### Validation:
- At least 3 FRs, at least 1 NFR
- All fields filled per item
- At least 1 FR is "Must"

### Cross-validation:
- Every scopeIn item from Brief → should have ≥1 FR with matching relatedScopeItem
- Every FR → should have ≥1 User Story (checked against User Stories' relatedRequirement)
- FR categories → used as grouping basis in Task Board

---

## Node 3: User Stories

```typescript
interface UserStory {
  id: string;                       // auto: "US-001"
  role: string;                     // dropdown from Project Brief targetUsers
  want: string;                     // required, max 200
  benefit: string;                  // required, max 200
  relatedRequirement: string;       // dropdown from Requirements FR list, required
  priority: string;                 // auto-inherited from linked FR
  acceptanceCriteria: Array<{       // required, min 1
    given: string;                  // required
    when: string;                   // required
    then: string;                   // required
  }>;
}
```

### Display format in editor:
```
As a [role dropdown], I want [want input], so that [benefit input]
```

### Bottom of editor shows coverage:
```
Coverage: 8/12 FRs have stories
⚠ FR-005, FR-009, FR-011, FR-012 have no user stories
```

### Validation:
- At least 1 story
- All fields filled, at least 1 acceptance criterion per story with Given/When/Then filled
- Role must be from Project Brief targetUsers

### Cross-validation:
- FRs without stories → warning
- Target Users without any stories → warning "No stories for actor: Admin"
- Acceptance criteria "Then" → checked against Flowchart outcomes

### Task Engine:
- Each User Story → 1 task "Implement: [want]" with inherited priority
- Each Acceptance Criterion → 1 test task "Test: Given [given], When [when], Then [then]"

---

## Node 4: Use Case

```typescript
interface UseCase {
  id: string;                       // auto: "UC-001"
  name: string;                     // required, verb+object, max 100
  primaryActor: string;             // dropdown from Brief targetUsers
  secondaryActors: string[];        // optional multi-select
  description: string;              // required, max 200
  preconditions: string[];          // required, min 1
  postconditionsSuccess: string[];  // required, min 1
  mainFlow: Array<{
    actor: 'User' | 'System';       // dropdown
    action: string;                 // required, max 150
  }>;                               // required, min 3 steps
  alternativeFlows: Array<{
    name: string;                   // required
    branchesFromStep: number;       // step number
    steps: Array<{
      actor: 'User' | 'System';
      action: string;
    }>;
  }>;                               // optional
  relatedUserStories: string[];     // multi-select from US list, required min 1
  relationships: Array<{           // optional
    type: 'include' | 'extend';
    targetUseCase: string;          // dropdown from other UCs
  }>;
}
```

### Auto-generated Mermaid (from all use cases):
Build a `graph TD` with subgraph "System", ovals for each UC, actors connected.
Include/extend shown as dotted lines with labels.

### Validation:
- At least 1 UC
- All required fields filled
- Main flow min 3 steps, at least 1 Start-type and end-type step
- Linked to at least 1 User Story
- If include/extend relationship → target UC must exist

### Cross-validation:
- Primary actors → must exist in Brief targetUsers
- User Stories without UC → warning
- UC postconditions → should align with US acceptance criteria "Then"

### Task Engine:
- Each UC → 1 epic-level task
- Main flow System steps → potential implementation sub-tasks

---

## Node 5: Flowchart

```typescript
interface FlowchartFlow {
  id: string;                       // auto
  name: string;                     // required
  relatedUseCase: string;           // dropdown from UC list, required
  trigger: string;                  // required, "what starts this flow"
  steps: Array<{
    id: number;                     // auto
    type: 'start' | 'process' | 'decision' | 'end';  // dropdown
    label: string;                  // required, verb+noun, max 100
    yesTarget?: number;             // step id, if type=decision
    noTarget?: number;              // step id, if type=decision
    nextStep?: number;              // step id, if type=process (auto: next in list)
  }>;
}
```

### Auto-generated Mermaid:
- `start` → `([label])`
- `process` → `[label]`
- `decision` → `{label}`
- `end` → `([label])`
- Connections from yesTarget/noTarget/nextStep

### Validation:
- At least 1 flow
- Every flow: name, related UC, trigger, min 4 steps
- Must have ≥1 start and ≥1 end
- Every decision must have yesTarget AND noTarget pointing to valid steps
- No orphan steps (every step reachable from start)

### Cross-validation:
- Use Cases without flows → warning
- Process steps mentioning data operations → check ERD entities
- Decision steps → should have corresponding alt branches in Sequence Diagram

### Task Engine:
- Each process step → 1 implementation task
- Each decision step → 1 validation/logic task

---

## Node 6: DFD

```typescript
interface DFDData {
  externalEntities: Array<{
    id: string;                     // auto: "EE-001"
    name: string;                   // required
  }>;
  processes: Array<{
    id: string;                     // auto: "P-001"
    name: string;                   // required, verb+noun
    description: string;            // required, max 150
    relatedUseCase?: string;        // dropdown from UC list
  }>;
  dataStores: Array<{
    id: string;                     // auto: "DS-001"
    name: string;                   // required
    relatedERDEntity?: string;      // dropdown from ERD entities (if filled)
  }>;
  dataFlows: Array<{
    id: string;                     // auto: "DF-001"
    label: string;                  // required, describes data content
    from: string;                   // dropdown: any EE, Process, or DS
    to: string;                     // dropdown: any EE, Process, or DS
  }>;
}
```

### DFD Rule Enforcement (validate in real-time):
- ❌ External Entity → External Entity (must go through Process)
- ❌ Data Store → Data Store (must go through Process)
- ❌ External Entity ↔ Data Store direct (must go through Process)
- ✅ Every Process must have ≥1 input AND ≥1 output flow
- ✅ Every Data Store must connect to ≥1 Process

Show rule violations as real-time errors when user tries to add invalid flow.

### Auto-generated Mermaid:
- External Entity → `[Name]` (rectangle)
- Process → `((Name))` (circle)
- Data Store → `[(Name)]` (cylinder)
- Data Flow → `-->|label|`

### Validation:
- Min 1 EE, 1 Process, 1 DS, 2 flows
- All DFD rules pass
- Every process has ≥1 in + ≥1 out

### Cross-validation:
- EEs → should match Brief targetUsers or known external systems
- Data Stores → should have matching ERD entity. Missing → warning
- Processes → should have related UC. Unlinked → warning

### Task Engine:
- Each Process → 1 implementation task
- Each DS without ERD entity → 1 task "Define data model for [name]"
- Each EE that is external system → 1 integration task

---

## Node 7: ERD

```typescript
interface ERDData {
  entities: Array<{
    id: string;                     // auto: "E-001"
    name: string;                   // required, UPPERCASE singular
    description: string;            // required, max 150
    attributes: Array<{
      name: string;                 // required, snake_case
      dataType: 'string' | 'int' | 'float' | 'boolean' | 'datetime' | 'text' | 'json' | 'enum';
      constraints: Array<'PK' | 'FK' | 'Unique' | 'Nullable' | 'Required' | 'Index'>;
      description?: string;         // optional, max 100
    }>;
  }>;
  relationships: Array<{
    id: string;                     // auto: "R-001"
    entityA: string;                // dropdown from entities
    cardinality: '1:1' | '1:N' | 'N:1' | 'N:M';
    entityB: string;                // dropdown from entities
    label: string;                  // required, verb, e.g., "places"
    junctionTable?: string;         // auto-suggested for N:M
  }>;
}
```

### N:M Auto-handling:
When user selects N:M cardinality:
1. Show suggestion: "N:M requires junction table. Suggested: [ENTITY_A]_[ENTITY_B]"
2. User confirms or renames
3. Junction entity auto-created with PKs from both entities as FKs

### SQL Paste Tab:
Additional tab "SQL Paste" where user can paste CREATE TABLE statements.
Parse with regex or simple parser:
- Extract table name → entity name (uppercase, singular)
- Extract columns → attributes with types and constraints
- PRIMARY KEY → PK constraint
- NOT NULL → Required
- UNIQUE → Unique
- REFERENCES → FK + auto-create relationship

### Auto-generated Mermaid:
Standard `erDiagram` with entities, attributes, and relationships using Crow's Foot notation.

### Validation:
- At least 2 entities
- Every entity has ≥1 attribute with PK
- At least 1 relationship
- Every N:M has junction table
- No orphan entities (every entity in ≥1 relationship)

### Cross-validation:
- DFD Data Stores → each should have matching entity
- Flowchart data operations → should reference existing entities
- US acceptance criteria mentioning data → should align
- Entities not referenced by any US/UC → warning

### Task Engine:
- Each Entity → "Create [Entity] table migration + model"
- Each Entity with 5+ attributes → "Add validations for [Entity]"
- Each Relationship → "Setup [A] ↔ [B] relationship"
- Each N:M junction → "Create [Junction] pivot table"
- Each Entity → "Create seed data for [Entity]"

---

## Node 8: Sequence Diagram

```typescript
interface SequenceDiagram {
  id: string;
  name: string;                     // required
  relatedUseCase: string;           // dropdown from UC list, required
  relatedFlowchart?: string;        // dropdown from flowchart flows
  participants: Array<{
    name: string;                   // required
    type: 'actor' | 'component' | 'service' | 'database' | 'external';
    order: number;                  // display order left-to-right
  }>;
  messages: Array<{
    stepNumber: number;             // auto
    from: string;                   // dropdown from participants
    to: string;                     // dropdown from participants
    label: string;                  // required, max 100
    type: 'request' | 'response' | 'self';
    group?: {
      type: 'alt' | 'opt' | 'loop';
      label: string;               // e.g., "success", "failure"
    };
  }>;
}
```

### Auto-extract API Endpoints:
After saving, scan all messages for patterns:
- Contains HTTP method (GET, POST, PUT, PATCH, DELETE)
- Contains path-like string (/api/..., /v1/...)
- Display extracted endpoints at bottom of editor

### Auto-generated Mermaid:
Standard `sequenceDiagram` with participants, messages (->>, -->>), and alt/opt/loop blocks.

### Validation:
- At least 1 sequence
- Each: name, related UC, ≥2 participants, ≥3 messages
- Every alt group has ≥2 branches
- Requests should generally have responses

### Cross-validation:
- UCs without sequence → warning
- Database participants → should match DFD stores / ERD entities
- External participants → should match DFD external entities
- Alt branches → should align with Flowchart decision steps

### Task Engine:
- Messages with HTTP methods → "Create [METHOD] [endpoint]"
- Each Service participant → "Setup [service] module"
- Each alt group → "Implement error handling for [label]"
- Auto-extracted endpoints → becomes API task list

---

## Node 9: Task Board

Task Board is a **consumer node** — it aggregates tasks from all other nodes.

```typescript
interface Task {
  id: string;                       // auto: "T-001"
  title: string;                    // editable
  description: string;              // editable
  sourceNodeType: string;           // read-only: "ERD", "Flowchart", "Sequence", "Manual"
  sourceItemId: string;             // read-only: "E-001", "Step 3", etc.
  priority: 'Must' | 'Should' | 'Could' | 'Wont';  // editable, initially inherited
  labels: string[];                 // editable, auto-suggested: ["database", "backend", "frontend", "testing"]
  status: 'todo' | 'in_progress' | 'done';  // manual toggle
  isManual: boolean;                // true = user-created, false = auto-generated
  groupKey: string;                 // for grouping: story ID, layer name, or feature name
}
```

### Grouping modes (segmented control):
- **By User Story**: group by related US ID
- **By Layer**: group by label (database/backend/frontend/testing)
- **By Feature Flow**: group by related flowchart flow name

### Layer auto-detection:
- Source = ERD → label "database"
- Source = Sequence + HTTP method → label "backend"
- Source = Flowchart + UI-related step → label "frontend"
- Source = User Story acceptance criteria → label "testing"

### Export formats:
1. **Markdown checklist**: `- [ ] T-001: Create USER table migration [Must] [database]`
2. **CSV**: columns = id, title, description, priority, labels, status, source
3. **JSON**: structured array of task objects
4. **Linear CSV**: columns matching Linear import spec (Title, Description, Priority, Labels, Status)

### Regeneration:
- Delete tasks where isManual = false
- Re-run all extraction rules
- Preserve manual tasks
- Show diff: "Added 3 new tasks, removed 2 outdated tasks"

---

## Node 10: Summary

Summary is **fully read-only and auto-calculated**. No input fields.

### Auto-compiled sections:
1. **Project Overview** — from Brief node
2. **Completion Status** — count Done/Total nodes with ✅/⚠ per node
3. **Validation Warnings** — aggregated from all cross-validation
4. **Requirements Coverage** — percentages:
   - FRs covered by stories
   - Stories covered by UCs
   - UCs covered by flowcharts
   - UCs covered by sequences
   - DFD stores matched to ERD entities
5. **Task Summary** — total, by priority, by layer
6. **API Endpoints** — extracted from Sequence Diagrams
7. **Export buttons** — full project (PDF/MD) + tasks only (MD/CSV/JSON/Linear)

### Summary status logic:
- Status = "Done" only when ALL other nodes Done AND validation warnings = 0
- Status = "In Progress" when any node Done but warnings exist
- Status = "Empty" when no nodes filled

---

## Cross-Validation Rules (Complete Reference)

| Rule | Source Node | Target Node | Warning Message |
|------|-----------|-------------|-----------------|
| CV-01 | Brief.targetUsers | UserStories.role | "Target user '[name]' has no user stories" |
| CV-02 | Brief.targetUsers | UseCase.primaryActor | "Target user '[name]' is not an actor in any use case" |
| CV-03 | Brief.scopeIn | Requirements.relatedScopeItem | "Scope item '[name]' has no requirements" |
| CV-04 | Requirements.FR | UserStories.relatedRequirement | "FR-[id] has no user story" |
| CV-05 | UserStories | UseCase.relatedUserStories | "US-[id] has no use case" |
| CV-06 | UseCase | Flowchart.relatedUseCase | "UC-[id] has no flowchart" |
| CV-07 | UseCase | Sequence.relatedUseCase | "UC-[id] has no sequence diagram" |
| CV-08 | DFD.dataStores | ERD.entities | "Data store '[name]' has no matching ERD entity" |
| CV-09 | DFD.externalEntities | Brief.targetUsers | "External entity '[name]' not in target users (may be external system — verify)" |
| CV-10 | DFD.processes | UseCase | "DFD process '[name]' has no related use case" |
| CV-11 | ERD.entities | DFD.dataStores | "Entity '[name]' has no matching DFD data store" |
| CV-12 | ERD.entities | UserStories + UseCase | "Entity '[name]' not referenced in any story or use case" |
| CV-13 | ERD.entities | Relationships | "Entity '[name]' is orphan (no relationships)" |
| CV-14 | Sequence.participants(db) | ERD.entities | "DB participant '[name]' has no matching ERD entity" |
| CV-15 | Sequence.participants(ext) | DFD.externalEntities | "External participant '[name]' not in DFD" |
| CV-16 | UserStories | TaskBoard | "US-[id] has no generated tasks" |
| CV-17 | ERD.entities | TaskBoard | "Entity '[name]' has no database task" |
| CV-18 | UseCase.include/extend | UseCase | "Included/extended UC '[name]' does not exist" |

---

## Task Engine Extraction Rules (Complete Reference)

| Source | Rule | Generated Task Title | Labels |
|--------|------|---------------------|--------|
| User Story | Each US → 1 task | "Implement: [want]" | from FR category |
| US Acceptance Criteria | Each AC → 1 test task | "Test: Given [given], When [when], Then [then]" | testing |
| ERD Entity | Each entity → 1 task | "Create [Entity] table migration + model" | database |
| ERD Entity (5+ attrs) | Extra task | "Add validations for [Entity]" | database |
| ERD Relationship | Each rel → 1 task | "Setup [EntityA] ↔ [EntityB] relationship" | database |
| ERD N:M Junction | Each junction → 1 task | "Create [Junction] pivot table" | database |
| ERD Entity | Each entity → 1 task | "Create seed data for [Entity]" | database |
| Flowchart Process | Each process step → 1 task | "[label]" (verb+noun from step) | backend or frontend |
| Flowchart Decision | Each decision → 1 task | "Validate: [label]" | backend |
| Sequence HTTP msg | Each API message → 1 task | "Create [METHOD] [endpoint]" | backend |
| Sequence Service | Each service participant → 1 task | "Setup [service] module/controller" | backend |
| Sequence Alt group | Each alt → 1 task | "Handle: [alt label] error case" | backend |
| DFD Process | Each process → 1 task | "Implement [name] logic" | backend |
| DFD External System | Each ext system EE → 1 task | "Integrate with [name]" | backend |

### Deduplication:
Tasks generated from different nodes may overlap (e.g., Flowchart "Create account" and Sequence "POST /api/register" are about the same thing). Task Engine should:
1. Generate all tasks
2. Show potential duplicates (similar titles) with suggestion to merge
3. User decides to merge or keep separate

---

## Priority: Implementation Order

1. **Structured fields for all 10 nodes** — this is the foundation
2. **Auto-generate Mermaid from structured data** — for Use Case, Flowchart, DFD, ERD, Sequence
3. **Per-node validation** — warning badges + error prevention
4. **Cross-node validation** — the 18 CV rules + validation summary panel
5. **Task Engine extraction** — progressive generation on node save
6. **Task Board UI** — grouping, CRUD, export
7. **Summary node** — auto-compilation + coverage percentages
8. **Export** — PDF, MD, task exports (MD/CSV/JSON/Linear)

---

## Dependencies

```bash
# If not already installed:
bun add mermaid
bun add uuid  # for generating IDs
```

No additional dependencies needed — structured fields use standard React form components + Tailwind.
