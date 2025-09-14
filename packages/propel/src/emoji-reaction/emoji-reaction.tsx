import * as React from "react";
import { Plus } from "lucide-react";
import { AnimatedCounter } from "../animated-counter";
import { stringToEmoji } from "../emoji-icon-picker";
import { Tooltip } from "../tooltip";
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
  size?: "sm" | "md" | "lg";
}

export interface EmojiReactionGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  reactions: EmojiReactionType[];
  onReactionClick?: (emoji: string) => void;
  onAddReaction?: () => void;
  className?: string;
  showAddButton?: boolean;
  maxDisplayUsers?: number;
  size?: "sm" | "md" | "lg";
}

export interface EmojiReactionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onAddReaction?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: {
    button: "px-2 py-1 text-xs gap-1",
    emoji: "text-sm",
    count: "text-xs",
    addButton: "h-6 w-6",
    addIcon: "h-3 w-3",
  },
  md: {
    button: "px-2.5 py-1.5 text-sm gap-1.5",
    emoji: "text-base",
    count: "text-sm",
    addButton: "h-7 w-7",
    addIcon: "h-3.5 w-3.5",
  },
  lg: {
    button: "px-3 py-2 text-base gap-2",
    emoji: "text-lg",
    count: "text-base",
    addButton: "h-8 w-8",
    addIcon: "h-4 w-4",
  },
};

const EmojiReaction = React.forwardRef<HTMLButtonElement, EmojiReactionProps>(
  (
    { emoji, count, reacted = false, users = [], onReactionClick, className, showCount = true, size = "md", ...props },
    ref
  ) => {
    const sizeClass = sizeClasses[size];

    const handleClick = () => {
      onReactionClick?.(emoji);
    };

    const tooltipContent = React.useMemo(() => {
      if (!users.length) return null;

      const displayUsers = users.slice(0, 5);
      const remainingCount = users.length - displayUsers.length;

      return (
        <div className="text-xs">
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
          "inline-flex items-center rounded-full border transition-all duration-200 hover:scale-105",
          "focus:outline-none focus:ring-2 focus:ring-custom-primary-100/20 focus:ring-offset-1",
          sizeClass.button,
          reacted
            ? "bg-custom-primary-100/10 border-custom-primary-100 text-custom-primary-100"
            : "bg-custom-background-100 border-custom-border-200 text-custom-text-300 hover:border-custom-border-300 hover:bg-custom-background-90",
          className
        )}
        {...props}
      >
        <span className={sizeClass.emoji}>{emoji}</span>
        {showCount && count > 0 && <AnimatedCounter count={count} size={size} className={sizeClass.count} />}
      </button>
    );

    if (tooltipContent && users.length > 0) {
      return <Tooltip tooltipContent={tooltipContent}>{button}</Tooltip>;
    }

    return button;
  }
);

const EmojiReactionButton = React.forwardRef<HTMLButtonElement, EmojiReactionButtonProps>(
  ({ onAddReaction, className, size = "md", ...props }, ref) => {
    const sizeClass = sizeClasses[size];

    return (
      <button
        ref={ref}
        onClick={onAddReaction}
        className={cn(
          "inline-flex items-center justify-center rounded-full border border-dashed border-custom-border-300",
          "bg-custom-background-100 text-custom-text-400 transition-all duration-200",
          "hover:border-custom-primary-100 hover:text-custom-primary-100 hover:bg-custom-primary-100/5",
          "focus:outline-none focus:ring-2 focus:ring-custom-primary-100/20 focus:ring-offset-1",
          sizeClass.addButton,
          className
        )}
        title="Add reaction"
        {...props}
      >
        <Plus className={sizeClass.addIcon} />
      </button>
    );
  }
);

const EmojiReactionGroup = React.forwardRef<HTMLDivElement, EmojiReactionGroupProps>(
  (
    {
      reactions,
      onReactionClick,
      onAddReaction,
      className,
      showAddButton = true,
      maxDisplayUsers = 5,
      size = "md",
      ...props
    },
    ref
  ) => (
    <div ref={ref} className={cn("flex flex-wrap items-center gap-2", className)} {...props}>
      {reactions.map((reaction, index) => (
        <EmojiReaction
          key={`${reaction.emoji}-${index}`}
          emoji={reaction.emoji}
          count={reaction.count}
          reacted={reaction.reacted}
          users={reaction.users?.slice(0, maxDisplayUsers)}
          onReactionClick={onReactionClick}
          size={size}
        />
      ))}
      {showAddButton && <EmojiReactionButton onAddReaction={onAddReaction} size={size} />}
    </div>
  )
);

EmojiReaction.displayName = "EmojiReaction";
EmojiReactionButton.displayName = "EmojiReactionButton";
EmojiReactionGroup.displayName = "EmojiReactionGroup";

export { EmojiReaction, EmojiReactionButton, EmojiReactionGroup };
