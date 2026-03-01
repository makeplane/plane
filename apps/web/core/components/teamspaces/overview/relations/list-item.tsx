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

import { useCallback, useMemo, useRef } from "react";
import { uniq } from "lodash-es";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import type { ERelationType } from "@plane/constants";
import { PriorityIcon, StateGroupIcon } from "@plane/propel/icons";
import type { TTeamspaceDependencyWorkItem } from "@plane/types";
import { Avatar, AvatarGroup } from "@plane/ui";
import { cn, getFileURL } from "@plane/utils";
// components
import { ListItem } from "@/components/core/list/list-item";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
// plane web components
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";

type TTeamspaceRelationIssueListItemProps = {
  type: ERelationType;
  issue: TTeamspaceDependencyWorkItem;
};

export const TeamspaceRelationIssueListItem = observer(function TeamspaceRelationIssueListItem(
  props: TTeamspaceRelationIssueListItemProps
) {
  const { type, issue } = props;
  // router
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  // refs
  const parentRef = useRef(null);
  // store hooks
  const { getUserDetails } = useMember();
  const { getProjectIdentifierById } = useProject();
  const { getIsIssuePeeked, setPeekIssue } = useIssueDetail();
  // derived values
  const projectIdentifier = getProjectIdentifierById(issue.project_id);
  // helpers
  const handleIssuePeekOverview = useCallback(
    () =>
      workspaceSlug &&
      issue &&
      issue.project_id &&
      issue.id &&
      !getIsIssuePeeked(issue.id) &&
      setPeekIssue({
        workspaceSlug,
        projectId: issue.project_id,
        issueId: issue.id,
        isArchived: !!issue.archived_at,
      }),
    [getIsIssuePeeked, issue, setPeekIssue, workspaceSlug]
  );

  const relationText = useMemo(() => {
    switch (type) {
      case "blocking":
        return "is blocking";
      case "blocked_by":
        return "is blocked by";
      default:
        return;
    }
  }, [type]);

  return (
    <div
      id={`issue-${issue.id}`}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        handleIssuePeekOverview();
      }}
      className="w-full cursor-pointer"
    >
      <ListItem
        title={issue.name}
        itemLink="#"
        prependTitleElement={
          <div className="flex flex-shrink-0 items-center justify-center gap-4">
            <PriorityIcon priority={issue.priority} className="size-3.5 flex-shrink-0" />
            <StateGroupIcon stateGroup={issue.state__group} className="size-3.5 flex-shrink-0" />
            {issue && issue.project_id && projectIdentifier && (
              <IssueIdentifier
                size="xs"
                issueSequenceId={issue.sequence_id}
                issueTypeId={issue.type_id}
                projectId={issue.project_id}
                projectIdentifier={projectIdentifier}
              />
            )}
          </div>
        }
        quickActionElement={
          <div className="flex flex-shrink-0 items-center justify-center gap-2 text-placeholder text-caption-md-medium">
            {relationText}{" "}
            {issue.related_issues.length > 1 ? (
              <span className="text-primary">{issue.related_issues.length} work items</span>
            ) : (
              issue.related_issues[0] && (
                <div className="flex flex-shrink-0 items-center justify-center gap-2">
                  {issue.related_issues[0].project_id && projectIdentifier && (
                    <IssueIdentifier
                      size="xs"
                      issueSequenceId={issue.related_issues[0].sequence_id}
                      issueTypeId={issue.related_issues[0].type_id}
                      projectId={issue.related_issues[0].project_id}
                      projectIdentifier={projectIdentifier}
                      variant="primary"
                    />
                  )}
                </div>
              )
            )}
            assigned to{" "}
            <AvatarGroup size="md" showTooltip>
              {issue.related_assignee_ids.length > 0 &&
                uniq(issue.related_assignee_ids)?.map((userId: string) => {
                  const userDetails = getUserDetails(userId);
                  if (!userDetails) return;
                  return (
                    <Avatar key={userId} src={getFileURL(userDetails.avatar_url)} name={userDetails.display_name} />
                  );
                })}
            </AvatarGroup>
          </div>
        }
        parentRef={parentRef}
        className={cn("min-h-9 rounded", getIsIssuePeeked(issue.id) ? "border border-accent-strong" : "border-none")}
        disableLink
      />
    </div>
  );
});
