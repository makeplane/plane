# Research Report: Attention Dilution & Context Window Management in AI Coding Assistants

**Researcher:** Claude Code Subagent
**Date:** 2026-03-02
**Report ID:** researcher-260302-1640-attention-dilution-solutions

---

## Executive Summary

Attention dilution is a well-documented phenomenon where LLM performance degrades as context windows grow. Recent research (Chroma 2025, Anthropic 2026) confirms that larger context windows create real problems: token attention spreads thinner, critical information in the middle gets ignored ("lost in the middle" effect), and computational overhead increases quadratically. This report synthesizes practical solutions from real developers, open-source projects, and academic research to provide a comprehensive guide for managing attention dilution in AI coding workflows.

**Key Finding:** Context engineering (structuring what the AI sees) has replaced prompt engineering as the critical discipline. Success requires treating context as a finite resource with deliberate architecture, not assuming bigger windows solve problems.

---

## Part 1: The Attention Dilution Problem

### 1.1 What is Attention Dilution?

As context windows grow, the model's attention mechanism must distribute its "attention budget" across more tokens. This causes:

- **Token competition:** In a 10 million-token window, a single relevant sentence becomes statistically insignificant against millions of distractor tokens
- **Probability mass spread:** The probability distribution of the attention mechanism spreads thinner, reducing focus on any individual token
- **Computational explosion:** Attention mechanism complexity grows **quadratically** with sequence length. Doubling tokens requires 4x compute to calculate all token-to-token relationships

### 1.2 The "Lost in the Middle" Effect

**Research Evidence (Chroma 2025 Context Rot Study):**

The Chroma research team evaluated 18 leading LLMs (GPT-4.1, Claude 4, Gemini 2.5, Qwen3) and found:

- Models perform significantly better with information at the **beginning** (strong attention)
- Models perform well with information at the **end** (recency bias)
- Models perform **poorly** with information in the **middle** (lost in the middle)
- In extremely long contexts, attention patterns sometimes **collapse entirely**

**Interesting Finding:** When researchers took coherent essays and **randomly reordered sentences** while keeping vocabulary/topics consistent, models performed **better** at finding information. This suggests models struggle not just with length, but with _structure_ of information.

### 1.3 Context Rot in 2025-2026

**Key Insight from Chroma Research:**
"Models do not use their context uniformly; instead, their performance grows increasingly unreliable as input length grows."

Nearly **65% of enterprise AI failures in 2025** were attributed to context drift or memory loss during multi-step reasoning. Large context windows are a false promise—they solve one problem (capacity) while creating new ones (attention management).

### 1.4 Quadratic Compute Costs

Processing larger context windows increases both:

- **Latency:** O(n²) complexity in attention calculations
- **Cost:** Proportional to token count (both input and processing time)

**Practical implication:** Using larger context is only effective if you actually reduce the number of rounds, otherwise you're trading one cost for another.

---

## Part 2: Best Practices for CLAUDE.md / Rules Structure

### 2.1 The Lost-Instruction Problem

**Real Issue:** When CLAUDE.md or rules grow too large, Claude ignores half of them. Critical instructions get lost in the noise because the model can't effectively prioritize everything.

**Solution:** Ruthlessly prune. If Claude already does something correctly without the instruction, delete it or convert it to a hook.

### 2.2 CLAUDE.md Size Limits

**Best Practice from Multiple Sources:**

- **Keep CLAUDE.md under 150 lines** — beyond this, important rules get lost in the noise
- Don't include rules that Claude already does correctly (redundancy = noise)
- Focus on **universal behavior** that applies everywhere
- Move domain-specific rules to `.claude/rules/` directory

### 2.3 Layered Rules Architecture (.claude/rules/)

**Claude Code Feature:** The `.claude/rules/` directory allows you to split instructions into multiple focused files instead of one massive CLAUDE.md.

**How it works:**

- All markdown files in `.claude/rules/` are automatically loaded when Claude starts
- Each rule file covers ONE topic (e.g., testing.md, api-design.md, frontend-patterns.md)
- Rules load with same high priority as CLAUDE.md but are context-filtered

