import Link from "next/link";
import { observer } from "mobx-react-lite";
import isToday from "date-fns/isToday";
// hooks
import { useMember, useProject } from "hooks/store";
// components
import { PriorityDropdown } from "components/dropdowns";
// ui
import { Avatar, AvatarGroup } from "@plane/ui";
// helpers
import { findTotalDaysInRange, renderFormattedDate } from "helpers/date-time.helper";
// types
import { IWidgetIssue } from "@plane/types";

type Props = {
  issue: IWidgetIssue;
  workspaceSlug: string;
};

export const AssignedUpcomingIssueListItem: React.FC<Props> = observer((props) => {
  const { issue, workspaceSlug } = props;
  // store hooks
  const { getProjectById } = useProject();

  const blockedByIssues = issue.related_issues?.filter((issue) => issue.relation_type === "blocked_by");
  const projectDetails = getProjectById(issue.project);

  const blockedByIssueProjectDetails =
    blockedByIssues.length === 1 ? getProjectById(blockedByIssues[0]?.project_id ?? "") : null;

  return (
    <Link
      href={`/${workspaceSlug}/projects/${issue.project}/issues/${issue.id}`}
      className="py-2 px-3 hover:bg-custom-background-80 rounded grid grid-cols-6 gap-1"
    >
      <div className="col-span-4 flex items-center gap-3">
        <PriorityDropdown
          value={issue.priority}
          // TODO: handle update priority
          onChange={() => {}}
          buttonVariant="border-without-text"
          buttonClassName="border"
          className="flex-shrink-0"
        />
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
      <div className="text-xs text-center">
        {blockedByIssues.length > 0
          ? blockedByIssues.length > 1
            ? `${blockedByIssues.length} blockers`
            : `${blockedByIssueProjectDetails?.identifier} ${blockedByIssues[0]?.sequence_id}`
          : "-"}
      </div>
    </Link>
  );
});

export const AssignedOverdueIssueListItem: React.FC<Props> = observer((props) => {
  const { issue, workspaceSlug } = props;
  // store hooks
  const { getProjectById } = useProject();

  const blockedByIssues = issue.related_issues?.filter((issue) => issue.relation_type === "blocked_by");
  const projectDetails = getProjectById(issue.project);

  const blockedByIssueProjectDetails =
    blockedByIssues.length === 1 ? getProjectById(blockedByIssues[0]?.project_id ?? "") : null;

  const dueBy = findTotalDaysInRange(new Date(issue.target_date ?? ""), new Date(), false);

  return (
    <Link
      href={`/${workspaceSlug}/projects/${issue.project}/issues/${issue.id}`}
      className="py-2 px-3 hover:bg-custom-background-80 rounded grid grid-cols-6 gap-1"
    >
      <div className="col-span-4 flex items-center gap-3">
        <PriorityDropdown
          value={issue.priority}
          // TODO: handle update priority
          onChange={() => {}}
          buttonVariant="border-without-text"
          buttonClassName="border"
          className="flex-shrink-0"
        />
        <span className="text-xs font-medium flex-shrink-0">
          {projectDetails?.identifier} {issue.sequence_id}
        </span>
        <h6 className="text-sm flex-grow truncate">{issue.name}</h6>
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
    </Link>
  );
});

export const AssignedCompletedIssueListItem: React.FC<Props> = observer((props) => {
  const { issue, workspaceSlug } = props;
  // store hooks
  const { getUserDetails } = useMember();
  const { getProjectById } = useProject();
  // derived values
  const projectDetails = getProjectById(issue.project);

  return (
    <Link
      href={`/${workspaceSlug}/projects/${issue.project}/issues/${issue.id}`}
      className="py-2 px-3 hover:bg-custom-background-80 rounded grid grid-cols-6 gap-1"
    >
      <div className="col-span-5 flex items-center gap-3">
        <PriorityDropdown
          value={issue.priority}
          // TODO: handle update priority
          onChange={() => {}}
          buttonVariant="border-without-text"
          buttonClassName="border"
          className="flex-shrink-0"
        />
        <span className="text-xs font-medium flex-shrink-0">
          {projectDetails?.identifier} {issue.sequence_id}
        </span>
        <h6 className="text-sm flex-grow truncate">{issue.name}</h6>
      </div>
      <div className="text-xs flex justify-center">
        <AvatarGroup>
          {issue.assignees?.map((assigneeId) => {
            const userDetails = getUserDetails(assigneeId);

            if (!userDetails) return null;

            return <Avatar key={assigneeId} src={userDetails.avatar} name={userDetails.display_name} />;
          })}
        </AvatarGroup>
      </div>
    </Link>
  );
});

