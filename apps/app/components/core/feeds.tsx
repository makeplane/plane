import React from "react";
import Image from "next/image";

// icons
import {
  ArrowTopRightOnSquareIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChatBubbleBottomCenterTextIcon,
  ChatBubbleLeftEllipsisIcon,
  RectangleGroupIcon,
  Squares2X2Icon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { BlockedIcon, BlockerIcon, CyclesIcon, TagIcon, UserGroupIcon } from "components/icons";
// helpers
import { renderShortNumericDateFormat, timeAgo } from "helpers/date-time.helper";
import { addSpaceIfCamelCase } from "helpers/string.helper";
// types
import RemirrorRichTextEditor from "components/rich-text-editor";
import Link from "next/link";

const activityDetails: {
  [key: string]: {
    message?: string;
    icon: JSX.Element;
  };
} = {
  assignee: {
    message: "removed the assignee",
    icon: <UserGroupIcon className="h-3 w-3" color="#6b7280" aria-hidden="true" />,
  },
  assignees: {
    message: "added a new assignee",
    icon: <UserGroupIcon className="h-3 w-3" color="#6b7280" aria-hidden="true" />,
  },
  blocks: {
    message: "marked this issue being blocked by",
    icon: <BlockedIcon height="12" width="12" color="#6b7280" />,
  },
  blocking: {
    message: "marked this issue is blocking",
    icon: <BlockerIcon height="12" width="12" color="#6b7280" />,
  },
  cycles: {
    message: "set the cycle to",
    icon: <CyclesIcon height="12" width="12" color="#6b7280" />,
  },
  labels: {
    icon: <TagIcon height="12" width="12" color="#6b7280" />,
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

export const Feeds: React.FC<any> = ({ activities }) => (
  <div>
    <ul role="list" className="-mb-4">
      {activities.map((activity: any, activityIdx: number) => {
        // determines what type of action is performed
        let action = activityDetails[activity.field as keyof typeof activityDetails]?.message;
        if (activity.field === "labels") {
          action = activity.new_value !== "" ? "added a new label" : "removed the label";
        } else if (activity.field === "blocking") {
          action =
            activity.new_value !== ""
              ? "marked this issue is blocking"
              : "removed the issue from blocking";
        } else if (activity.field === "blocks") {
          action =
            activity.new_value !== "" ? "marked this issue being blocked by" : "removed blocker";
        } else if (activity.field === "target_date") {
          action =
            activity.new_value && activity.new_value !== ""
              ? "set the due date to"
              : "removed the due date";
        } else if (activity.field === "parent") {
          action =
            activity.new_value && activity.new_value !== ""
              ? "set the parent to"
              : "removed the parent";
        } else if (activity.field === "priority") {
          action =
            activity.new_value && activity.new_value !== ""
              ? "set the priority to"
              : "removed the priority";
        } else if (activity.field === "description") {
          action = "updated the";
        }
        // for values that are after the action clause
        let value: any = activity.new_value ? activity.new_value : activity.old_value;
        if (
          activity.verb === "created" &&
          activity.field !== "cycles" &&
          activity.field !== "modules"
        ) {
          const { workspace_detail, project, issue } = activity;
          value = (
            <span className="text-gray-600">
              created{" "}
              <Link href={`/${workspace_detail.slug}/projects/${project}/issues/${issue}`}>
                <a className="inline-flex items-center hover:underline">
                  this issue. <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 ml-1" />
                </a>
              </Link>
            </span>
          );
        } else if (activity.field === "state") {
          value = activity.new_value ? addSpaceIfCamelCase(activity.new_value) : "None";
        } else if (activity.field === "labels") {
          let name;
          let id = "#000000";
          if (activity.new_value !== "") {
            name = activity.new_value;
            id = activity.new_identifier ? activity.new_identifier : id;
          } else {
            name = activity.old_value;
            id = activity.old_identifier ? activity.old_identifier : id;
          }

          value = name;
        } else if (activity.field === "assignees") {
          value = activity.new_value;
        } else if (activity.field === "target_date") {
          const date =
            activity.new_value && activity.new_value !== ""
              ? activity.new_value
              : activity.old_value;
          value = renderShortNumericDateFormat(date as string);
        } else if (activity.field === "description") {
          value = "description";
        }

        if (activity.field === "comment") {
          return (
            <div key={activity.id}>
              <div className="relative flex items-start space-x-3">
                <div className="relative px-1">
                  {activity.actor_detail.avatar && activity.actor_detail.avatar !== "" ? (
                    <Image
                      src={activity.actor_detail.avatar}
                      alt={activity.actor_detail.first_name}
                      height={30}
                      width={30}
                      className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-gray-500 text-white"
                    />
                  ) : (
                    <div
                      className={`grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-gray-500 text-white`}
                    >
                      {activity.actor_detail.first_name.charAt(0)}
                    </div>
                  )}

                  <span className="absolute -bottom-0.5 -right-1 rounded-tl bg-white px-0.5 py-px">
                    <ChatBubbleLeftEllipsisIcon
                      className="h-3.5 w-3.5 text-gray-400"
                      aria-hidden="true"
                    />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div>
                    <div className="text-xs">
                      {activity.actor_detail.first_name}
                      {activity.actor_detail.is_bot ? "Bot" : " " + activity.actor_detail.last_name}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Commented {timeAgo(activity.created_at)}
                    </p>
                  </div>
                  <div className="issue-comments-section p-0">
                    <RemirrorRichTextEditor
                      value={
                        activity.new_value && activity.new_value !== ""
                          ? activity.new_value
                          : activity.old_value
                      }
                      editable={false}
                      onBlur={() => ({})}
                      noBorder
                      customClassName="text-xs bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        }

        if ("field" in activity && activity.field !== "updated_by") {
          return (
            <li key={activity.id}>
              <div className="relative pb-1">
                {activities.length > 1 && activityIdx !== activities.length - 1 ? (
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
                            {activity.field ? (
                              activityDetails[activity.field as keyof typeof activityDetails]?.icon
                            ) : activity.actor_detail.avatar &&
                              activity.actor_detail.avatar !== "" ? (
                              <Image
                                src={activity.actor_detail.avatar}
                                alt={activity.actor_detail.first_name}
                                height={24}
                                width={24}
                                className="rounded-full"
                              />
                            ) : (
                              <div
                                className={`grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-gray-700 text-xs text-white`}
                              >
                                {activity.actor_detail.first_name.charAt(0)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 py-3">
                      <div className="text-xs text-gray-500">
                        <span className="text-gray font-medium">
                          {activity.actor_detail.first_name}
                          {activity.actor_detail.is_bot
                            ? " Bot"
                            : " " + activity.actor_detail.last_name}
                        </span>
                        <span> {action} </span>
                        <span className="text-xs font-medium text-gray-900"> {value} </span>
                        <span className="whitespace-nowrap">{timeAgo(activity.created_at)}</span>
                      </div>
                    </div>
                  </>
                </div>
              </div>
            </li>
          );
        }
      })}
    </ul>
  </div>
);
