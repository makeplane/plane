import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import issuesService from "services/issues.service";
// components
import { CommentCard } from "components/issues/comment";
// ui
import { Icon, Loader } from "components/ui";
// icons
import { Squares2X2Icon } from "@heroicons/react/24/outline";
import { BlockedIcon, BlockerIcon } from "components/icons";
// helpers
import { renderShortDateWithYearFormat, timeAgo } from "helpers/date-time.helper";
import { capitalizeFirstLetter } from "helpers/string.helper";
// types
import { ICurrentUserResponse, IIssueActivity, IIssueComment } from "types";
// fetch-keys
import { PROJECT_ISSUES_ACTIVITY } from "constants/fetch-keys";

const activityDetails: {
  [key: string]: {
    message: (activity: IIssueActivity) => React.ReactNode;
    icon: React.ReactNode;
  };
} = {
  assignees: {
    message: (activity) => {
      if (activity.old_value === "")
        return (
          <>
            added a new assignee{" "}
            <span className="font-medium text-custom-text-100">{activity.new_value}</span>.
          </>
        );
      else
        return (
          <>
            removed the assignee{" "}
            <span className="font-medium text-custom-text-100">{activity.old_value}</span>.
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
    message: (activity) => {
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
          </>
        );
      else return "removed an attachment.";
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
    message: (activity) => {
      if (activity.verb === "created")
        return (
          <>
            added this issue to the cycle{" "}
            <span className="font-medium text-custom-text-100">{activity.new_value}</span>.
          </>
        );
      else if (activity.verb === "updated")
        return (
          <>
            set the cycle to{" "}
            <span className="font-medium text-custom-text-100">{activity.new_value}</span>.
          </>
        );
      else
        return (
          <>
            removed the issue from the cycle{" "}
            <span className="font-medium text-custom-text-100">{activity.old_value}</span>.
          </>
        );
    },
    icon: <Icon iconName="contrast" className="!text-sm" aria-hidden="true" />,
  },
  description: {
    message: (activity) => "updated the description.",
    icon: <Icon iconName="chat" className="!text-sm" aria-hidden="true" />,
  },
  estimate_point: {
    message: (activity) => {
      if (!activity.new_value) return "removed the estimate point.";
      else
        return (
          <>
            set the estimate point to{" "}
            <span className="font-medium text-custom-text-100">{activity.new_value}</span>.
          </>
        );
    },
    icon: <Icon iconName="change_history" className="!text-sm" aria-hidden="true" />,
  },
  labels: {
    message: (activity) => {
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
          </>
        );
    },
    icon: <Icon iconName="sell" className="!text-sm" aria-hidden="true" />,
  },
  link: {
    message: (activity) => {
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
            </a>{" "}
            to the issue.
          </>
        );
      else return "removed a link.";
    },
    icon: <Icon iconName="link" className="!text-sm" aria-hidden="true" />,
  },
  modules: {
    message: (activity) => {
      if (activity.verb === "created")
        return (
          <>
            added this issue to the module{" "}
            <span className="font-medium text-custom-text-100">{activity.new_value}</span>.
          </>
        );
      else if (activity.verb === "updated")
        return (
          <>
            set the module to{" "}
            <span className="font-medium text-custom-text-100">{activity.new_value}</span>.
          </>
        );
      else
        return (
          <>
            removed the issue from the module{" "}
            <span className="font-medium text-custom-text-100">{activity.old_value}</span>.
          </>
        );
    },
    icon: <Icon iconName="dataset" className="!text-sm" aria-hidden="true" />,
  },
  name: {
    message: (activity) => `set the name to ${activity.new_value}.`,
    icon: <Icon iconName="chat" className="!text-sm" aria-hidden="true" />,
  },
  parent: {
    message: (activity) => {
      if (!activity.new_value)
        return (
          <>
            removed the parent{" "}
            <span className="font-medium text-custom-text-100">{activity.old_value}</span>.
          </>
        );
      else
        return (
          <>
            set the parent to{" "}
            <span className="font-medium text-custom-text-100">{activity.new_value}</span>.
          </>
        );
    },
    icon: <Icon iconName="supervised_user_circle" className="!text-sm" aria-hidden="true" />,
  },
  priority: {
    message: (activity) => (
      <>
        set the priority to{" "}
        <span className="font-medium text-custom-text-100">
          {activity.new_value ? capitalizeFirstLetter(activity.new_value) : "None"}
        </span>
        .
      </>
    ),
    icon: <Icon iconName="signal_cellular_alt" className="!text-sm" aria-hidden="true" />,
  },
  state: {
    message: (activity) => (
      <>
        set the state to{" "}
        <span className="font-medium text-custom-text-100">{activity.new_value}</span>.
      </>
    ),
    icon: <Squares2X2Icon className="h-3 w-3" aria-hidden="true" />,
  },
  target_date: {
    message: (activity) => {
      if (!activity.new_value) return "removed the due date.";
      else
        return (
          <>
            set the due date to{" "}
            <span className="font-medium text-custom-text-100">
              {renderShortDateWithYearFormat(activity.new_value)}
            </span>
            .
          </>
        );
    },
    icon: <Icon iconName="calendar_today" className="!text-sm" aria-hidden="true" />,
  },
};

