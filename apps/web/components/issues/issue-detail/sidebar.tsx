/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// local imports
import type { TIssueOperations } from "./root";
import { IssueDetailSidebarSections } from "./sidebar-sections";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  isEditable: boolean;
};

export const IssueDetailsSidebar = observer(function IssueDetailsSidebar(props: Props) {
  const { workspaceSlug, projectId, issueId, issueOperations, isEditable } = props;

  return (
    <div className="h-full w-full overflow-hidden overflow-y-auto px-6 py-6">
      <IssueDetailSidebarSections
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        issueOperations={issueOperations}
        disabled={!isEditable}
        showUpdatedMeta
      />
    </div>
  );
});
