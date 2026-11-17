/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
// plane imports
import { EntityDetailVotes, EntityDetailVotesModal } from "@plane/blocks/entity-detail";
import type { TEntityDetailVoteType, TEntityDetailVoter } from "@plane/blocks/entity-detail";
import { useTranslation } from "@plane/i18n";
import { getFileURL } from "@plane/utils";
// helpers
import { queryParamGenerator } from "@/helpers/query-param-generator";
// hooks
import { useIssueDetails } from "@/hooks/store/use-issue-details";
import { useUser } from "@/hooks/store/use-user";
import useIsInIframe from "@/hooks/use-is-in-iframe";
// types
import type { IVote } from "@/types/issue";

type TIssueVotes = {
  anchor: string;
  issueIdFromProps?: string;
};

const toVoters = (votes: IVote[]): TEntityDetailVoter[] =>
  votes.map((vote) => ({
    id: vote.actor_details?.id ?? "",
    displayName: vote.actor_details?.display_name ?? "",
    avatarUrl: getFileURL(vote.actor_details?.avatar_url ?? ""),
  }));

export const IssueVotes = observer(function IssueVotes(props: TIssueVotes) {
  const { anchor, issueIdFromProps } = props;
  const { t } = useTranslation();
  // states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votersModalTab, setVotersModalTab] = useState<TEntityDetailVoteType | null>(null);
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

  // derived values
  const { queryParam } = queryParamGenerator({ peekId, board, state, priority, labels });

  const handleVote = async (voteValue: 1 | -1) => {
    if (isInIframe) return;
    if (!user) {
      router.push(`/?next_path=${pathName}?${queryParam}`);
      return;
    }
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

  return (
    <>
      <EntityDetailVotes
        upVotesCount={allUpVotes.length}
        downVotesCount={allDownVotes.length}
        isUpVotedByUser={isUpVotedByUser}
        isDownVotedByUser={isDownVotedByUser}
        onUpVote={() => void handleVote(1)}
        onDownVote={() => void handleVote(-1)}
        onCountClick={setVotersModalTab}
        disabled={isSubmitting}
        upVoteLabel={t("issue.vote.click_to_upvote")}
        downVoteLabel={t("issue.vote.click_to_downvote")}
        viewUpVotesLabel={t("issue.vote.click_to_view_upvotes")}
        viewDownVotesLabel={t("issue.vote.click_to_view_downvotes")}
      />
      {/* Mounted only while open, since every board card renders its own votes. */}
      {votersModalTab !== null && (
        <EntityDetailVotesModal
          isOpen
          onClose={() => setVotersModalTab(null)}
          initialTab={votersModalTab}
          upVoters={toVoters(allUpVotes)}
          downVoters={toVoters(allDownVotes)}
          title={t("issue.vote.title")}
          upVotesTabLabel={t("issue.vote.upvotes_count", { count: allUpVotes.length })}
          downVotesTabLabel={t("issue.vote.downvotes_count", { count: allDownVotes.length })}
          emptyUpVotesMessage={t("issue.vote.no_upvotes")}
          emptyDownVotesMessage={t("issue.vote.no_downvotes")}
          closeLabel={t("close")}
        />
      )}
    </>
  );
});
