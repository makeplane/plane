import { useRouter } from "next/router";

// icons
import { Icon, Tooltip } from "components/ui";
import { Squares2X2Icon } from "@heroicons/react/24/outline";
import { BlockedIcon, BlockerIcon } from "components/icons";
// helpers
import { renderShortDateWithYearFormat } from "helpers/date-time.helper";
import { capitalizeFirstLetter } from "helpers/string.helper";
// types
import { IIssueActivity } from "types";

const IssueLink = ({ activity }: { activity: IIssueActivity }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <Tooltip
      tooltipContent={
        activity.issue_detail ? activity.issue_detail.name : "This issue has been deleted"
      }
    >
      <a
        href={`/${workspaceSlug}/projects/${activity.project}/issues/${activity.issue}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-custom-text-100 inline-flex items-center gap-1 hover:underline"
      >
        {activity.issue_detail
          ? `${activity.project_detail.identifier}-${activity.issue_detail.sequence_id}`
          : "Issue"}
        <Icon iconName="launch" className="!text-xs" />
      </a>
    </Tooltip>
  );
};

const UserLink = ({ activity }: { activity: IIssueActivity }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <a
      href={`/${workspaceSlug}/profile/${activity.new_identifier ?? activity.old_identifier}`}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-custom-text-100 inline-flex items-center hover:underline"
    >
      {activity.new_value && activity.new_value !== "" ? activity.new_value : activity.old_value}
    </a>
  );
};

const activityDetails: {
  [key: string]: {
    message: (
      activity: IIssueActivity,
      showIssue: boolean,
      workspaceSlug: string
    ) => React.ReactNode;
    icon: React.ReactNode;
  };
} = {
  assignees: {
    message: (activity, showIssue) => {
      if (activity.old_value === "")
        return (
          <>
            added a new assignee <UserLink activity={activity} />
            {showIssue && (
              <>
                {" "}
                to <IssueLink activity={activity} />
              </>
            )}
            .
          </>
        );
      else
        return (
          <>
            removed the assignee <UserLink activity={activity} />
            {showIssue && (
              <>
                {" "}
                from <IssueLink activity={activity} />
              </>
            )}
            .
          </>
        );
    },
    icon: <Icon iconName="group" className="!text-sm" aria-hidden="true" />,
  },
  archived_at: {
    message: (activity) => {
      if (activity.new_value === "restore") return "restored the issue.";
      else return "archived the issue.";
    },
    icon: <Icon iconName="archive" className="!text-sm" aria-hidden="true" />,
  },
  attachment: {
    message: (activity, showIssue) => {
      if (activity.verb === "created")
        return (
          <>
            uploaded a new{" "}
            <a
              href={`${activity.new_value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-custom-text-100 inline-flex items-center gap-1 hover:underline"
            >
              attachment
              <Icon iconName="launch" className="!text-xs" />
            </a>
            {showIssue && (
              <>
                {" "}
                to <IssueLink activity={activity} />
              </>
            )}
          </>
        );
      else
        return (
          <>
            removed an attachment
            {showIssue && (
              <>
                {" "}
                from <IssueLink activity={activity} />
              </>
            )}
            .
          </>
        );
    },
    icon: <Icon iconName="attach_file" className="!text-sm" aria-hidden="true" />,
  },
  blocking: {
    message: (activity) => {
      if (activity.old_value === "")
        return (
          <>
            marked this issue is blocking issue{" "}
            <span className="font-medium text-custom-text-100">{activity.new_value}</span>.
          </>
        );
      else
        return (
          <>
            removed the blocking issue{" "}
            <span className="font-medium text-custom-text-100">{activity.old_value}</span>.
          </>
        );
    },
    icon: <BlockerIcon height="12" width="12" color="#6b7280" />,
  },
  blocks: {
    message: (activity) => {
      if (activity.old_value === "")
        return (
          <>
            marked this issue is being blocked by{" "}
            <span className="font-medium text-custom-text-100">{activity.new_value}</span>.
          </>
        );
      else
        return (
          <>
            removed this issue being blocked by issue{" "}
            <span className="font-medium text-custom-text-100">{activity.old_value}</span>.
          </>
        );
    },
    icon: <BlockedIcon height="12" width="12" color="#6b7280" />,
  },
  cycles: {
    message: (activity, showIssue, workspaceSlug) => {
      if (activity.verb === "created")
        return (
          <>
            added this issue to the cycle{" "}
            <a
              href={`/${workspaceSlug}/projects/${activity.project}/cycles/${activity.new_identifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-custom-text-100 inline-flex items-center gap-1 hover:underline"
            >
              {activity.new_value}
              <Icon iconName="launch" className="!text-xs" />
            </a>
          </>
        );
      else if (activity.verb === "updated")
        return (
          <>
            set the cycle to{" "}
            <a
              href={`/${workspaceSlug}/projects/${activity.project}/cycles/${activity.new_identifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-custom-text-100 inline-flex items-center gap-1 hover:underline"
            >
              {activity.new_value}
              <Icon iconName="launch" className="!text-xs" />
            </a>
          </>
        );
      else
        return (
          <>
            removed the issue from the cycle{" "}
            <a
              href={`/${workspaceSlug}/projects/${activity.project}/cycles/${activity.old_identifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-custom-text-100 inline-flex items-center gap-1 hover:underline"
            >
              {activity.old_value}
              <Icon iconName="launch" className="!text-xs" />
            </a>
          </>
        );
    },
    icon: <Icon iconName="contrast" className="!text-sm" aria-hidden="true" />,
  },
  description: {
    message: (activity, showIssue) => (
      <>
        updated the description
        {showIssue && (
          <>
            {" "}
            of <IssueLink activity={activity} />
          </>
        )}
        .
      </>
    ),
    icon: <Icon iconName="chat" className="!text-sm" aria-hidden="true" />,
  },
  estimate_point: {
    message: (activity, showIssue) => {
      if (!activity.new_value)
        return (
          <>
            removed the estimate point
            {showIssue && (
              <>
                {" "}
                from <IssueLink activity={activity} />
              </>
            )}
            .
          </>
        );
      else
        return (
          <>
            set the estimate point to{" "}
            <span className="font-medium text-custom-text-100">{activity.new_value}</span>
            {showIssue && (
              <>
                {" "}
                for <IssueLink activity={activity} />
              </>
            )}
            .
          </>
        );
    },
    icon: <Icon iconName="change_history" className="!text-sm" aria-hidden="true" />,
  },
  issue: {
    message: (activity) => {
      if (activity.verb === "created") return "created the issue.";
      else return "deleted an issue.";
    },
    icon: <Icon iconName="stack" className="!text-sm" aria-hidden="true" />,
  },
  labels: {
    message: (activity, showIssue) => {
      if (activity.old_value === "")
        return (
          <>
            added a new label{" "}
            <span className="inline-flex items-center gap-3 rounded-full border border-custom-border-300 px-2 py-0.5 text-xs">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: "#000000",
                }}
                aria-hidden="true"
              />
              <span className="font-medium text-custom-text-100">{activity.new_value}</span>
            </span>
            {showIssue && (
              <>
                {" "}
                to <IssueLink activity={activity} />
              </>
            )}
          </>
        );
      else
        return (
          <>
            removed the label{" "}
            <span className="inline-flex items-center gap-3 rounded-full border border-custom-border-300 px-2 py-0.5 text-xs">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: "#000000",
                }}
                aria-hidden="true"
              />
              <span className="font-medium text-custom-text-100">{activity.old_value}</span>
            </span>
            {showIssue && (
              <>
                {" "}
                from <IssueLink activity={activity} />
              </>
            )}
          </>
        );
    },
    icon: <Icon iconName="sell" className="!text-sm" aria-hidden="true" />,
  },
  link: {
    message: (activity, showIssue) => {
      if (activity.verb === "created")
        return (
          <>
            added this{" "}
            <a
              href={`${activity.new_value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-custom-text-100 inline-flex items-center gap-1 hover:underline"
            >
              link
              <Icon iconName="launch" className="!text-xs" />
            </a>
            {showIssue && (
              <>
                {" "}
                to <IssueLink activity={activity} />
              </>
            )}
            .
          </>
        );
      else
        return (
          <>
            removed this{" "}
            <a
              href={`${activity.old_value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-custom-text-100 inline-flex items-center gap-1 hover:underline"
            >
              link
              <Icon iconName="launch" className="!text-xs" />
            </a>
            {showIssue && (
              <>
                {" "}
                from <IssueLink activity={activity} />
              </>
            )}
            .
          </>
        );
    },
    icon: <Icon iconName="link" className="!text-sm" aria-hidden="true" />,
  },
  modules: {
    message: (activity, showIssue, workspaceSlug) => {
      if (activity.verb === "created")
        return (
          <>
            added this issue to the module{" "}
            <a
              href={`/${workspaceSlug}/projects/${activity.project}/modules/${activity.new_identifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-custom-text-100 inline-flex items-center gap-1 hover:underline"
            >
              {activity.new_value}
              <Icon iconName="launch" className="!text-xs" />
            </a>
          </>
        );
      else if (activity.verb === "updated")
        return (
          <>
            set the module to{" "}
            <a
              href={`/${workspaceSlug}/projects/${activity.project}/modules/${activity.new_identifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-custom-text-100 inline-flex items-center gap-1 hover:underline"
            >
              {activity.new_value}
              <Icon iconName="launch" className="!text-xs" />
            </a>
          </>
        );
      else
        return (
          <>
            removed the issue from the module{" "}
            <a
              href={`/${workspaceSlug}/projects/${activity.project}/modules/${activity.old_identifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-custom-text-100 inline-flex items-center gap-1 hover:underline"
            >
              {activity.old_value}
              <Icon iconName="launch" className="!text-xs" />
            </a>
          </>
        );
    },
    icon: <Icon iconName="dataset" className="!text-sm" aria-hidden="true" />,
  },
  name: {
    message: (activity, showIssue) => (
      <>
        set the name to {activity.new_value}
        {showIssue && (
          <>
            {" "}
            of <IssueLink activity={activity} />
          </>
        )}
        .
      </>
    ),
    icon: <Icon iconName="chat" className="!text-sm" aria-hidden="true" />,
  },
  parent: {
    message: (activity, showIssue) => {
      if (!activity.new_value)
        return (
          <>
            removed the parent{" "}
            <span className="font-medium text-custom-text-100">{activity.old_value}</span>
            {showIssue && (
              <>
                {" "}
                from <IssueLink activity={activity} />
              </>
            )}
            .
          </>
        );
      else
        return (
          <>
            set the parent to{" "}
            <span className="font-medium text-custom-text-100">{activity.new_value}</span>
            {showIssue && (
              <>
                {" "}
                for <IssueLink activity={activity} />
              </>
            )}
            .
          </>
        );
    },
    icon: <Icon iconName="supervised_user_circle" className="!text-sm" aria-hidden="true" />,
  },
  priority: {
    message: (activity, showIssue) => (
      <>
        set the priority to{" "}
        <span className="font-medium text-custom-text-100">
          {activity.new_value ? capitalizeFirstLetter(activity.new_value) : "None"}
        </span>
        {showIssue && (
          <>
            {" "}
            for <IssueLink activity={activity} />
          </>
        )}
        .
      </>
    ),
    icon: <Icon iconName="signal_cellular_alt" className="!text-sm" aria-hidden="true" />,
  },
  start_date: {
    message: (activity, showIssue) => {
      if (!activity.new_value)
        return (
          <>
            removed the start date
            {showIssue && (
              <>
                {" "}
                from <IssueLink activity={activity} />
              </>
            )}
            .
          </>
        );
      else
        return (
          <>
            set the start date to{" "}
            <span className="font-medium text-custom-text-100">
              {renderShortDateWithYearFormat(activity.new_value)}
            </span>
            {showIssue && (
              <>
                {" "}
                for <IssueLink activity={activity} />
              </>
            )}
            .
          </>
        );
    },
    icon: <Icon iconName="calendar_today" className="!text-sm" aria-hidden="true" />,
  },
  state: {
    message: (activity, showIssue) => (
      <>
        set the state to{" "}
        <span className="font-medium text-custom-text-100">{activity.new_value}</span>
        {showIssue && (
          <>
            {" "}
            for <IssueLink activity={activity} />
          </>
        )}
        .
      </>
    ),
    icon: <Squares2X2Icon className="h-3 w-3" aria-hidden="true" />,
  },
  target_date: {
    message: (activity, showIssue) => {
      if (!activity.new_value)
        return (
          <>
            removed the due date
            {showIssue && (
              <>
                {" "}
                from <IssueLink activity={activity} />
              </>
            )}
            .
          </>
        );
      else
        return (
          <>
            set the due date to{" "}
            <span className="font-medium text-custom-text-100">
              {renderShortDateWithYearFormat(activity.new_value)}
            </span>
            {showIssue && (
              <>
                {" "}
                for <IssueLink activity={activity} />
              </>
            )}
            .
          </>
        );
    },
    icon: <Icon iconName="calendar_today" className="!text-sm" aria-hidden="true" />,
  },
};

export const ActivityIcon = ({ activity }: { activity: IIssueActivity }) => (
  <>{activityDetails[activity.field as keyof typeof activityDetails]?.icon}</>
);

export const ActivityMessage = ({
  activity,
  showIssue = false,
}: {
  activity: IIssueActivity;
  showIssue?: boolean;
}) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <>
      {activityDetails[activity.field as keyof typeof activityDetails]?.message(
        activity,
        showIssue,
        workspaceSlug?.toString() ?? ""
      )}
    </>
  );
};
