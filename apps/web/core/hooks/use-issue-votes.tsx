/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import useSWR from "swr";
import { IssueVotesService } from "@plane/services";
import type { ActorDetail } from "@plane/types";

import { useCallback, useState } from "react";

const issueVotesService = new IssueVotesService();

export type IssueVote = { actor_detail: ActorDetail; vote: 1 | -1 };

type TIssueVotesProps = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  userId: string;
};

export const useIssueVotes = (props: TIssueVotesProps) => {
  const { workspaceSlug, projectId, issueId, userId } = props;
  const [loading, setLoading] = useState(false);

  // swr hooks
  const { data: votes = [], mutate: mutateVotes } = useSWR<IssueVote[]>(
    workspaceSlug && projectId && issueId ? `ISSUES_VOTES_${issueId}` : null,
    workspaceSlug && projectId && issueId ? () => issueVotesService.getVotes(workspaceSlug, projectId, issueId) : null
  );
  // up votes Derived values
  const upVotes = votes.filter((vote) => vote.vote === 1);
  const upVotesCount = upVotes.length;
  // down votes Derived values
  const downVotes = votes.filter((vote) => vote.vote === -1);
  const downVotesCount = downVotes.length;

  const handleVote = useCallback(
    async (voteValue: 1 | -1) => {
      if (!workspaceSlug || !projectId || !issueId) return;
      setLoading(true);
      try {
        const actionPerformed = votes?.find((vote) => vote.actor_detail?.id === userId && vote.vote === voteValue);
        if (actionPerformed) await issueVotesService.removeVote(workspaceSlug, projectId, issueId);
        else await issueVotesService.addVote(workspaceSlug, projectId, issueId, voteValue);
      } finally {
        mutateVotes();
        setLoading(false);
      }
    },
    [workspaceSlug, projectId, issueId, mutateVotes, userId, votes]
  );

  return { loading, votes: votes, upVotes, downVotes, upVotesCount, downVotesCount, handleVote };
};
