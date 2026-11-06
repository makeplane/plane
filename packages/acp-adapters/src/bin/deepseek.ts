#!/usr/bin/env node
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { runStdioAgent } from "../core/stdio.ts";
import { createDeepSeekAdapter } from "../deepseek/index.ts";

await runStdioAgent(createDeepSeekAdapter());
