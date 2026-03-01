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

import { useEffect } from "react";
// plane imports
import { EIssueServiceType } from "@plane/types";
// ce imports
import type { TNotificationPreview } from "@/ce/hooks/use-notification-preview";
// components
import { IssuePeekOverview } from "@/components/issues/peek-overview";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// plane web imports
import { EpicPeekOverview } from "@/components/epics/peek-overview";

/**
 * This function returns if the current active notification is related to work item or an epic.
 * @returns isWorkItem: boolean, peekOverviewComponent: IWorkItemPeekOverview, setPeekWorkItem
 */
export const useNotificationPreview = (): TNotificationPreview => {
  const { peekIssue, setPeekIssue } = useIssueDetail(EIssueServiceType.ISSUES);
  const { peekIssue: peekEpic, setPeekIssue: setPeekEpic } = useIssueDetail(EIssueServiceType.EPICS);
  const { toggleEpicDetailSidebar } = useAppTheme();

  const isWorkItem = Boolean(peekIssue && !peekEpic);

  // set epic detail sidebar to collapsed
  useEffect(() => {
    if (peekEpic) {
      toggleEpicDetailSidebar(true);
    }
  }, [peekEpic, toggleEpicDetailSidebar]);

  return {
    isWorkItem,
    PeekOverviewComponent: isWorkItem ? IssuePeekOverview : EpicPeekOverview,
    setPeekWorkItem: isWorkItem ? setPeekIssue : setPeekEpic,
  };
};