**Structure Example:**

```
.claude/rules/
├── testing.md                    # Test requirements, frameworks
├── api-design.md                 # API patterns, conventions
├── frontend-patterns.md          # React, component structure
├── backend-architecture.md       # Django, database patterns
├── git-safety-rules.md          # Git workflow, branch protection
└── modularization-guidelines.md # File size, code organization
```

### 2.4 Conditional Rule Loading with Path Targeting

**Most Powerful Feature:** Rules can be scoped to specific files using YAML frontmatter:

```yaml
---
paths: src/api/**/*.ts
---
# These rules only apply when Claude works on API TypeScript files
```

**Real Example (from Plane.so):**

```yaml
---
paths: apps/web/ce/**/*
---
# CE-specific rules only load when working in the CE directory
```

**Benefits:**

- Frontend engineer editing React doesn't see backend Django rules (noise reduction)
- Backend engineer sees all Django + database rules when touching API
- Context stays focused; unrelated rules stay out of the attention window

### 2.5 Rule Organization Strategy

**Recommended Tiering:**

**CLAUDE.md (always loaded, ~100-150 lines):**

- Project overview & context
- Universal quality standards (testing, linting, commit format)
- Core workflows (planning → implementation → testing)
- File size/modularization guidelines
- Role & responsibilities

**Rule Files (conditional/domain-specific):**

- `testing.md` (test frameworks, coverage targets, pytest patterns)
- `api-design.md` (REST conventions, serializer patterns, permission checks)
- `frontend-patterns.md` (MobX store patterns, component structure, Tailwind usage)
- `backend-architecture.md` (Django viewsets, middleware, timezone handling)
- `git-safety-rules.md` (branch protection, force push warnings, upstream risks)
- `performance-optimization.md` (N+1 queries, caching, database indexes)

---

## Part 3: Context Window Management Strategies

### 3.1 Anthropic's "Finite Resource" Principle

**Official Guidance (Anthropic 2026):**

Treat context window as a **finite resource with diminishing returns**. Don't front-load everything. Instead, use:

- **Minimal system instructions** — keep them focused
- **Just-in-time retrieval** — fetch data when needed, not upfront
- **Lazy context loading** — load details only for current task

**Practical Pattern:**

```
Bad:  Load entire codebase → AI reads 100k lines → loses focus
Good: AI needs function → Load only that function + related types → focused attention
```

### 3.2 "Just-In-Time" Context Retrieval Pattern

**Definition:** Retrieve data/documents only when needed, not at the start.

**Implementation in Claude Code:**

When requesting help, provide only what's needed right now:

```
Bad:  "Here's my entire Django models file (500 lines)"
Good: "I'm working on IssueViewSet. Can you help with the list() method?"
      [Paste only the list() method + related methods]
```

**Benefits:**

- Avoids drowning the model in distractors
- Each token in context has more influence
- Better model performance on the focused task

### 3.3 Dynamic Context Allocation

**Advanced Pattern (Anthropic 2026):**

For complex tasks, dynamically allocate context budget:

**Simple factual queries:**

- 70% context → retrieved documents
- 20% context → conversation history
- 10% context → system instructions

**Complex queries requiring understanding previous discussion:**

- 40% context → retrieved documents
- 50% context → conversation history
- 10% context → system instructions

**Implementation:** Adjust what you include in each message based on task complexity.

### 3.4 The "Lost in the Middle" Countermeasure

**Technique: Front-Load Critical Information**

If you must include lots of context, put critical information at the **beginning** and **end**, not in the middle:

```
Bad (middle loses focus):
Line 1: Function definition
Line 2-50: 49 lines of boilerplate
Line 51: Critical constraint "must handle null"
Result: Critical constraint gets ignored

Good (critical at start):
Line 1: "CRITICAL: Must handle null values"
Line 2: Function definition
Line 3-50: Implementation details
Result: Critical constraint gets attention
```

---

## Part 4: Phase-Based Development Pattern

### 4.1 The Three-Phase Model

**From Research (Addy Osmani, Dr. Randal Olson, 2026):**

