#!/usr/bin/env node
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { runLoginHelper } from "../login/index.ts";

const code = await runLoginHelper(process.argv.slice(2));
// Child processes and sockets may still hold the event loop; flush stdout and exit.
await new Promise<void>((resolve) => process.stdout.write("", () => resolve()));
process.exit(code);
