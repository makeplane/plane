"use client";

import isToday from "date-fns/isToday";
import { observer } from "mobx-react";
import { TIssue, TWidgetIssue } from "@plane/types";
// hooks
// ui
import { Avatar, AvatarGroup, ControlLink, PriorityIcon } from "@plane/ui";
// helpers
import { findTotalDaysInRange, getDate, renderFormattedDate } from "@/helpers/date-time.helper";
import { useIssueDetail, useMember, useProject } from "@/hooks/store";
// types

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
      className="grid grid-cols-6 gap-1 rounded px-3 py-2 hover:bg-custom-background-80"
    >
      <div className="col-span-4 flex items-center gap-3">
        <PriorityIcon priority={issueDetails.priority} withContainer />
        <span className="flex-shrink-0 text-xs font-medium">
          {projectDetails?.identifier} {issueDetails.sequence_id}
        </span>
        <h6 className="flex-grow truncate text-sm">{issueDetails.name}</h6>
      </div>
      <div className="text-center text-xs">
        {targetDate ? (isToday(targetDate) ? "Today" : renderFormattedDate(targetDate)) : "-"}
      </div>
      <div className="text-center text-xs">
        {blockedByIssues.length > 0
          ? blockedByIssues.length > 1
            ? `${blockedByIssues.length} blockers`
            : `${blockedByIssueProjectDetails?.identifier} ${blockedByIssues[0]?.sequence_id}`
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
      className="grid grid-cols-6 gap-1 rounded px-3 py-2 hover:bg-custom-background-80"
    >
      <div className="col-span-4 flex items-center gap-3">
        <PriorityIcon priority={issueDetails.priority} withContainer />
        <span className="flex-shrink-0 text-xs font-medium">
          {projectDetails?.identifier} {issueDetails.sequence_id}
        </span>
        <h6 className="flex-grow truncate text-sm">{issueDetails.name}</h6>
      </div>
      <div className="text-center text-xs">
        {dueBy} {`day${dueBy > 1 ? "s" : ""}`}
      </div>
      <div className="text-center text-xs">
        {blockedByIssues.length > 0
          ? blockedByIssues.length > 1
            ? `${blockedByIssues.length} blockers`
            : `${blockedByIssueProjectDetails?.identifier} ${blockedByIssues[0]?.sequence_id}`
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
      className="grid grid-cols-6 gap-1 rounded px-3 py-2 hover:bg-custom-background-80"
    >
      <div className="col-span-6 flex items-center gap-3">
        <PriorityIcon priority={issueDetails.priority} withContainer />
        <span className="flex-shrink-0 text-xs font-medium">
          {projectDetails?.identifier} {issueDetails.sequence_id}
        </span>
        <h6 className="flex-grow truncate text-sm">{issueDetails.name}</h6>
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
      className="grid grid-cols-6 gap-1 rounded px-3 py-2 hover:bg-custom-background-80"
    >
      <div className="col-span-4 flex items-center gap-3">
        <PriorityIcon priority={issue.priority} withContainer />
        <span className="flex-shrink-0 text-xs font-medium">
          {projectDetails?.identifier} {issue.sequence_id}
        </span>
        <h6 className="flex-grow truncate text-sm">{issue.name}</h6>
      </div>
      <div className="text-center text-xs">
        {targetDate ? (isToday(targetDate) ? "Today" : renderFormattedDate(targetDate)) : "-"}
      </div>
      <div className="flex justify-center text-xs">
        {issue.assignee_ids && issue.assignee_ids?.length > 0 ? (
          <AvatarGroup>
            {issue.assignee_ids?.map((assigneeId) => {
              const userDetails = getUserDetails(assigneeId);

              if (!userDetails) return null;

              return <Avatar key={assigneeId} src={userDetails.avatar} name={userDetails.display_name} />;
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
      className="grid grid-cols-6 gap-1 rounded px-3 py-2 hover:bg-custom-background-80"
    >
      <div className="col-span-4 flex items-center gap-3">
        <PriorityIcon priority={issue.priority} withContainer />
        <span className="flex-shrink-0 text-xs font-medium">
          {projectDetails?.identifier} {issue.sequence_id}
        </span>
        <h6 className="flex-grow truncate text-sm">{issue.name}</h6>
      </div>
      <div className="text-center text-xs">
        {dueBy} {`day${dueBy > 1 ? "s" : ""}`}
      </div>
      <div className="flex justify-center text-xs">
        {issue.assignee_ids.length > 0 ? (
          <AvatarGroup>
            {issue.assignee_ids?.map((assigneeId) => {
              const userDetails = getUserDetails(assigneeId);

              if (!userDetails) return null;

              return <Avatar key={assigneeId} src={userDetails.avatar} name={userDetails.display_name} />;
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
      className="grid grid-cols-6 gap-1 rounded px-3 py-2 hover:bg-custom-background-80"
    >
      <div className="col-span-5 flex items-center gap-3">
        <PriorityIcon priority={issue.priority} withContainer />
        <span className="flex-shrink-0 text-xs font-medium">
          {projectDetails?.identifier} {issue.sequence_id}
        </span>
        <h6 className="flex-grow truncate text-sm">{issue.name}</h6>
      </div>
      <div className="flex justify-center text-xs">
        {issue.assignee_ids.length > 0 ? (
          <AvatarGroup>
            {issue.assignee_ids?.map((assigneeId) => {
              const userDetails = getUserDetails(assigneeId);

              if (!userDetails) return null;

              return <Avatar key={assigneeId} src={userDetails.avatar} name={userDetails.display_name} />;
            })}
          </AvatarGroup>
        ) : (
          "-"
        )}
      </div>
    </ControlLink>
  );
});
