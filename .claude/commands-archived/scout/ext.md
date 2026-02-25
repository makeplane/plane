---
description: ⚡ Use external agentic tools to scout given directories
argument-hint: [user-prompt] [scale]
---

## Purpose

Utilize external agentic tools to scout given directories or explore the codebase for files needed to complete the task using a fast, token efficient agent.

## Variables

USER_PROMPT: $1
SCALE: $2 (defaults to 3)
RELEVANT_FILE_OUTPUT_DIR: Use `Report:` from `## Naming` section

## Configuration

Read Gemini model from `.claude/.ck.json`: `gemini.model` (default: `gemini-3-flash-preview`)

## Workflow:
- Write a prompt for 'SCALE' number of agents to the `Task` tool that will immediately call the `Bash` tool to run these commands to kick off your agents to conduct the search:
  - `gemini -y -m <gemini.model> "[prompt]"` (if count <= 3)
  - `opencode run "[prompt]" --model opencode/grok-code` (if count > 3 and count < 6)
  - if count >= 6, spawn `Explore` subagents to search the codebase in parallel

**Why use external agentic tools?**
- External agentic tools are faster and more efficient when using LLMs with large context windows (1M+ tokens).

**How to prompt the agents:**
- If `gemini` or `opencode` is not available, ask the user if they want to install it:
  - If **yes**, install it (if there are permission issues, instruct the user to install it manually, including authentication steps)
  - If **no**, use the default `Explore` subagents.
- IMPORTANT: Kick these agents off in parallel using the `Task` tool, analyze and divide folders for each agent to scout intelligently and quickly.
- IMPORTANT: These agents are calling OTHER agentic coding tools to search the codebase. DO NOT call any search tools yourself.
- IMPORTANT: That means with the `Task` tool, you'll immediately call the Bash tool to run the respective agentic coding tool (gemini, opencode, claude, etc.)
- IMPORTANT: Instruct the agents to quickly search the codebase for files needed to complete the task. This isn't about a full blown search, just a quick search to find the files needed to complete the task.
- Instruct the subagent to use a timeout of 3 minutes for each agent's bash call. Skip any agents that don't return within the timeout, don't restart them.
- **IMPORTANT:** Sacrifice grammar for the sake of concision when writing reports.
- **IMPORTANT:** In reports, list any unresolved questions at the end, if any.