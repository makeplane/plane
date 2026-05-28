# External Scouting with Gemini/OpenCode

Use external agentic tools for faster searches with large context windows (1M+ tokens).

## Tool Selection

```
SCALE <= 3  → gemini CLI
SCALE 4-5   → opencode CLI
SCALE >= 6  → Use internal scouting instead
```

## Configuration

Read from `.claude/.ck.json`:

```json
{
  "gemini": {
    "model": "gemini-3-flash-preview"
  }
}
```

Default model: `gemini-3-flash-preview`

## Gemini CLI (SCALE <= 3)

### Command

```bash
timeout 120 gemini -y -m <model> --prompt "[prompt]" 2>&1
```

### Example

```bash
timeout 120 gemini -y -m gemini-3-flash-preview --prompt "Search src/ for authentication files. List paths with brief descriptions." 2>&1
```

## OpenCode CLI (SCALE 4-5)

### Command

```bash
opencode run "[prompt]" --model opencode/grok-code
```

### Example

```bash
opencode run "Find all payment-related files in lib/ and api/" --model opencode/grok-code
```

## Installation Check

Before using, verify tools installed:

```bash
which gemini
which opencode
```

If not installed, ask user:

1. **Yes** - Provide installation instructions (may need manual auth steps)
2. **No** - Fall back to Explore subagents (`internal-scouting.md`)

## Spawning Parallel Bash Agents

Use `Task` tool with `subagent_type: "Bash"` to spawn parallel agents:

```
Task 1: subagent_type="Bash", prompt="Run: timeout 120 gemini -y -m gemini-3-flash-preview --prompt '[prompt1]' 2>&1"
Task 2: subagent_type="Bash", prompt="Run: timeout 120 gemini -y -m gemini-3-flash-preview --prompt '[prompt2]' 2>&1"
Task 3: subagent_type="Bash", prompt="Run: timeout 120 gemini -y -m gemini-3-flash-preview --prompt '[prompt3]' 2>&1"
```

Spawn all in single message for parallel execution.

## Prompt Guidelines

- Be specific about directories to search
- Request file paths with descriptions
- Set clear scope boundaries
- Ask for patterns/relationships if relevant

## Example Workflow

User: "Find database migration files"

Spawn 3 parallel Bash agents via Task tool:

```
Task 1 (Bash): "Run: timeout 120 gemini -y -m gemini-3-flash-preview --prompt 'Search db/, migrations/ for migration files' 2>&1"
Task 2 (Bash): "Run: timeout 120 gemini -y -m gemini-3-flash-preview --prompt 'Search lib/, src/ for database schema files' 2>&1"
Task 3 (Bash): "Run: timeout 120 gemini -y -m gemini-3-flash-preview --prompt 'Search config/ for database configuration' 2>&1"
```

## Reading File Content

When needing to read file content, use chunking to stay within context limits (<150K tokens safe zone).

### Step 1: Get Line Counts

```bash
wc -l path/to/file1.ts path/to/file2.ts path/to/file3.ts
```

### Step 2: Calculate Chunks

- **Target:** ~500 lines per chunk (safe for most files)
- **Max files per agent:** 3-5 small files OR 1 large file chunked

**Chunking formula:**

```
chunks = ceil(total_lines / 500)
lines_per_chunk = ceil(total_lines / chunks)
```

### Step 3: Spawn Parallel Bash Agents

**Small files (<500 lines each):**

```
Task 1: subagent_type="Bash", prompt="cat file1.ts file2.ts"
Task 2: subagent_type="Bash", prompt="cat file3.ts file4.ts"
```

**Large file (>500 lines) - use sed for ranges:**

```
Task 1: subagent_type="Bash", prompt="sed -n '1,500p' large-file.ts"
Task 2: subagent_type="Bash", prompt="sed -n '501,1000p' large-file.ts"
Task 3: subagent_type="Bash", prompt="sed -n '1001,1500p' large-file.ts"
```

### Chunking Decision Tree

```
File < 500 lines     → Read entire file
File 500-1500 lines  → Split into 2-3 chunks
File > 1500 lines    → Split into ceil(lines/500) chunks
```

Spawn all in single message for parallel execution.

## Timeout and Error Handling

- Wrap all gemini calls: `timeout 120 gemini -y -m <model> --prompt "[prompt]" 2>&1`
- Check exit code: non-zero means failure
- Check output for error markers: `GaxiosError`, `RESOURCE_EXHAUSTED`, `MODEL_CAPACITY_EXHAUSTED`, `PERMISSION_DENIED`, `UNAUTHENTICATED`
- On failure: skip that agent's result, do NOT retry
- On persistent failures (2+ agents fail): fall back to internal scouting
- **Model fallback**: If `gemini-3-flash-preview` fails with 429, try `gemini-2.5-flash` before giving up