export const CreatedUpcomingIssueListItem: React.FC<Props> = observer((props) => {
  const { issue, workspaceSlug } = props;
  // store hooks
  const { getUserDetails } = useMember();
  const { getProjectById } = useProject();
  // derived values
  const projectDetails = getProjectById(issue.project);

  return (
    <Link
      href={`/${workspaceSlug}/projects/${issue.project}/issues/${issue.id}`}
      className="py-2 px-3 hover:bg-custom-background-80 rounded grid grid-cols-6 gap-1"
    >
      <div className="col-span-4 flex items-center gap-3">
        <PriorityDropdown
          value={issue.priority}
          // TODO: handle update priority
          onChange={() => {}}
          buttonVariant="border-without-text"
          buttonClassName="border"
          className="flex-shrink-0"
        />
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
        <AvatarGroup>
          {issue.assignees?.map((assigneeId) => {
            const userDetails = getUserDetails(assigneeId);

            if (!userDetails) return null;

            return <Avatar key={assigneeId} src={userDetails.avatar} name={userDetails.display_name} />;
          })}
        </AvatarGroup>
      </div>
    </Link>
  );
});

export const CreatedOverdueIssueListItem: React.FC<Props> = observer((props) => {
  const { issue, workspaceSlug } = props;
  // store hooks
  const { getUserDetails } = useMember();
  const { getProjectById } = useProject();
  // derived values
  const projectDetails = getProjectById(issue.project);

  const dueBy = findTotalDaysInRange(new Date(issue.target_date ?? ""), new Date(), false);

  return (
    <Link
      href={`/${workspaceSlug}/projects/${issue.project}/issues/${issue.id}`}
      className="py-2 px-3 hover:bg-custom-background-80 rounded grid grid-cols-6 gap-1"
    >
      <div className="col-span-4 flex items-center gap-3">
        <PriorityDropdown
          value={issue.priority}
          // TODO: handle update priority
          onChange={() => {}}
          buttonVariant="border-without-text"
          buttonClassName="border"
          className="flex-shrink-0"
        />
        <span className="text-xs font-medium flex-shrink-0">
          {projectDetails?.identifier} {issue.sequence_id}
        </span>
        <h6 className="text-sm flex-grow truncate">{issue.name}</h6>
      </div>
      <div className="text-xs text-center">
        {dueBy} {`day${dueBy > 1 ? "s" : ""}`}
      </div>
      <div className="text-xs flex justify-center">
        <AvatarGroup>
          {issue.assignees?.map((assigneeId) => {
            const userDetails = getUserDetails(assigneeId);

            if (!userDetails) return null;

            return <Avatar key={assigneeId} src={userDetails.avatar} name={userDetails.display_name} />;
          })}
        </AvatarGroup>
      </div>
    </Link>
  );
});

export const CreatedCompletedIssueListItem: React.FC<Props> = observer((props) => {
  const { issue, workspaceSlug } = props;
  // store hooks
  const { getUserDetails } = useMember();
  const { getProjectById } = useProject();
  // derived values
  const projectDetails = getProjectById(issue.project);

  return (
    <Link
      href={`/${workspaceSlug}/projects/${issue.project}/issues/${issue.id}`}
      className="py-2 px-3 hover:bg-custom-background-80 rounded grid grid-cols-6 gap-1"
    >
      <div className="col-span-5 flex items-center gap-3">
        <PriorityDropdown
          value={issue.priority}
          // TODO: handle update priority
          onChange={() => {}}
          buttonVariant="border-without-text"
          buttonClassName="border"
          className="flex-shrink-0"
        />
        <span className="text-xs font-medium flex-shrink-0">
          {projectDetails?.identifier} {issue.sequence_id}
        </span>
        <h6 className="text-sm flex-grow truncate">{issue.name}</h6>
      </div>
      <div className="text-xs flex justify-center">
        <AvatarGroup>
          {issue.assignees?.map((assigneeId) => {
            const userDetails = getUserDetails(assigneeId);

            if (!userDetails) return null;

            return <Avatar key={assigneeId} src={userDetails.avatar} name={userDetails.display_name} />;
          })}
        </AvatarGroup>
      </div>
    </Link>
  );
});
