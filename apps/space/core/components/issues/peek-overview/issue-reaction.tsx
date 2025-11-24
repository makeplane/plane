import { observer } from "mobx-react";
// components
import { IssueEmojiReactions } from "@/components/issues/reactions/issue-emoji-reactions";
import { IssueVotes } from "@/components/issues/reactions/issue-vote-reactions";
// hooks
import { usePublish } from "@/hooks/store/publish";
import useIsInIframe from "@/hooks/use-is-in-iframe";

type Props = {
  anchor: string;
};

export const IssueReactions = observer(function IssueReactions(props: Props) {
  const { anchor } = props;
  // store hooks
  const { canVote, canReact } = usePublish(anchor);
  const isInIframe = useIsInIframe();

  return (
    <div className="mt-4 flex items-center gap-3">
      {canVote && (
        <div className="flex items-center gap-2">
          <IssueVotes anchor={anchor} />
        </div>
      )}
      {!isInIframe && canReact && (
        <div className="flex items-center gap-2">
          <IssueEmojiReactions anchor={anchor} />
        </div>
      )}
    </div>
  );
});
