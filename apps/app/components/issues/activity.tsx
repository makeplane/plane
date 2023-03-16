import React from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import useSWR from "swr";

// icons
import {
  CalendarDaysIcon,
  ChartBarIcon,
  ChatBubbleBottomCenterTextIcon,
  RectangleGroupIcon,
  Squares2X2Icon,
  UserIcon,
} from "@heroicons/react/24/outline";
// services
import issuesService from "services/issues.service";
// components
import { CommentCard } from "components/issues/comment";
// ui
import { Loader } from "components/ui";
// icons
import { BlockedIcon, BlockerIcon, CyclesIcon, TagIcon, UserGroupIcon } from "components/icons";
// helpers
import { renderShortNumericDateFormat, timeAgo } from "helpers/date-time.helper";
import { addSpaceIfCamelCase } from "helpers/string.helper";
// types
import { IIssueComment } from "types";
import { PROJECT_ISSUES_ACTIVITY } from "constants/fetch-keys";

const activityDetails: {
  [key: string]: {
    message?: string;
    icon: JSX.Element;
  };
} = {
  assignee: {
    message: "removed the assignee",
    icon: <UserGroupIcon className="h-4 w-4" />,
  },
  assignees: {
    message: "added a new assignee",
    icon: <UserGroupIcon className="h-4 w-4" />,
  },
  blocks: {
    message: "marked this issue being blocked by",
    icon: <BlockedIcon height="16" width="16" />,
  },
  blocking: {
    message: "marked this issue is blocking",
    icon: <BlockerIcon height="16" width="16" />,
  },
  cycles: {
    message: "set the cycle to",
    icon: <CyclesIcon height="16" width="16" />,
  },
  labels: {
    icon: <TagIcon height="16" width="16" />,
  },
  modules: {
    message: "set the module to",
    icon: <RectangleGroupIcon className="h-4 w-4" />,
  },
  state: {
    message: "set the state to",
    icon: <Squares2X2Icon className="h-4 w-4" />,
  },
  priority: {
    message: "set the priority to",
    icon: <ChartBarIcon className="h-4 w-4" />,
  },
  name: {
    message: "set the name to",
    icon: <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />,
  },
  description: {
    message: "updated the description.",
    icon: <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />,
  },
  target_date: {
    message: "set the due date to",
    icon: <CalendarDaysIcon className="h-4 w-4" />,
  },
  parent: {
    message: "set the parent to",
    icon: <UserIcon className="h-4 w-4" />,
  },
};

type Props = {};

export const IssueActivitySection: React.FC<Props> = () => {
  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { data: issueActivities, mutate: mutateIssueActivities } = useSWR(
    workspaceSlug && projectId && issueId ? PROJECT_ISSUES_ACTIVITY(issueId as string) : null,
    workspaceSlug && projectId && issueId
      ? () =>
          issuesService.getIssueActivities(
            workspaceSlug as string,
            projectId as string,
            issueId as string
          )
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
        comment
      )
      .then((res) => {
        mutateIssueActivities();
      });
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!workspaceSlug || !projectId || !issueId) return;
    await issuesService
      .deleteIssueComment(
        workspaceSlug as string,
        projectId as string,
        issueId as string,
        commentId
      )
      .then((response) => {
        mutateIssueActivities();
        console.log(response);
      });
  };

  return (
    <>
      {issueActivities ? (
        <div className="space-y-4">
          {issueActivities.map((activity, index) => {
            if ("field" in activity && activity.field !== "updated_by") {
              return (
                <div key={activity.id} className="relative flex w-full items-center gap-x-2">
                  {issueActivities.length > 1 && index !== issueActivities.length - 1 ? (
                    <span
                      className="absolute top-5 left-2.5 h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  ) : null}
                  {activity.field ? (
                    <div className="relative z-10 -ml-1 flex-shrink-0">
                      <div className="grid h-8 w-8 place-items-center bg-white">
                        {activityDetails[activity.field as keyof typeof activityDetails]?.icon}
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-10 -ml-4 flex-shrink-0 rounded-full border-2 border-white">
                      <div className="grid h-12 w-12 place-items-center">
                        {activity.actor_detail.avatar && activity.actor_detail.avatar !== "" ? (
                          <Image
                            src={activity.actor_detail.avatar}
                            alt={activity.actor_detail.first_name}
                            height={30}
                            width={30}
                            className="rounded-full"
                          />
                        ) : (
                          <div
                            className={`grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-gray-700 text-white`}
                          >
                            {activity.actor_detail.first_name.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className={`${activity.field ? "ml-1.5" : ""} w-full text-xs`}>
                    <p>
                      <span className="font-medium">
                        {activity.actor_detail.first_name}
                        {activity.actor_detail.is_bot
                          ? " Bot"
                          : " " + activity.actor_detail.last_name}
                      </span>
                      <span>
                        {" "}
                        {activity.field === "labels"
                          ? activity.new_value !== ""
                            ? "added a new label"
                            : "removed the label"
                          : activity.field === "blocking"
                          ? activity.new_value !== ""
                            ? "marked this issue is blocking"
                            : "removed the issue from blocking"
                          : activity.field === "blocks"
                          ? activity.new_value !== ""
                            ? "marked this issue being blocked by"
                            : "removed blocker"
                          : activity.field === "target_date"
                          ? activity.new_value && activity.new_value !== ""
                            ? "set the due date to"
                            : "removed the due date"
                          : activityDetails[activity.field as keyof typeof activityDetails]
                              ?.message}{" "}
                      </span>
                      <span className="font-medium">
                        {activity.verb === "created" &&
                        activity.field !== "cycles" &&
                        activity.field !== "modules" ? (
                          <span className="text-gray-600">created this issue.</span>
                        ) : activity.field === "description" ? null : activity.field === "state" ? (
                          activity.new_value ? (
                            addSpaceIfCamelCase(activity.new_value)
                          ) : (
                            "None"
                          )
                        ) : activity.field === "labels" ||
                          activity.field === "blocking" ||
                          activity.field === "blocks" ? (
                          activity.new_value !== "" ? (
                            activity.new_value
                          ) : (
                            activity.old_value
                          )
                        ) : activity.field === "assignee" ? (
                          activity.old_value
                        ) : activity.field === "target_date" ? (
                          activity.new_value ? (
                            renderShortNumericDateFormat(activity.new_value as string)
                          ) : null
                        ) : activity.field === "description" ? (
                          ""
                        ) : (
                          activity.new_value ?? "None"
                        )}
                      </span>
                      <span className="ml-2 text-gray-500">{timeAgo(activity.created_at)}</span>
                    </p>
                  </div>
                </div>
              );
            } else if ("comment_json" in activity)
              return (
                <CommentCard
                  key={activity.id}
                  comment={activity as any}
                  onSubmit={handleCommentUpdate}
                  handleCommentDeletion={handleCommentDelete}
                />
              );
          })}
        </div>
      ) : (
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
      )}
    </>
  );
};
