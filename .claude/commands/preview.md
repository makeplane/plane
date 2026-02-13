---
description: View files/directories OR generate visual explanations, slides, diagrams
arguments:
  - name: path
    description: Path to file/directory to preview, OR topic for generation modes
    required: false
---

Universal viewer + visual generator. View existing content OR generate new visual explanations.

## Usage

### View Mode (existing behavior)
- `/preview <file.md>` - View markdown file in novel-reader UI
- `/preview <directory/>` - Browse directory contents
- `/preview --stop` - Stop running server

### Generation Mode (new)
- `/preview --explain <topic>` - Generate visual explanation (ASCII + Mermaid + prose)
- `/preview --slides <topic>` - Generate presentation slides (one concept per slide)
- `/preview --diagram <topic>` - Generate focused diagram (ASCII + Mermaid)
- `/preview --ascii <topic>` - Generate ASCII-only diagram (terminal-friendly)

## Examples

```bash
# View mode
/preview plans/my-plan/plan.md     # View markdown file
/preview plans/                    # Browse plans directory

# Generation mode
/preview --explain OAuth flow      # Generate OAuth explanation
/preview --slides API architecture # Generate architecture slides
/preview --diagram data flow       # Generate data flow diagram
/preview --ascii auth process      # Generate ASCII-only diagram
```

## Argument Resolution

When processing arguments, follow this priority order:

1. **`--stop`** → Stop server (exit)
2. **Generation flags** (`--explain`, `--slides`, `--diagram`, `--ascii`) → Generation mode
3. **Path exists on filesystem** → View mode
4. **Neither flag nor valid path** → Error: suggest `/preview --help`

**Topic-to-slug conversion:**
- Lowercase the topic
- Replace spaces/special chars with hyphens
- Remove non-alphanumeric except hyphens
- Collapse multiple hyphens → single hyphen
- Trim leading/trailing hyphens
- **Max 80 chars** - truncate at word boundary if longer
- If result is empty (topic was all special chars) → Error: ask for valid topic

Example: `OAuth 2.0 Flow` → `oauth-2-0-flow.md`

**Multiple flags:** If multiple generation flags provided, use first one; remaining treated as topic.
Example: `/preview --explain --slides topic` → `--explain` mode, topic = "--slides topic"

**Placeholder `{topic}`:** Replaced with original user input in title case (not the slug).

## Execution

**IMPORTANT:** Run server as Claude Code background task using `run_in_background: true` with the Bash tool. This makes the server visible in `/tasks` and manageable via `KillShell`.

The skill is located at `.claude/skills/markdown-novel-viewer/`.

### Stop Server

If `--stop` flag is provided:

```bash
node .claude/skills/markdown-novel-viewer/scripts/server.cjs --stop
```

### Start Server

Otherwise, run the `markdown-novel-viewer` server as CC background task with `--foreground` flag (keeps process alive for CC task management):

```bash
# Determine if path is file or directory
INPUT_PATH="{{path}}"
if [[ -d "$INPUT_PATH" ]]; then
  # Directory mode - browse
  node .claude/skills/markdown-novel-viewer/scripts/server.cjs \
    --dir "$INPUT_PATH" \
    --host 0.0.0.0 \
    --open \
    --foreground
else
  # File mode - view markdown
  node .claude/skills/markdown-novel-viewer/scripts/server.cjs \
    --file "$INPUT_PATH" \
    --host 0.0.0.0 \
    --open \
    --foreground
fi
```

**Critical:** When calling the Bash tool:
- Set `run_in_background: true` to run as CC background task
- Set `timeout: 300000` (5 minutes) to prevent premature termination
- Parse JSON output and report URL to user

Example Bash tool call:
```json
{
  "command": "node .claude/skills/markdown-novel-viewer/scripts/server.cjs --dir \"path\" --host 0.0.0.0 --open --foreground",
  "run_in_background": true,
  "timeout": 300000,
  "description": "Start preview server in background"
}
```

After starting, parse the JSON output (e.g., `{"success":true,"url":"http://localhost:3456/view?file=...","networkUrl":"http://192.168.1.x:3456/view?file=..."}`) and report:
- Local URL for browser access
- Network URL for remote device access (if available)
- Inform user that server is now running as CC background task (visible in `/tasks`)

