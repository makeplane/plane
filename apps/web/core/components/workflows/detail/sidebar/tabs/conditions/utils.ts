/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { TWorkflowScriptConfig } from "@plane/types";
import type { GetScriptById } from "./script-item";

export function hasMissingRequiredVariables(scripts: TWorkflowScriptConfig[], getScriptById: GetScriptById): boolean {
  for (const config of scripts) {
    if (!config.script_id) continue;
    const script = getScriptById(config.script_id);
    if (!script?.variables) continue;
    const requiredVariables = script.variables.filter((v) => v.required);
    const executionVariables = config.execution_variables ?? {};
    const missing = requiredVariables.some((v) => !executionVariables[v.key]?.trim());
    if (missing) return true;
  }
  return false;
}
