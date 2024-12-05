"use client";

import isToday from "date-fns/isToday";
import { observer } from "mobx-react";
// types
import { TIssue, TWidgetIssue } from "@plane/types";
// ui
import { Avatar, AvatarGroup, ControlLink, PriorityIcon } from "@plane/ui";
// helpers
import { findTotalDaysInRange, getDate, renderFormattedDate } from "@/helpers/date-time.helper";
import { getFileURL } from "@/helpers/file.helper";
// hooks
import { useIssueDetail, useMember, useProject } from "@/hooks/store";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues";

export type IssueListItemProps = {
  issueId: string;
  onClick: (issue: TIssue) => void;
  workspaceSlug: string;
};

export const AssignedUpcomingIssueListItem: React.FC<IssueListItemProps> = observer((props) => {
  const { issueId, onClick, workspaceSlug } = props;
  // store hooks
  const { getProjectById } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // derived values
  const issueDetails = getIssueById(issueId) as TWidgetIssue | undefined;

  if (!issueDetails || !issueDetails.project_id) return null;

  const projectDetails = getProjectById(issueDetails.project_id);

  const blockedByIssues = issueDetails.issue_relation?.filter((issue) => issue.relation_type === "blocked_by") ?? [];

  const blockedByIssueProjectDetails =
    blockedByIssues.length === 1 ? getProjectById(blockedByIssues[0]?.project_id ?? "") : null;

  const targetDate = getDate(issueDetails.target_date);

  return (
    <ControlLink
      href={`/${workspaceSlug}/projects/${issueDetails.project_id}/issues/${issueDetails.id}`}
      onClick={() => onClick(issueDetails)}
      className="grid grid-cols-12 gap-1 rounded px-3 py-2 hover:bg-custom-background-80"
    >
      <div className="col-span-7 flex items-center gap-3">
        {projectDetails && (
          <IssueIdentifier
            issueId={issueDetails.id}
            projectId={projectDetails?.id}
            textContainerClassName="text-xs text-custom-text-200 font-medium"
          />
        )}
        <h6 className="flex-grow truncate text-sm">{issueDetails.name}</h6>
      </div>
      <div className="flex justify-center col-span-1 items-center">
        <PriorityIcon priority={issueDetails.priority} size={12} withContainer />
      </div>
      <div className="text-center text-xs col-span-2">
        {targetDate ? (isToday(targetDate) ? "Today" : renderFormattedDate(targetDate)) : "-"}
      </div>
      <div className="flex justify-center text-xs col-span-2">
        {blockedByIssues.length > 0
          ? blockedByIssues.length > 1
            ? `${blockedByIssues.length} blockers`
            : blockedByIssueProjectDetails && (
                <IssueIdentifier
                  projectIdentifier={blockedByIssueProjectDetails?.identifier}
                  projectId={blockedByIssueProjectDetails?.id}
                  issueSequenceId={blockedByIssues[0]?.sequence_id}
                  textContainerClassName="text-xs text-custom-text-200 font-medium"
                />
              )
          : "-"}
      </div>
    </ControlLink>
  );
});

