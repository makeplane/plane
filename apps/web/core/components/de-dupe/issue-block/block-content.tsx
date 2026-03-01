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
import { PriorityIcon, StateGroupIcon } from "@plane/propel/icons";
import type { TDeDupeIssue } from "@plane/types";
import { Avatar } from "@plane/ui";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProjectState } from "@/hooks/store/use-project-state";

type TDeDupeIssueBlockContentProps = { issue: TDeDupeIssue };

export const DeDupeIssueBlockContent = observer(function DeDupeIssueBlockContent(props: TDeDupeIssueBlockContentProps) {
  const { issue } = props;
  // store
  const { getStateById } = useProjectState();
  const {
    project: { getProjectMemberDetails },
  } = useMember();
  // derived values
  const stateDetails = issue ? getStateById(issue?.state_id) : undefined;
  const creator = getProjectMemberDetails(issue.created_by, issue.project_id);

  return (
    <>
      <p className="w-full truncate cursor-pointer text-13 text-primary pb-3 border-b border-subtle-1 border-dashed">
        {issue.name}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PriorityIcon priority={issue.priority} className="size-4" withContainer />
          <div className="flex flex-shrink-0 items-center gap-2">
            <StateGroupIcon
              stateGroup={stateDetails?.group ?? "backlog"}
              color={stateDetails?.color ?? "var(--text-color-tertiary)"}
              className="size-4 flex-shrink-0"
            />
            <span className="flex items-baseline">
              <p className="text-13 leading-3 text-secondary ">{stateDetails?.name ?? "State"}</p>
            </span>
          </div>
        </div>
        <Avatar src={creator?.member.avatar_url} name={creator?.member.display_name} size="md" />
      </div>
    </>
  );
});
