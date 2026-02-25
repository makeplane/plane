---
description: Update an existing agent skill [auto]
argument-hint: [skill-name] [prompt]
---

Think harder.
Use `skill-creator` skill and `claude-code-guide` subagent.
Use `docs-seeker` skills to search for documentation if needed.

## Arguments
SKILL: $1 (default: `*`)
PROMPT: $2 (default: empty)

## Your mission
Update an existing skill or its reference files in `.claude/skills/${SKILL}` directory based on the user's prompt. 
Always keep in mind that `SKILL.md` and reference files should be token consumption efficient, so that **progressive disclosure** can be leveraged at best.
`SKILL.md` is always short and concise, straight to the point, treat it as a quick reference guide.

### Scopes
- Project-scope: Current working project directory (e.g. `.claude/`)
- User-scope: Home/user directory (e.g. `~/.claude/`)

## IMPORTANT NOTES:
- ALWAYS make changes to skills in the project-scope `.claude/skills/` directory (UNLESS you're allowed to).
- DO NOT make any changes to skills in the home/user-scope `~/.claude/skills/` directory (UNLESS you're allowed to).
- If you're given nothing, use `AskUserQuestion` tool for clarifications and `researcher` subagent to research about the topic.
- If you're given an URL, it's documentation page, use `Explore` subagent to explore every internal link and report back to main agent, don't skip any link.
- If you receive a lot of URLs, use multiple `Explore` subagents to explore them in parallel, then report back to main agent.
- If you receive a lot of files, use multiple `Explore` subagents to explore them in parallel, then report back to main agent.
- If you're given a Github URL, use [`repomix`](https://repomix.com/guide/usage) command to summarize ([install it](https://repomix.com/guide/installation) if needed) and spawn multiple `Explore` subagents to explore it in parallel, then report back to main agent.
- Skills are not documentation, they are practical instructions for Claude Code to use the tools, packages, plugins or APIs to achieve the tasks.
- Each skill teaches Claude how to perform a specific development task, not what a tool does.
- Claude Code can activate multiple skills automatically to achieve the user's request.

## Additional instructions
<additional-instructions>$PROMPT</additional-instructions>