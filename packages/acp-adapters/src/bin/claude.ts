#!/usr/bin/env node
import { createClaudeAdapter } from "../claude/index.ts";
import { runStdioAgent } from "../core/stdio.ts";

await runStdioAgent(createClaudeAdapter());
