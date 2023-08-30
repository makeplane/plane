import { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// lib
import { useMobxStore } from "lib/mobx/store-provider";

export const IssueVotes: React.FC = observer(() => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  const { workspace_slug, project_slug } = router.query as { workspace_slug: string; project_slug: string };

  const { user: userStore, issue: issueStore } = useMobxStore();

  const user = userStore?.currentUser;
  const issueId = issueStore.activePeekOverviewIssueId;

  const votes = issueId ? issueStore.issue_detail[issueId]?.votes : [];

  const upVoteCount = votes?.filter((vote) => vote.vote === 1).length || 0;
  const downVoteCount = votes?.filter((vote) => vote.vote === -1).length || 0;

  const isUpVotedByUser = votes?.some((vote) => vote.actor === user?.id && vote.vote === 1);
  const isDownVotedByUser = votes?.some((vote) => vote.actor === user?.id && vote.vote === -1);

  const handleVote = async (e: any, voteValue: 1 | -1) => {
    if (!workspace_slug || !project_slug || !issueId) return;

    setIsSubmitting(true);

    const actionPerformed = votes?.find((vote) => vote.actor === user?.id && vote.vote === voteValue);

    if (actionPerformed) await issueStore.deleteIssueVoteAsync(workspace_slug, project_slug, issueId);
    else
      await issueStore.createIssueVoteAsync(workspace_slug, project_slug, issueId, {
        vote: voteValue,
      });

    setIsSubmitting(false);
  };

  useEffect(() => {
    if (user) return;

    userStore.getUserAsync();
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
        className={`flex items-center justify-center overflow-hidden px-2 py-1 gap-x-1 border rounded focus:outline-none ${
          isUpVotedByUser ? "border-custom-primary-200 text-custom-primary-200" : "border-custom-border-300"
        }`}
      >
        <svg className="w-2.5" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M3.44122 2.35988L0.952108 4.84898C0.848405 4.95268 0.718049 5.00574 0.561041 5.00815C0.404044 5.01054 0.271292 4.95749 0.162783 4.84898C0.0542613 4.74047 0 4.60891 0 4.45431C0 4.2997 0.0542613 4.16814 0.162783 4.05963L3.52908 0.693333C3.66448 0.557934 3.82245 0.490234 4.00297 0.490234C4.1835 0.490234 4.34147 0.557934 4.47687 0.693333L7.84316 4.05963C7.94688 4.16335 7.99994 4.2937 8.00233 4.4507C8.00474 4.60771 7.95169 4.74047 7.84316 4.84898C7.73466 4.95749 7.6031 5.01174 7.4485 5.01174C7.2939 5.01174 7.16235 4.95749 7.05384 4.84898L4.56473 2.35988V8.94848C4.56473 9.10787 4.51095 9.24135 4.4034 9.34891C4.29586 9.45646 4.16238 9.51023 4.00297 9.51023C3.84357 9.51023 3.71009 9.45646 3.60254 9.34891C3.495 9.24135 3.44122 9.10787 3.44122 8.94848V2.35988Z"
            fill="currentColor"
          />
        </svg>
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
        className={`flex items-center justify-center overflow-hidden px-2 py-1 gap-x-1 border rounded focus:outline-none ${
          isDownVotedByUser ? "border-red-600 text-red-600" : "border-custom-border-300"
        }`}
      >
        <svg className="w-2.5" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4.55878 7.6406L7.04789 5.15151C7.15159 5.04781 7.28195 4.99475 7.43896 4.99234C7.59596 4.98994 7.72871 5.043 7.83722 5.15151C7.94574 5.26002 8 5.39157 8 5.54617C8 5.70079 7.94574 5.83235 7.83722 5.94085L4.47092 9.30715C4.33552 9.44255 4.17755 9.51025 3.99703 9.51025C3.8165 9.51025 3.65853 9.44255 3.52313 9.30715L0.156836 5.94085C0.0531201 5.83714 6.34193e-05 5.70678 -0.00233364 5.54979C-0.00474262 5.39278 0.0483136 5.26002 0.156836 5.15151C0.265345 5.043 0.396898 4.98875 0.551497 4.98875C0.706097 4.98875 0.837651 5.043 0.946161 5.15151L3.43527 7.6406L3.43527 1.05201C3.43527 0.892613 3.48905 0.759136 3.5966 0.651576C3.70414 0.544028 3.83762 0.490253 3.99703 0.490253C4.15643 0.490253 4.28991 0.544028 4.39746 0.651576C4.505 0.759136 4.55878 0.892613 4.55878 1.05201L4.55878 7.6406Z"
            fill="currentColor"
          />
        </svg>
        <span className="text-sm font-normal transition-opacity ease-in-out">{downVoteCount}</span>
      </button>
    </div>
  );
});
