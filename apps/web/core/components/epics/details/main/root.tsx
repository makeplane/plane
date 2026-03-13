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
// plane imports
import type { EditorRefApi } from "@plane/editor";
import { EIssueServiceType } from "@plane/types";
import type { TIssue } from "@plane/types";
// components
import { IssueDetailWidgets } from "@/components/issues/issue-detail-widgets/root";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
// plane web components
import { MainWrapper } from "@/components/common/layout/main/main-wrapper";
// local imports
import { EpicInfoSection } from "./info-section-root";
import { EpicOverviewRoot } from "./overview-section-root";
import { EpicProgressSection } from "./progress-section-root";

type Props = {
  editorRef: React.RefObject<EditorRefApi>;
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  permissions: {
    sub_work_items: {
      getCanView: (projectId: string, workItemId: string) => boolean;
      getCanEdit: (projectId: string, workItemId: string) => boolean;
      getCanEditProperty: (projectId: string, workItemId: string, property: keyof TIssue) => boolean; // TODO: <permissionEngine> update property type to TWorkItemProperty
      getCanDelete: (projectId: string, workItemId: string) => boolean;
      getCanAdd: (parentWorkItemProjectId: string, parentWorkItemId: string) => boolean;
      getCanRemove: (
        parentWorkItemProjectId: string,
        parentWorkItemId: string,
        projectId: string,
        workItemId: string
      ) => boolean;
    };
  };
  disabled?: boolean;
};

export const EpicMainContentRoot = observer(function EpicMainContentRoot(props: Props) {
  const { editorRef, workspaceSlug, projectId, epicId, permissions, disabled = false } = props;
  // store hooks
  const { epicDetailSidebarCollapsed } = useAppTheme();

  return (
    <MainWrapper isSidebarOpen={!epicDetailSidebarCollapsed}>
      <EpicInfoSection
        editorRef={editorRef}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        epicId={epicId}
        disabled={disabled}
      />
      <EpicProgressSection epicId={epicId} />
      <div className="py-2">
        <IssueDetailWidgets
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={epicId}
          disabled={disabled}
          issueServiceType={EIssueServiceType.EPICS}
          hideWidgets={["sub-work-items", "relations"]}
          permissions={permissions}
        />
      </div>
      <EpicOverviewRoot
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        epicId={epicId}
        permissions={permissions}
        disabled={disabled}
      />
    </MainWrapper>
  );
});
