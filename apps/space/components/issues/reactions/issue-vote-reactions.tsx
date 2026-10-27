/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { ArrowDownOutline, TopArrowOutline } from "@makeplane/propel/icons";
import { observer } from "mobx-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
// plane imports
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { Icon } from "@makeplane/propel/components/icon";
import { Toggle, ToggleLabel } from "@makeplane/propel/elements/toggle";
import { useTranslation } from "@plane/i18n";
// helpers
import { queryParamGenerator } from "@/helpers/query-param-generator";
// hooks
import { useIssueDetails } from "@/hooks/store/use-issue-details";
import { useUser } from "@/hooks/store/use-user";
import useIsInIframe from "@/hooks/use-is-in-iframe";

type TIssueVotes = {
  anchor: string;
  issueIdFromProps?: string;
  size?: "md" | "sm";
};

export const IssueVotes = observer(function IssueVotes(props: TIssueVotes) {
  const { anchor, issueIdFromProps, size = "md" } = props;
  const { t } = useTranslation();
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

  return (
    <div className="flex items-center gap-2">
      {/* upvote button 👇 */}
      <Tooltip
        label={
          allUpVotes.length > 0
            ? allUpVotes
                .map((r) => r.actor_details?.display_name)
                .slice(0, VOTES_LIMIT)
                .join(", ") + (allUpVotes.length > VOTES_LIMIT ? ` and ${allUpVotes.length - VOTES_LIMIT} more` : "")
            : "No upvotes yet"
        }
      >
        <Toggle
          type="button"
          size={size === "sm" ? "xs" : "sm"}
          aria-label={`${t("issue.vote.click_to_upvote")}, ${allUpVotes.length}`}
          aria-pressed={isUpVotedByUser}
          data-pressed={isUpVotedByUser ? "" : undefined}
          disabled={isSubmitting}
          onClick={(e) => {
            if (isInIframe) return;
            if (user) handleVote(e, 1);
            else router.push(`/?next_path=${pathName}?${queryParam}`);
          }}
        >
          <Icon icon={<TopArrowOutline />} />
          <ToggleLabel>{allUpVotes.length}</ToggleLabel>
        </Toggle>
      </Tooltip>

      {/* downvote button 👇 */}
      <Tooltip
        label={
          allDownVotes.length > 0
            ? allDownVotes
                .map((r) => r.actor_details.display_name)
                .slice(0, VOTES_LIMIT)
                .join(", ") +
              (allDownVotes.length > VOTES_LIMIT ? ` and ${allDownVotes.length - VOTES_LIMIT} more` : "")
            : "No downvotes yet"
        }
      >
        <Toggle
          type="button"
          size={size === "sm" ? "xs" : "sm"}
          aria-label={`${t("issue.vote.click_to_downvote")}, ${allDownVotes.length}`}
          aria-pressed={isDownVotedByUser}
          data-pressed={isDownVotedByUser ? "" : undefined}
          disabled={isSubmitting}
          onClick={(e) => {
            if (isInIframe) return;
            if (user) handleVote(e, -1);
            else router.push(`/?next_path=${pathName}?${queryParam}`);
          }}
        >
          <Icon icon={<ArrowDownOutline />} />
          <ToggleLabel>{allDownVotes.length}</ToggleLabel>
        </Toggle>
      </Tooltip>
    </div>
  );
});
