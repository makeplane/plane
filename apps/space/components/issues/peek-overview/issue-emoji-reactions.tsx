"use client";

// react
import { useEffect } from "react";

// next
import { useParams } from "next/navigation";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";

// helpers
import { groupReactions, renderEmoji } from "helpers/emoji.helper";

// ui
import { ReactionSelector } from "components/ui";

export const IssueEmojiReactions: React.FC = observer(() => {
  const routerParams = useParams();

  const { workspace_slug, project_slug } = routerParams as { workspace_slug: string; project_slug: string };

  const { user: userStore, issue: issueStore } = useMobxStore();

  const user = userStore?.currentUser;
  const issueId = issueStore.activePeekOverviewIssueId;

  const reactions = issueId ? issueStore.issue_detail[issueId]?.reactions || [] : [];
  const groupedReactions = groupReactions(reactions, "reaction");

  const handleReactionClick = (reactionHexa: string) => {
    if (!workspace_slug || !project_slug || !issueId) return;

    const userReaction = reactions?.find((r) => r.created_by === user?.id && r.reaction === reactionHexa);

    if (userReaction)
      issueStore.deleteIssueReactionAsync(workspace_slug, userReaction.project, userReaction.issue, reactionHexa);
    else
      issueStore.createIssueReactionAsync(workspace_slug, project_slug, issueId, {
        reaction: reactionHexa,
      });
  };

  useEffect(() => {
    if (user) return;

    userStore.getUserAsync();
  }, [user, userStore]);

  return (
    <>
      <ReactionSelector
        onSelect={(value) => {
          userStore.requiredLogin(() => {
            handleReactionClick(value);
          });
        }}
      />

      {Object.keys(groupedReactions || {}).map(
        (reaction) =>
          groupedReactions?.[reaction]?.length &&
          groupedReactions[reaction].length > 0 && (
            <button
              type="button"
              onClick={() => {
                userStore.requiredLogin(() => {
                  handleReactionClick(reaction);
                });
              }}
              key={reaction}
              className={`flex items-center gap-1 text-custom-text-100 text-sm h-full px-2 py-1 rounded-md border ${
                reactions?.some((r) => r.actor === user?.id && r.reaction === reaction)
                  ? "bg-custom-primary-100/10 border-custom-primary-100"
                  : "bg-custom-background-80 border-transparent"
              }`}
            >
              <span>{renderEmoji(reaction)}</span>
              <span
                className={
                  reactions?.some((r) => r.actor === user?.id && r.reaction === reaction)
                    ? "text-custom-primary-100"
                    : ""
                }
              >
                {groupedReactions?.[reaction].length}{" "}
              </span>
            </button>
          )
      )}
    </>
  );
});
