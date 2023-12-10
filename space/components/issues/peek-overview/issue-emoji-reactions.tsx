import { useEffect } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// lib
import { useMobxStore } from "lib/mobx/store-provider";
// helpers
import { groupReactions, renderEmoji } from "helpers/emoji.helper";
// components
import { ReactionSelector } from "components/ui";
import { Tooltip } from "@plane/ui";

export const IssueEmojiReactions: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspace_slug, project_slug } = router.query;
  // store
  const { user: userStore, issueDetails: issueDetailsStore } = useMobxStore();

  const user = userStore?.currentUser;
  const issueId = issueDetailsStore.peekId;
  const reactions = issueId ? issueDetailsStore.details[issueId]?.reactions || [] : [];
  const groupedReactions = groupReactions(reactions, "reaction");

  const userReactions = reactions?.filter((r) => r.actor_detail.id === user?.id);

  const handleAddReaction = (reactionHex: string) => {
    if (!workspace_slug || !project_slug || !issueId) return;

    issueDetailsStore.addIssueReaction(workspace_slug.toString(), project_slug.toString(), issueId, reactionHex);
  };

  const handleRemoveReaction = (reactionHex: string) => {
    if (!workspace_slug || !project_slug || !issueId) return;

    issueDetailsStore.removeIssueReaction(workspace_slug.toString(), project_slug.toString(), issueId, reactionHex);
  };

  const handleReactionClick = (reactionHex: string) => {
    const userReaction = userReactions?.find((r) => r.actor_detail.id === user?.id && r.reaction === reactionHex);

    if (userReaction) handleRemoveReaction(reactionHex);
    else handleAddReaction(reactionHex);
  };

  useEffect(() => {
    if (user) return;
    userStore.fetchCurrentUser();
  }, [user, userStore]);

  return (
    <>
      <ReactionSelector
        onSelect={(value) => {
          userStore.requiredLogin(() => {
            handleReactionClick(value);
          });
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
                    userStore.requiredLogin(() => {
                      handleReactionClick(reaction);
                    });
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
