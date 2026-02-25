---
description: Fix the agent skill based on `logs.txt` file.
argument-hint: [prompt-or-path-to-skill]
---

Think harder.
Use `skill-creator` skill and `claude-code-guide` subagent.
Use `docs-seeker` skills to search for documentation if needed.

## Your mission
Fix the agent skill based on the current `logs.txt` file (in the project root directory).

## Requirements
<user-prompt>$ARGUMENTS</user-prompt>

## Rules of Skill Fixing:
Base on the requirements:
- If you're given nothing, use `AskUserQuestion` tool for clarifications and `researcher` subagent to research about the topic.
- If you're given an URL, it's documentation page, use `Explorer` subagent to explore every internal link and report back to main agent, don't skip any link.
- If you receive a lot of URLs, use multiple `Explorer` subagents to explore them in parallel, then report back to main agent.
- If you receive a lot of files, use multiple `Explorer` subagents to explore them in parallel, then report back to main agent.
- If you're given a Github URL, use [`repomix`](https://repomix.com/guide/usage) command to summarize ([install it](https://repomix.com/guide/installation) if needed) and spawn multiple `Explorer` subagents to explore it in parallel, then report back to main agent.