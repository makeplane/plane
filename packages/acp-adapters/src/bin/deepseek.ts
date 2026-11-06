#!/usr/bin/env node
import { runStdioAgent } from "../core/stdio.ts";
import { createDeepSeekAdapter } from "../deepseek/index.ts";

await runStdioAgent(createDeepSeekAdapter());
