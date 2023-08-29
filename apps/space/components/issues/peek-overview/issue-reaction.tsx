"use client";

// ui
import { IssueEmojiReactions, IssueVotes } from "components/issues/peek-overview";

export const IssueReactions: React.FC = () => (
  <div className="flex gap-3 items-center mt-4">
    <div className="flex gap-2 items-center">
      <IssueVotes />
    </div>

    <div className="w-0.5 h-8 bg-custom-background-200" />

    <div className="flex gap-2 items-center">
      <IssueEmojiReactions />
    </div>
  </div>
);
