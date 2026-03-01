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
import type { TDeDupeIssue } from "@plane/types";
// hooks
import { useProject } from "@/hooks/store/use-project";
// plane web imports
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";

type DuplicateIssueReadOnlyHeaderRoot = {
  issue: TDeDupeIssue;
};

export const DuplicateIssueReadOnlyHeaderRoot = observer(function DuplicateIssueReadOnlyHeaderRoot(
  props: DuplicateIssueReadOnlyHeaderRoot
) {
  const { issue } = props;
  // store
  const { getProjectById } = useProject();
  // derived values
  const projectDetails = getProjectById(issue?.project_id);
  const projectIdentifier = projectDetails?.identifier ?? "";

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 ">
          <IssueIdentifier
            issueSequenceId={issue.sequence_id}
            projectIdentifier={projectIdentifier}
            issueTypeId={issue.type_id}
            projectId={issue.project_id}
            variant="tertiary"
            size="xs"
            displayProperties={{
              key: true,
              issue_type: true,
            }}
          />
        </div>
      </div>
    </>
  );
});
