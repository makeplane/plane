import React from "react";

import Link from "next/link";

// icons
import {
  ArrowTopRightOnSquareIcon,
  ChatBubbleLeftEllipsisIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { BlockedIcon, BlockerIcon } from "components/icons";
import { Icon } from "components/ui";
// helpers
import { renderShortDateWithYearFormat, timeAgo } from "helpers/date-time.helper";
import { addSpaceIfCamelCase } from "helpers/string.helper";
// types
import RemirrorRichTextEditor from "components/rich-text-editor";

const activityDetails: {
  [key: string]: {
    message?: string;
    icon: JSX.Element;
  };
} = {
  assignee: {
    message: "removed the assignee",
    icon: <Icon iconName="group" className="!text-sm" aria-hidden="true" />,
  },
  assignees: {
    message: "added a new assignee",
    icon: <Icon iconName="group" className="!text-sm" aria-hidden="true" />,
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
    icon: <Icon iconName="contrast" className="!text-sm" aria-hidden="true" />,
  },
  labels: {
    icon: <Icon iconName="sell" className="!text-sm" aria-hidden="true" />,
  },
  modules: {
    message: "set the module to",
    icon: <Icon iconName="dataset" className="!text-sm" aria-hidden="true" />,
  },
  state: {
    message: "set the state to",
    icon: <Squares2X2Icon className="h-3 w-3 text-custom-text-200" aria-hidden="true" />,
  },
  priority: {
    message: "set the priority to",
    icon: <Icon iconName="signal_cellular_alt" className="!text-sm" aria-hidden="true" />,
  },
  name: {
    message: "set the name to",
    icon: <Icon iconName="chat" className="!text-sm" aria-hidden="true" />,
  },
  description: {
    message: "updated the description.",
    icon: <Icon iconName="chat" className="!text-sm" aria-hidden="true" />,
  },
  estimate_point: {
    message: "set the estimate point to",
    icon: <Icon iconName="change_history" className="!text-sm" aria-hidden="true" />,
  },
  target_date: {
    message: "set the due date to",
    icon: <Icon iconName="calendar_today" className="!text-sm" aria-hidden="true" />,
  },
  parent: {
    message: "set the parent to",
    icon: <Icon iconName="supervised_user_circle" className="!text-sm" aria-hidden="true" />,
  },
  issue: {
    message: "deleted the issue.",
    icon: <Icon iconName="delete" className="!text-sm" aria-hidden="true" />,
  },
  estimate: {
    message: "updated the estimate",
    icon: <Icon iconName="change_history" className="!text-sm" aria-hidden="true" />,
  },
  link: {
    message: "updated the link",
    icon: <Icon iconName="link" className="!text-sm" aria-hidden="true" />,
  },
  attachment: {
    message: "updated the attachment",
    icon: <Icon iconName="attach_file" className="!text-sm" aria-hidden="true" />,
  },
  archived_at: {
    message: "archived",
    icon: <Icon iconName="archive" className="!text-sm text-custom-text-200" aria-hidden="true" />,
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
        } else if (activity.field === "attachment") {
          action = `${activity.verb} the`;
        } else if (activity.field === "link") {
          action = `${activity.verb} the`;
        } else if (activity.field === "archived_at") {
          action =
            activity.new_value && activity.new_value === "restore"
              ? "restored the issue"
              : "archived the issue";
        }
        // for values that are after the action clause
        let value: any = activity.new_value ? activity.new_value : activity.old_value;
        if (
          activity.verb === "created" &&
          activity.field !== "cycles" &&
          activity.field !== "modules" &&
          activity.field !== "attachment" &&
          activity.field !== "link" &&
          activity.field !== "estimate"
        ) {
          const { workspace_detail, project, issue } = activity;
          value = (
            <span className="text-custom-text-200">
              created{" "}
              <Link href={`/${workspace_detail.slug}/projects/${project}/issues/${issue}`}>
                <a className="inline-flex items-center hover:underline">
                  this issue. <ArrowTopRightOnSquareIcon className="ml-1 h-3.5 w-3.5" />
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
          value = renderShortDateWithYearFormat(date as string);
        } else if (activity.field === "description") {
          value = "description";
        } else if (activity.field === "attachment") {
          value = "attachment";
        } else if (activity.field === "link") {
          value = "link";
        } else if (activity.field === "estimate_point") {
          value = activity.new_value
            ? activity.new_value + ` Point${parseInt(activity.new_value ?? "", 10) > 1 ? "s" : ""}`
            : "None";
        }

        if (activity.field === "comment") {
          return (
            <div key={activity.id} className="mt-2">
              <div className="relative flex items-start space-x-3">
                <div className="relative px-1">
                  {activity.field ? (
                    activity.new_value === "restore" ? (
                      <Icon iconName="history" className="text-sm text-custom-text-200" />
                    ) : (
                      activityDetails[activity.field as keyof typeof activityDetails]?.icon
                    )
                  ) : activity.actor_detail.avatar && activity.actor_detail.avatar !== "" ? (
                    <img
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

                  <span className="absolute -bottom-0.5 -right-1 rounded-tl bg-custom-background-80 px-0.5 py-px">
                    <ChatBubbleLeftEllipsisIcon
                      className="h-3.5 w-3.5 text-custom-text-200"
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
                    <p className="mt-0.5 text-xs text-custom-text-200">
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
                      noBorder
                      customClassName="text-xs border border-custom-border-200 bg-custom-background-100"
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
                    className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-custom-background-80"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex items-start space-x-2">
                  <>
                    <div>
                      <div className="relative px-1.5">
                        <div className="mt-1.5">
                          <div className="ring-6 flex h-7 w-7 items-center justify-center rounded-full bg-custom-background-80 text-custom-text-200 ring-white">
                            {activity.field ? (
                              activityDetails[activity.field as keyof typeof activityDetails]?.icon
                            ) : activity.actor_detail.avatar &&
                              activity.actor_detail.avatar !== "" ? (
                              <img
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
                      <div className="text-xs text-custom-text-200">
                        {activity.field === "archived_at" && activity.new_value !== "restore" ? (
                          <span className="text-gray font-medium">Plane</span>
                        ) : (
                          <span className="text-gray font-medium">
                            {activity.actor_detail.first_name}
                            {activity.actor_detail.is_bot
                              ? " Bot"
                              : " " + activity.actor_detail.last_name}
                          </span>
                        )}
                        <span> {action} </span>
                        {activity.field !== "archived_at" && (
                          <span className="text-xs font-medium text-custom-text-100">
                            {" "}
                            {value}{" "}
                          </span>
                        )}
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
