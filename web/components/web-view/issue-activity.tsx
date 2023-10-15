// react
import React from "react";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";

// fetch key
import { PROJECT_ISSUES_ACTIVITY } from "constants/fetch-keys";
// services
import { IssueService, IssueCommentService } from "services/issue";
// hooks
import useUser from "hooks/use-user";
// components
import { Label, AddComment, ActivityMessage, ActivityIcon, CommentCard } from "components/web-view";
// helpers
import { timeAgo } from "helpers/date-time.helper";
// ui
import { Icon } from "components/ui";
// types
import type { IIssue, IIssueComment } from "types";

type Props = {
  allowed: boolean;
  issueDetails: IIssue;
};

// services
const issueService = new IssueService();
const issueCommentService = new IssueCommentService();

export const IssueActivity: React.FC<Props> = (props) => {
  const { issueDetails, allowed } = props;

  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { user } = useUser();

  const { data: issueActivities, mutate: mutateIssueActivity } = useSWR(
    workspaceSlug && projectId && issueId ? PROJECT_ISSUES_ACTIVITY(issueId.toString()) : null,
    workspaceSlug && projectId && issueId
      ? () => issueService.getIssueActivities(workspaceSlug.toString(), projectId.toString(), issueId.toString())
      : null
  );

  const handleCommentUpdate = async (comment: any, formData: any) => {
    if (!workspaceSlug || !projectId || !issueId || !allowed) return;

    await issueCommentService
      .patchIssueComment(workspaceSlug as string, projectId as string, issueId as string, comment, formData, user)
      .then(() => mutateIssueActivity())
      .catch(() =>
        console.log(
          "toast",
          JSON.stringify({
            type: "error",
            message: "Comment could not be updated. Please try again.",
          })
        )
      );
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!workspaceSlug || !projectId || !issueId || !allowed) return;

    mutateIssueActivity((prevData: any) => prevData?.filter((p: any) => p.id !== commentId), false);

    await issueCommentService
      .deleteIssueComment(workspaceSlug as string, projectId as string, issueId as string, commentId, user)
      .then(() => mutateIssueActivity())
      .catch(() =>
        console.log(
          "toast",
          JSON.stringify({
            type: "error",
            message: "Comment could not be deleted. Please try again.",
          })
        )
      );
  };

  const handleAddComment = async (formData: IIssueComment) => {
    if (!workspaceSlug || !issueDetails || !allowed) return;

    await issueCommentService
      .createIssueComment(workspaceSlug.toString(), issueDetails.project, issueDetails.id, formData, user)
      .then(() => {
        mutate(PROJECT_ISSUES_ACTIVITY(issueDetails.id));
      })
      .catch(() =>
        console.log(
          "toast",
          JSON.stringify({
            type: "error",
            message: "Comment could not be posted. Please try again.",
          })
        )
      );
  };

  return (
    <div>
      <Label>Activity</Label>
      <div className="mt-1 space-y-[6px] p-2 border border-custom-border-200 rounded-[4px]">
        <ul role="list" className="-mb-4">
          {issueActivities?.map((activityItem, index) => {
            // determines what type of action is performed
            const message = activityItem.field ? <ActivityMessage activity={activityItem} /> : "created the issue.";

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
                            <button
                              type="button"
                              className="text-gray font-medium"
                              onClick={() => console.log("user", activityItem.actor)}
                            >
                              {activityItem.actor_detail.is_bot
                                ? activityItem.actor_detail.first_name
                                : activityItem.actor_detail.display_name}
                            </button>
                          )}{" "}
                          {message} <span className="whitespace-nowrap">{timeAgo(activityItem.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            } else if ("comment_json" in activityItem)
              return (
                <div key={activityItem.id} className="my-4">
                  <CommentCard
                    workspaceSlug={workspaceSlug as string}
                    comment={activityItem as any}
                    onSubmit={handleCommentUpdate}
                    handleCommentDeletion={handleCommentDelete}
                    disabled={
                      !allowed || !issueDetails || issueDetails.state === "closed" || issueDetails.state === "archived"
                    }
                  />
                </div>
              );
          })}
          {allowed && (
            <li>
              <div className="my-4">
                <AddComment
                  onSubmit={handleAddComment}
                  disabled={
                    !allowed || !issueDetails || issueDetails.state === "closed" || issueDetails.state === "archived"
                  }
                />
              </div>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};
