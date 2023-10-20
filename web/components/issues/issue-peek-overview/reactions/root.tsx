import { FC } from "react";
// components
import { IssueReactionPreview, IssueReactionSelector } from "./";

interface IIssueReaction {
  issueReactions: any;
  user: any;
  issueReactionCreate: (reaction: string) => void;
  issueReactionRemove: (reaction: string) => void;
}

export const IssueReaction: FC<IIssueReaction> = (props) => {
  const { issueReactions, user, issueReactionCreate, issueReactionRemove } = props;

  const handleReaction = (reaction: string) => {
    const isReactionAvailable =
      issueReactions[reaction].find((_reaction: any) => _reaction.actor === user?.id) ?? false;

    if (isReactionAvailable) issueReactionRemove(reaction);
    else issueReactionCreate(reaction);
  };

  return (
    <div className="relative flex items-center flex-wrap gap-2">
      <IssueReactionSelector onSelect={handleReaction} position="bottom" />
      <IssueReactionPreview issueReactions={issueReactions} user={user} handleReaction={handleReaction} />
    </div>
  );
};