AI-assisted development works best as **three distinct phases**. If done right, 75% of time spent in first two phases (planning + design), only 25% in execution.

### 4.2 Phase 1: Planning Phase

**Goal:** Create a comprehensive project plan without implementation.

**Steps:**

1. Write project specification/requirements
2. Ask AI to generate a detailed plan by breaking into logical tasks
3. AI generates `implementation-plan.md` with:
   - Overview of all tasks
   - Dependencies between tasks
   - Estimated complexity for each
   - Success criteria

**Context:** Feed AI spec + any architecture docs. No code yet.

**Output:** Markdown file documenting the plan. This becomes your source of truth.

### 4.3 Phase 2: Design Phase

**Goal:** Design system architecture and components.

**Steps:**

1. Based on plan, have AI write design docs with:
   - Component interactions
   - Data flow diagrams
   - API contracts
   - Database schema
2. Include checkpoints after major features
3. Review + test before moving forward

**Context:** Reference the plan + existing codebase patterns.

**Output:** Design documentation + potentially initial test suites.

### 4.4 Phase 3: Implementation Phase

**Goal:** Execute the plan with focus.

**Critical Technique: Start Fresh Chat**

> "Start a fresh chat session. Point the AI at your implementation plan file and nothing else. Then tell it to follow the plan."

**Why this works:**

- Plan is self-contained and comprehensive
- AI doesn't need to understand the entire planning discussion
- Context stays lean and focused on current task
- Reduces distraction from planning debates

**Implementation Pattern:**

```
1. Start new Claude Code session
2. Point to: implementation-plan.md
3. Say: "Implement Phase 1 from this plan"
4. AI executes focused on plan
5. You review + test
6. Commit + start next chat for Phase 2
```

### 4.5 Why Fresh Chats Matter

**Problem:** As context accumulates, "carelessness and stupid mistakes seem to increase" (Addy Osmani observation).

**Root Cause:** Each message adds to token count. By the end of a long conversation, your current task is buried in hundreds of previous messages. Attention dilutes.

**Solution:** Clear context between logical phases. Each new chat is focused on a single phase with a clear plan.

**Practical Result:** Better code quality, fewer iterations, faster turnaround.

---

## Part 5: Rule Compression & Instruction Optimization

### 5.1 Why Rules Bloat Happens

Large projects accumulate rules over time:

- Add a new architectural pattern → add rule
- Fix a bug caused by misunderstanding → add rule
- Onboard a new team member → clarify existing rules
- Result: CLAUDE.md grows to 300+ lines

**Problem:** Larger rule files have **diminishing returns**. After ~150 lines, additional rules actually hurt performance because important ones get lost.

### 5.2 Rule Compression Technique 1: Ruthless Pruning

**Process:**

1. Read your current CLAUDE.md/rules
2. For each rule, ask: "Does Claude already do this without the instruction?"
3. If yes → delete or convert to inline code comment
4. Keep only rules that prevent actual mistakes

**Example (Real Case):**

```
Rule: "Use kebab-case for filenames"
       (Claude already does this 95% of the time)

Better: Keep for ONE special case that Claude gets wrong,
        delete the generic version
```

### 5.3 Rule Compression Technique 2: Hierarchical Abstraction

Instead of listing all rules, abstract into categories:

```
Bad (verbose):
- Use const not let
- Use arrow functions not function keyword
- Use template strings not concatenation
- Use destructuring not property access

Good (abstract):
- Follow modern JavaScript conventions (ES2020+)
- Link to: javascript-style-guide.md (external)
```

### 5.4 Rule Compression Technique 3: Context-Based Embedding

**Technique:** Embed rules into code, plan files, and documentation where they naturally belong instead of centralizing them.

**Example:**

```
Bad (centralized in CLAUDE.md):
├── CLAUDE.md (list of 30 rules)

Good (distributed context):
├── CLAUDE.md (5 universal rules)
├── .claude/rules/testing.md (test-specific rules)
├── plans/phase-1-api.md (API design rules embedded in plan)
│   └── "Note: All ViewSets must inherit BaseViewSet"
├── docs/design-guidelines.md (referenced from rules)
└── apps/api/plane/api/views/base.py (actual pattern in code)
```

