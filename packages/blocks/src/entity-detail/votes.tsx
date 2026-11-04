/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ArrowDownOutline, TopArrowOutline } from "@makeplane/propel/icons";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { cn } from "@plane/utils";

export type TEntityDetailVoteType = "upvotes" | "downvotes";

export type EntityDetailVotesProps = {
  upVotesCount: number;
  downVotesCount: number;
  isUpVotedByUser: boolean;
  isDownVotedByUser: boolean;
  onUpVote: () => void;
  onDownVote: () => void;
  /** Opens the voter list on the matching tab. */
  onCountClick: (voteType: TEntityDetailVoteType) => void;
  disabled?: boolean;
  /** Accessible name and tooltip of the upvote toggle, e.g. "Click to upvote". */
  upVoteLabel: string;
  /** Accessible name and tooltip of the downvote toggle, e.g. "Click to downvote". */
  downVoteLabel: string;
  /** Tooltip of the upvote count; its accessible name also carries the count. */
  viewUpVotesLabel: string;
  /** Tooltip of the downvote count; its accessible name also carries the count. */
  viewDownVotesLabel: string;
};

type TVoteSideProps = {
  direction: "up" | "down";
  count: number;
  isActive: boolean;
  disabled: boolean;
  voteLabel: string;
  viewLabel: string;
  onVote: () => void;
  onCountClick: () => void;
};

function VoteSide(props: TVoteSideProps) {
  const { direction, count, isActive, disabled, voteLabel, viewLabel, onVote, onCountClick } = props;
  const isUp = direction === "up";
  const ArrowIcon = isUp ? TopArrowOutline : ArrowDownOutline;

  return (
    <div className="flex items-center gap-1">
      <Tooltip label={voteLabel} disabled={disabled}>
        <button
          type="button"
          aria-label={voteLabel}
          aria-pressed={isActive}
          disabled={disabled}
          onClick={onVote}
          className={cn(
            "group/vote grid size-6 shrink-0 cursor-pointer place-items-center rounded-full transition-colors duration-150 outline-none",
            "focus-visible:ring-2 focus-visible:ring-accent-strong disabled:pointer-events-none disabled:opacity-50",
            isActive
              ? isUp
                ? "bg-label-indigo-bg text-label-indigo-icon"
                : "bg-label-crimson-bg text-label-crimson-icon"
              : "bg-layer-3 text-secondary hover:bg-layer-3-hover hover:text-primary"
          )}
        >
          <ArrowIcon
            aria-hidden
            className={cn("size-4 transition-transform duration-150 motion-reduce:transition-none", {
              "group-hover/vote:translate-y-0.5": !isActive && !isUp,
              "group-hover/vote:-translate-y-0.5": !isActive && isUp,
            })}
          />
        </button>
      </Tooltip>
      <Tooltip label={viewLabel}>
        <button
          type="button"
          aria-label={`${viewLabel}, ${count}`}
          onClick={onCountClick}
          className={cn(
            "min-w-[2ch] cursor-pointer rounded-sm text-left text-body-xs-medium tabular-nums outline-none hover:underline focus-visible:ring-2 focus-visible:ring-accent-strong",
            isActive ? (isUp ? "text-label-indigo-text" : "text-label-crimson-text") : "text-secondary"
          )}
        >
          {count}
        </button>
      </Tooltip>
    </div>
  );
}

/**
 * The upvote/downvote pair on an entity: each side is a round toggle (tinted while the viewer's
 * vote is on it) followed by its count, which opens the voter list instead of voting.
 */
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
    upVoteLabel,
    downVoteLabel,
    viewUpVotesLabel,
    viewDownVotesLabel,
  } = props;

  return (
    <div className="flex items-center gap-1.5">
      <VoteSide
        direction="up"
        count={upVotesCount}
        isActive={isUpVotedByUser}
        disabled={disabled}
        voteLabel={upVoteLabel}
        viewLabel={viewUpVotesLabel}
        onVote={onUpVote}
        onCountClick={() => onCountClick("upvotes")}
      />
      <VoteSide
        direction="down"
        count={downVotesCount}
        isActive={isDownVotedByUser}
        disabled={disabled}
        voteLabel={downVoteLabel}
        viewLabel={viewDownVotesLabel}
        onVote={onDownVote}
        onCountClick={() => onCountClick("downvotes")}
      />
    </div>
  );
}