export const AssignedOverdueIssueListItem: React.FC<IssueListItemProps> = observer((props) => {
  const { issueId, onClick, workspaceSlug } = props;
  // store hooks
  const { getProjectById } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // derived values
  const issueDetails = getIssueById(issueId) as TWidgetIssue | undefined;

  if (!issueDetails || !issueDetails.project_id) return null;

  const projectDetails = getProjectById(issueDetails.project_id);
  const blockedByIssues = issueDetails.issue_relation?.filter((issue) => issue.relation_type === "blocked_by") ?? [];

  const blockedByIssueProjectDetails =
    blockedByIssues.length === 1 ? getProjectById(blockedByIssues[0]?.project_id ?? "") : null;

  const dueBy = findTotalDaysInRange(getDate(issueDetails.target_date), new Date(), false) ?? 0;

  return (
    <ControlLink
      href={`/${workspaceSlug}/projects/${issueDetails.project_id}/issues/${issueDetails.id}`}
      onClick={() => onClick(issueDetails)}
      className="grid grid-cols-12 gap-1 rounded px-3 py-2 hover:bg-custom-background-80"
    >
      <div className="col-span-7 flex items-center gap-3">
        {projectDetails && (
          <IssueIdentifier
            issueId={issueDetails.id}
            projectId={projectDetails?.id}
            textContainerClassName="text-xs text-custom-text-200 font-medium"
          />
        )}
        <h6 className="flex-grow truncate text-sm">{issueDetails.name}</h6>
      </div>
      <div className="flex justify-center col-span-1 items-center">
        <PriorityIcon priority={issueDetails.priority} size={12} withContainer />
      </div>
      <div className="text-center text-xs col-span-2">
        {dueBy} {`day${dueBy > 1 ? "s" : ""}`}
      </div>
      <div className="flex justify-center text-xs col-span-2">
        {blockedByIssues.length > 0
          ? blockedByIssues.length > 1
            ? `${blockedByIssues.length} blockers`
            : blockedByIssueProjectDetails && (
                <IssueIdentifier
                  issueId={blockedByIssues[0]?.id}
                  projectId={blockedByIssueProjectDetails?.id}
                  textContainerClassName="text-xs text-custom-text-200 font-medium"
                />
              )
          : "-"}
      </div>
    </ControlLink>
  );
});

export const AssignedCompletedIssueListItem: React.FC<IssueListItemProps> = observer((props) => {
  const { issueId, onClick, workspaceSlug } = props;
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getProjectById } = useProject();
  // derived values
  const issueDetails = getIssueById(issueId);

  if (!issueDetails || !issueDetails.project_id) return null;

  const projectDetails = getProjectById(issueDetails.project_id);

  return (
    <ControlLink
      href={`/${workspaceSlug}/projects/${issueDetails.project_id}/issues/${issueDetails.id}`}
      onClick={() => onClick(issueDetails)}
      className="grid grid-cols-12 gap-1 rounded px-3 py-2 hover:bg-custom-background-80"
    >
      <div className="col-span-11 flex items-center gap-3">
        {projectDetails && (
          <IssueIdentifier
            issueId={issueDetails.id}
            projectId={projectDetails?.id}
            textContainerClassName="text-xs text-custom-text-200 font-medium"
          />
        )}
        <h6 className="flex-grow truncate text-sm">{issueDetails.name}</h6>
      </div>
      <div className="flex justify-center col-span-1 items-center">
        <PriorityIcon priority={issueDetails.priority} size={12} withContainer />
      </div>
    </ControlLink>
  );
});

export const CreatedUpcomingIssueListItem: React.FC<IssueListItemProps> = observer((props) => {
  const { issueId, onClick, workspaceSlug } = props;
  // store hooks
  const { getUserDetails } = useMember();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getProjectById } = useProject();
  // derived values
  const issue = getIssueById(issueId);

  if (!issue || !issue.project_id) return null;

  const projectDetails = getProjectById(issue.project_id);
  const targetDate = getDate(issue.target_date);

  return (
    <ControlLink
      href={`/${workspaceSlug}/projects/${issue.project_id}/issues/${issue.id}`}
      onClick={() => onClick(issue)}
      className="grid grid-cols-12 gap-1 rounded px-3 py-2 hover:bg-custom-background-80"
    >
      <div className="col-span-7 flex items-center gap-3">
        {projectDetails && (
          <IssueIdentifier
            issueId={issue.id}
            projectId={projectDetails?.id}
            textContainerClassName="text-xs text-custom-text-200 font-medium"
          />
        )}
        <h6 className="flex-grow truncate text-sm">{issue.name}</h6>
      </div>
      <div className="flex justify-center col-span-1 items-center">
        <PriorityIcon priority={issue.priority} size={12} withContainer />
      </div>
      <div className="text-center text-xs col-span-2">
        {targetDate ? (isToday(targetDate) ? "Today" : renderFormattedDate(targetDate)) : "-"}
      </div>
      <div className="flex justify-center text-xs col-span-2">
        {issue.assignee_ids && issue.assignee_ids?.length > 0 ? (
          <AvatarGroup>
            {issue.assignee_ids?.map((assigneeId) => {
              const userDetails = getUserDetails(assigneeId);

              if (!userDetails) return null;

              return (
                <Avatar key={assigneeId} src={getFileURL(userDetails.avatar_url)} name={userDetails.display_name} />
              );
            })}
          </AvatarGroup>
        ) : (
          "-"
        )}
      </div>
    </ControlLink>
  );
});

