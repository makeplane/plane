import { useState, useEffect } from "react";

import { useRouter } from "next/router";

// mobx
import { observer } from "mobx-react-lite";
// lib
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { Tooltip } from "@plane/ui";

export const IssueVotes: React.FC = observer(() => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  const { workspace_slug, project_slug } = router.query;

  const { user: userStore, issueDetails: issueDetailsStore } = useMobxStore();

  const user = userStore?.currentUser;
  const issueId = issueDetailsStore.peekId;

  const votes = issueId ? issueDetailsStore.details[issueId]?.votes : [];

  const allUpVotes = votes?.filter((vote) => vote.vote === 1);
  const allDownVotes = votes?.filter((vote) => vote.vote === -1);

  const isUpVotedByUser = allUpVotes?.some((vote) => vote.actor === user?.id);
  const isDownVotedByUser = allDownVotes?.some((vote) => vote.actor === user?.id);

  const handleVote = async (e: any, voteValue: 1 | -1) => {
    if (!workspace_slug || !project_slug || !issueId) return;

    setIsSubmitting(true);

    const actionPerformed = votes?.find((vote) => vote.actor === user?.id && vote.vote === voteValue);

    if (actionPerformed)
      await issueDetailsStore.removeIssueVote(workspace_slug.toString(), project_slug.toString(), issueId);
    else
      await issueDetailsStore.addIssueVote(workspace_slug.toString(), project_slug.toString(), issueId, {
        vote: voteValue,
      });

    setIsSubmitting(false);
  };

  useEffect(() => {
    if (user) return;

    userStore.fetchCurrentUser();
  }, [user, userStore]);

  const VOTES_LIMIT = 1000;

  return (
    <div className="flex items-center gap-2">
      {/* upvote button 👇 */}
      <Tooltip
        tooltipContent={
          <div>
            {allUpVotes.length > 0 ? (
              <>
                {allUpVotes
                  .map((r) => r.actor_detail.display_name)
                  .splice(0, VOTES_LIMIT)
                  .join(", ")}
                {allUpVotes.length > VOTES_LIMIT && " and " + (allUpVotes.length - VOTES_LIMIT) + " more"}
              </>
            ) : (
              "No upvotes yet"
            )}
          </div>
        }
      >
        <button
          type="button"
          disabled={isSubmitting}
          onClick={(e) => {
            userStore.requiredLogin(() => {
              handleVote(e, 1);
            });
          }}
          className={`flex items-center justify-center gap-x-1 overflow-hidden rounded border px-2 focus:outline-none ${
            isUpVotedByUser ? "border-custom-primary-200 text-custom-primary-200" : "border-custom-border-300"
          }`}
        >
          <span className="material-symbols-rounded !m-0 !p-0 text-base">arrow_upward_alt</span>
          <span className="text-sm font-normal transition-opacity ease-in-out">{allUpVotes.length}</span>
        </button>
      </Tooltip>

      {/* downvote button 👇 */}
      <Tooltip
        tooltipContent={
          <div>
            {allDownVotes.length > 0 ? (
              <>
                {allDownVotes
                  .map((r) => r.actor_detail.display_name)
                  .splice(0, VOTES_LIMIT)
                  .join(", ")}
                {allDownVotes.length > VOTES_LIMIT && " and " + (allDownVotes.length - VOTES_LIMIT) + " more"}
              </>
            ) : (
              "No downvotes yet"
            )}
          </div>
        }
      >
        <button
          type="button"
          disabled={isSubmitting}
          onClick={(e) => {
            userStore.requiredLogin(() => {
              handleVote(e, -1);
            });
          }}
          className={`flex items-center justify-center gap-x-1 overflow-hidden rounded border px-2 focus:outline-none ${
            isDownVotedByUser ? "border-red-600 text-red-600" : "border-custom-border-300"
          }`}
        >
          <span className="material-symbols-rounded !m-0 !p-0 text-base">arrow_downward_alt</span>
          <span className="text-sm font-normal transition-opacity ease-in-out">{allDownVotes.length}</span>
        </button>
      </Tooltip>
    </div>
  );
});
