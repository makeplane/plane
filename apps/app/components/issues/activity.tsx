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
import { IIssueComment, IIssueLabels } from "types";
import { PROJECT_ISSUES_ACTIVITY, PROJECT_ISSUE_LABELS } from "constants/fetch-keys";

const activityDetails: {
  [key: string]: {
    message?: string;
    icon: JSX.Element;
  };
} = {
  assignee: {
    message: "removed the assignee",
    icon: <UserGroupIcon className="h-3 w-3 text-gray-500" aria-hidden="true" />,
  },
  assignees: {
    message: "added a new assignee",
    icon: <UserGroupIcon className="h-3 w-3 text-gray-500" aria-hidden="true" />,
  },
  blocks: {
    message: "marked this issue being blocked by",
    icon: <BlockedIcon height="12" width="12" className="fill-gray-500" />,
  },
  blocking: {
    message: "marked this issue is blocking",
    icon: <BlockerIcon height="12" width="12" />,
  },
  cycles: {
    message: "set the cycle to",
    icon: <CyclesIcon height="12" width="12" />,
  },
  labels: {
    icon: <TagIcon height="12" width="12" />,
  },
  modules: {
    message: "set the module to",
    icon: <RectangleGroupIcon className="h-3 w-3 text-gray-500" aria-hidden="true" />,
  },
  state: {
    message: "set the state to",
    icon: <Squares2X2Icon className="h-3 w-3 text-gray-500" aria-hidden="true" />,
  },
  priority: {
    message: "set the priority to",
    icon: <ChartBarIcon className="h-3 w-3 text-gray-500" aria-hidden="true" />,
  },
  name: {
    message: "set the name to",
    icon: <ChatBubbleBottomCenterTextIcon className="h-3 w-3 text-gray-500" aria-hidden="true" />,
  },
  description: {
    message: "updated the description.",
    icon: <ChatBubbleBottomCenterTextIcon className="h-3 w-3 text-gray-500" aria-hidden="true" />,
  },
  target_date: {
    message: "set the due date to",
    icon: <CalendarDaysIcon className="h-3 w-3 text-gray-500" aria-hidden="true" />,
  },
  parent: {
    message: "set the parent to",
    icon: <UserIcon className="h-3 w-3 text-gray-500" aria-hidden="true" />,
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

  const { data: issueLabels } = useSWR<IIssueLabels[]>(
    projectId ? PROJECT_ISSUE_LABELS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => issuesService.getIssueLabels(workspaceSlug as string, projectId as string)
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

  const getLabelColor = (labelId: string) => {
    if (!issueLabels) return;
    const label = issueLabels.find((label) => label.id === labelId);
    if (typeof label !== "undefined") {
      return label.color;
    }
    return "#64748b";
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
      <ul role="list" className="-mb-8">
        {issueActivities.map((activityItem, activityItemIdx) => {
          // determines what type of action is performed
          let action = activityDetails[activityItem.field as keyof typeof activityDetails]?.message;
          if (activityItem.field === "labels") {
            action = activityItem.new_value !== "" ? "added a new label" : "removed the label";
          } else if (activityItem.field === "blocking") {
            action =
              activityItem.new_value !== ""
                ? "marked this issue is blocking"
                : "removed the issue from blocking";
          } else if (activityItem.field === "blocks") {
            action =
              activityItem.new_value !== ""
                ? "marked this issue being blocked by"
                : "removed blocker";
          } else if (activityItem.field === "target_date") {
            action =
              activityItem.new_value && activityItem.new_value !== ""
                ? "set the due date to"
                : "removed the due date";
          }
          // for values that are after the action clause
          let value: any = activityItem.new_value ? activityItem.new_value : activityItem.old_value;
          if (
            activityItem.verb === "created" &&
            activityItem.field !== "cycles" &&
            activityItem.field !== "modules"
          ) {
            value = <span className="text-gray-600">created this issue.</span>;
          } else if (activityItem.field === "state") {
            value = activityItem.new_value ? addSpaceIfCamelCase(activityItem.new_value) : "None";
          } else if (activityItem.field === "labels") {
            let name,
              id = "#64748b";
            if (activityItem.new_value !== "") {
              name = activityItem.new_value;
              id = activityItem.new_identifier ? activityItem.new_identifier : id;
            } else {
              name = activityItem.old_value;
              id = activityItem.old_identifier ? activityItem.old_identifier : id;
            }

            value = (
              <span className="relative inline-flex items-center rounded-full px-2.5 py-1 text-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                <span className="absolute flex flex-shrink-0 items-center justify-center">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: getLabelColor(id),
                    }}
                    aria-hidden="true"
                  />
                </span>
                <span className="ml-3 font-medium text-gray-900">{name}</span>
              </span>
            );
          } else if (activityItem.field === "assignees") {
            value = activityItem.new_value;
          } else if (activityItem.field === "target_date") {
            value = renderShortNumericDateFormat(activityItem.new_value as string);
          } else if (activityItem.field === "description") {
            value = "";
          }

          if ("field" in activityItem && activityItem.field !== "updated_by") {
            return (
              <li key={activityItem.id}>
                <div className="relative pb-3">
                  {issueActivities.length > 1 && activityItemIdx !== issueActivities.length - 1 ? (
                    <span
                      className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex items-start space-x-2">
                    <>
                      <div>
                        <div className="relative px-1.5">
                          <div className="mt-1.5">
                            <div className="ring-6 flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 ring-white">
                              {activityItem.field ? (
                                activityDetails[activityItem.field as keyof typeof activityDetails]
                                  ?.icon
                              ) : activityItem.actor_detail.avatar &&
                                activityItem.actor_detail.avatar !== "" ? (
                                <Image
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
                        <div className="text-xs text-gray-500">
                          <span className="text-gray font-medium">
                            {activityItem.actor_detail.first_name}
                            {activityItem.actor_detail.is_bot
                              ? " Bot"
                              : " " + activityItem.actor_detail.last_name}
                          </span>
                          <span> {action} </span>
                          <span className="text-xs font-medium text-gray-900"> {value} </span>
                          <span className="whitespace-nowrap">
                            {timeAgo(activityItem.created_at)}
                          </span>
                        </div>
                      </div>
                    </>
                  </div>
                </div>
              </li>
            );
          } else if ("comment_json" in activityItem)
            return (
              <CommentCard
                key={activityItem.id}
                comment={activityItem as any}
                onSubmit={handleCommentUpdate}
                handleCommentDeletion={handleCommentDelete}
              />
            );
        })}
      </ul>
    </div>
  );
};
