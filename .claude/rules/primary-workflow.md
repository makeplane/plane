---
paths:
  - apps/**
---

# Primary Workflow

Activate relevant skills from catalog per task. Ensure token efficiency.

#### 1. Code Implementation

- Delegate to `planner` agent for implementation plan in `./plans`
- Use multiple `researcher` agents in parallel for technical research
- Follow established patterns, handle edge cases
- Update existing files directly — never create "enhanced" copies
- Run compile command after creating/modifying code files

#### 2. Testing

- Delegate to `tester` agent on final code
- Never ignore failing tests — fix and re-test until all pass
- No fake data, mocks, or cheats to pass builds

#### 3. Code Quality

- Delegate to `code-reviewer` agent after testing passes
- Self-documenting code with meaningful comments for complex logic

#### 4. Integration

- Follow `planner` agent's plan
- Maintain backward compatibility, document breaking changes
- Delegate to `docs-manager` agent for `./docs` updates

#### 5. Debugging

- Delegate to `debugger` agent for bug reports/CI failures
- Read summary report, implement fix
- Delegate to `tester` agent, repeat from Step 3 if tests fail

#### 6. Visual Explanations

When explaining complex code/architecture (3+ interacting components):

- `/preview --explain <topic>` — ASCII + Mermaid
- `/preview --diagram <topic>` — architecture/data flow
- `/preview --slides <topic>` — step-by-step
- `/preview --ascii <topic>` — terminal-friendly
