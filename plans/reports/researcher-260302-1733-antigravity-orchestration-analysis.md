# Antigravity Multi-Agent Orchestration Research Report

**Date:** 2026-03-02
**Researcher:** Claude Code
**Status:** Complete Analysis

---

## Executive Summary

Google Antigravity is a **managed IDE-first agentic platform** (VSCode fork) launched Nov 2025. Unlike Claude Code's explicit Task/Subagent tools, Antigravity uses **implicit agent management** via the Agent Manager and **skill-based task delegation**. Multi-step orchestration exists natively but functions differently than Claude Code's direct agent spawning. Core capability: **Skills act as micro-workflows, not subagents.**

**Key Finding:** Antigravity CANNOT spawn truly independent subagents like Claude Code. Instead, it chains skills sequentially within a single agent context. However, **Gemini CLI (terminal variant) DOES support experimental subagent spawning** with parallel dispatch patterns (maestro-gemini proves this works).

---

## 1. Antigravity's Agent/Subagent Capabilities

### What Antigravity CAN Do

**Native Multi-Agent Manager**

- Antigravity includes an "Agent Manager" interface for spawning multiple autonomous agents
- Agents can operate asynchronously across editor, terminal, and browser surfaces
- Agents are **instance-level, not task-specific** — you launch them manually via the UI, not programmatically

**Key Distinction:** Agents are **environment-level servants** you monitor, not **task-specific sub-services** you delegate to from code.

### What Antigravity CANNOT Do

❌ **No programmatic agent spawn** — Cannot call "spawn_researcher_agent()" from a skill
❌ **No task queue system** — No equivalent to Claude Code's Task tool for creating subtasks
❌ **No agent chaining in SKILL.md** — Skills cannot invoke other skills directly; they must chain sequentially through a single agent's execution context
❌ **No cross-session state sharing** — Each agent has isolated context; you must manually pass state via files

### Comparison: Claude Code vs Antigravity

| Feature            | Claude Code                 | Antigravity                               |
| ------------------ | --------------------------- | ----------------------------------------- |
| Spawn subagents    | ✅ `TaskCreate` tool        | ❌ Manual UI only                         |
| Pass context       | ✅ Task prompt context      | ❌ File-based state sharing               |
| Parallel execution | ✅ Built-in                 | ❌ Not native (Gemini CLI extension only) |
| Skill chaining     | ✅ Agents can trigger Tasks | ❌ Sequential within single agent         |
| Task scheduling    | ✅ Native Task queue        | ❌ Workflow files only                    |

---

## 2. Workflow Chaining in Antigravity

### How Skills Chain (Sequential Pattern)

Antigravity does NOT support skill-to-skill invocation. Instead:

1. **Single Agent, Multiple Skills:** One agent loads all relevant skills in its context
2. **Sequential Execution:** Agent progresses through steps, activating skills as needed
3. **Manual Routing:** Agent decides which skill to activate based on task description
4. **State via Markdown:** Progress tracked in YAML/Markdown files in workspace

**Example Flow:**

```
Agent sees: "Build SaaS MVP"
  → Activates "architecture-skill"
  → Activates "database-skill"
  → Activates "api-skill"
  → Activates "frontend-skill"
```

Each skill loads independently; no skill can programmatically trigger the next.

### Workflow Orchestration Skill (Meta-Level)

Antigravity includes a "Workflows" skill that:

- Reads workflow definition files from your repo
- Decomposes a goal into sequential steps
- Proposes which skill to activate at each step
- Guides the agent through completion

**Example Workflow Definition:**

```yaml
name: "SaaS MVP Delivery"
phases:
  - name: "Architecture Design"
    skill: "architecture-designer"
    artifacts: ["system-design.md", "db-schema.sql"]
  - name: "Backend Implementation"
    skill: "backend-coder"
    artifacts: ["api-endpoints.ts", "models.py"]
  - name: "Frontend Implementation"
    skill: "frontend-coder"
    artifacts: ["components/", "pages/"]
  - name: "Testing & QA"
    skill: "qa-tester"
    artifacts: ["test-results.md"]
```

**Limitation:** This is guidance for a human-level agent, not programmatic delegation. The agent still executes sequentially.

---

## 3. Antigravity Skills Advanced Patterns

### SKILL.md Structure

```yaml
---
name: data-engineer-skills
description: |
  Specializes in database schema design, query optimization,
  and data migration strategies.
---

# Data Engineer Skills

## Use this skill when
- Designing database schemas for scalability
- Optimizing slow queries
- Planning safe data migrations
- Analyzing query performance

## Do not use this skill when
- Implementing frontend UI
- Writing API endpoint logic
- Doing DevOps/infrastructure work

## Overview
[Detailed instructions for the agent]

## Context
- Your codebase uses PostgreSQL 15.7
- All migrations go to `apps/api/plane/db/migrations/`
- Use Django ORM patterns from `plane/db/models/`

## Examples
### Example 1: Design schema for new feature
[Real example with expected output]

### Example 2: Optimize slow query
[Real example with N+1 avoidance pattern]

## Tools & Scripts
- `scripts/analyze-queries.py` — Find N+1 problems
- `scripts/suggest-indexes.sql` — Index recommendations
```

### Skill Activation Process

