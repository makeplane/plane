/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import powershell from "highlight.js/lib/languages/powershell";
import ts from "highlight.js/lib/languages/typescript";
import { common, createLowlight } from "lowlight";

// highlight.js `common` languages plus the extras below
export const lowlight = createLowlight(common);
lowlight.register("ts", ts);
lowlight.register("powershell", powershell);
