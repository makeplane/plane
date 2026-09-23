/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Icon as PropelIcon } from "@makeplane/propel/components/icon";
import * as React from "react";
import { AnimatedCounter } from "./animated-counter";
import { stringToEmoji } from "../emoji-icon-picker/helper";
import { ReactionOutline } from "@makeplane/propel/icons";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { IconButton } from "@makeplane/propel/components/icon-button";

export type EmojiReactionType = {
  emoji: string;
  count: number;
  reacted?: boolean;
  users?: string[];
};

export type EmojiReactionProps = React.ComponentPropsWithRef<"button"> & {
  emoji: string;
  count: number;
  reacted?: boolean;
  users?: string[];
  onReactionClick?: (emoji: string) => void;
  showCount?: boolean;
};

export type EmojiReactionGroupProps = React.ComponentPropsWithRef<"div"> & {
  reactions: EmojiReactionType[];
  onReactionClick?: (emoji: string) => void;
  onAddReaction?: () => void;
  showAddButton?: boolean;
  maxDisplayUsers?: number;
};

export type EmojiReactionButtonProps = React.ComponentPropsWithRef<"button"> & {
  onAddReaction?: () => void;
};

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

  // propel: Tooltip's `label` is a string, so the old two-line markup is flattened
  const tooltipContent = React.useMemo(() => {
    if (!users.length) return null;

    const displayUsers = users.slice(0, 5);
    const remainingCount = users.length - displayUsers.length;

    return [
      stringToEmoji(emoji),
      `${displayUsers.join(", ")}${remainingCount > 0 ? ` and ${remainingCount} more` : ""}`,
    ].join(": ");
  }, [emoji, users]);

  const button = (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border px-1.5 text-caption-sm-regular transition-all duration-200",
        reacted
          ? "border-accent-strong bg-accent-primary/10 text-accent-primary"
          : "border-subtle bg-surface-1 text-tertiary hover:border-strong hover:bg-surface-2",
        className
      )}
      {...props}
    >
      <span className="leading-unset text-body-sm-regular">{emoji}</span>
      {showCount && count > 0 && (
        <AnimatedCounter count={count} size="sm" className="text-caption-sm-regular leading-normal" />
      )}
    </button>
  );

  if (tooltipContent && users.length > 0) {
    return (
      <Tooltip label={tooltipContent} layout="stacked">
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
  // plane hooks
  const { t } = useTranslation();

  return (
    // propel: `IconButton` takes an icon ELEMENT, a required `aria-label` and no className —
    // the caller's class rides a wrapper.
    <Tooltip label={t("common.actions.add_reaction")}>
      <span className={className}>
        <IconButton
          ref={ref}
          icon={<PropelIcon icon={<ReactionOutline className="size-3.5" />} />}
          variant="ghost"
          size="xs"
          aria-label={t("common.actions.add_reaction")}
          onClick={onAddReaction}
          {...props}
        />
      </span>
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
