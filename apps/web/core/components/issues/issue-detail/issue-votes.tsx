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

import { useState } from "react";
import { observer } from "mobx-react";
import { ArrowDown, ArrowUp } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/propel/utils";
import type { IUser } from "@plane/types";
// hooks
import { useIssueVotes } from "@/hooks/use-issue-votes";
// local imports
import { WorkItemVotedMembersModal } from "./issue-votes-members-modal";

export type TVotes = "upVotes" | "downVotes";

type IssueVotesProps = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  currentUser: IUser;
  disabled?: boolean;
  toggleVotingMembersModal?: (value: boolean) => void;
};

export const IssueVotes = observer(function IssueVotes(props: IssueVotesProps) {
  const { workspaceSlug, projectId, issueId, currentUser, disabled = false, toggleVotingMembersModal } = props;
  const { t } = useTranslation();
  const userId = currentUser.id;

  const [isModalOpen, setIsModalOpen] = useState<TVotes | undefined>(undefined);

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

  const isDisabled = isSubmitting || disabled;

  const openVotingMembersModal = (voteType: TVotes) => {
    setIsModalOpen(voteType);
    if (toggleVotingMembersModal) toggleVotingMembersModal(true);
  };

  return (
    <div className="flex items-center gap-2 text-body-xs-medium text-secondary pr-1">
      <WorkItemVotedMembersModal
        isOpen={!!isModalOpen}
        handleClose={() => {
          setIsModalOpen(undefined);
          if (toggleVotingMembersModal) toggleVotingMembersModal(false);
        }}
        upVotes={upVotes}
        downVotes={downVotes}
        defaultTab={isModalOpen}
      />

      {/* upvote button */}
      <div className="flex items-center gap-1.5">
        <Tooltip tooltipContent={t("issue.vote.click_to_upvote")} disabled={isDisabled}>
          <button
            aria-label="Upvote"
            aria-disabled={isDisabled}
            tabIndex={0}
            className={cn(
              "flex items-center justify-center shrink-0 size-6 rounded-full cursor-pointer",
              isUpVotedByUser ? "border-none text-label-indigo-text bg-label-indigo-bg" : "border-inverse bg-layer-3"
            )}
            onClick={() => !isDisabled && handleVote(1)}
            onKeyDown={(e) => e.key === "Enter" && !isDisabled && handleVote(1)}
          >
            <ArrowUp className="size-4" />
          </button>
        </Tooltip>

        <Tooltip tooltipContent={t("issue.vote.click_to_view_upvotes")}>
          <button
            aria-label="Upvote members"
            tabIndex={0}
            className={cn("cursor-pointer", isUpVotedByUser && "text-label-indigo-text")}
            onClick={() => openVotingMembersModal("upVotes")}
            onKeyDown={(e) => e.key === "Enter" && openVotingMembersModal("upVotes")}
          >
            {upVotesCount}
          </button>
        </Tooltip>
      </div>

      {/* downvote button */}
      <div className="flex items-center gap-1.5">
        <Tooltip tooltipContent={t("issue.vote.click_to_downvote")} disabled={isDisabled}>
          <button
            aria-label="Downvote"
            aria-disabled={isDisabled}
            tabIndex={0}
            className={cn(
              "flex items-center justify-center shrink-0 size-6 rounded-full cursor-pointer",
              isDownVotedByUser
                ? "border-none text-label-crimson-text bg-label-crimson-bg"
                : "border-inverse bg-layer-3"
            )}
            onClick={() => !isDisabled && handleVote(-1)}
            onKeyDown={(e) => e.key === "Enter" && !isDisabled && handleVote(-1)}
          >
            <ArrowDown className="size-4" />
          </button>
        </Tooltip>

        <Tooltip tooltipContent={t("issue.vote.click_to_view_downvotes")}>
          <button
            aria-label="Downvote members"
            tabIndex={0}
            className={cn("cursor-pointer", isDownVotedByUser && "text-label-crimson-text")}
            onClick={() => openVotingMembersModal("downVotes")}
            onKeyDown={(e) => e.key === "Enter" && openVotingMembersModal("downVotes")}
          >
            {downVotesCount}
          </button>
        </Tooltip>
      </div>
    </div>
  );
});
