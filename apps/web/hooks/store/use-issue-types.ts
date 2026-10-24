/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
import type { IIssueTypesStore } from "@/store/issue-types.store";

export const useIssueTypes = (): IIssueTypesStore => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useIssueTypes must be used within StoreProvider");
  return context.issueTypesStore;
};
