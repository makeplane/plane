import { observer } from "mobx-react-lite";
// hooks
import { useUser } from "hooks/store";
import useIssueReaction from "hooks/use-issue-reaction";
// components
import { ReactionSelector } from "components/core";
// string helpers
import { renderEmoji } from "helpers/emoji.helper";

// types
type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
};

export const IssueReaction: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId } = props;

  const { currentUser } = useUser();

  const { reactions, groupedReactions, handleReactionCreate, handleReactionDelete } = useIssueReaction(
    workspaceSlug,
    projectId,
    issueId
  );

  const handleReactionClick = (reaction: string) => {
    if (!workspaceSlug || !projectId || !issueId) return;

    const isSelected = reactions?.some((r) => r.actor === currentUser?.id && r.reaction === reaction);

    if (isSelected) {
      handleReactionDelete(reaction);
    } else {
      handleReactionCreate(reaction);
    }
  };

  return (
    <div className="mt-4 flex items-center gap-1.5">
      <ReactionSelector
        size="md"
        position="top"
        value={reactions?.filter((reaction) => reaction.actor === currentUser?.id).map((r) => r.reaction) || []}
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
              className={`flex h-full items-center gap-1 rounded-md px-2 py-1 text-sm text-custom-text-100 ${
                reactions?.some((r) => r.actor === currentUser?.id && r.reaction === reaction)
                  ? "bg-custom-primary-100/10"
                  : "bg-custom-background-80"
              }`}
            >
              <span>{renderEmoji(reaction)}</span>
              <span
                className={
                  reactions?.some((r) => r.actor === currentUser?.id && r.reaction === reaction)
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
});