```
Agent Task: "Design database schema for user roles"
      ↓
Agent recognizes: "data-engineer-skills" matches
      ↓
System: "Activate skill data-engineer-skills? [Yes/No]"
      ↓
SKILL.md + /scripts + /references loaded to agent context
      ↓
Agent executes with specialized knowledge
```

**Key:** Only YAML metadata loads initially; full SKILL.md loads on activation (token-efficient).

### Complex Multi-Step Pattern Example

A "full-stack-feature-builder" skill can orchestrate multiple concerns:

```yaml
---
name: full-stack-feature-builder
description: |
  Builds end-to-end features: database → API → frontend → tests
---

## Instructions

### Phase 1: Database Design
1. Analyze existing schemas in `plane/db/models/`
2. Design new models following `BaseModel`/`ProjectBaseModel` patterns
3. Generate migration: `python manage.py makemigrations`
4. Save schema to `docs/schema-new-feature.md`

### Phase 2: API Implementation
1. Create serializers in `plane/app/serializers/`
2. Create ViewSet in `plane/app/views/`
3. Register in `plane/app/urls/`
4. Test endpoints via provided script

### Phase 3: Frontend Implementation
1. Create TypeScript types in `packages/types/`
2. Create MobX store in `apps/web/core/store/`
3. Create React components in `apps/web/core/components/`
4. Wire up form bindings

### Phase 4: Testing
1. Write Django tests in `plane/tests/`
2. Write React component tests
3. Run `pnpm test` and `python run_tests.py`
4. Report coverage

## Scripts
- `scripts/full-stack-scaffold.py` — Generates boilerplate
- `scripts/test-runner.sh` — Runs full test suite
```

**Reality:** Agent still executes this sequentially within one context window. No subagent spawning.

---

## 4. Antigravity + MCP Servers

### What MCP Provides

MCP (Model Context Protocol) servers expose **tools** to agents, not workflows. Architecture:

```
┌─────────────────────────────────────┐
│   Antigravity Agent (LLM)           │
└──────────────┬──────────────────────┘
               │ MCP Client
               ↓
┌──────────────────────────────────────┐
│  MCP Server (custom implementation)   │
│  - PostgreSQL queries                 │
│  - GitHub API calls                   │
│  - Jira ticket creation               │
│  - Custom script execution            │
└──────────────────────────────────────┘
```

### MCP Configuration in Antigravity

File: `.antigravity/mcp_servers.json`

```json
{
  "servers": [
    {
      "name": "postgres-analyzer",
      "description": "Query database for performance analysis",
      "transport": "stdio",
      "command": "python",
      "args": ["~/.antigravity/mcp-servers/postgres-analyzer.py"],
      "env": {
        "DATABASE_URL": "postgresql://..."
      }
    },
    {
      "name": "github-integration",
      "description": "Create PRs, read issues, manage workflows",
      "transport": "sse",
      "url": "http://localhost:3000/mcp/github"
    }
  ]
}
```

### Custom MCP Server Example (Python + FastMCP)

```python
# ~/.antigravity/mcp-servers/orchestrator.py

from fastmcp import FastMCP
import subprocess
import json

app = FastMCP("orchestrator")

@app.tool()
def spawn_researcher_task(task_description: str) -> str:
    """Spawn independent researcher task in background."""
    config = {
        "agent_role": "researcher",
        "task": task_description,
        "report_path": "/tmp/research-report.md"
    }

    # Write task config
    with open("/tmp/task-config.json", "w") as f:
        json.dump(config, f)

    # Spawn independent process (NOT integrated with Antigravity)
    proc = subprocess.Popen([
        "antigravity", "--headless", "--task-config", "/tmp/task-config.json"
    ])

    return f"Spawned researcher task (PID: {proc.pid})"

@app.tool()
def wait_for_research(poll_interval: int = 5) -> str:
    """Poll for research report completion."""
    import time
    import os

    while not os.path.exists("/tmp/research-report.md"):
        time.sleep(poll_interval)

    with open("/tmp/research-report.md") as f:
        return f.read()
```

**Verdict:** MCPs expose **tools**, not **agent control**. You can script external agent spawning via MCP, but it's **not integrated** — it's just a tool the agent can call.

---

## 5. Community Solutions: Maestro-Gemini

### Why Maestro Works Where Antigravity Can't

Maestro-Gemini targets **Gemini CLI** (terminal variant), not Antigravity IDE. Gemini CLI has **experimental subagent support** that Maestro leverages.

**Gemini CLI Subagent System:**

```bash
gemini /agents:run -e "researcher-agent" -p "Investigate authentication patterns"
```

This spawns a new **independent Gemini CLI instance** with only the "researcher-agent" extension loaded.

### Maestro Architecture (Replaces Claude Code's TaskCreate)

```
TechLead Agent (Orchestrator)
    ↓
Parallel Dispatch (parallel-dispatch.js)
    ├─ $ gemini /agents:run -e "architect" ...
    ├─ $ gemini /agents:run -e "coder" ...
    ├─ $ gemini /agents:run -e "debugger" ...
    └─ $ gemini /agents:run -e "security-engineer" ...
    ↓
State Files (.gemini/state/*.md) sync results
    ↓
TechLead integrates & verifies
```

### Maestro's 12 Specialized Subagents

