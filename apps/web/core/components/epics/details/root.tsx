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
import { EUserPermissionsLevel } from "@plane/constants";
import type { EditorRefApi } from "@plane/editor";
import { EIssueServiceType, EIssuesStoreType, EUserProjectRoles } from "@plane/types";
// components
import { IssuePeekOverview } from "@/components/issues/peek-overview";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { LayoutRoot } from "@/components/common/layout";
import { useEpicAnalytics } from "@/plane-web/hooks/store";
// local components
import { EpicEmptyState } from "./empty-state";
import { EpicMainContentRoot } from "./main/root";
import { EpicDetailsSidebar } from "./sidebar/root";

export type TIssueDetailRoot = {
  editorRef: React.RefObject<EditorRefApi>;
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  isArchived: boolean;
};

export const EpicDetailRoot = observer(function EpicDetailRoot(props: TIssueDetailRoot) {
  const { editorRef, workspaceSlug, projectId, epicId, isArchived } = props;
  // hooks
  const { fetchEpicAnalytics } = useEpicAnalytics();
  const {
    issue: { getIssueById },
  } = useIssueDetail(EIssueServiceType.EPICS);
  const { allowPermissions } = useUserPermissions();

  useSWR(
    workspaceSlug && projectId && epicId ? `EPIC_ANALYTICS_${workspaceSlug}_${projectId}_${epicId}` : null,
    workspaceSlug && projectId && epicId
      ? () => fetchEpicAnalytics(workspaceSlug.toString(), projectId.toString(), epicId.toString())
      : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

  // issue details
  const epic = getIssueById(epicId);
  // checking if issue is editable, based on user role
  const isEditable = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );

  return (
    <>
      <LayoutRoot
        renderEmptyState={!epic}
        emptyStateComponent={<EpicEmptyState workspaceSlug={workspaceSlug} projectId={projectId} />}
      >
        <EpicMainContentRoot
          editorRef={editorRef}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          epicId={epicId}
          disabled={!isEditable || isArchived}
        />

        <EpicDetailsSidebar
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          epicId={epicId}
          disabled={!isEditable || isArchived}
        />
      </LayoutRoot>

      {/* peek overview */}
      <IssuePeekOverview storeType={EIssuesStoreType.PROJECT} />
    </>
  );
});
