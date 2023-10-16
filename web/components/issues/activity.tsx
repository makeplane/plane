import React from "react";

import Link from "next/link";
import { useRouter } from "next/router";

// components
import { ActivityIcon, ActivityMessage } from "components/core";
import { CommentCard } from "components/issues/comment";
// ui
import { Icon } from "components/ui";
import { Loader, Tooltip } from "@plane/ui";
// helpers
import { render24HourFormatTime, renderLongDateFormat, timeAgo } from "helpers/date-time.helper";
// types
import { IIssueActivity, IIssueComment } from "types";

type Props = {
  activity: IIssueActivity[] | undefined;
  handleCommentUpdate: (commentId: string, data: Partial<IIssueComment>) => Promise<void>;
  handleCommentDelete: (commentId: string) => Promise<void>;
  showAccessSpecifier?: boolean;
};

export const IssueActivitySection: React.FC<Props> = ({
  activity,
  handleCommentUpdate,
  handleCommentDelete,
  showAccessSpecifier = false,
}) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  if (!activity)
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

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-4">
        {activity.map((activityItem, index) => {
          // determines what type of action is performed
          const message = activityItem.field ? <ActivityMessage activity={activityItem} /> : "created the issue.";

          if ("field" in activityItem && activityItem.field !== "updated_by") {
            return (
              <li key={activityItem.id}>
                <div className="relative pb-1">
                  {activity.length > 1 && index !== activity.length - 1 ? (
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
                                <ActivityIcon activity={activityItem} />
                              )
                            ) : activityItem.actor_detail.avatar && activityItem.actor_detail.avatar !== "" ? (
                              <img
                                src={activityItem.actor_detail.avatar}
                                alt={activityItem.actor_detail.display_name}
                                height={24}
                                width={24}
                                className="rounded-full"
                              />
                            ) : (
                              <div
                                className={`grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-gray-700 text-xs text-white`}
                              >
                                {activityItem.actor_detail.is_bot
                                  ? activityItem.actor_detail.first_name.charAt(0)
                                  : activityItem.actor_detail.display_name.charAt(0)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 py-3">
                      <div className="text-xs text-custom-text-200 break-words">
                        {activityItem.field === "archived_at" && activityItem.new_value !== "restore" ? (
                          <span className="text-gray font-medium">Plane</span>
                        ) : activityItem.actor_detail.is_bot ? (
                          <span className="text-gray font-medium">{activityItem.actor_detail.first_name} Bot</span>
                        ) : (
                          <Link href={`/${workspaceSlug}/profile/${activityItem.actor_detail.id}`}>
                            <a className="text-gray font-medium">
                              {activityItem.actor_detail.is_bot
                                ? activityItem.actor_detail.first_name
                                : activityItem.actor_detail.display_name}
                            </a>
                          </Link>
                        )}{" "}
                        {message}{" "}
                        <Tooltip
                          tooltipContent={`${renderLongDateFormat(activityItem.created_at)}, ${render24HourFormatTime(
                            activityItem.created_at
                          )}`}
                        >
                          <span className="whitespace-nowrap">{timeAgo(activityItem.created_at)}</span>
                        </Tooltip>
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
                  handleCommentDeletion={handleCommentDelete}
                  onSubmit={handleCommentUpdate}
                  showAccessSpecifier={showAccessSpecifier}
                  workspaceSlug={workspaceSlug as string}
                />
              </div>
            );
        })}
      </ul>
    </div>
  );
};
