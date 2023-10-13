import { useRouter } from "next/router";

// icons
import { CopyPlus } from "lucide-react";
import { Icon } from "components/ui";
import { Tooltip } from "@plane/ui";
import { Squares2X2Icon } from "@heroicons/react/24/outline";
import { BlockedIcon, BlockerIcon, RelatedIcon } from "components/icons";
// helpers
import { renderShortDateWithYearFormat } from "helpers/date-time.helper";
import { capitalizeFirstLetter } from "helpers/string.helper";
// types
import { IIssueActivity } from "types";

const IssueLink = ({ activity }: { activity: IIssueActivity }) => (
  <Tooltip tooltipContent={activity.issue_detail ? activity.issue_detail.name : "This issue has been deleted"}>
    <button
      type="button"
      onClick={() =>
        console.log(
          "issue",
          JSON.stringify({
            project_id: activity.project,
            issue_id: activity.issue,
          })
        )
      }
      className="font-medium text-custom-text-100 inline-flex items-center gap-1 hover:underline"
    >
      {activity.issue_detail ? `${activity.project_detail.identifier}-${activity.issue_detail.sequence_id}` : "Issue"}
      <Icon iconName="launch" className="!text-xs" />
    </button>
  </Tooltip>
);

const UserLink = ({ activity }: { activity: IIssueActivity }) => (
  <button
    type="button"
    onClick={() => console.log("user", activity.new_identifier ?? activity.old_identifier)}
    className="font-medium text-custom-text-100 inline-flex items-center hover:underline"
  >
    {activity.new_value && activity.new_value !== "" ? activity.new_value : activity.old_value}
  </button>
);

