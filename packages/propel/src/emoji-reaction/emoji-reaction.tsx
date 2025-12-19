import * as React from "react";
import { AnimatedCounter } from "../animated-counter";
import { stringToEmoji } from "../emoji-icon-picker";
import { AddReactionIcon } from "../icons";
import { Tooltip } from "../tooltip";
import { cn } from "../utils";
import { IconButton } from "../icon-button";

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

  const tooltipContent = React.useMemo(() => {
    if (!users.length) return null;

    const displayUsers = users.slice(0, 5);
    const remainingCount = users.length - displayUsers.length;

    return (
      <div className="text-11">
        <div className="font-medium mb-1">{stringToEmoji(emoji)}</div>
        <div>
          {displayUsers.join(", ")}
          {remainingCount > 0 && ` and ${remainingCount} more`}
        </div>
      </div>
    );
  }, [emoji, users]);

  const button = (
    <button
      ref={ref}
      onClick={handleClick}
      className={cn(
        "inline-flex items-center rounded-full border px-1.5 text-11 gap-0.5 transition-all duration-200",
        reacted
          ? "bg-accent-primary/10 border-accent-strong text-accent-primary"
          : "bg-surface-1 border-subtle text-tertiary hover:border-strong hover:bg-surface-2",
        className
      )}
      {...props}
    >
      <span className="text-14 leading-unset">{emoji}</span>
      {showCount && count > 0 && <AnimatedCounter count={count} size="sm" className="text-11 leading-normal" />}
    </button>
  );

  if (tooltipContent && users.length > 0) {
    return <Tooltip tooltipContent={tooltipContent}>{button}</Tooltip>;
  }

  return button;
});

const EmojiReactionButton = React.forwardRef(function EmojiReactionButton(
  { onAddReaction, className, ...props }: EmojiReactionButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  return (
    <Tooltip tooltipContent="Add reaction">
      <IconButton
        ref={ref}
        icon={AddReactionIcon}
        variant="ghost"
        size="sm"
        onClick={onAddReaction}
        className={className}
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