```yaml
agents:
  - architect # System design, tech selection
  - coder # Feature implementation
  - code-reviewer # Quality gates, security
  - debugger # Root cause analysis
  - data-engineer # Schema, query optimization
  - devops-engineer # Deployment, infrastructure
  - security-engineer # Vulnerability scanning
  - ml-engineer # ML/data science features
  - frontend-specialist # UI/UX implementation
  - backend-specialist # API design, service logic
  - test-engineer # Test coverage, strategies
  - performance-engineer # Optimization, profiling
```

**Tool Privileges:** Each agent receives only tools needed:

```yaml
# .gemini/agents/coder.md (excerpt)
---
name: coder
tools:
  - shell # Run commands
  - write # Write files
  - replace # Replace code sections
  - search # Find code
# tools NOT included:
# - git:force-push  (prevented)
# - deploy         (prevented)
---
```

### Parallel Dispatch Implementation

File: `scripts/parallel-dispatch.js`

```javascript
const { execSync } = require("child_process");
const path = require("path");

async function dispatch() {
  const agents = [
    { role: "architect", task: "Design system" },
    { role: "coder", task: "Implement features" },
    { role: "tester", task: "Write tests" },
  ];

  // Stagger launches by 5 seconds (avoid rate limits)
  const processes = agents.map((agent, idx) => {
    setTimeout(() => {
      const cmd = `gemini /agents:run -e "${agent.role}" -p "${agent.task}"`;
      console.log(`[${agent.role}] Spawning...`);
      execSync(cmd, { stdio: "inherit" });
    }, idx * 5000);
  });

  // Wait for all to complete
  await Promise.all(processes);
}
```

### State Persistence Pattern

File: `.gemini/state/orchestration.md`

```markdown
# Orchestration State

## Phase 1: Architect

- Status: COMPLETED
- Output: `docs/system-design.md`
- Timestamp: 2026-03-02T10:30:00Z

## Phase 2: Coder

- Status: IN_PROGRESS
- Output: `apps/web/src/components/NewFeature.tsx` (partial)
- Timestamp: 2026-03-02T10:35:00Z
- Last Check: 5 minutes ago

## Phase 3: Tester

- Status: QUEUED
- Prerequisites: Phase 2 complete
```

**Advantage:** Resumable, auditable, parallel-friendly. **Disadvantage:** Brittle file-based IPC.

---

## 6. Antigravity's Tool Use Capabilities

### Tools Available to Agents

Antigravity agents have access to:

| Tool        | Capability                            | Limit            |
| ----------- | ------------------------------------- | ---------------- |
| Editor      | Read/write files, edit code           | File-level       |
| Terminal    | Run bash/shell commands               | OS-level         |
| Browser     | Automated testing, screenshot capture | Page-level       |
| File Search | Grep, pattern matching                | Workspace scope  |
| Git         | Status, diff, commit (no force-push)  | Repository scope |
| MCP Tools   | Custom via MCP servers                | Server-defined   |

**What agents CAN'T do natively:**

- Spawn other Antigravity instances
- Read/write to shared task queues
- Access other agents' context windows
- Dynamically register new skills

### Terminal Access Pattern

An agent can execute bash and capture output:

```bash
# Agent can run:
python scripts/analyze-codebase.py --output /tmp/analysis.json
pip install -r requirements.txt
git log --oneline -n 20
curl https://api.github.com/repos/...

# Agent sees stdout/stderr and can parse results
```

This enables **scripted orchestration** but not **integrated orchestration**.

---

## 7. Workarounds for Subagent Pattern

### Option 1: Skill-Based Sequential Pipeline (Antigravity Native)

**Best for:** Simple, linear workflows (research → design → code → test)

**Implementation:**

```yaml
---
name: research-to-review-pipeline
description: |
  Orchestrates researcher → designer → coder → reviewer workflow
---

## Phase 1: Research
[Activate researcher-skill]
[Output: research-findings.md]

## Phase 2: Design
[Activate architect-skill using research findings]
[Output: design-doc.md]

## Phase 3: Implementation
[Activate coder-skill using design]
[Output: implementation/]

## Phase 4: Code Review
[Activate code-reviewer-skill]
[Output: review-report.md]

## Instructions
Follow the phases sequentially. Progress tracked in ORCHESTRATION.md.
```

**Pros:** Native, no external dependencies, token-efficient
**Cons:** Sequential only, single context window, no true parallelism

### Option 2: Gemini CLI + Maestro (Best Current Solution)

**Best for:** Complex, parallel orchestration

**Implementation:**

```bash
#!/bin/bash
# orchestrate.sh — Run from Gemini CLI

# Phase 1: Parallel research
gemini /agents:run -e "researcher" -p "Research authentication patterns" &
gemini /agents:run -e "researcher" -p "Research database design" &
wait

# Phase 2: Parallel design
gemini /agents:run -e "architect" -p "Design from research findings" &
wait

# Phase 3: Parallel implementation
gemini /agents:run -e "coder" -p "Implement backend" &
gemini /agents:run -e "coder" -p "Implement frontend" &
wait

# Phase 4: Review & integration
gemini /agents:run -e "code-reviewer" -p "Review all code"
```

**Pros:** True parallelism, separate contexts, proven in maestro-gemini
**Cons:** Only in Gemini CLI, file-based state sharing, manual process management

### Option 3: External Orchestrator + MCP Bridge

**Best for:** Enterprise multi-agent systems

**Implementation:**

