# UI Fix Workflow

For fixing visual/UI issues. Requires design skills. Uses native Claude Tasks for phase tracking.

## Required Skills (activate in order)
1. `ck:ui-ux-pro-max` - Design database (ALWAYS FIRST)
2. `ck:ui-ux-pro-max` - Design principles
3. `ck:frontend-design` - Implementation patterns

## Pre-fix Research
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<product-type>" --domain product
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<style>" --domain style
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "accessibility" --domain ux
```

## Task Setup (Before Starting)

```
T1 = TaskCreate(subject="Analyze visual issue",    activeForm="Analyzing visual issue")
T2 = TaskCreate(subject="Implement UI fix",         activeForm="Implementing UI fix",       addBlockedBy=[T1])
T3 = TaskCreate(subject="Verify visually",          activeForm="Verifying visually",         addBlockedBy=[T2])
T4 = TaskCreate(subject="DevTools check",           activeForm="Checking with DevTools",     addBlockedBy=[T3])
T5 = TaskCreate(subject="Test compilation",         activeForm="Testing compilation",        addBlockedBy=[T4])
T6 = TaskCreate(subject="Update design docs",       activeForm="Updating design docs",       addBlockedBy=[T5])
```

## Workflow

### Step 1: Analyze
`TaskUpdate(T1, status="in_progress")`
Analyze screenshots/videos with `ck:ai-multimodal` skill.

- Read `./docs/design-guidelines.md` first
- Identify exact visual discrepancy

`TaskUpdate(T1, status="completed")`

### Step 2: Implement
`TaskUpdate(T2, status="in_progress")`
Use `ui-ux-designer` agent.

`TaskUpdate(T2, status="completed")`

### Step 3: Verify Visually
`TaskUpdate(T3, status="in_progress")`
Screenshot + `ck:ai-multimodal` analysis.

- Capture parent container, not whole page
- Compare to design guidelines
- If incorrect → keep T3 `in_progress`, loop back to Step 2

`TaskUpdate(T3, status="completed")`

### Step 4: DevTools Check
`TaskUpdate(T4, status="in_progress")`
Use `ck:chrome-devtools` skill.

`TaskUpdate(T4, status="completed")`

### Step 5: Test
`TaskUpdate(T5, status="in_progress")`
Use `tester` agent for compilation check.

`TaskUpdate(T5, status="completed")`

### Step 6: Document
`TaskUpdate(T6, status="in_progress")`
Update `./docs/design-guidelines.md` if needed.

`TaskUpdate(T6, status="completed")`

## Tips
- Use `ck:ai-multimodal` for generating visual assets
- Use `ImageMagick` for image editing