**CRITICAL:** MUST display the FULL URL including path and query string (e.g., `http://localhost:3456/view?file=/path/to/file.md`). NEVER truncate to just `host:port` (e.g., `http://localhost:3456`). The full URL is required for direct file access.

---

## Generation Mode

When `--explain`, `--slides`, `--diagram`, or `--ascii` flag is provided:

### Step 1: Determine Output Location

1. Check if there's an active plan context (from `## Plan Context` in hook injection)
2. If active plan exists: save to `{plan_dir}/visuals/{topic-slug}.md`
3. If no active plan: save to `plans/visuals/{topic-slug}.md`
4. Create `visuals/` directory if it doesn't exist

### Step 2: Generate Content

**Mermaid Diagram Syntax:**
When generating ` ```mermaid ` code blocks, use `/mermaidjs-v11` skill for v11 syntax rules.

**Essential rules (always apply):**
- Quote node text with special characters: `A["text with /slashes"]`
- Escape brackets in labels: `A["array[0]"]`

Use the appropriate template based on flag:

#### --explain (Visual Explanation)
```markdown
# Visual Explanation: {topic}

## Overview
Brief description of what we're explaining.

## Quick View (ASCII)
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Component A │───>│ Component B │───>│ Component C │
└─────────────┘    └─────────────┘    └─────────────┘

## Detailed Flow
\```mermaid
sequenceDiagram
    participant A as Component A
    participant B as Component B
    A->>B: Request
    B-->>A: Response
\```

## Key Concepts
1. **Concept A** - Explanation
2. **Concept B** - Explanation

## Code Example (if applicable)
\```typescript
// Relevant code snippet with comments
\```
```

#### --slides (Presentation Format)
```markdown
# {Topic} - Visual Presentation

---

## Slide 1: Introduction
- One concept per slide
- Bullet points only

---

## Slide 2: The Problem
\```mermaid
flowchart TD
    A[Problem] --> B[Impact]
\```

---

## Slide 3: The Solution
- Key point 1
- Key point 2

---

## Slide 4: Summary
Key takeaways...
```

#### --diagram (Focused Diagram)
```markdown
# Diagram: {topic}

## ASCII Version
┌──────────────────────────────────────────┐
│               Architecture               │
├─────────────┬──────────────┬─────────────┤
│   Layer 1   │   Layer 2    │   Layer 3   │
└─────────────┴──────────────┴─────────────┘

## Mermaid Version
\```mermaid
flowchart TB
    subgraph Layer1[Layer 1]
        A[Component A]
    end
    subgraph Layer2[Layer 2]
        B[Component B]
    end
    A --> B
\```
```

#### --ascii (Terminal-Friendly Only)
```
┌────────────────────────────────────────────────────────┐
│                    {Topic} Overview                    │
├────────────────────────────────────────────────────────┤
│                                                        │
│   ┌─────────┐       ┌─────────┐       ┌─────────┐      │
│   │  Input  │──────>│ Process │──────>│ Output  │      │
│   └─────────┘       └─────────┘       └─────────┘      │
│                                                        │
│   Legend:                                              │
│   ──────>  Data flow                                   │
│   ──────   Connection                                  │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Step 3: Save and Preview

1. Write generated content to determined path
2. Start preview server with the generated file:
```bash
node .claude/skills/markdown-novel-viewer/scripts/server.cjs \
  --file "<generated-file-path>" \
  --host 0.0.0.0 \
  --open \
  --foreground
```

### Step 4: Report to User

Report:
- Generated file path
- Preview URL (local + network)
- Remind: file saved in plan's `visuals/` folder for future reference

## Error Handling

| Error | Action |
|-------|--------|
| Invalid topic (empty) | Ask user to provide a topic |
| Flag without topic (`/preview --explain`) | Ask user: "Please provide a topic: `/preview --explain <topic>`" |
| Topic becomes empty after sanitization | Ask user to provide topic with alphanumeric characters |
| File write failure | Report error, suggest checking permissions |
| Server startup failure | Check if port in use, try `/preview --stop` first |
| No generation flag + invalid path | Suggest `/preview --help` or correct syntax |
| Existing file at output path | Overwrite with new content (no prompt) |
| Server already running | Reuse existing server instance, just open new URL |
| Parent `plans/` dir missing | Create directories recursively before write |
