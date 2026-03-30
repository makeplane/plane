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

import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { EIssueServiceType } from "@plane/types";
import { IssuePeekOverview } from "@/components/issues/peek-overview";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProjectIssueProperties } from "@/hooks/use-project-issue-properties";
// plane web imports
import { EpicPeekOverview } from "@/components/epics/peek-overview";

export const HomePeekOverviewsRoot = observer(function HomePeekOverviewsRoot() {
  const { peekIssue } = useIssueDetail();
  const { peekIssue: epicPeekIssue } = useIssueDetail(EIssueServiceType.EPICS);

  const { fetchAll } = useProjectIssueProperties();

  const workspaceSlug = peekIssue?.workspaceSlug || epicPeekIssue?.workspaceSlug;
  const projectId = peekIssue?.projectId || epicPeekIssue?.projectId;

  // fetching all project work item properties
  useSWR(
    workspaceSlug && projectId ? `WORK_ITEM_PROPERTIES_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchAll(workspaceSlug, projectId) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

  return (
    <>
      {peekIssue && <IssuePeekOverview />}
      {epicPeekIssue && <EpicPeekOverview />}
    </>
  );
});