**Benefit:** AI sees rules at point-of-use, not in isolation. Context is tighter.

---

## Part 6: Real-World Project Examples

### 6.1 How Anthropic Structures Rules

**Claude Code Repository:** https://github.com/anthropics/claude-code

Contains:

- CLAUDE.md for universal behavior
- `.claude/rules/` directory for modular rules
- Plugin system for extending capabilities
- Focus on agent-specific patterns, not verbose documentation

### 6.2 How Vercel & Stripe Structure .cursorrules

**Pattern:** Professional projects use `.cursorrules` (Cursor format) with sections:

```
# Vercel .cursorrules structure:
- Framework conventions (Next.js specific)
- Code style preferences (ESLint, Prettier)
- Performance guidelines (React best practices)
- Testing standards (Jest, E2E tests)
- Deployment considerations
```

**Key Difference from Claude Code:**

- Cursor uses `.cursorrules` (single file, max ~300 lines)
- Claude Code uses `.claude/rules/` (multiple files, modular)
- Anthropic is pushing toward **modular architecture** (multiple files)

### 6.3 Plane.so Pattern (Actual Project)

From the project you're in (./.claude/rules/):

```
.claude/rules/
├── primary-workflow.md           # Research → Plan → Code → Test → Review
├── development-rules.md          # File naming, size limits, quality
├── plane-design-system.md        # Frontend patterns, component libs
├── plane-backend-architecture.md # Django patterns, database, API design
├── orchestration-protocol.md     # Multi-agent coordination
└── documentation-management.md   # Roadmap, changelog, plan structure
```

**Why this works for Plane:**

