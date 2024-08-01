import { observer } from "mobx-react";
import { useParams } from "next/navigation";
//plane
import { cn } from "@plane/editor";
// components
import { IssueEmojiReactions, IssueVotes } from "@/components/issues/reactions";
// hooks
import { usePublish } from "@/hooks/store";

type Props = {
  issueId: string;
};
export const BlockReactions = observer((props: Props) => {
  const { issueId } = props;
  const { anchor } = useParams();
  const { canVote, canReact } = usePublish(anchor.toString());

  // if the user cannot vote or react then return empty
  if (!canVote && !canReact) return <></>;

  return (
    <div
      className={cn(
        "flex flex-wrap border-t-[1px] outline-transparent w-full border-t-custom-border-200 bg-custom-background-90 rounded-b"
      )}
    >
      <div className="py-2 px-3 flex flex-wrap items-center gap-2">
        {canVote && (
          <div
            className={cn(`flex items-center gap-2 pr-1`, {
              "after:h-6 after:ml-1 after:w-[1px] after:bg-custom-border-200": canReact,
            })}
          >
            <IssueVotes anchor={anchor.toString()} issueIdFromProps={issueId} size="sm" />
          </div>
        )}
        {canReact && (
          <div className="flex flex-wrap items-center gap-2">
            <IssueEmojiReactions anchor={anchor.toString()} issueIdFromProps={issueId} size="sm" />
          </div>
        )}
      </div>
    </div>
  );
});
