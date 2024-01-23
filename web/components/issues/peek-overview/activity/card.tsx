import { FC } from "react";
import Link from "next/link";
import { History } from "lucide-react";
// packages
import { Loader, Tooltip } from "@plane/ui";
// components
import { ActivityIcon, ActivityMessage } from "components/core";
import { IssueCommentCard } from "./comment-card";
// helpers
import { renderFormattedTime, renderFormattedDate, calculateTimeAgo } from "helpers/date-time.helper";
// types
import { IIssueActivity, IUser } from "@plane/types";
import { useIssueDetail } from "hooks/store";

interface IIssueActivityCard {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  user: IUser | null;
  issueActivity: string[] | undefined;
  issueCommentUpdate: (comment: any) => void;
  issueCommentRemove: (commentId: string) => void;
  issueCommentReactionCreate: (commentId: string, reaction: string) => void;
  issueCommentReactionRemove: (commentId: string, reaction: string) => void;
}

export const IssueActivityCard: FC<IIssueActivityCard> = (props) => {
  const {
    workspaceSlug,
    projectId,
    issueId,
    user,
    issueActivity,
    issueCommentUpdate,
    issueCommentRemove,
    issueCommentReactionCreate,
    issueCommentReactionRemove,
  } = props;

  const { activity } = useIssueDetail();

  return (
    <div className="flow-root">
      {/* FIXME: --issue-detail-- */}
      {/* <ul role="list" className="-mb-4">
        {issueActivity ? (
          issueActivity.length > 0 &&
          issueActivity.map((activityId, index) => {
            // determines what type of action is performed
            const activityItem = activity.getActivityById(activityId) as IIssueActivity;
            const message = activityItem.field ? <ActivityMessage activity={activityItem} /> : "created the issue.";

            if ("field" in activityItem && activityItem.field !== "updated_by") {
              return (
                <li key={activityItem.id}>
                  <div className="relative pb-1">
                    {issueActivity.length > 1 && index !== issueActivity.length - 1 ? (
                      <span
                        className="absolute left-5 top-5 -ml-[1.5px] h-full w-0.5 bg-custom-background-100"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex items-start space-x-2">
                      <div>
                        <div className="relative px-1.5">
                          <div className="mt-1.5">
                            <div className="ring-6 flex h-7 w-7 items-center justify-center rounded-full bg-custom-background-100 text-custom-text-200 ring-white">
                              {activityItem.field ? (
                                activityItem.new_value === "restore" ? (
                                  <History className="h-3.5 w-3.5 text-custom-text-200" />
                                ) : (
                                  <ActivityIcon activity={activityItem} />
                                )
                              ) : activityItem.actor_detail.avatar && activityItem.actor_detail.avatar !== "" ? (
                                <img
                                  src={activityItem.actor_detail.avatar}
                                  alt={activityItem.actor_detail.display_name}
                                  height={24}
                                  width={24}
                                  className="h-full w-full rounded-full object-cover"
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
                        <div className="flex gap-1 break-words text-xs text-custom-text-200">
                          {activityItem.field === "archived_at" && activityItem.new_value !== "restore" ? (
                            <span className="text-gray font-medium">Plane</span>
                          ) : activityItem.actor_detail.is_bot ? (
                            <span className="text-gray font-medium">{activityItem.actor_detail.first_name} Bot</span>
                          ) : (
                            <Link href={`/${workspaceSlug}/profile/${activityItem.actor_detail.id}`}>
                              <span className="text-gray font-medium">
                                {activityItem.actor_detail.is_bot
                                  ? activityItem.actor_detail.first_name
                                  : activityItem.actor_detail.display_name}
                              </span>
                            </Link>
                          )}
                          {message}
                          <Tooltip
                            tooltipContent={`${renderFormattedDate(activityItem.created_at)}, ${renderFormattedTime(
                              activityItem.created_at
                            )}`}
                          >
                            <span className="whitespace-nowrap">{calculateTimeAgo(activityItem.created_at)}</span>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            } else if ("comment_html" in activityItem)
              return (
                <div key={activityItem.id} className="mt-4">
                  <IssueCommentCard
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    issueId={issueId}
                    user={user}
                    comment={activityItem}
                    onSubmit={issueCommentUpdate}
                    handleCommentDeletion={issueCommentRemove}
                    issueCommentReactionCreate={issueCommentReactionCreate}
                    issueCommentReactionRemove={issueCommentReactionRemove}
                    // showAccessSpecifier={showAccessSpecifier}
                  />
                </div>
              );
          })
        ) : (
          <Loader className="mb-3 space-y-3">
            <Loader.Item height="20px" />
            <Loader.Item height="20px" />
            <Loader.Item height="20px" />
            <Loader.Item height="20px" />
          </Loader>
        )}
      </ul> */}
    </div>
  );
};
