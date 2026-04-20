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
// types
import type { TWorkItemProperty } from "@/store/work-items/permissions/root";
// local imports
import type { TIssueOperations } from "./root";
import { SidebarSections } from "./sidebar-sections";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  permissions: {
    canEdit: boolean;
    canEditProperty: (property: TWorkItemProperty) => boolean;
  };
};

export const IssueDetailsSidebar = observer(function IssueDetailsSidebar(props: Props) {
  const { workspaceSlug, projectId, issueId, issueOperations, permissions } = props;

  return (
    <div className="px-6 py-6 overflow-hidden overflow-y-auto h-full">
      <SidebarSections
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        issueOperations={issueOperations}
        permissions={permissions}
      />
    </div>
  );
});