```python
# external-orchestrator.py (runs in separate process)

from fastmcp import FastMCP
from anthropic import Anthropic
import subprocess
import json

app = FastMCP("orchestrator")
client = Anthropic()

@app.tool()
def trigger_research_agent(query: str) -> dict:
    """Spawn researcher agent and return findings."""
    config = {
        "agent_type": "researcher",
        "query": query,
        "output_file": f"/tmp/research-{uuid4().hex}.json"
    }

    # Spawn in subprocess with isolated context
    proc = subprocess.run([
        "python", "agents/researcher-agent.py",
        "--config", json.dumps(config)
    ], capture_output=True, text=True)

    with open(config["output_file"]) as f:
        return json.load(f)

@app.tool()
def trigger_planner_agent(research: dict) -> dict:
    """Route research to planner."""
    config = {
        "agent_type": "planner",
        "research": research,
        "output_file": f"/tmp/plan-{uuid4().hex}.json"
    }
    # Similar pattern...
```

**Register in Antigravity:**

```json
{
  "servers": [
    {
      "name": "orchestrator",
      "command": "python",
      "args": ["./external-orchestrator.py"]
    }
  ]
}
```

**Pros:** Full control, non-blocking, scalable
**Cons:** External complexity, file I/O overhead, not integrated with IDE

### Option 4: Google ADK (Agent Development Kit)

**Best for:** Google Cloud-native deployments

Google's ADK (Agent Development Kit) provides:

- Multi-agent framework for Gemini
- Native task delegation primitives
- State management
- Tool composition

**Example (from Google ADK docs):**

```python
from google.agentframework import Agent, Tool

researcher = Agent(
    model="gemini-3-pro",
    role="Research technical trends",
    tools=[search_tool, code_analysis_tool]
)

planner = Agent(
    model="gemini-3-pro",
    role="Create implementation plans",
    tools=[design_tool, estimation_tool]
)

coder = Agent(
    model="gemini-3-pro",
    role="Write production code",
    tools=[code_writer, linter, test_runner]
)

# Orchestrate
result = orchestrate([researcher, planner, coder])
```

**Availability:** Early access, requires Google Cloud account
**Advantage:** Native multi-agent primitives, not IDE-specific

---

## 8. Antigravity vs Gemini CLI: Key Differences

| Aspect                   | Antigravity                   | Gemini CLI                                |
| ------------------------ | ----------------------------- | ----------------------------------------- |
| **Platform**             | VSCode fork IDE               | Terminal CLI                              |
| **UX**                   | GUI with Agent Manager        | Command-line terminal                     |
| **Subagent Support**     | ❌ No native support          | ✅ Experimental (`/agents:run`)           |
| **Parallel Execution**   | ❌ Single agent primary flow  | ✅ Via shell scripting                    |
| **Skills**               | Skill-based activation        | Skill-based activation                    |
| **Use Case**             | IDE-integrated development    | Terminal-native vibe coding               |
| **Model Options**        | Gemini 3 Pro (primary)        | Gemini 2.5 Pro + Claude + OpenAI          |
| **Multi-Agent Maturity** | Early (visual orchestration)  | Experimental but working (maestro-gemini) |
| **Best For**             | Single-agent coding workflows | Multi-agent orchestration                 |

---

## 9. Best Practical Approach: Replicating Claude Code's Pattern

### For Antigravity (IDE-First)

**Recommended:** Sequential skill-based pipeline + file-based checkpoints

**Implementation:**

```yaml
---
name: full-development-orchestration
description: |
  Replicate Claude Code's researcher→planner→implementer→tester→reviewer pipeline
  using sequential skill activation and Markdown-based state management.
---
## Architecture
```

┌──────────────────────────────────────────┐
│ Antigravity Agent (Single Context) │
└──────────────────────────────────────────┘
↓ (Sequential Activation)
┌──────────────────────────────────────────┐
│ Phase 1: Researcher Skill │
│ Input: User requirement │
│ Output: research-findings.md │
└──────────────────────────────────────────┘
↓ (File-based handoff)
┌──────────────────────────────────────────┐
│ Phase 2: Planner Skill │
│ Input: research-findings.md │
│ Output: implementation-plan.md │
└──────────────────────────────────────────┘
↓
[... repeat for implementer, tester, reviewer ...]

````

## Phase 1: Researcher Skill

SKILL.md path: `.antigravity/skills/researcher-skill/SKILL.md`

```yaml
---
name: researcher-skill
description: |
  Analyzes requirements and researches technical solutions.
  Outputs findings in structured format for planner.
---

## Use this skill when
- Starting a new feature request
- Need to understand existing patterns
- Require competitive analysis
- Security/compliance research needed

## Instructions

### 1. Parse Requirements
Analyze the user's initial request. Extract:
- Functional requirements
- Non-functional requirements
- Constraints & dependencies
- Success criteria

### 2. Research Phase
- Search codebase for similar implementations
- Review architecture documentation
- Check external best practices
- Identify potential risks

### 3. Output Format
Create `ORCHESTRATION-STATE.md`:

\`\`\`markdown
# Research Findings

## Requirement Analysis
- [extracted requirements]

## Codebase Context
- Similar patterns found: [files]
- Existing solutions: [patterns]

## Technical Research
- Best practices: [findings]
- Risk assessment: [potential issues]

## Recommendations
- Proposed approach: [high-level]
- Technology choices: [rationale]
- Open questions: [items for planner]
\`\`\`

### 4. Handoff Signal
End with: "Research complete. Planner can now design implementation."

## Tools & References
- scripts/search-patterns.py — Find similar code
- docs/architecture.md — System design reference
````

## Phase 2: Planner Skill

```yaml
---
name: planner-skill
description: |
  Creates detailed implementation plan based on research findings.
  Outputs TODO list and phase breakdown for implementer.