const activityDetails: {
  [key: string]: {
    message: (activity: IIssueActivity, showIssue: boolean, workspaceSlug: string) => React.ReactNode;
    icon: React.ReactNode;
  };
} = {
  assignees: {
    message: (activity, showIssue) => (
      <>
        {activity.old_value === "" ? "added a new assignee " : "removed the assignee "}
        <UserLink activity={activity} />
        {showIssue && (
          <>
            {" "}
            to <IssueLink activity={activity} />
          </>
        )}
        .
      </>
    ),
    icon: <Icon iconName="group" className="!text-2xl" aria-hidden="true" />,
  },

  archived_at: {
    message: (activity) => {
      if (activity.new_value === "restore") return "restored the issue.";
      else return "archived the issue.";
    },
    icon: <Icon iconName="archive" className="!text-2xl" aria-hidden="true" />,
  },

  attachment: {
    message: (activity, showIssue) => (
      <>
        {activity.verb === "created" ? "uploaded a new " : "removed an "}
        {activity.new_value && activity.new_value !== "" ? (
          <button type="button" onClick={() => console.log("attachment", activity.new_value)}>
            attachment
          </button>
        ) : (
          "attachment"
        )}
        {showIssue && activity.verb === "created" ? " to " : " from "}
        {showIssue && <IssueLink activity={activity} />}
      </>
    ),
    icon: <Icon iconName="attach_file" className="!text-2xl" aria-hidden="true" />,
  },

  blocking: {
    message: (activity) => (
      <>
        {activity.old_value === "" ? "marked this issue is blocking issue " : "removed the blocking issue "}
        <button
          type="button"
          onClick={() =>
            console.log(
              "issue",
              JSON.stringify({
                project_id: activity.project,
                issue_id: activity.new_identifier ?? activity.old_identifier,
                issue_identifier:
                  activity.new_value && activity.new_value !== "" ? activity.new_value : activity.old_value,
              })
            )
          }
          className="font-medium text-custom-text-100"
        >
          {activity.old_value === "" ? activity.new_value : activity.old_value}
        </button>
        .
      </>
    ),
    icon: <BlockerIcon height="12" width="12" color="#6b7280" />,
  },

  blocked_by: {
    message: (activity) => (
      <>
        {activity.old_value === ""
          ? "marked this issue is being blocked by issue "
          : "removed this issue being blocked by issue "}
        <button
          type="button"
          onClick={() =>
            console.log(
              "issue",
              JSON.stringify({
                project_id: activity.project,
                issue_id: activity.new_identifier ?? activity.old_identifier,
                issue_identifier:
                  activity.new_value && activity.new_value !== "" ? activity.new_value : activity.old_value,
              })
            )
          }
          className="font-medium text-custom-text-100"
        >
          {activity.old_value === "" ? activity.new_value : activity.old_value}
        </button>
        .
      </>
    ),
    icon: <BlockedIcon height="12" width="12" color="#6b7280" />,
  },

  duplicate: {
    message: (activity) => (
      <>
        {activity.old_value === "" ? "marked this issue as duplicate of " : "removed this issue as a duplicate of "}
        <button
          type="button"
          onClick={() =>
            console.log(
              "issue",
              JSON.stringify({
                project_id: activity.project,
                issue_id: activity.new_identifier ?? activity.old_identifier,
                issue_identifier:
                  activity.new_value && activity.new_value !== "" ? activity.new_value : activity.old_value,
              })
            )
          }
          className="font-medium text-custom-text-100"
        >
          {activity.verb === "created" ? activity.new_value : activity.old_value}
        </button>
        .
      </>
    ),
    icon: <CopyPlus size={12} color="#6b7280" />,
  },

  relates_to: {
    message: (activity) => (
      <>
        {activity.old_value === "" ? "marked that this issue relates to " : "removed the relation from "}
        <button
          type="button"
          onClick={() => {
            console.log(
              "issue",
              JSON.stringify({
                project_id: activity.project,
                issue_id: activity.new_identifier ?? activity.old_identifier,
                issue_identifier:
                  activity.new_value && activity.new_value !== "" ? activity.new_value : activity.old_value,
              })
            );
          }}
          className="font-medium text-custom-text-100"
        >
          {activity.old_value === "" ? activity.new_value : activity.old_value}
        </button>
        .
      </>
    ),
    icon: <RelatedIcon height="12" width="12" color="#6b7280" />,
  },

  cycles: {
    message: (activity) => (
      <>
        {activity.verb === "created" && "added this issue to the cycle "}
        {activity.verb === "updated" && "set the cycle to "}
        {activity.verb === "deleted" && "removed the issue from the cycle "}
        <button
          type="button"
          onClick={() =>
            console.log(
              "cycle",
              JSON.stringify({
                cycle_id: activity.new_identifier ?? activity.old_identifier,
                project_id: activity.project,
                cycle_name: activity.verb === "created" ? activity.new_value : activity.old_value,
              })
            )
          }
          className="font-medium text-custom-text-100 inline-flex items-center gap-1 hover:underline"
        >
          {activity.verb === "created" || activity.verb === "updated" ? activity.new_value : activity.old_value}
          <Icon iconName="launch" className="!text-xs" />
        </button>
      </>
    ),
    icon: <Icon iconName="contrast" className="!text-2xl" aria-hidden="true" />,
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
    icon: <Icon iconName="chat" className="!text-2xl" aria-hidden="true" />,
  },

  estimate_point: {
    message: (activity, showIssue) => (
      <>
        {activity.new_value ? "set the estimate point to " : "removed the estimate point "}
        {activity.new_value && <span className="font-medium text-custom-text-100">{activity.new_value}</span>}
        {showIssue && (
          <>
            {" "}
            for <IssueLink activity={activity} />
          </>
        )}
      </>
    ),
    icon: <Icon iconName="change_history" className="!text-2xl" aria-hidden="true" />,
  },

  issue: {
    message: (activity) => {
      if (activity.verb === "created") return "created the issue.";
      else return "deleted an issue.";
    },
    icon: <Icon iconName="stack" className="!text-2xl" aria-hidden="true" />,
  },

  labels: {
    message: (activity, showIssue) => (
      <>
        {activity.old_value === "" ? "added a new label " : "removed the label "}
        <span className="inline-flex items-center gap-3 rounded-full border border-custom-border-300 px-2 py-0.5 text-xs">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: "#000000",
            }}
            aria-hidden="true"
          />
          <span className="font-medium text-custom-text-100">
            {activity.old_value === "" ? activity.new_value : activity.old_value}
          </span>
        </span>
        {showIssue && (
          <>
            {" "}
            to <IssueLink activity={activity} />
          </>
        )}
      </>
    ),
    icon: <Icon iconName="sell" className="!text-2xl" aria-hidden="true" />,
  },

  link: {
    message: (activity, showIssue) => (
      <>
        {activity.verb === "created" && "added this "}
        {activity.verb === "updated" && "updated this "}
        {activity.verb === "deleted" && "removed this "}
        <button
          onClick={() => console.log("link", activity.verb === "created" ? activity.new_value : activity.old_value)}
          className="font-medium text-custom-text-100 inline-flex items-center gap-1 hover:underline"
        >
          link
          <Icon iconName="launch" className="!text-xs" />
        </button>
        {showIssue && (
          <>
            {" "}
            to <IssueLink activity={activity} />
          </>
        )}
        .
      </>
    ),
    icon: <Icon iconName="link" className="!text-2xl" aria-hidden="true" />,
  },

  modules: {
    message: (activity) => (
      <>
        {activity.verb === "created" && "added this "}
        {activity.verb === "updated" && "updated this "}
        {activity.verb === "deleted" && "removed this "}
        module{" "}
        <button
          onClick={() =>
            console.log(
              "module",
              JSON.stringify({
                module_id: activity.new_identifier ?? activity.old_identifier,
                project_id: activity.project,
                module_name: activity.verb === "created" ? activity.new_value : activity.old_value,
              })
            )
          }
          className="font-medium text-custom-text-100 inline-flex items-center gap-1 hover:underline"
        >
          {activity.verb === "created" || activity.verb === "updated" ? activity.new_value : activity.old_value}
          <Icon iconName="launch" className="!text-xs" />
        </button>
        .
      </>
    ),
    icon: <Icon iconName="dataset" className="!text-2xl" aria-hidden="true" />,
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
    icon: <Icon iconName="chat" className="!text-2xl" aria-hidden="true" />,
  },

  parent: {
    message: (activity, showIssue) => (
      <>
        {activity.new_value ? "set the parent to " : "removed the parent "}
        <button
          type="button"
          onClick={() => {
            console.log(
              "issue",
              JSON.stringify({
                project_id: activity.project,
                issue_id: activity.new_identifier ?? activity.old_identifier,
                issue_identifier:
                  activity.new_value && activity.new_value !== "" ? activity.new_value : activity.old_value,
              })
            );
          }}
          className="font-medium text-custom-text-100"
        >
          {activity.new_value ? activity.new_value : activity.old_value}
        </button>
        {showIssue && (
          <>
            {" "}
            for <IssueLink activity={activity} />
          </>
        )}
        .
      </>
    ),
    icon: <Icon iconName="supervised_user_circle" className="!text-2xl" aria-hidden="true" />,
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
    icon: <Icon iconName="signal_cellular_alt" className="!text-2xl" aria-hidden="true" />,
  },

  start_date: {
    message: (activity, showIssue) => (
      <>
        {activity.new_value ? "set the start date to " : "removed the start date "}
        <span className="font-medium text-custom-text-100">
          {activity.new_value ? renderShortDateWithYearFormat(activity.new_value) : "None"}
        </span>
        {showIssue && (
          <>
            {" "}
            for <IssueLink activity={activity} />
          </>
        )}
      </>
    ),
    icon: <Icon iconName="calendar_today" className="!text-2xl" aria-hidden="true" />,
  },

  state: {
    message: (activity, showIssue) => (
      <>
        set the state to <span className="font-medium text-custom-text-100">{activity.new_value}</span>
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
    message: (activity, showIssue) => (
      <>
        {activity.new_value ? "set the target date to " : "removed the target date "}
        {activity.new_value && (
          <span className="font-medium text-custom-text-100">{renderShortDateWithYearFormat(activity.new_value)}</span>
        )}

        {showIssue && (
          <>
            {" "}
            for <IssueLink activity={activity} />
          </>
        )}
      </>
    ),
    icon: <Icon iconName="calendar_today" className="!text-2xl" aria-hidden="true" />,
  },
};

export const ActivityIcon = ({ activity }: { activity: IIssueActivity }) => (
  <>{activityDetails[activity.field as keyof typeof activityDetails]?.icon}</>
);

export const ActivityMessage = ({ activity, showIssue = false }: { activity: IIssueActivity; showIssue?: boolean }) => {
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
