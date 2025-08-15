"use client";

import { FC, useMemo } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { IUser } from "@plane/types";
import { TOAST_TYPE, Tooltip, setToast } from "@plane/ui";
import { cn, formatTextList } from "@plane/utils";
// components
import { ReactionSelector } from "@/components/issues/issue-detail/reactions";
// components
import { renderEmoji } from "@/helpers/emoji.helper";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProjectReactions } from "@/plane-web/hooks/store/projects/use-project-reactions";

export type TProjectReaction = {
  workspaceSlug: string;
  projectId: string;
  currentUser: IUser | undefined;
  disabled?: boolean;
};

export const ProjectReaction: FC<TProjectReaction> = observer((props) => {
  const { workspaceSlug, projectId, currentUser, disabled = false } = props;

  // hooks
  const {
    fetchProjectReactions,
    createProjectReaction,
    getProjectReactionsByProjectId,
    reactionsByUser,
    removeProjectReaction,
  } = useProjectReactions();
  const { getUserDetails } = useMember();

  const reactionIds = getProjectReactionsByProjectId(projectId);
  const userReactions = currentUser ? reactionsByUser(projectId, currentUser.id).map((r) => r.reaction) : [];

  // api calls
  useSWR(
    projectId && workspaceSlug ? `PROJECT_REACTIONS_${projectId}` : null,
    projectId && workspaceSlug ? () => fetchProjectReactions(workspaceSlug, projectId) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const projectReactionOperations = useMemo(
    () => ({
      create: async (reaction: string) => {
        try {
          if (!workspaceSlug || !projectId) {
            console.error("Missing required fields:", { workspaceSlug, projectId });
            throw new Error("Missing fields");
          }

          console.log("Creating reaction with:", { workspaceSlug, projectId, reaction });
          const response = await createProjectReaction(workspaceSlug, projectId, reaction);
          console.log("Reaction created successfully:", response);

          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Reaction created successfully",
          });
        } catch (error) {
          console.error("Error creating reaction:", error);
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Failed to create reaction",
          });
          throw error;
        }
      },
      remove: async (reaction: string) => {
        try {
          if (!workspaceSlug || !projectId || !currentUser) throw new Error("Missing fields");
          await removeProjectReaction(workspaceSlug, projectId, reaction, currentUser.id);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Reaction removed successfully",
          });
        } catch (error) {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Reaction removal failed",
          });
        }
      },
      react: (reaction: string) => {
        if (userReactions.includes(reaction)) projectReactionOperations.remove(reaction);
        else projectReactionOperations.create(reaction);
      },
    }),
    [workspaceSlug, projectId, currentUser, createProjectReaction, removeProjectReaction, userReactions]
  );

  const getReactionUsers = (reaction: string): string => {
    if (!reactionIds || typeof reactionIds !== "object" || !Array.isArray(reactionIds?.[reaction])) {
      return "";
    }

    const _users = reactionIds[reaction].map((r) => getUserDetails(r.actor)?.display_name);
    return formatTextList(_users as string[]);
  };

  return (
    <div className="relative flex items-center gap-1.5">
      {!disabled && (
        <ReactionSelector size="md" position="top" value={userReactions} onSelect={projectReactionOperations.react} />
      )}
      {reactionIds &&
        Object.keys(reactionIds).map((reaction) => {
          if (reactionIds[reaction].length === 0) return null;
          return (
            <Tooltip key={reaction} tooltipContent={getReactionUsers(reaction)}>
              <button
                type="button"
                onClick={() => !disabled && projectReactionOperations.react(reaction)}
                className={cn(
                  "flex items-center gap-1 rounded-md border-[0.5px] border-custom-border-200 px-2 py-1 text-xs h-7",
                  {
                    "cursor-not-allowed opacity-75": disabled,
                    "cursor-pointer hover:bg-custom-background-80": !disabled,
                    "bg-custom-primary-100/10 text-custom-primary-100": userReactions.includes(reaction),
                  }
                )}
              >
                {renderEmoji(reaction)}
                <span
                  className={cn("text-custom-text-100", {
                    "text-custom-primary-100": userReactions.includes(reaction),
                  })}
                >
                  {reactionIds[reaction].length}
                </span>
              </button>
            </Tooltip>
          );
        })}
    </div>
  );
});