---

## Instructions

### 1. Read Research
Parse `ORCHESTRATION-STATE.md` from researcher phase.

### 2. Design Phases
Create implementation phases:
- Phase structure
- Dependencies between phases
- Estimated effort
- Risk mitigation

### 3. Create TODO List
Generate `.todo.md`:

\`\`\`markdown
# Implementation Plan

## Phase 1: Setup [Status: PENDING]
- [ ] Create database models
- [ ] Generate migrations
- [ ] Create serializers

## Phase 2: API [Status: PENDING]
- [ ] Create ViewSets
- [ ] Write tests
- [ ] Document endpoints

## Phase 3: Frontend [Status: PENDING]
- [ ] Create components
- [ ] Wire up store
- [ ] Add translations

## Testing & Review [Status: PENDING]
- [ ] Run test suite
- [ ] Code review
- [ ] Performance check
\`\`\`

### 4. Append to State
Update `ORCHESTRATION-STATE.md` with plan section.

## Tools & References
- scripts/estimate-effort.py — Complexity analysis
```

## Phase 3: Implementer Skill

```yaml
---
name: implementer-skill
description: |
  Executes implementation plan from planner.
  Updates TODO list as progress advances.
  Outputs working code.
---

## Instructions

### 1. Load Plan
Read `.todo.md` and identify pending items.

### 2. Execute Phases Sequentially
For each phase in plan:
- Create/modify files per requirements
- Run linting checks
- Update TODO checkboxes

### 3. Commit Checkpoints
After each major phase:
- Commit code with conventional message
- Update `ORCHESTRATION-STATE.md`
- Document any deviations from plan

### 4. Final Output
Code is ready for testing phase.

## Tools & Scripts
- scripts/lint-check.sh — Verify code quality
- scripts/create-migration.py — Django scaffolding
```

## Phase 4: Tester Skill

```yaml
---
name: tester-skill
description: |
  Runs comprehensive test suite.
  Reports coverage and failures.
  Validates against success criteria.
---

## Instructions

### 1. Run Tests
Execute full test suite:
- Unit tests
- Integration tests
- E2E tests

### 2. Report Results
Generate `test-results.md`:

\`\`\`markdown
# Test Results

## Coverage
- Overall: 87%
- New code: 92%

## Failures
[List any failures with stack traces]

## Performance
- API response times: [metrics]
- Build time: [seconds]
\`\`\`

### 3. Success Criteria Check
Verify all requirements met.

## Tools & Scripts
- `pnpm test` — Frontend tests
- `python run_tests.py` — Backend tests
```

## Phase 5: Reviewer Skill

```yaml
---
name: code-reviewer-skill
description: |
  Reviews code for quality, security, performance.
  Recommends improvements.
  Approves for merge.
---

## Instructions

### 1. Code Quality Review
Check:
- Code style & conventions
- Complexity & readability
- Test coverage

### 2. Security Review
Scan for:
- Input validation
- SQL injection risks
- XSS vulnerabilities
- Auth/authz gaps

### 3. Generate Review Report
Create `code-review-report.md`:

\`\`\`markdown
# Code Review Report

## Quality: ✅ PASS
- [observations]

## Security: ✅ PASS
- [security checks]

## Performance: ✅ PASS
- [performance notes]

## Recommendations
- [improvement suggestions]

## Final Status: APPROVED ✅
\`\`\`

## Tools & Scripts
- scripts/security-scan.sh — SAST
- scripts/performance-check.py — Profiling
```

### Orchestration Controller Skill

```yaml
---
name: orchestration-controller
description: |
  Manages the state machine for researcher→planner→implementer→tester→reviewer
  pipeline. Handles phase transitions and error recovery.
---
## Instructions

### Main Loop
```

While task not complete:

1. Read ORCHESTRATION-STATE.md
2. Determine current phase from state
3. Activate appropriate skill
4. Wait for completion signal
5. Update state file
6. Advance to next phase

```

### State Transitions

\`\`\`markdown
PENDING → RESEARCH → PLANNING → IMPLEMENTING → TESTING → REVIEW → COMPLETE
           ↑           ↑            ↑            ↑        ↑
         (read)    (file check) (file check) (file check) (approval)
\`\`\`

### Error Handling
- If phase fails: Stay in phase, log error, notify user
- If dependent data missing: Rollback to previous phase
- Timeout handling: 30 min per phase

## State File Format
`.orchestration-state.md`:

\`\`\`markdown
# Orchestration Progress

## Current Phase
Phase: RESEARCH
Status: IN_PROGRESS
Started: 2026-03-02T10:00:00Z
Last Update: 2026-03-02T10:05:00Z

## Completion Checklist
- [x] Research complete
- [ ] Plan ready
- [ ] Code implemented
- [ ] Tests passing
- [ ] Review approved

## Artifacts
- Research: docs/research-findings.md
- Plan: docs/implementation-plan.md
- Code: (various files)
- Tests: test-results.md
- Review: code-review-report.md

## Phase History
1. RESEARCH (completed 10:05)
   - [completed]
2. PLANNING (started 10:05)
   - [in progress]
\`\`\`
```

