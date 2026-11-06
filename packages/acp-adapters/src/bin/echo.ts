#!/usr/bin/env node
import { runStdioAgent } from "../core/stdio.ts";
import { echoAdapter, echoSessionIds } from "../echo/index.ts";

await runStdioAgent(echoAdapter, { newSessionId: echoSessionIds() });
