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
// ui
import { CustomMenu } from "@plane/ui";
// helpers
import { generateWorkItemLink } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
// plane web components
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";

type TIssueParentSiblingItem = {
  workspaceSlug: string;
  issueId: string;
};

export const IssueParentSiblingItem = observer(function IssueParentSiblingItem(props: TIssueParentSiblingItem) {
  const { workspaceSlug, issueId } = props;
  // hooks
  const { getProjectById } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();

  // derived values
  const issueDetail = (issueId && getIssueById(issueId)) || undefined;
  if (!issueDetail) return <></>;

  const projectDetails = (issueDetail.project_id && getProjectById(issueDetail.project_id)) || undefined;

  const workItemLink = generateWorkItemLink({
    workspaceSlug,
    projectId: issueDetail?.project_id,
    issueId: issueDetail?.id,
    projectIdentifier: projectDetails?.identifier,
    sequenceId: issueDetail?.sequence_id,
  });

  return (
    <>
      <CustomMenu.MenuItem
        key={issueDetail.id}
        onClick={() => window.open(workItemLink, "_blank", "noopener,noreferrer")}
      >
        <div className="flex items-center gap-2 py-0.5">
          {issueDetail.project_id && projectDetails?.identifier && (
            <IssueIdentifier
              projectId={issueDetail.project_id}
              issueTypeId={issueDetail.type_id}
              projectIdentifier={projectDetails?.identifier}
              issueSequenceId={issueDetail.sequence_id}
              size="xs"
            />
          )}
        </div>
      </CustomMenu.MenuItem>
    </>
  );
});
