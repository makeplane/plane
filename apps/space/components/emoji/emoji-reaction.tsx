/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { ReactionOutline } from "@makeplane/propel/icons";
// plane imports
import { cn } from "@plane/utils";

export interface EmojiReactionType {
  emoji: string;
  count: number;
  reacted?: boolean;
  users?: string[];
}

interface EmojiReactionProps {
  emoji: string;
  count: number;
  reacted?: boolean;
  users?: string[];
  onReactionClick?: (emoji: string) => void;
  className?: string;
  ref?: React.Ref<HTMLButtonElement>;
}

const MAX_DISPLAY_USERS = 5;

function EmojiReaction(props: EmojiReactionProps) {
  const { emoji, count, reacted = false, users = [], onReactionClick, className, ref } = props;

  const handleClick = () => {
    onReactionClick?.(emoji);
  };

  const button = (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border px-1.5 text-11 transition-all duration-200",
        reacted
          ? "border-accent-strong bg-accent-primary/10 text-accent-primary"
          : "border-subtle bg-surface-1 text-tertiary hover:border-strong hover:bg-surface-2",
        className
      )}
    >
      <span className="leading-unset text-14">{emoji}</span>
      {count > 0 && <span className="text-11 leading-normal">{count}</span>}
    </button>
  );

  if (users.length === 0) return button;

  const displayUsers = users.slice(0, MAX_DISPLAY_USERS);
  const remainingCount = users.length - displayUsers.length;
  const tooltipLabel = `${emoji} ${displayUsers.join(", ")}${remainingCount > 0 ? ` and ${remainingCount} more` : ""}`;

  return <Tooltip label={tooltipLabel}>{button}</Tooltip>;
}

export interface EmojiReactionGroupProps {
  reactions: EmojiReactionType[];
  onReactionClick?: (emoji: string) => void;
  onAddReaction?: () => void;
  showAddButton?: boolean;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

export function EmojiReactionGroup(props: EmojiReactionGroupProps) {
  const { reactions, onReactionClick, onAddReaction, showAddButton = true, className, ref } = props;

  return (
    <div ref={ref} className={cn("flex flex-wrap items-center gap-2", className)}>
      {reactions.map((reaction) => (
        <EmojiReaction
          key={reaction.emoji}
          emoji={reaction.emoji}
          count={reaction.count}
          reacted={reaction.reacted}
          users={reaction.users}
          onReactionClick={onReactionClick}
        />
      ))}
      {showAddButton && (
        <Tooltip label="Add reaction">
          <button
            type="button"
            onClick={onAddReaction}
            className="grid size-6 place-items-center rounded-full text-tertiary transition-colors outline-none hover:bg-surface-2 hover:text-secondary"
            aria-label="Add reaction"
          >
            <ReactionOutline className="size-3.5" />
          </button>
        </Tooltip>
      )}
    </div>
  );
}
