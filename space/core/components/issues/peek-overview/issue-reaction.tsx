import { observer } from "mobx-react";
import { IssueEmojiReactions, IssueVotes } from "@/components/issues/peek-overview";
// hooks
import { usePublish } from "@/hooks/store";
import useIsInIframe from "@/hooks/use-is-in-iframe";

type Props = {
  anchor: string;
};

export const IssueReactions: React.FC<Props> = observer((props) => {
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
