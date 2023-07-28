// hooks
import useUserAuth from "hooks/use-user-auth";
import useIssueReaction from "hooks/use-issue-reaction";
// components
import { ReactionSelector } from "components/core";
// string helpers
import { renderEmoji } from "helpers/emoji.helper";

// types
type Props = {
  workspaceSlug?: string | string[];
  projectId?: string | string[];
  issueId?: string | string[];
};

export const IssueReaction: React.FC<Props> = (props) => {
  const { workspaceSlug, projectId, issueId } = props;

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
              <span>{renderEmoji(reaction)}</span>
              <span
                className={
                  reactions?.some((r) => r.actor === user?.id && r.reaction === reaction)
                    ? "text-custom-primary-100"
                    : ""
                }
              >
                {groupedReactions?.[reaction].length}{" "}
              </span>
            </button>
          )
      )}
    </div>
  );
};
