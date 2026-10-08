/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Params } from "react-router";
// local imports
import type { TPowerKContextType } from "./types";

export const detectContextFromURL = (params: Params): TPowerKContextType | null => {
  if (params.workItem) return "work-item";
  if (params.cycleId) return "cycle";
  if (params.moduleId) return "module";
  if (params.pageId) return "page";

  return null;
};
