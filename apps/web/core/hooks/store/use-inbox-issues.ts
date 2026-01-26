/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
import type { IInboxIssueStore } from "@/store/inbox/inbox-issue.store";

export const useInboxIssues = (inboxIssueId: string): IInboxIssueStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useInboxIssues must be used within StoreProvider");
  return context.projectInbox.getIssueInboxByIssueId(inboxIssueId);
};
