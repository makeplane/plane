"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tooltip } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
import { queryParamGenerator } from "@/helpers/query-param-generator";
// hooks
import { useIssueDetails, useUser } from "@/hooks/store";
import useIsInIframe from "@/hooks/use-is-in-iframe";

type TIssueVotes = {
  anchor: string;
  issueIdFromProps?: string;
  size?: "md" | "sm";
};

export const IssueVotes: React.FC<TIssueVotes> = observer((props) => {
  const { anchor, issueIdFromProps, size = "md" } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState(false);
  // router
  const router = useRouter();
  const pathName = usePathname();
  const searchParams = useSearchParams();
  // query params
  const peekId = searchParams.get("peekId") || undefined;
  const board = searchParams.get("board") || undefined;
  const state = searchParams.get("state") || undefined;
  const priority = searchParams.get("priority") || undefined;
  const labels = searchParams.get("labels") || undefined;
  // store hooks
  const issueDetailsStore = useIssueDetails();
  const { data: user } = useUser();

  const isInIframe = useIsInIframe();

  const issueId = issueIdFromProps ?? issueDetailsStore.peekId;

  const votes = issueDetailsStore.details[issueId ?? ""]?.vote_items ?? [];

  const allUpVotes = votes.filter((vote) => vote.vote === 1);
  const allDownVotes = votes.filter((vote) => vote.vote === -1);

  const isUpVotedByUser = allUpVotes.some((vote) => vote.actor_details?.id === user?.id);
  const isDownVotedByUser = allDownVotes.some((vote) => vote.actor_details?.id === user?.id);

  const handleVote = async (e: any, voteValue: 1 | -1) => {
    if (!issueId) return;

    setIsSubmitting(true);

    const actionPerformed = votes?.find((vote) => vote.actor_details?.id === user?.id && vote.vote === voteValue);

    if (actionPerformed) await issueDetailsStore.removeIssueVote(anchor, issueId);
    else {
      await issueDetailsStore.addIssueVote(anchor, issueId, {
        vote: voteValue,
      });
    }

    setIsSubmitting(false);
  };

  const VOTES_LIMIT = 1000;

  // derived values
  const { queryParam } = queryParamGenerator({ peekId, board, state, priority, labels });
  const votingDimensions = size === "sm" ? "px-1 h-6 min-w-9" : "px-2 h-7";

  return (
    <div className="flex items-center gap-2">
      {/* upvote button 👇 */}
      <Tooltip
        tooltipContent={
          <div>
            {allUpVotes.length > 0 ? (
              <>
                {allUpVotes
                  .map((r) => r.actor_details?.display_name)
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
            if (isInIframe) return;
            if (user) handleVote(e, 1);
            else router.push(`/?next_path=${pathName}?${queryParam}`);
          }}
          className={cn(
            "flex items-center justify-center gap-x-1 overflow-hidden rounded border focus:outline-none bg-custom-background-100",
            votingDimensions,
            {
              "border-custom-primary-200 text-custom-primary-200": isUpVotedByUser,
              "border-custom-border-300": !isUpVotedByUser,
              "cursor-default": isInIframe,
            }
          )}
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
                  .map((r) => r.actor_details.display_name)
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
            if (isInIframe) return;
            if (user) handleVote(e, -1);
            else router.push(`/?next_path=${pathName}?${queryParam}`);
          }}
          className={cn(
            "flex items-center justify-center gap-x-1 overflow-hidden rounded border focus:outline-none bg-custom-background-100",
            votingDimensions,
            {
              "border-red-600 text-red-600": isDownVotedByUser,
              "border-custom-border-300": !isDownVotedByUser,
              "cursor-default": isInIframe,
            }
          )}
        >
          <span className="material-symbols-rounded !m-0 !p-0 text-base">arrow_downward_alt</span>
          <span className="text-sm font-normal transition-opacity ease-in-out">{allDownVotes.length}</span>
        </button>
      </Tooltip>
    </div>
  );
});
