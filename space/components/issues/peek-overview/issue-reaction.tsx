import { useParams } from "next/navigation";
import { IssueEmojiReactions, IssueVotes } from "@/components/issues/peek-overview";
import { useProject } from "@/hooks/store";
import useIsInIframe from "@/hooks/use-is-in-iframe";

// type IssueReactionsProps = {
//   workspaceSlug: string;
//   projectId: string;
// };

export const IssueReactions: React.FC = () => {
  const { workspaceSlug, projectId } = useParams<any>();

  const { canVote, canReact } = useProject();
  const isInIframe = useIsInIframe();

  return (
    <div className="mt-4 flex items-center gap-3">
      {canVote && (
        <>
          <div className="flex items-center gap-2">
            <IssueVotes workspaceSlug={workspaceSlug} projectId={projectId} />
          </div>
        </>
      )}
      {!isInIframe && canReact && (
        <div className="flex items-center gap-2">
          <IssueEmojiReactions workspaceSlug={workspaceSlug} projectId={projectId} />
        </div>
      )}
    </div>
  );
};