**Activation in Antigravity:**

```
User: "Build user authentication feature"
     ↓
Agent: "I'll orchestrate this using my development pipeline"
     ↓
Activates: orchestration-controller skill
     ↓
Controller: Triggers researcher-skill → planner-skill → ...
```

### For Gemini CLI (Terminal-First, Production-Ready)

**Recommended:** Maestro-Gemini pattern with parallel dispatch

File structure:

```
.gemini/
├── skills/
│   ├── researcher-skill/SKILL.md
│   ├── planner-skill/SKILL.md
│   ├── implementer-skill/SKILL.md
│   ├── tester-skill/SKILL.md
│   └── code-reviewer-skill/SKILL.md
├── agents/
│   ├── researcher.md
│   ├── planner.md
│   ├── implementer.md
│   ├── tester.md
│   └── code-reviewer.md
├── scripts/
│   ├── orchestrate.sh
│   └── parallel-dispatch.js
└── state/
    └── orchestration.md (progress tracking)
```

Main orchestration script:

```bash
#!/bin/bash
# .gemini/scripts/orchestrate.sh

set -e

PROJECT_NAME="$1"
REQUIREMENT="$2"

echo "🚀 Starting development pipeline for: $PROJECT_NAME"
echo "Requirement: $REQUIREMENT"

# Phase 1: Research (parallel if multiple topics)
echo "📚 Phase 1: Research"
gemini /agents:run -e "researcher" \
  -p "Research technical approaches for: $REQUIREMENT" \
  > ./state/phase-1-research.md

# Phase 2: Planning
echo "📋 Phase 2: Planning (dependent on research)"
gemini /agents:run -e "planner" \
  -p "Create detailed plan based on: $(cat ./state/phase-1-research.md)" \
  > ./state/phase-2-plan.md

# Phase 3: Implementation (can parallel different modules)
echo "💻 Phase 3: Implementation"
gemini /agents:run -e "implementer-backend" \
  -p "Implement backend based on plan" \
  > ./state/phase-3a-backend.md &

gemini /agents:run -e "implementer-frontend" \
  -p "Implement frontend based on plan" \
  > ./state/phase-3b-frontend.md &

wait

# Phase 4: Testing
echo "✅ Phase 4: Testing"
gemini /agents:run -e "tester" \
  -p "Run full test suite on implementation" \
  > ./state/phase-4-tests.md

# Phase 5: Code Review
echo "🔍 Phase 5: Code Review"
gemini /agents:run -e "code-reviewer" \
  -p "Review all code from this session" \
  > ./state/phase-5-review.md

echo "✨ Pipeline complete!"
cat ./state/phase-5-review.md
```

---

## 10. Concrete SKILL.md Examples

### Example 1: Simple Single-Purpose Skill

````yaml
---
name: database-schema-designer
description: |
  Designs PostgreSQL schemas following Plane's BaseModel patterns.
  Outputs Django model code and migrations.
---

## Use this skill when
- Designing database models for new features
- Planning database migrations
- Need to follow existing Plane model patterns

## Do not use this skill when
- Implementing API logic
- Writing frontend components
- Debugging existing queries

## Context
The Plane codebase uses Django ORM with patterns:
- All models inherit BaseModel or ProjectBaseModel
- Timestamps: created_at, updated_at (auto)
- Audit: created_by, updated_by (auto via crum middleware)
- Soft delete: deleted_at field
- Projects always link: workspace + project FKs

## Instructions

### Step 1: Analyze Requirements
Identify:
- Entities needed
- Relationships (FK, M2M)
- Constraints
- Indexing needs

### Step 2: Design Schema
Using examples from `plane/db/models/`, design:
```python
# Example structure you'll follow
class MyModel(ProjectBaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    project = ForeignKey(Project, on_delete=CASCADE)
    workspace = ForeignKey(Workspace, on_delete=CASCADE)

    class Meta:
        db_table = "my_model"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name
````

### Step 3: Check Patterns

- Use UUID primary keys
- Use BaseModel not custom base
- Follow field naming (snake_case)
- Include docstrings

### Step 4: Output

Generate model code and save to:
`apps/api/plane/db/models/my_feature.py`

## Examples

### Example 1: Department Model

**Input:** "Design model for company departments with staff tracking"

**Output:**

```python
class Department(ProjectBaseModel):
    """Company department with staff management."""

    name = models.CharField(max_length=255, help_text="Department name")
    manager = models.ForeignKey(
        User, on_delete=SET_NULL, null=True,
        related_name="managed_departments"
    )
    budget = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    staff_count = models.IntegerField(default=0)

    class Meta:
        db_table = "department"
        ordering = ["name"]
```

### Example 2: M2M with Through Model

**Input:** "Design issue-to-label relationship with metadata"

**Output:**

```python
class IssueLabel(ProjectBaseModel):
    """Through model for issue-label relationships."""

    issue = models.ForeignKey(Issue, on_delete=CASCADE)
    label = models.ForeignKey(Label, on_delete=CASCADE)
    added_by = models.ForeignKey(User, on_delete=SET_NULL, null=True)

    class Meta:
        db_table = "issue_label"
        unique_together = [["issue", "label"]]
