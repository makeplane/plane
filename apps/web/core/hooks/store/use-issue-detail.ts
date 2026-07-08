/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
import type { TIssueServiceType } from "@plane/types";
import { EIssueServiceType, EIssuesStoreType } from "@plane/types";
// mobx store
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
import { StoreContext } from "@/lib/store-context";
// types
import type { IIssueDetail } from "@/plane-web/store/issue/issue-details/root.store";

export const useIssueDetail = (serviceType?: TIssueServiceType): IIssueDetail => {
  const context = useContext(StoreContext);
  // Without an explicit service type, follow the surrounding issues store
  // context (the epics section provides EIssuesStoreType.EPIC) so that every
  // nested detail consumer resolves to the matching detail store.
  const storeType = useContext(IssuesStoreContext);
  if (context === undefined) throw new Error("useIssueDetail must be used within StoreProvider");
  const resolvedServiceType =
    serviceType ?? (storeType === EIssuesStoreType.EPIC ? EIssueServiceType.EPICS : EIssueServiceType.ISSUES);
  if (resolvedServiceType === EIssueServiceType.EPICS) return context.issue.epicDetail;
  else return context.issue.issueDetail;
};
