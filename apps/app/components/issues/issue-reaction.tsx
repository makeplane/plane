import { useRouter } from "next/router";

// hooks
import useUserAuth from "hooks/use-user-auth";
import useIssueReaction from "hooks/use-issue-reaction";
// components
import { ReactionSelector } from "components/core";
// string helpers
import { renderEmoji } from "helpers/emoji.helper";

export const IssueReaction: React.FC = () => {
  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { user } = useUserAuth();

  const { reactions, groupedReactions, handleReactionCreate, handleReactionDelete } =
    useIssueReaction(workspaceSlug, projectId, issueId);

  const handleReactionClick = (reaction: string) => {
    if (!workspaceSlug || !projectId || !issueId) return;

    const isSelected = reactions?.some((r) => r.actor === user?.id && r.reaction === reaction);

    if (isSelected) {
      handleReactionDelete(reaction);
    } else {
      handleReactionCreate(reaction);
    }
  };

  return (
    <div className="flex gap-1.5 items-center mt-4">
      <ReactionSelector
        size="md"
        position="top"
        value={
          reactions?.filter((reaction) => reaction.actor === user?.id).map((r) => r.reaction) || []
        }
        onSelect={handleReactionClick}
      />

      {Object.keys(groupedReactions || {}).map(
        (reaction) =>
          groupedReactions?.[reaction]?.length &&
          groupedReactions[reaction].length > 0 && (
            <button
              type="button"
              onClick={() => {
                handleReactionClick(reaction);
              }}
              key={reaction}
              className={`flex items-center gap-1 text-custom-text-100 h-full px-2 py-1 rounded-md ${
                reactions?.some((r) => r.actor === user?.id && r.reaction === reaction)
                  ? "bg-custom-primary-100/10"
                  : "bg-custom-background-80"
              }`}
            >
              <span>{groupedReactions?.[reaction].length} </span>
              <span>{renderEmoji(reaction)}</span>
            </button>
          )
      )}
    </div>
  );
};
