import { useEffect } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// lib
import { useMobxStore } from "lib/mobx/store-provider";
// helpers
import { groupReactions, renderEmoji } from "helpers/emoji.helper";
// components
import { ReactionSelector } from "components/ui";

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

  const handleReactionSelectClick = (reactionHex: string) => {
    if (!workspace_slug || !project_slug || !issueId) return;
    const userReaction = reactions?.find((r) => r.actor_detail.id === user?.id && r.reaction === reactionHex);
    if (userReaction) return;
    issueDetailsStore.addIssueReaction(workspace_slug.toString(), project_slug.toString(), issueId, {
      reaction: reactionHex,
    });
  };

  const handleReactionClick = (reactionHex: string) => {
    if (!workspace_slug || !project_slug || !issueId) return;
    issueDetailsStore.removeIssueReaction(workspace_slug.toString(), project_slug.toString(), issueId, reactionHex);
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
            handleReactionSelectClick(value);
          });
        }}
      />

      {Object.keys(groupedReactions || {}).map(
        (reaction) =>
          groupedReactions?.[reaction]?.length &&
          groupedReactions[reaction].length > 0 && (
            <button
              type="button"
              onClick={() => {
                userStore.requiredLogin(() => {
                  handleReactionClick(reaction);
                });
              }}
              key={reaction}
              className={`flex items-center gap-1 text-custom-text-100 text-sm h-full px-2 py-1 rounded-md border ${
                reactions?.some((r) => r?.actor_detail?.id === user?.id && r.reaction === reaction)
                  ? "bg-custom-primary-100/10 border-custom-primary-100"
                  : "bg-custom-background-80 border-transparent"
              }`}
            >
              <span>{renderEmoji(reaction)}</span>
              <span
                className={
                  reactions?.some((r) => r?.actor_detail?.id === user?.id && r.reaction === reaction)
                    ? "text-custom-primary-100"
                    : ""
                }
              >
                {groupedReactions?.[reaction].length}{" "}
              </span>
            </button>
          )
      )}
    </>
  );
});
