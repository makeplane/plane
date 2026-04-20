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
import type { TIssueOperations } from "../issue-detail";
import { SidebarSections } from "../issue-detail/sidebar-sections";

type PeekOverviewPropertiesProps = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  permissions: {
    canEdit: boolean;
    canEditProperty: (property: TWorkItemProperty) => boolean;
  };
};

export const PeekOverviewProperties = observer(function PeekOverviewProperties(props: PeekOverviewPropertiesProps) {
  const { workspaceSlug, projectId, issueId, issueOperations, permissions } = props;

  return (
    <div className="flex flex-col gap-4 py-6 w-full">
      <SidebarSections
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        issueOperations={issueOperations}
        permissions={permissions}
        isPeekView
      />
    </div>
  );
});
