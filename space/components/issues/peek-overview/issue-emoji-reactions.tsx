import { useEffect } from "react";
import { observer } from "mobx-react-lite";
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
  workspaceSlug: string;
  projectId: string;
};

export const IssueEmojiReactions: React.FC<IssueEmojiReactionsProps> = observer((props) => {
  const router = useRouter();
  const pathName = usePathname();
  const searchParams = useSearchParams();
  // query params
  const peekId = searchParams.get("peekId") || undefined;
  const board = searchParams.get("board") || undefined;
  const state = searchParams.get("state") || undefined;
  const priority = searchParams.get("priority") || undefined;
  const labels = searchParams.get("labels") || undefined;

  const { workspaceSlug, projectId } = props;
  // store
  const issueDetailsStore = useIssueDetails();
  const { data: user, fetchCurrentUser } = useUser();

  const issueId = issueDetailsStore.peekId;
  const reactions = issueId ? issueDetailsStore.details[issueId]?.reactions || [] : [];
  const groupedReactions = groupReactions(reactions, "reaction");

  const userReactions = reactions?.filter((r) => r.actor_detail.id === user?.id);

  const handleAddReaction = (reactionHex: string) => {
    if (!workspaceSlug || !projectId || !issueId) return;
    issueDetailsStore.addIssueReaction(workspaceSlug.toString(), projectId.toString(), issueId, reactionHex);
  };

  const handleRemoveReaction = (reactionHex: string) => {
    if (!workspaceSlug || !projectId || !issueId) return;
    issueDetailsStore.removeIssueReaction(workspaceSlug.toString(), projectId.toString(), issueId, reactionHex);
  };

  const handleReactionClick = (reactionHex: string) => {
    const userReaction = userReactions?.find((r) => r.actor_detail.id === user?.id && r.reaction === reactionHex);
    if (userReaction) handleRemoveReaction(reactionHex);
    else handleAddReaction(reactionHex);
  };

  useEffect(() => {
    if (user) return;
    fetchCurrentUser();
  }, [user, fetchCurrentUser]);

  // derived values
  const { queryParam } = queryParamGenerator({ peekId, board, state, priority, labels });

  return (
    <>
      <ReactionSelector
        onSelect={(value) => {
          if (user) handleReactionClick(value);
          else router.push(`/?next_path=${pathName}?${queryParam}`);
        }}
        selected={userReactions?.map((r) => r.reaction)}
        size="md"
      />
      <div className="flex flex-wrap items-center gap-2">
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
                      .map((r) => r.actor_detail.display_name)
                      .splice(0, REACTIONS_LIMIT)
                      .join(", ")}
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
                  className={`flex h-full items-center gap-1 rounded-md px-2 py-1 text-sm text-custom-text-100 ${
                    reactions?.some((r) => r.actor_detail.id === user?.id && r.reaction === reaction)
                      ? "bg-custom-primary-100/10"
                      : "bg-custom-background-80"
                  }`}
                >
                  <span>{renderEmoji(reaction)}</span>
                  <span
                    className={
                      reactions?.some((r) => r.actor_detail.id === user?.id && r.reaction === reaction)
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
      </div>
    </>
  );
});
