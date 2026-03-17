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

import { ArrowDown, ArrowUp } from "lucide-react";
import { observer } from "mobx-react";
// plane imports
import type { IUser } from "@plane/types";
import { Button } from "@plane/propel/button";
import { Tooltip } from "@plane/propel/tooltip";
// hooks
import { useIssueVotes } from "@/hooks/use-issue-votes";
import type { IssueVote } from "@/hooks/use-issue-votes";

type IssueVotesProps = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  currentUser: IUser;
  disabled?: boolean;
};

type WorkItemVotedMembersProps = {
  votes: IssueVote[];
  message: string;
};

const VOTES_LIMIT = 10;

const WorkItemVotedMembers = (props: WorkItemVotedMembersProps) => {
  const { votes, message } = props;
  return (
    <div>
      {votes.length > 0 ? (
        <>
          {votes
            .map((r) => r.actor_detail?.display_name)
            .splice(0, VOTES_LIMIT)
            .join(", ")}
          {votes.length > VOTES_LIMIT && " and " + (votes.length - VOTES_LIMIT) + " more"}
        </>
      ) : (
        <>{message}</>
      )}
    </div>
  );
};

export const IssueVotes = observer(function IssueVotes(props: IssueVotesProps) {
  const { workspaceSlug, projectId, issueId, currentUser, disabled = false } = props;
  const userId = currentUser.id;
  // Fetching votes
  const {
    loading: isSubmitting,
    upVotes,
    downVotes,
    upVotesCount,
    downVotesCount,
    handleVote,
  } = useIssueVotes({ workspaceSlug, projectId, issueId, userId });
  // Derived values
  const isUpVotedByUser = upVotes.some((vote) => vote.actor_detail?.id === userId);
  const isDownVotedByUser = downVotes.some((vote) => vote.actor_detail?.id === userId);

  return (
    <div className="flex items-center gap-2">
      {/* upvote button */}
      <Tooltip tooltipContent={<WorkItemVotedMembers votes={upVotes} message="No upvotes yet" />}>
        <Button
          prependIcon={<ArrowUp />}
          disabled={isSubmitting || disabled}
          onClick={() => handleVote(1)}
          variant={isUpVotedByUser ? "success-outline" : "secondary"}
          size="sm"
        >
          {upVotesCount}
        </Button>
      </Tooltip>

      {/* downvote button */}
      <Tooltip tooltipContent={<WorkItemVotedMembers votes={downVotes} message="No downvotes yet" />}>
        <Button
          prependIcon={<ArrowDown />}
          disabled={isSubmitting || disabled}
          onClick={() => handleVote(-1)}
          variant={isDownVotedByUser ? "error-outline" : "secondary"}
          size="sm"
        >
          {downVotesCount}
        </Button>
      </Tooltip>
    </div>
  );
});
