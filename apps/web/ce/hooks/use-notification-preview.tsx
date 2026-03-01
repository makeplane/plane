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

import type { IWorkItemPeekOverview } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
import { IssuePeekOverview } from "@/components/issues/peek-overview";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import type { TPeekIssue } from "@/store/work-items/details/root.store";

export type TNotificationPreview = {
  isWorkItem: boolean;
  PeekOverviewComponent: React.ComponentType<IWorkItemPeekOverview>;
  setPeekWorkItem: (peekIssue: TPeekIssue | undefined) => void;
};

/**
 * This function returns if the current active notification is related to work item or an epic.
 * @returns isWorkItem: boolean, peekOverviewComponent: IWorkItemPeekOverview, setPeekWorkItem
 */
export const useNotificationPreview = (): TNotificationPreview => {
  const { peekIssue, setPeekIssue } = useIssueDetail(EIssueServiceType.ISSUES);

  return {
    isWorkItem: Boolean(peekIssue),
    PeekOverviewComponent: IssuePeekOverview,
    setPeekWorkItem: setPeekIssue,
  };
};
