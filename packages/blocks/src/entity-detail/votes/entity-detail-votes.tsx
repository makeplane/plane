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
import { cn } from "@plane/utils";

export type EntityDetailVotesProps = {
  upVotesCount: number;
  downVotesCount: number;
  isUpVotedByUser: boolean;
  isDownVotedByUser: boolean;
  onUpVote: () => void;
  onDownVote: () => void;
  onCountClick: (voteType: "upvotes" | "downvotes") => void;
  disabled?: boolean;
};

export function EntityDetailVotes(props: EntityDetailVotesProps) {
  const {
    upVotesCount,
    downVotesCount,
    isUpVotedByUser,
    isDownVotedByUser,
    onUpVote,
    onDownVote,
    onCountClick,
    disabled = false,
  } = props;

  return (
    <div className="flex items-center gap-3 px-1.5">
      {/* Upvote */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={onUpVote}
          aria-label="Upvote"
          className={cn(
            "p-1 rounded-full transition-colors",
            "disabled:pointer-events-none disabled:opacity-50",
            isUpVotedByUser ? "bg-info-subtle" : "bg-layer-3"
          )}
        >
          <ArrowUp className="size-4 text-info-primary" />
        </button>
        <button
          type="button"
          className="text-body-xs-medium text-accent-primary hover:underline"
          onClick={() => onCountClick("upvotes")}
          aria-label="View upvotes"
        >
          {upVotesCount}
        </button>
      </div>

      {/* Downvote */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={onDownVote}
          aria-label="Downvote"
          className={cn(
            "p-1 rounded-full border border-inverse transition-colors",
            "disabled:pointer-events-none disabled:opacity-50",
            isDownVotedByUser ? "bg-danger-subtle" : "bg-layer-3"
          )}
        >
          <ArrowDown className="size-4 text-secondary" />
        </button>
        <button
          type="button"
          className="text-body-xs-medium text-secondary hover:underline"
          onClick={() => onCountClick("downvotes")}
          aria-label="View downvotes"
        >
          {downVotesCount}
        </button>
      </div>
    </div>
  );
}
