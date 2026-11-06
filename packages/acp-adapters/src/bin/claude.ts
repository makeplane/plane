#!/usr/bin/env node
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createClaudeAdapter } from "../claude/index.ts";
import { runStdioAgent } from "../core/stdio.ts";

await runStdioAgent(createClaudeAdapter());
