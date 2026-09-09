/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import { AnimatedCounter } from "../animated-counter";
import { stringToEmoji } from "../emoji-icon-picker";
import { ReactionOutline } from "@makeplane/propel/icons";
import { Icon } from "@makeplane/propel/components/icon";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { cn } from "../utils";

export interface EmojiReactionType {
  emoji: string;
  count: number;
  reacted?: boolean;
  users?: string[];
}

export interface EmojiReactionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  emoji: string;
  count: number;
  reacted?: boolean;
  users?: string[];
  onReactionClick?: (emoji: string) => void;
  className?: string;
  showCount?: boolean;
}

export interface EmojiReactionGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  reactions: EmojiReactionType[];
  onReactionClick?: (emoji: string) => void;
  onAddReaction?: () => void;
  className?: string;
  showAddButton?: boolean;
  maxDisplayUsers?: number;
}

export interface EmojiReactionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onAddReaction?: () => void;
  className?: string;
}

const EmojiReaction = React.forwardRef(function EmojiReaction(
  {
    emoji,
    count,
    reacted = false,
    users = [],
    onReactionClick,
    className,
    showCount = true,
    ...props
  }: EmojiReactionProps,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  const handleClick = () => {
    onReactionClick?.(emoji);
  };

  const tooltipLabel = React.useMemo(() => {
    if (!users.length) return null;

    const displayUsers = users.slice(0, 5);
    const remainingCount = users.length - displayUsers.length;

    return `${stringToEmoji(emoji)}: ${displayUsers.join(", ")}${remainingCount > 0 ? ` and ${remainingCount} more` : ""}`;
  }, [emoji, users]);

  const button = (
    <button
      ref={ref}
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border px-1.5 text-11 transition-all duration-200",
        reacted
          ? "border-accent-strong bg-accent-primary/10 text-accent-primary"
          : "border-subtle bg-surface-1 text-tertiary hover:border-strong hover:bg-surface-2",
        className
      )}
      {...props}
    >
      <span className="leading-unset text-14">{emoji}</span>
      {showCount && count > 0 && <AnimatedCounter count={count} size="sm" className="text-11 leading-normal" />}
    </button>
  );

  if (tooltipLabel && users.length > 0) {
    return (
      <Tooltip label={tooltipLabel} layout="stacked">
        {button}
      </Tooltip>
    );
  }

  return button;
});

const EmojiReactionButton = React.forwardRef(function EmojiReactionButton(
  { onAddReaction, className, ...props }: EmojiReactionButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  return (
    <Tooltip label="Add reaction">
      <IconButton
        ref={ref}
        render={<button className={className} />}
        aria-label="Add reaction"
        icon={<Icon icon={ReactionOutline} />}
        variant="ghost"
        size="sm"
        onClick={onAddReaction}
        {...props}
      />
    </Tooltip>
  );
});

const EmojiReactionGroup = React.forwardRef(function EmojiReactionGroup(
  {
    reactions,
    onReactionClick,
    onAddReaction,
    className,
    showAddButton = true,
    maxDisplayUsers = 5,
    ...props
  }: EmojiReactionGroupProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  return (
    <div ref={ref} className={cn("flex flex-wrap items-center gap-2", className)} {...props}>
      {reactions.map((reaction, index) => (
        <EmojiReaction
          key={`${reaction.emoji}-${index}`}
          emoji={reaction.emoji}
          count={reaction.count}
          reacted={reaction.reacted}
          users={reaction.users?.slice(0, maxDisplayUsers)}
          onReactionClick={onReactionClick}
        />
      ))}
      {showAddButton && <EmojiReactionButton onAddReaction={onAddReaction} />}
    </div>
  );
});

EmojiReaction.displayName = "EmojiReaction";
EmojiReactionButton.displayName = "EmojiReactionButton";
EmojiReactionGroup.displayName = "EmojiReactionGroup";

export { EmojiReaction, EmojiReactionButton, EmojiReactionGroup };
