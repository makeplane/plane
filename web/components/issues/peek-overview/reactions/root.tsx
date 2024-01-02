import { FC } from "react";
// components
import { IssueReactionPreview, IssueReactionSelector } from "components/issues";
// types
import { IUser } from "@plane/types";

interface IIssueReaction {
  issueReactions: any;
  user: IUser | null;
  issueReactionCreate: (reaction: string) => void;
  issueReactionRemove: (reaction: string) => void;
  position?: "top" | "bottom";
}

export const IssuePeekOverviewReactions: FC<IIssueReaction> = (props) => {
  const { issueReactions, user, issueReactionCreate, issueReactionRemove, position = "bottom" } = props;

  const handleReaction = (reaction: string) => {
    const isReactionAvailable =
      issueReactions?.[reaction].find((_reaction: any) => _reaction.actor === user?.id) ?? false;

    if (isReactionAvailable) issueReactionRemove(reaction);
    else issueReactionCreate(reaction);
  };

  return (
    <div className="relative flex flex-wrap items-center gap-2">
      <IssueReactionSelector onSelect={handleReaction} position={position} />
      <IssueReactionPreview issueReactions={issueReactions} user={user} handleReaction={handleReaction} />
    </div>
  );
};
