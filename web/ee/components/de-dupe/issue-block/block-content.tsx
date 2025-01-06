"use-client";

import React, { FC } from "react";
import { observer } from "mobx-react";
// types
import { TDeDupeIssue } from "@plane/types";
// ui
import { Avatar, PriorityIcon, StateGroupIcon } from "@plane/ui";
// hooks
import { useMember, useProjectState } from "@/hooks/store";

type TDeDupeIssueBlockContentProps = { issue: TDeDupeIssue };

export const DeDupeIssueBlockContent: FC<TDeDupeIssueBlockContentProps> = observer((props) => {
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
      <p className="w-full truncate cursor-pointer text-sm text-custom-text-100 pb-3 border-b border-custom-border-300 border-dashed">
        {issue.name}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PriorityIcon priority={issue.priority} className="size-4" withContainer />
          <div className="flex flex-shrink-0 items-center gap-2">
            <StateGroupIcon
              stateGroup={stateDetails?.group ?? "backlog"}
              color={stateDetails?.color ?? "rgba(var(--color-text-300))"}
              className="size-4 flex-shrink-0"
            />
            <span className="flex items-baseline">
              <p className="text-sm leading-3 text-custom-text-200 ">{stateDetails?.name ?? "State"}</p>
            </span>
          </div>
        </div>
        <Avatar src={creator?.member.avatar_url} name={creator?.member.display_name} size="md" />
      </div>
    </>
  );
});