```

## Tools & Scripts

- `scripts/generate-migration.sh` — Create Django migration
- `scripts/validate-schema.py` — Check against existing patterns

````

### Example 2: Complex Orchestration Skill

```yaml
---
name: feature-implementation-orchestrator
description: |
  Full-stack feature implementation: models → migrations → serializers → views →
  frontend store → components → tests → documentation.

  This skill chains work across backend and frontend, coordinating handoffs
  between specialists while maintaining single-agent execution.
---

## Use this skill when
- Building complete features end-to-end
- Need coordination across multiple layers
- Want structured, auditable progress tracking

## Instructions

### Setup: Create Orchestration File

First, create `.orchestration/feature-state.md`:

\`\`\`markdown
# Feature Implementation State: {feature-name}

## Current Phase
Phase: MODELS
Status: PENDING
Started: {timestamp}

## Phases
- [ ] Models: Define Django models
- [ ] Migrations: Generate and test migrations
- [ ] Serializers: Create DRF serializers
- [ ] Views: Implement API endpoints
- [ ] Frontend Types: TypeScript interfaces
- [ ] Frontend Store: MobX state management
- [ ] Frontend Components: React components
- [ ] Tests: Unit + integration tests
- [ ] Documentation: Update docs/

## Artifacts
- models: apps/api/plane/db/models/
- serializers: apps/api/plane/app/serializers/
- views: apps/api/plane/app/views/
- frontend: apps/web/core/
- tests: plane/tests/
\`\`\`

### Phase 1: Models & Migrations

1. **Design models** using database-schema-designer skill
2. **Create migration:**
   ```bash
   cd apps/api
   python manage.py makemigrations my_feature
````

3. **Test migration:**
   ```bash
   python manage.py migrate --dry-run
   ```
4. **Update state file:** Mark Models as COMPLETE

### Phase 2: Serializers

1. **Examine model** you just created
2. **Create serializers** in `apps/api/plane/app/serializers/`
3. **Implement patterns:**
   - BaseSerializer for simple cases
   - DynamicBaseSerializer for query param support
   - Separate write/read serializers if needed
4. **Add validation** (FK uniqueness, cross-project checks)
5. **Test serializer** with sample data

### Phase 3: Views & URLs

1. **Create ViewSet** in `apps/api/plane/app/views/`
2. **Register permissions** with `@allow_permission` decorators
3. **Wire up URLs** in `apps/api/plane/app/urls/`
4. **Add activity tracking** for create/update/delete
5. **Test endpoints** with provided curl commands

### Phase 4: Frontend - Types & Store

1. **Create TypeScript interface** in `packages/types/`
2. **Create MobX store** in `apps/web/core/store/`
3. **Create API service** in `apps/web/core/services/`
4. **Wire up store** in CE root store if needed
5. **Create store hook** in `apps/web/core/hooks/store/`

### Phase 5: Frontend - Components

1. **Design components** using @plane/propel
2. **Use semantic color tokens** (never hardcode colors)
3. **Wrap with observer()** for MobX reactivity
4. **Use useTranslation()** for all strings
5. **Create layout + page routes**

### Phase 6: Testing

1. **Backend tests** in `apps/api/plane/tests/`

   ```bash
   cd apps/api && python run_tests.py
   ```

2. **Frontend component tests** in `apps/web/`

   ```bash
   pnpm test
   ```

3. **Report coverage** (target: >80%)

### Phase 7: Documentation

Update `docs/`:

- `system-architecture.md` — Add to architecture diagram
- `code-standards.md` — If new patterns introduced
- `project-roadmap.md` — Mark feature as complete

### Final State Update

Mark all phases COMPLETE and generate summary:

\`\`\`markdown

## Summary

✅ Feature Implementation Complete

### Code Changes

- Added models: [files]
- Added views: [files]
- Added components: [files]
- Test coverage: 87%

### Next Steps

- Deploy to staging
- QA verification
- User acceptance testing
  \`\`\`

## Tools & Scripts

- `scripts/full-stack-scaffold.py` — Generate boilerplate
- `scripts/run-all-tests.sh` — Full test suite
- `scripts/check-coverage.py` — Coverage report

````

---

## 11. Community Workarounds Found

### Pattern 1: Shell-Based Agent Spawning

Used in maestro-gemini. Shell scripts spawn independent Gemini CLI instances:

```bash
# Good for: Gemini CLI environment
# Enables: True parallelism
# Drawback: File-based IPC

for agent in researcher planner coder tester; do
  gemini /agents:run -e "$agent" -p "Execute phase" &
done
wait
````

### Pattern 2: Webhook-Based Orchestration

External webhook server triggers agents:

```python
# Central orchestrator listens on webhooks
@app.post("/trigger/{agent_id}")
def trigger_agent(agent_id: str, task: str):
    # Spawn agent process
    # Return webhook URL for callback
    # Agent calls back when done
```

**Advantage:** Truly decoupled, scalable
**Drawback:** Requires external infrastructure

### Pattern 3: Monorepo Organization

Keep all skills in single repo with clear dependencies:

```
.agents/
├── skills/
│   ├── phase-01-research/
│   ├── phase-02-planning/
│   ├── phase-03-implementation/
│   └── phase-04-testing/
├── scripts/
│   └── orchestrate.sh (master controller)
└── state/
    └── shared-state.yaml (progress tracking)
```

