import type { FC } from "react";
import { useMemo, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { stringToEmoji } from "@plane/propel/emoji-icon-picker";
import { EmojiReactionGroup, EmojiReactionPicker } from "@plane/propel/emoji-reaction";
import type { EmojiReactionType } from "@plane/propel/emoji-reaction";
import type { TCommentsOperations, TIssueComment } from "@plane/types";
import { cn } from "@plane/utils";
// helpers
// local imports

export type TProps = {
  comment: TIssueComment;
  disabled?: boolean;
  activityOperations: TCommentsOperations;
};

export const CommentReactions = observer(function CommentReactions(props: TProps) {
  const { comment, activityOperations, disabled = false } = props;
  // state
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const userReactions = activityOperations.userReactions(comment.id);
  const reactionIds = activityOperations.reactionIds(comment.id);

  // Transform reactions data to Propel EmojiReactionType format
  const reactions: EmojiReactionType[] = useMemo(() => {
    if (!reactionIds) return [];

    return Object.keys(reactionIds)
      .filter((reaction) => reactionIds[reaction]?.length > 0)
      .map((reaction) => {
        // Get user names for this reaction
        const tooltipContent = activityOperations.getReactionUsers(reaction, reactionIds);
        // Parse the tooltip content string to extract user names
        const users = tooltipContent ? tooltipContent.split(", ") : [];

        return {
          emoji: stringToEmoji(reaction),
          count: reactionIds[reaction].length,
          reacted: userReactions?.includes(reaction) || false,
          users: users,
        };
      });
  }, [reactionIds, userReactions, activityOperations]);

  const handleReactionClick = (emoji: string) => {
    if (disabled || !userReactions) return;
    // Convert emoji back to decimal string format for the API
    const emojiCodePoints = Array.from(emoji).map((char) => char.codePointAt(0));
    const reactionString = emojiCodePoints.join("-");
    activityOperations.react(comment.id, reactionString, userReactions);
  };

  const handleEmojiSelect = (emoji: string) => {
    if (!userReactions) return;
    // emoji is already in decimal string format from EmojiReactionPicker
    activityOperations.react(comment.id, emoji, userReactions);
  };

  if (!userReactions) return null;

  // Don't render anything if there are no reactions and it's disabled
  if (reactions.length === 0 && disabled) return null;

  // Don't show the add button if there are no reactions
  const showAddButton = !disabled && reactions.length > 0;

  return (
    <div className="relative">
      <EmojiReactionPicker
        isOpen={isPickerOpen}
        handleToggle={setIsPickerOpen}
        onChange={handleEmojiSelect}
        disabled={disabled}
        label={
          <EmojiReactionGroup
            reactions={reactions}
            onReactionClick={handleReactionClick}
            showAddButton={showAddButton}
            onAddReaction={() => setIsPickerOpen(true)}
          />
        }
        placement="bottom-start"
      />
    </div>
  );
});
