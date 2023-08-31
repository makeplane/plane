import { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// lib
import { useMobxStore } from "lib/mobx/store-provider";

export const IssueVotes: React.FC = observer(() => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  const { workspace_slug, project_slug } = router.query as { workspace_slug: string; project_slug: string };

  const { user: userStore, issueDetails: issueDetailsStore } = useMobxStore();

  const user = userStore?.currentUser;
  const issueId = issueDetailsStore.peekId;

  const votes = issueId ? issueDetailsStore.details[issueId]?.votes : [];

  const upVoteCount = votes?.filter((vote) => vote.vote === 1).length || 0;
  const downVoteCount = votes?.filter((vote) => vote.vote === -1).length || 0;

  const isUpVotedByUser = votes?.some((vote) => vote.actor === user?.id && vote.vote === 1);
  const isDownVotedByUser = votes?.some((vote) => vote.actor === user?.id && vote.vote === -1);

  const handleVote = async (e: any, voteValue: 1 | -1) => {
    if (!workspace_slug || !project_slug || !issueId) return;

    setIsSubmitting(true);

    const actionPerformed = votes?.find((vote) => vote.actor === user?.id && vote.vote === voteValue);

    if (actionPerformed) await issueDetailsStore.removeIssueVote(workspace_slug, project_slug, issueId);
    else
      await issueDetailsStore.addIssueVote(workspace_slug, project_slug, issueId, {
        vote: voteValue,
      });

    setIsSubmitting(false);
  };

  useEffect(() => {
    if (user) return;

    userStore.fetchCurrentUser();
  }, [user, userStore]);

  return (
    <div className="flex gap-2 items-center">
      {/* upvote button 👇 */}
      <button
        type="button"
        disabled={isSubmitting}
        onClick={(e) => {
          userStore.requiredLogin(() => {
            handleVote(e, 1);
          });
        }}
        className={`flex items-center justify-center overflow-hidden px-2 gap-x-1 border rounded focus:outline-none ${
          isUpVotedByUser ? "border-custom-primary-200 text-custom-primary-200" : "border-custom-border-300"
        }`}
      >
        <span className="material-symbols-rounded text-base !p-0 !m-0 text-custom-text-300">arrow_upward_alt</span>
        <span className="text-sm font-normal transition-opacity ease-in-out">{upVoteCount}</span>
      </button>

      {/* downvote button 👇 */}
      <button
        type="button"
        disabled={isSubmitting}
        onClick={(e) => {
          userStore.requiredLogin(() => {
            handleVote(e, -1);
          });
        }}
        className={`flex items-center justify-center overflow-hidden px-2 gap-x-1 border rounded focus:outline-none ${
          isDownVotedByUser ? "border-red-600 text-red-600" : "border-custom-border-300"
        }`}
      >
        <span className="material-symbols-rounded text-base !p-0 !m-0 rotate-180 text-custom-text-300">
          arrow_upward_alt
        </span>
        <span className="text-sm font-normal transition-opacity ease-in-out">{downVoteCount}</span>
      </button>
    </div>
  );
});
