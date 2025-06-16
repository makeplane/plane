"use client";

import { FC, useMemo } from "react";
import { observer } from "mobx-react";
import { IUser } from "@plane/types";
// hooks
// ui
import { TOAST_TYPE, Tooltip, setToast } from "@plane/ui";
import { cn, formatTextList } from "@plane/utils";
// helpers
import { renderEmoji } from "@/helpers/emoji.helper";
import { useIssueDetail, useMember } from "@/hooks/store";
// types
import { ReactionSelector } from "./reaction-selector";

export type TIssueReaction = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  currentUser: IUser;
  disabled?: boolean;
  className?: string;
};

export const IssueReaction: FC<TIssueReaction> = observer((props) => {
  const { workspaceSlug, projectId, issueId, currentUser, disabled = false, className = "" } = props;
  // hooks
  const {
    reaction: { getReactionsByIssueId, reactionsByUser, getReactionById },
    createReaction,
    removeReaction,
  } = useIssueDetail();
  const { getUserDetails } = useMember();

  const reactionIds = getReactionsByIssueId(issueId);
  const userReactions = reactionsByUser(issueId, currentUser.id).map((r) => r.reaction);

  const issueReactionOperations = useMemo(
    () => ({
      create: async (reaction: string) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing fields");
          await createReaction(workspaceSlug, projectId, issueId, reaction);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Reaction created successfully",
          });
        } catch (error) {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Reaction creation failed",
          });
        }
      },
      remove: async (reaction: string) => {
        try {
          if (!workspaceSlug || !projectId || !issueId || !currentUser?.id) throw new Error("Missing fields");
          await removeReaction(workspaceSlug, projectId, issueId, reaction, currentUser.id);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Reaction removed successfully",
          });
        } catch (error) {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Reaction remove failed",
          });
        }
      },
      react: async (reaction: string) => {
        if (userReactions.includes(reaction)) await issueReactionOperations.remove(reaction);
        else await issueReactionOperations.create(reaction);
      },
    }),
    [workspaceSlug, projectId, issueId, currentUser, createReaction, removeReaction, userReactions]
  );

  const getReactionUsers = (reaction: string): string => {
    const reactionUsers = (reactionIds?.[reaction] || [])
      .map((reactionId) => {
        const reactionDetails = getReactionById(reactionId);
        return reactionDetails ? getUserDetails(reactionDetails.actor)?.display_name : null;
      })
      .filter((displayName): displayName is string => !!displayName);

    const formattedUsers = formatTextList(reactionUsers);
    return formattedUsers;
  };

  return (
    <div className={cn("relative mt-4 flex items-center gap-1.5", className)}>
      {!disabled && (
        <ReactionSelector size="md" position="top" value={userReactions} onSelect={issueReactionOperations.react} />
      )}
      {reactionIds &&
        Object.keys(reactionIds || {}).map(
          (reaction) =>
            reactionIds[reaction]?.length > 0 && (
              <>
                <Tooltip tooltipContent={getReactionUsers(reaction)}>
                  <button
                    type="button"
                    onClick={() => !disabled && issueReactionOperations.react(reaction)}
                    key={reaction}
                    className={cn(
                      "flex h-full items-center gap-1 rounded-md px-2 py-1 text-sm text-custom-text-100",
                      userReactions.includes(reaction) ? "bg-custom-primary-100/10" : "bg-custom-background-80",
                      {
                        "cursor-not-allowed": disabled,
                      }
                    )}
                  >
                    <span>{renderEmoji(reaction)}</span>
                    <span className={userReactions.includes(reaction) ? "text-custom-primary-100" : ""}>
                      {(reactionIds || {})[reaction].length}{" "}
                    </span>
                  </button>
                </Tooltip>
              </>
            )
        )}
    </div>
  );
});