export const CreatedOverdueIssueListItem: React.FC<IssueListItemProps> = observer((props) => {
  const { issueId, onClick, workspaceSlug } = props;
  // store hooks
  const { getUserDetails } = useMember();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getProjectById } = useProject();
  // derived values
  const issue = getIssueById(issueId);

  if (!issue || !issue.project_id) return null;

  const projectDetails = getProjectById(issue.project_id);

  const dueBy: number = findTotalDaysInRange(getDate(issue.target_date), new Date(), false) ?? 0;

  return (
    <ControlLink
      href={`/${workspaceSlug}/projects/${issue.project_id}/issues/${issue.id}`}
      onClick={() => onClick(issue)}
      className="grid grid-cols-12 gap-1 rounded px-3 py-2 hover:bg-custom-background-80"
    >
      <div className="col-span-7 flex items-center gap-3">
        {projectDetails && (
          <IssueIdentifier
            issueId={issue.id}
            projectId={projectDetails?.id}
            textContainerClassName="text-xs text-custom-text-200 font-medium"
          />
        )}
        <h6 className="flex-grow truncate text-sm">{issue.name}</h6>
      </div>
      <div className="flex justify-center col-span-1 items-center">
        <PriorityIcon priority={issue.priority} size={12} withContainer />
      </div>
      <div className="text-center text-xs col-span-2">
        {dueBy} {`day${dueBy > 1 ? "s" : ""}`}
      </div>
      <div className="flex justify-center text-xs col-span-2">
        {issue.assignee_ids.length > 0 ? (
          <AvatarGroup>
            {issue.assignee_ids?.map((assigneeId) => {
              const userDetails = getUserDetails(assigneeId);

              if (!userDetails) return null;

              return (
                <Avatar key={assigneeId} src={getFileURL(userDetails.avatar_url)} name={userDetails.display_name} />
              );
            })}
          </AvatarGroup>
        ) : (
          "-"
        )}
      </div>
    </ControlLink>
  );
});

export const CreatedCompletedIssueListItem: React.FC<IssueListItemProps> = observer((props) => {
  const { issueId, onClick, workspaceSlug } = props;
  // store hooks
  const { getUserDetails } = useMember();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getProjectById } = useProject();
  // derived values
  const issue = getIssueById(issueId);

  if (!issue || !issue.project_id) return null;

  const projectDetails = getProjectById(issue.project_id);

  return (
    <ControlLink
      href={`/${workspaceSlug}/projects/${issue.project_id}/issues/${issue.id}`}
      onClick={() => onClick(issue)}
      className="grid grid-cols-12 gap-1 rounded px-3 py-2 hover:bg-custom-background-80"
    >
      <div className="col-span-9 flex items-center gap-3">
        {projectDetails && (
          <IssueIdentifier
            issueId={issue.id}
            projectId={projectDetails?.id}
            textContainerClassName="text-xs text-custom-text-200 font-medium"
          />
        )}
        <h6 className="flex-grow truncate text-sm">{issue.name}</h6>
      </div>
      <div className="flex justify-center col-span-1 items-center">
        <PriorityIcon priority={issue.priority} size={12} withContainer />
      </div>
      <div className="flex justify-center text-xs col-span-2">
        {issue.assignee_ids.length > 0 ? (
          <AvatarGroup>
            {issue.assignee_ids?.map((assigneeId) => {
              const userDetails = getUserDetails(assigneeId);

              if (!userDetails) return null;

              return (
                <Avatar key={assigneeId} src={getFileURL(userDetails.avatar_url)} name={userDetails.display_name} />
              );
            })}
          </AvatarGroup>
        ) : (
          "-"
        )}
      </div>
    </ControlLink>
  );
});
