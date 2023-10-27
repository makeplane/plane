import { FC } from "react";
// helpers
import { renderEmoji } from "helpers/emoji.helper";

interface IIssueReactionPreview {
  issueReactions: any;
  user: any;
  handleReaction: (reaction: string) => void;
}

export const IssueReactionPreview: FC<IIssueReactionPreview> = (props) => {
  const { issueReactions, user, handleReaction } = props;

  const isUserReacted = (reactions: any) => {
    const userReaction = reactions?.find((reaction: any) => reaction.actor === user?.id);
    if (userReaction) return true;
    return false;
  };

  return (
    <div className="flex items-center gap-2">
      {Object.keys(issueReactions || {}).map(
        (reaction) =>
          issueReactions[reaction]?.length > 0 && (
            <button
              type="button"
              onClick={() => handleReaction(reaction)}
              key={reaction}
              className={`flex items-center gap-1.5 text-custom-text-100 text-sm h-full px-2 py-1 rounded-md ${
                isUserReacted(issueReactions[reaction])
                  ? `bg-custom-primary-100/20 hover:bg-custom-primary-100/30`
                  : `bg-custom-background-90 hover:bg-custom-background-100/30`
              }`}
            >
              <span>{renderEmoji(reaction)}</span>
              <span
                className={`${
                  isUserReacted(issueReactions[reaction]) ? `text-custom-primary-100 hover:text-custom-primary-200` : ``
                }`}
              >
                {issueReactions[reaction].length}
              </span>
            </button>
          )
      )}
    </div>
  );
};