type Props = {
  issueId: string;
  user: ICurrentUserResponse | undefined;
};

export const IssueActivitySection: React.FC<Props> = ({ issueId, user }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: issueActivities, mutate: mutateIssueActivities } = useSWR(
    workspaceSlug && projectId ? PROJECT_ISSUES_ACTIVITY(issueId) : null,
    workspaceSlug && projectId
      ? () =>
          issuesService.getIssueActivities(workspaceSlug as string, projectId as string, issueId)
      : null
  );

  const handleCommentUpdate = async (comment: IIssueComment) => {
    if (!workspaceSlug || !projectId || !issueId) return;

    await issuesService
      .patchIssueComment(
        workspaceSlug as string,
        projectId as string,
        issueId as string,
        comment.id,
        comment,
        user
      )
      .then((res) => mutateIssueActivities());
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!workspaceSlug || !projectId || !issueId) return;

    mutateIssueActivities((prevData) => prevData?.filter((p) => p.id !== commentId), false);

    await issuesService
      .deleteIssueComment(
        workspaceSlug as string,
        projectId as string,
        issueId as string,
        commentId,
        user
      )
      .then(() => mutateIssueActivities());
  };

  if (!issueActivities) {
    return (
      <Loader className="space-y-4">
        <div className="space-y-2">
          <Loader.Item height="30px" width="40%" />
          <Loader.Item height="15px" width="60%" />
        </div>
        <div className="space-y-2">
          <Loader.Item height="30px" width="40%" />
          <Loader.Item height="15px" width="60%" />
        </div>
        <div className="space-y-2">
          <Loader.Item height="30px" width="40%" />
          <Loader.Item height="15px" width="60%" />
        </div>
      </Loader>
    );
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-4">
        {issueActivities.map((activityItem, index) => {
          // determines what type of action is performed
          const message = activityItem.field
            ? activityDetails[activityItem.field as keyof typeof activityDetails]?.message(
                activityItem
              )
            : "created the issue.";

          if ("field" in activityItem && activityItem.field !== "updated_by") {
            return (
              <li key={activityItem.id}>
                <div className="relative pb-1">
                  {issueActivities.length > 1 && index !== issueActivities.length - 1 ? (
                    <span
                      className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-custom-background-80"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex items-start space-x-2">
                    <div>
                      <div className="relative px-1.5">
                        <div className="mt-1.5">
                          <div className="ring-6 flex h-7 w-7 items-center justify-center rounded-full bg-custom-background-80 text-custom-text-200 ring-white">
                            {activityItem.field ? (
                              activityItem.new_value === "restore" ? (
                                <Icon iconName="history" className="text-sm text-custom-text-200" />
                              ) : (
                                activityDetails[activityItem.field as keyof typeof activityDetails]
                                  ?.icon
                              )
                            ) : activityItem.actor_detail.avatar &&
                              activityItem.actor_detail.avatar !== "" ? (
                              <img
                                src={activityItem.actor_detail.avatar}
                                alt={activityItem.actor_detail.first_name}
                                height={24}
                                width={24}
                                className="rounded-full"
                              />
                            ) : (
                              <div
                                className={`grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-gray-700 text-xs text-white`}
                              >
                                {activityItem.actor_detail.first_name.charAt(0)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 py-3">
                      <div className="text-xs text-custom-text-200 break-words">
                        {activityItem.field === "archived_at" &&
                        activityItem.new_value !== "restore" ? (
                          <span className="text-gray font-medium">Plane</span>
                        ) : (
                          <span className="text-gray font-medium">
                            {activityItem.actor_detail.first_name}
                            {activityItem.actor_detail.is_bot
                              ? " Bot"
                              : " " + activityItem.actor_detail.last_name}
                          </span>
                        )}{" "}
                        {message}{" "}
                        <span className="whitespace-nowrap">
                          {timeAgo(activityItem.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          } else if ("comment_json" in activityItem)
            return (
              <div key={activityItem.id} className="mt-4">
                <CommentCard
                  comment={activityItem as IIssueComment}
                  onSubmit={handleCommentUpdate}
                  handleCommentDeletion={handleCommentDelete}
                />
              </div>
            );
        })}
      </ul>
    </div>
  );
};
