/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// types
import type { IIssueDisplayProperties } from "@plane/types";
// lib
import { store } from "@/lib/store-context";

export const shouldRenderColumn = (key: keyof IIssueDisplayProperties): boolean => {
  const isEstimateEnabled: boolean = store.projectRoot.project.currentProjectDetails?.estimate !== null;
  switch (key) {
    case "estimate":
      return isEstimateEnabled;
    default:
      return true;
  }
};
