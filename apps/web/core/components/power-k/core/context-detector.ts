/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { Params } from "react-router";
// plane web imports
import { detectExtendedContextFromURL } from "@/components/command-palette/power-k/context-detector";
// local imports
import type { TPowerKContextType } from "./types";

/**
 * Detects the current context from the URL params and pathname
 * Returns information about the active entity (work item, project, cycle, etc.)
 */
export const detectContextFromURL = (params: Params): TPowerKContextType | null => {
  if (params.workItem) return "work-item";
  if (params.cycleId) return "cycle";
  if (params.moduleId) return "module";
  if (params.pageId) return "page";

  return detectExtendedContextFromURL(params);
};
