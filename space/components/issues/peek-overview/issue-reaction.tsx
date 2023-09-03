import { IssueEmojiReactions, IssueVotes } from "components/issues/peek-overview";
import { useMobxStore } from "lib/mobx/store-provider";

export const IssueReactions: React.FC = () => {
  const { project: projectStore } = useMobxStore();

  return (
    <div className="flex gap-3 items-center mt-4">
      {projectStore?.deploySettings?.votes && (
        <>
          <div className="flex gap-2 items-center">
            <IssueVotes />
          </div>
          <div className="w-0.5 h-8 bg-custom-background-200" />
        </>
      )}
      {projectStore?.deploySettings?.reactions && (
        <div className="flex gap-2 items-center">
          <IssueEmojiReactions />
        </div>
      )}
    </div>
  );
};