**Advantage:** Self-contained, version controlled
**Drawback:** Sequential execution only

---

## Unresolved Questions

1. **Can Antigravity agents write to shared persistent state?** Currently file-based, unclear if concurrent writes are safe.

2. **What's the maximum practical skill count?** Loading 50+ skills in one agent's context likely degrades performance.

3. **Does Antigravity have built-in task retry logic?** If a skill fails mid-execution, resume mechanisms unclear.

4. **Can Gemini CLI subagents run on separate machines?** Maestro assumes local shell execution.

5. **Is there a public SLA for agent uptime/reliability?** Antigravity still in preview; stability not guaranteed.

6. **How does Agent Manager handle long-running agents?** Can you safely disconnect and reconnect?

7. **Does Antigravity support cost attribution per agent?** Important for billing multi-agent setups.

---

## Conclusion

### For Antigravity (Current Reality)

Antigravity **cannot replicate Claude Code's multi-agent pattern natively**. Best approach:

✅ **Use sequential skill-based pipeline** (researcher → planner → implementer → tester → reviewer)
✅ **Track state via Markdown files** (.orchestration-state.md)
❌ **No true subagent spawning**
❌ **No parallel execution**
❌ **Single context window shared across phases**

**Verdict:** Suitable for linear, single-developer workflows; not for complex team-based orchestration.

### For Gemini CLI (Experimental but Functional)

Gemini CLI + maestro-gemini **CAN replicate Claude Code's pattern** via experimental subagent system:

✅ **True parallel execution** via `/agents:run` spawning
✅ **Independent contexts** per subagent
✅ **Scalable** (tested with 12+ agents)
✅ **Production-ready in maestro-gemini** (battle-tested framework)
❌ **Experimental API** (may change)
❌ **File-based state sharing** (potential races)
❌ **CLI-first, not IDE-integrated**

**Verdict:** If you need Claude Code-like orchestration, use Gemini CLI with maestro-gemini framework.

### Hybrid Recommendation

1. **For IDE-focused teams:** Use Antigravity with sequential skills + strong documentation
2. **For orchestration-heavy projects:** Switch to Gemini CLI + maestro-gemini
3. **For enterprise:** Evaluate Google ADK (multi-agent primitives, production-grade)
4. **For maximum flexibility:** Build external orchestrator + MCP bridge

---

## Sources

- [Build with Google Antigravity, our new agentic development platform - Google Developers Blog](https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/)
- [Getting Started with Google Antigravity | Google Codelabs](https://codelabs.developers.google.com/getting-started-google-antigravity)
- [Google Antigravity AI IDE 2026: Agentic Development Platform & Workflow Revolution](https://www.baytechconsulting.com/blog/google-antigravity-ai-ide-2026)
- [Google Antigravity: The Agentic IDE Changing Development Work](https://www.index.dev/blog/google-antigravity-agentic-ide)
- [Google Antigravity IDE Review: The Moment "Agent-First Development" Started Feeling Real | by SONAL VIJ | Jan, 2026 | Medium](https://medium.com/@sonalchinioti/google-antigravity-ide-review-the-moment-agent-first-development-started-feeling-real-ff5697c80216)
- [How to Build Custom Skills in Google Antigravity: 5 Practical Examples | Google Cloud - Community](https://medium.com/google-cloud/tutorial-getting-started-with-antigravity-skills-864041811e0d)
- [Agent Skills | Gemini CLI](https://geminicli.com/docs/cli/skills/)
- [Get started with Agent Skills | Gemini CLI](https://geminicli.com/docs/cli/tutorials/skills-getting-started/)
- [Authoring Google Antigravity Skills | Google Codelabs](https://codelabs.developers.google.com/getting-started-with-antigravity-skills)
- [How to connect MCP servers with Google Antigravity to maximize productivity - Composio](https://composio.dev/blog/howto-mcp-antigravity)
- [GitHub - josstei/maestro-gemini: Turn Gemini CLI into a multi-agent platform](https://github.com/josstei/maestro-gemini)
- [Subagents (experimental) | Gemini CLI](https://geminicli.com/docs/core/subagents/)
- [GitHub - shinpr/sub-agents-skills: Cross-LLM sub-agent orchestration as an Agent Skills](https://github.com/shinpr/sub-agents-skills)
- [Multi-agent systems - Agent Development Kit (ADK)](https://google.github.io/adk-docs/agents/multi-agents/)
- [Creating Agent Skills | Gemini CLI](https://geminicli.com/docs/cli/creating-skills/)
- [Advanced Gemini CLI: Part 3—Dynamic Isolated Agents | by Prashanth Subrahmanyam | Google Cloud - Community | Medium](https://medium.com/google-cloud/advanced-gemini-cli-part-3-isolated-agents-b9dbab70eeff)
- [Google Antigravity vs Gemini CLI: Agent-First Development vs Terminal-Based AI (2026) | Augment Code](https://www.augmentcode.com/tools/google-antigravity-vs-gemini-cli)
- [How I Turned Gemini CLI into a Multi-Agent System with Just Prompts](https://aipositive.substack.com/p/how-i-turned-gemini-cli-into-a-multi)
- [What are Google Antigravity Skills? Build 24/7 AI Agents | VERTU](https://vertu.com/lifestyle/mastering-google-antigravity-skills-the-ultimate-guide-to-extending-agentic-ai-in-2026/)
