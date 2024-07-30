"use client";

import { observer } from "mobx-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
// lib
import { Tooltip } from "@plane/ui";
import { ReactionSelector } from "@/components/ui";
// helpers
import { groupReactions, renderEmoji } from "@/helpers/emoji.helper";
import { queryParamGenerator } from "@/helpers/query-param-generator";
// hooks
import { useIssueDetails, useUser } from "@/hooks/store";

type IssueEmojiReactionsProps = {
  anchor: string;
  issueIdFromProps?: string;
  size?: "md" | "sm";
};

export const IssueEmojiReactions: React.FC<IssueEmojiReactionsProps> = observer((props) => {
  const { anchor, issueIdFromProps, size = "md" } = props;
  // router
  const router = useRouter();
  const pathName = usePathname();
  const searchParams = useSearchParams();
  // query params
  const peekId = searchParams.get("peekId") || undefined;
  const board = searchParams.get("board") || undefined;
  const state = searchParams.get("state") || undefined;
  const priority = searchParams.get("priority") || undefined;
  const labels = searchParams.get("labels") || undefined;
  // store hooks
  const issueDetailsStore = useIssueDetails();
  const { data: user } = useUser();

  const issueId = issueIdFromProps ?? issueDetailsStore.peekId;
  const reactions = issueDetailsStore.details[issueId ?? ""]?.reaction_items ?? [];
  const groupedReactions = groupReactions(reactions, "reaction");

  const userReactions = reactions.filter((r) => r.actor_details?.id === user?.id);

  const handleAddReaction = (reactionHex: string) => {
    if (!issueId) return;
    issueDetailsStore.addIssueReaction(anchor, issueId, reactionHex);
  };

  const handleRemoveReaction = (reactionHex: string) => {
    if (!issueId) return;
    issueDetailsStore.removeIssueReaction(anchor, issueId, reactionHex);
  };

  const handleReactionClick = (reactionHex: string) => {
    const userReaction = userReactions?.find((r) => r.actor_details?.id === user?.id && r.reaction === reactionHex);
    if (userReaction) handleRemoveReaction(reactionHex);
    else handleAddReaction(reactionHex);
  };

  // derived values
  const { queryParam } = queryParamGenerator({ peekId, board, state, priority, labels });
  const reactionDimensions = size === "sm" ? "h-6 px-2 py-1" : "h-full px-2 py-1";

  return (
    <>
      <ReactionSelector
        onSelect={(value) => {
          if (user) handleReactionClick(value);
          else router.push(`/?next_path=${pathName}?${queryParam}`);
        }}
        selected={userReactions?.map((r) => r.reaction)}
        size={size}
      />
      {Object.keys(groupedReactions || {}).map((reaction) => {
        const reactions = groupedReactions?.[reaction] ?? [];
        const REACTIONS_LIMIT = 1000;

        if (reactions.length > 0)
          return (
            <Tooltip
              key={reaction}
              tooltipContent={
                <div>
                  {reactions
                    ?.map((r) => r?.actor_details?.display_name)
                    ?.splice(0, REACTIONS_LIMIT)
                    ?.join(", ")}
                  {reactions.length > REACTIONS_LIMIT && " and " + (reactions.length - REACTIONS_LIMIT) + " more"}
                </div>
              }
            >
              <button
                type="button"
                onClick={() => {
                  if (user) handleReactionClick(reaction);
                  else router.push(`/?next_path=${pathName}?${queryParam}`);
                }}
                className={`flex items-center gap-1 rounded-md text-sm text-custom-text-100 ${
                  reactions.some((r) => r?.actor_details?.id === user?.id && r.reaction === reaction)
                    ? "bg-custom-primary-100/10"
                    : "bg-custom-background-80"
                } ${reactionDimensions}`}
              >
                <span>{renderEmoji(reaction)}</span>
                <span
                  className={
                    reactions.some((r) => r?.actor_details?.id === user?.id && r.reaction === reaction)
                      ? "text-custom-primary-100"
                      : ""
                  }
                >
                  {groupedReactions?.[reaction].length}{" "}
                </span>
              </button>
            </Tooltip>
          );
      })}
    </>
  );
});
