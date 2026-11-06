#!/usr/bin/env node
import { createCodexAdapter } from "../codex/index.ts";
import { runStdioAgent } from "../core/stdio.ts";

await runStdioAgent(createCodexAdapter());
