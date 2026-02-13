---
description: Optimize an existing agent skill [auto]
argument-hint: [skill-name] [prompt]
---

Think harder.
Use `skill-creator` skill and `claude-code-guide` subagent.
Use `docs-seeker` skills to search for documentation if needed.

## Arguments
SKILL: $1 (default: `*`)
PROMPT: $2 (default: empty)

## Your mission
Optimize an existing skill in `.claude/skills/${SKILL}` directory. 
Always keep in mind that `SKILL.md` and reference files should be token consumption efficient, so that **progressive disclosure** can be leveraged at best.
`SKILL.md` is always short and concise, straight to the point, treat it as a quick reference guide.

**IMPORTANT:**
- Skills are not documentation, they are practical instructions for Claude Code to use the tools, packages, plugins or APIs to achieve the tasks.
- Each skill teaches Claude how to perform a specific development task, not what a tool does.
- Claude Code can activate multiple skills automatically to achieve the user's request.

## Additional instructions
<additional-instructions>$PROMPT</additional-instructions>