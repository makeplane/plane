import { IssueEmojiReactions, IssueVotes } from "components/issues/peek-overview";
import { useMobxStore } from "lib/mobx/store-provider";

export const IssueReactions: React.FC = () => {
  const { project: projectStore } = useMobxStore();

  return (
    <div className="mt-4 flex items-center gap-3">
      {projectStore?.deploySettings?.votes && (
        <>
          <div className="flex items-center gap-2">
            <IssueVotes />
          </div>
          <div className="h-8 w-0.5 bg-custom-background-200" />
        </>
      )}
      {projectStore?.deploySettings?.reactions && (
        <div className="flex items-center gap-2">
          <IssueEmojiReactions />
        </div>
      )}
    </div>
  );
};