- Each rule file is focused (~500-1500 lines each)
- Rules are referenced, not duplicated
- Path-targeting applies rules conditionally (frontend rules don't load for backend)
- Clear separation of concerns

---

## Part 7: Embedding Rules into Plan/Phase Files

### 7.1 Pattern: Lightweight Plans with Embedded Rules

**Concept:** Rather than maintaining separate rules + plans, embed rules into phase files at point-of-use.

**Example Plan File Structure:**

```markdown
# Phase 1: Implement API Endpoints

## Context Links

- Related rules: .claude/rules/plane-backend-architecture.md
- Design doc: docs/system-architecture.md
- Similar features: see Issue #234

## Overview

Implement CRUD endpoints for new feature X.

## Key Architectural Rules (Embedded)

- **Always inherit BaseViewSet** not ModelViewSet
- **Use @allow_permission decorator** for per-method permission checks
- **Fire activity.delay() and model_activity.delay()** after mutations
- **Use Issue.issue_objects not Issue.objects** (excludes deleted)
- **Serialize with DynamicSerializer** to support ?fields=a,b&expand=c,d

## Implementation Steps

1. Create ViewSet class inheriting BaseViewSet
   - Include webhook_event = "my_model"
   - Define get_serializer_class() for write/read separation
   - All steps reference the embedded rules above
```

**Benefits:**

- AI has rules right when implementing each step
- No need to reference separate rule files
- Plan is self-contained and executable
- Rules stay lean; embedded rules prevent AI from getting lost

### 7.2 Pattern: Dynamic Task Markdown (ai_dynamic_task.md)

**From Community Patterns (Real Developers, 2025):**

Successful projects maintain two markdown files:

**ai_project_context.md** (static, long-term):

- Project overview
- Architecture
- Technology stack
- Key patterns
- Never changes mid-task

**ai_dynamic_task.md** (live scratchpad, changes constantly):

```markdown
# Current Task: Implement Issue Comments

## Task Status

- Step 1: Create model ✅ DONE
- Step 2: Create serializer 🔄 IN PROGRESS
- Step 3: Create ViewSet ⏳ TODO
- Step 4: Write tests ⏳ TODO

## Current Rules (for this task)

- All comments must be soft-deletable
- Fire activity_task after mutations
- Support ?expand=author,reactions query param

## Plan This Step

## Expected Output

## Issues/Blockers

## Next Step
```

**Why this works:**

- AI reads current context fresh every message
- Progress is tracked
- No need to re-explain rules for current task
- Plans are updated live; AI always sees current state

---

## Part 8: How Claude Code .claude/rules/ Works

### 8.1 Rule Loading Behavior

**How Claude loads rules:**

1. On session start, Claude scans `.claude/rules/` directory
2. All `.md` files are discovered recursively
3. Files are loaded with **high priority** (same as CLAUDE.md)
4. YAML frontmatter controls conditional loading

### 8.2 Path-Based Conditional Loading

**YAML Frontmatter Syntax:**

```yaml
---
paths: src/api/**/*.ts
---
# This rule only applies to TypeScript files under src/api/
```

**When not to use conditional loading:**

- Rules that apply everywhere (use CLAUDE.md instead)
- Rules that are rarely conditional (too much overhead)

**When to use conditional loading:**

- Backend rules that don't apply to frontend
- Frontend-specific design system rules
- Test-specific patterns (pytest vs Jest, different scopes)
- Project-specific patterns (CE overrides in Plane)

### 8.3 Rule Priority & Conflict Resolution

**Priority Hierarchy (Highest → Lowest):**

1. YAML frontmatter conditional rules (when paths match)
2. Non-conditional rules in `.claude/rules/`
3. CLAUDE.md

**If multiple rules apply:** Claude uses specificity algorithm similar to CSS. More specific paths override general ones.

**Example:**

```
.claude/rules/
├── general-api-rules.md (paths: "apps/api/**/*")
└── specific-auth-rules.md (paths: "apps/api/authentication/**/*")

When Claude works on apps/api/authentication/views.py:
→ Both rules load
→ specific-auth-rules.md takes priority
```

### 8.4 Practical Limitations & Workarounds

**Limitation 1: User-Level Rules (Not Yet Stable)**

Some versions of Claude Code don't properly load `~/.claude/rules/` (user-level rules). **Workaround:** Keep all rules in your project's `.claude/rules/`.

**Limitation 2: Rule Size in Context**

Each rule file adds to token count. If you have 6 rule files × 1000 lines each = 6000 tokens just for rules. **Workaround:** Use conditional paths to scope rules.

**Limitation 3: No Built-In Rule Inheritance**

Rules don't inherit from parent directories. **Workaround:** Use clear naming and documentation to show dependencies.

---

## Part 9: Practical Implementation Examples

### 9.1 Example: Structuring Rules for Plane.so

**Given:** Plane has frontend (React) + backend (Django) + tests + database

**Current Structure (Good):**

```
.claude/rules/
├── primary-workflow.md
├── development-rules.md
├── plane-design-system.md (paths: apps/web/**)
├── plane-backend-architecture.md (paths: apps/api/**)
├── orchestration-protocol.md
└── documentation-management.md
```

**Optimization (Following Best Practices):**

```
.claude/rules/
├── primary-workflow.md (always, ~80 lines)
├── development-rules.md (always, ~150 lines, references others)
├── frontend/
│   ├── design-system.md (paths: apps/web/**)
│   ├── components.md (paths: apps/web/ce/components/**)
│   ├── stores.md (paths: apps/web/core/store/**, apps/web/ce/store/**)
│   └── routing.md (paths: apps/web/app/**)
├── backend/
│   ├── architecture.md (paths: apps/api/**)
│   ├── models.md (paths: apps/api/plane/db/models/**)
│   ├── views.md (paths: apps/api/plane/app/views/**)
│   └── testing.md (paths: apps/api/plane/tests/**)
├── database.md (paths: apps/api/plane/db/**)
├── git-safety.md (always, critical)
└── orchestration-protocol.md (always, for multi-agent coordination)
```

**Benefits:**

- Frontend rules don't load when editing Django
- Database rules only load when editing models
- Each rule file is ~300-500 lines (digestible)
- Path specificity is explicit

### 9.2 Example: Writing an Effective Backend Rule File

**File: `.claude/rules/backend/views.md`**

````yaml
---
paths: apps/api/plane/app/views/**/*.py
---

# Django Backend View Patterns

## Core Principles
- Always inherit from BaseViewSet or BaseAPIView
- Use @allow_permission decorator for per-method control
- Never use Is Authenticated directly—use decorators

## ViewSet Template

```python
from plane.app.views.base import BaseViewSet
from plane.app.permissions import ROLE, allow_permission

class MyModelViewSet(BaseViewSet):
    model = MyModel
    webhook_event = "my_model"

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return MyModelCreateSerializer
        return MyModelSerializer

    def get_queryset(self):
        return MyModel.objects.filter(
            project_id=self.kwargs.get("project_id"),
            workspace__slug=self.kwargs.get("slug"),
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id):
        # Always fire activity + webhook after mutations
        issue_activity.delay(...)
        model_activity.delay(...)
````

## Required Patterns

- Use .issue_objects not .objects (prevents leaking deleted items)
- Capture current_instance BEFORE updates (for activity diff)
- Use timezone_converter on datetime responses
- Validate related objects same project (prevent cross-project leak)

## Common Mistakes to Avoid

- ❌ Using .objects instead of .issue_objects
- ❌ Forgetting activity/webhook tasks
- ❌ Missing timezone conversion
- ❌ Not validating project ownership

````

**Why this works:**
- It's focused (only backend views)
- Conditional path loading (only loads for views/)
- Rules are at point-of-use (embedded in actual implementation pattern)
- Lists common mistakes (pattern matching helps AI avoid errors)

### 9.3 Example: Embedding Rules in a Phase File

**File: `plans/260302-1640-issue-comments/phase-03-implement-api.md`**

```markdown
# Phase 3: Implement API Endpoints

## Overview
Create REST endpoints for issue comments with proper pagination, permissions, and activity tracking.

## Embedded Key Rules

### Rule 1: Always Use BaseViewSet
```python
# ✅ Correct
from plane.app.views.base import BaseViewSet

class CommentViewSet(BaseViewSet):
    model = Comment
    webhook_event = "comment"
````

### Rule 2: Fire Activity + Webhook After Mutations

```python
# After create/update/delete, ALWAYS fire:
comment_activity.delay(
    type="comment.activity.created",
    requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
    actor_id=str(request.user.id),
    comment_id=str(comment.id),
    # ...
)
model_activity.delay(
    model_name="comment",
    model_id=str(comment.id),
    # ...
)
```

### Rule 3: Use .comment_objects not .objects

```python
# ✅ Correct - excludes deleted + special states
Comment.comment_objects.filter(...)

# ❌ Wrong - may leak hidden comments
Comment.objects.filter(...)
```

## Step-by-Step Implementation

1. **Create CommentViewSet** inheriting BaseViewSet
   - Remember Rule 1: Always inherit BaseViewSet
   - Include webhook_event = "comment"

2. **Implement list() method**
   - Use .comment_objects (Rule 3)
   - Use self.paginate() from BaseViewSet
   - Return paginated queryset

3. **Implement create() method**
   - Capture current_instance before save (for activity diffs)
   - Fire comment_activity.delay() AFTER create (Rule 2)
   - Fire model_activity.delay() AFTER create (Rule 2)

4. **Implement update() method**
   - Validate only author or admin can update
   - Fire activity tasks

5. **Implement delete() method**
   - Soft delete by default (model is SoftDeleteModel)
   - Fire activity tasks

```

**Why embedding in phase file works:**
- Rules are right where AI implements them
- Less context bloat (rules aren't separate files)
- Phase file is executable step-by-step
- AI sees rules at point-of-use, not in abstract form

---

## Part 10: Multi-Agent Orchestration (2026 Trend)

### 10.1 Why Single-Agent Models Fail at Scale

**Problem:** One Claude Code instance doing all planning + design + implementation leads to:
- Context accumulation (grows exponentially)
- Attention dilution (later code quality drops)
- Mixed concerns (AI switches between planning & execution)

### 10.2 Writer/Reviewer Pattern

**Pattern from Real Projects (2026):**

```

Agent 1 (Writer) → Writes code
→ Clears context
↓
Agent 2 (Reviewer) → Reviews code (context cleared)
→ Provides feedback
↓
Agent 1 (Writer) → Fixes issues based on feedback
→ Fresh context again

```

**Why it works:**
- Each agent has focused context
- No attention accumulation
- Both agents see only relevant information
- Better code quality (review loop catches attention-dilution errors)

### 10.3 Plan/Execute Pattern

**Pattern from Addy Osmani (2026):**

```

Phase 1: Planner (Opus) → Create detailed implementation plan
→ Save to file
↓
Phase 2: Executor (Haiku) → Load plan file
→ Execute plan step-by-step
→ Fresh context per step
↓
Phase 3: Reviewer (Opus) → Review completed code
→ Integration testing

```

**Why it works:**
- Opus handles complex planning (expensive)
- Haiku executes focused tasks (cheap)
- Each phase has dedicated context
- Plan is the "source of truth" across agents

### 10.4 Context Engineering Framework

**Emerging Standard (2026):**

```

Layer 1: System Instructions (CLAUDE.md) — Always loaded
Universal rules (.claude/rules/) — Conditional by path

Layer 2: Project Context (ai_project_context.md) — Load once
Architecture (docs/system-architecture.md)
Code standards (docs/code-standards.md)

Layer 3: Task-Specific Context (ai_dynamic_task.md) — Live scratchpad
Phase/Plan (current phase file)
Recent discussion (last 10 messages)

Layer 4: Point-of-Use Context (relevant code snippets)
Related tests (for reference)
Examples (from existing codebase)

```

**Implication:** Rules are distributed across layers, not centralized. Each layer has different refresh cadence.

---

## Part 11: Advanced Techniques (2025-2026 Frontier)

### 11.1 Attention Biasing

**Research Technique (Not Yet Production):**

Models can be conditioned to increase attention weight on specific sections. Example:

```

[CRITICAL START]
The system must handle timezone conversions for all datetime fields
returned to users.
[CRITICAL END]

## Implementation

1. Query the database
2. Convert timestamps

```

**Status:** Emerging in research; not yet standard in Claude Code. Use selectively.

### 11.2 Sparse Attention Mechanisms

**Research Direction:**

Instead of computing attention between all token pairs (O(n²)), compute only between relevant pairs. Benefits:
- Reduced computational cost
- Better focus on important tokens
- Faster inference

**Status:** Not available in Claude Code currently; mentioned for awareness of future directions.

### 11.3 Retrieval-Augmented Generation (RAG) Pattern

**How to implement:**

Instead of loading entire codebase, use semantic search:

```

User: "Help me implement the authentication flow"

Step 1: Search knowledge base for "authentication flow"
Step 2: Return only relevant docs + code examples
Step 3: Feed relevant context to Claude

```

**Implementation in Claude Code:** Not native, but achievable via:
- Custom documentation search
- Link relevant files in messages
- Use `@file` references instead of copy-pasting

---

## Part 12: Unresolved Questions & Research Gaps

Based on research, several questions remain open:

1. **Optimal rule file count:** How many rule files is too many? (6? 12? 20?)
   - Current guidance: "As many as needed, but use conditional paths to limit loaded rules"
   - **Unresolved:** What's the actual threshold before performance degrades?

2. **Path-based rule loading overhead:** Does conditional YAML frontmatter have computational cost?
   - **Unresolved:** How much context is consumed by loading/evaluating paths?

3. **Multi-agent context sharing:** What's the best way to pass context between agents?
   - Current pattern: Write to files, read from files
   - **Unresolved:** Is there a more efficient protocol?

4. **Rule inheritance and composition:** Can rules reference other rules?
   - **Unresolved:** Should `.claude/rules/` support rule composition/imports?

5. **Attention measurement:** Can we measure "attention dilution" in real Claude Code sessions?
   - **Unresolved:** What metrics would indicate when attention is diluting?

6. **Context budget allocation algorithm:** How to optimally allocate tokens across layers?
   - **Unresolved:** Adaptive allocation is possible but not standardized yet.

7. **Learned attention patterns:** Can developers train Claude Code to attend better?
   - **Unresolved:** Fine-tuning is expensive; is there a cheaper way?

8. **Phase-based checkpoint standards:** What should checkpoints include? What format?
   - Current practice: Save test results + commit hash
   - **Unresolved:** Should there be a standard checkpoint format?

---

## Part 13: Summary & Actionable Recommendations

### For Plane.so Specifically

1. **Keep current `.claude/rules/` structure** — it's well-organized
2. **Add conditional paths** to rules:
   - `frontend-specific.md` (paths: apps/web/**)
   - `backend-specific.md` (paths: apps/api/**)
3. **Embed rules in phase files** rather than maintaining separate rule lists
4. **Use /clear between major phases** when doing large implementations
5. **Treat CLAUDE.md as immutable** — add domain rules to `.claude/rules/` instead

### For Any Large Codebase

1. **Split CLAUDE.md into layers:**
   - Lean CLAUDE.md (100-150 lines max)
   - Domain-specific rules in `.claude/rules/`
   - Task-specific rules embedded in phase files

2. **Use conditional paths:**
   - Backend rules for `apps/api/**`
   - Frontend rules for `apps/web/**`
   - Test rules for `tests/**`

3. **Implement phase-based workflow:**
   - Phase 1: Planning (with AI help)
   - Phase 2: Design (with AI help, save plan.md)
   - Phase 3: Implementation (fresh chat, point at plan.md)
   - Phase 4: Testing (review & refine)

4. **Use dynamic task markdown:**
   - Maintain `ai_dynamic_task.md` as live scratchpad
   - Update as you progress through phases
   - Re-reference in each new chat

5. **Measure and optimize:**
   - Track which rules Claude actually uses
   - Remove rules that never prevent errors
   - Add rules only when fixing real mistakes

### For Reducing Attention Dilution

1. **Front-load critical information** in long contexts
2. **Use just-in-time retrieval** — fetch details when needed
3. **Start fresh chat between logical phases** — clears accumulated context
4. **Embed rules at point-of-use** — better attention than abstract listing
5. **Use YAML frontmatter for conditional loading** — reduces noise
6. **Maintain plan/phase files** — gives AI a focused roadmap

---

## Sources

Key research and practical guides referenced:

- [The Three Phases of AI-Assisted Coding](https://www.randalolson.com/2025/11/24/three-phases-ai-assisted-coding/)
- [My LLM Coding Workflow Going into 2026 - Addy Osmani](https://addyosmani.com/blog/ai-coding-workflow/)
- [Context Rot: When Long Context Fails - Chroma Research (2025)](https://research.trychroma.com/context-rot)
- [Claude Code Rules Directory: Modular Instructions That Scale](https://claudefa.st/blog/guide/mechanics/rules-directory)
- [AI Agents' Context Management Breakthroughs and Long-Running Task Execution](https://bytebridge.medium.com/ai-agents-context-management-breakthroughs-and-long-running-task-execution-d5cee32aeaa4)
- [Writing a Good CLAUDE.md File - HumanLayer Blog](https://www.humanlayer.dev/blog/writing-a-good-claude-md)
- [How to Write Great Cursor Rules - Trigger.dev](https://trigger.dev/blog/cursor-rules)
- [Context Engineering: A Complete Guide & Why It Is Important in 2026](https://codeconductor.ai/blog/context-engineering)
- [Best LLMs for Extended Context Windows in 2026](https://aimultiple.com/ai-context-window)
- [Best Practices for Claude Code - Claude Code Docs](https://code.claude.com/docs/en/best-practices)
- [2026 Agentic Coding Trends Report - Anthropic](https://resources.anthropic.com/hubfs/2026%20Agentic%20Coding%20Trends%20Report.pdf)
- [AI Coding Agents in 2026: Coherence Through Orchestration, Not Autonomy](https://mikemason.ca/writing/ai-coding-agents-jan-2026/)
- [Mastering Project Context Files for AI Coding Agents - EclipseSource](https://eclipsesource.com/blogs/2025/11/20/mastering-project-context-files-for-ai-coding-agents)
- [Context Windows are a Lie: The Myth Blocking AGI](https://natesnewsletter.substack.com/p/context-windows-are-a-lie-the-myth)

---

**End of Report**
```
