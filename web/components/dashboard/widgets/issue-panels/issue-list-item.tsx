import { observer } from "mobx-react-lite";
import isToday from "date-fns/isToday";
// hooks
import { useIssueDetail, useMember, useProject } from "hooks/store";
// ui
import { Avatar, AvatarGroup, ControlLink, PriorityIcon } from "@plane/ui";
// helpers
import { findTotalDaysInRange, renderFormattedDate } from "helpers/date-time.helper";
// types
import { TIssue, TWidgetIssue } from "@plane/types";

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

  if (!issueDetails) return null;

  const projectDetails = getProjectById(issueDetails.project_id);

  const blockedByIssues = issueDetails.issue_relation?.filter((issue) => issue.relation_type === "blocked_by") ?? [];

  const blockedByIssueProjectDetails =
    blockedByIssues.length === 1 ? getProjectById(blockedByIssues[0]?.project_id ?? "") : null;

  return (
    <ControlLink
      href={`/${workspaceSlug}/projects/${issueDetails.project_id}/issues/${issueDetails.id}`}
      onClick={() => onClick(issueDetails)}
      className="py-2 px-3 hover:bg-custom-background-80 rounded grid grid-cols-6 gap-1"
    >
      <div className="col-span-4 flex items-center gap-3">
        <PriorityIcon priority={issueDetails.priority} withContainer />
        <span className="text-xs font-medium flex-shrink-0">
          {projectDetails?.identifier} {issueDetails.sequence_id}
        </span>
        <h6 className="text-sm flex-grow truncate">{issueDetails.name}</h6>
      </div>
      <div className="text-xs text-center">
        {issueDetails.target_date
          ? isToday(new Date(issueDetails.target_date))
            ? "Today"
            : renderFormattedDate(issueDetails.target_date)
          : "-"}
      </div>
      <div className="text-xs text-center">
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

  if (!issueDetails) return null;

  const projectDetails = getProjectById(issueDetails.project_id);
  const blockedByIssues = issueDetails.issue_relation?.filter((issue) => issue.relation_type === "blocked_by") ?? [];

  const blockedByIssueProjectDetails =
    blockedByIssues.length === 1 ? getProjectById(blockedByIssues[0]?.project_id ?? "") : null;

  const dueBy = findTotalDaysInRange(new Date(issueDetails.target_date ?? ""), new Date(), false);

  return (
    <ControlLink
      href={`/${workspaceSlug}/projects/${issueDetails.project_id}/issues/${issueDetails.id}`}
      onClick={() => onClick(issueDetails)}
      className="py-2 px-3 hover:bg-custom-background-80 rounded grid grid-cols-6 gap-1"
    >
      <div className="col-span-4 flex items-center gap-3">
        <PriorityIcon priority={issueDetails.priority} withContainer />
        <span className="text-xs font-medium flex-shrink-0">
          {projectDetails?.identifier} {issueDetails.sequence_id}
        </span>
        <h6 className="text-sm flex-grow truncate">{issueDetails.name}</h6>
      </div>
      <div className="text-xs text-center">
        {dueBy} {`day${dueBy > 1 ? "s" : ""}`}
      </div>
      <div className="text-xs text-center">
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

  if (!issueDetails) return null;

  const projectDetails = getProjectById(issueDetails.project_id);

  return (
    <ControlLink
      href={`/${workspaceSlug}/projects/${issueDetails.project_id}/issues/${issueDetails.id}`}
      onClick={() => onClick(issueDetails)}
      className="py-2 px-3 hover:bg-custom-background-80 rounded grid grid-cols-6 gap-1"
    >
      <div className="col-span-6 flex items-center gap-3">
        <PriorityIcon priority={issueDetails.priority} withContainer />
        <span className="text-xs font-medium flex-shrink-0">
          {projectDetails?.identifier} {issueDetails.sequence_id}
        </span>
        <h6 className="text-sm flex-grow truncate">{issueDetails.name}</h6>
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

  if (!issue) return null;

  const projectDetails = getProjectById(issue.project_id);

  return (
    <ControlLink
      href={`/${workspaceSlug}/projects/${issue.project_id}/issues/${issue.id}`}
      onClick={() => onClick(issue)}
      className="py-2 px-3 hover:bg-custom-background-80 rounded grid grid-cols-6 gap-1"
    >
      <div className="col-span-4 flex items-center gap-3">
        <PriorityIcon priority={issue.priority} withContainer />
        <span className="text-xs font-medium flex-shrink-0">
          {projectDetails?.identifier} {issue.sequence_id}
        </span>
        <h6 className="text-sm flex-grow truncate">{issue.name}</h6>
      </div>
      <div className="text-xs text-center">
        {issue.target_date
          ? isToday(new Date(issue.target_date))
            ? "Today"
            : renderFormattedDate(issue.target_date)
          : "-"}
      </div>
      <div className="text-xs flex justify-center">
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

  if (!issue) return null;

  const projectDetails = getProjectById(issue.project_id);

  const dueBy = findTotalDaysInRange(new Date(issue.target_date ?? ""), new Date(), false);

  return (
    <ControlLink
      href={`/${workspaceSlug}/projects/${issue.project_id}/issues/${issue.id}`}
      onClick={() => onClick(issue)}
      className="py-2 px-3 hover:bg-custom-background-80 rounded grid grid-cols-6 gap-1"
    >
      <div className="col-span-4 flex items-center gap-3">
        <PriorityIcon priority={issue.priority} withContainer />
        <span className="text-xs font-medium flex-shrink-0">
          {projectDetails?.identifier} {issue.sequence_id}
        </span>
        <h6 className="text-sm flex-grow truncate">{issue.name}</h6>
      </div>
      <div className="text-xs text-center">
        {dueBy} {`day${dueBy > 1 ? "s" : ""}`}
      </div>
      <div className="text-xs flex justify-center">
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

  if (!issue) return null;

  const projectDetails = getProjectById(issue.project_id);

  return (
    <ControlLink
      href={`/${workspaceSlug}/projects/${issue.project_id}/issues/${issue.id}`}
      onClick={() => onClick(issue)}
      className="py-2 px-3 hover:bg-custom-background-80 rounded grid grid-cols-6 gap-1"
    >
      <div className="col-span-5 flex items-center gap-3">
        <PriorityIcon priority={issue.priority} withContainer />
        <span className="text-xs font-medium flex-shrink-0">
          {projectDetails?.identifier} {issue.sequence_id}
        </span>
        <h6 className="text-sm flex-grow truncate">{issue.name}</h6>
      </div>
      <div className="text-xs flex justify-center">
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
