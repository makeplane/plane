import React, { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
// plane imports
import { stringToEmoji } from "@plane/propel/emoji-icon-picker";
import { EmojiReactionGroup, EmojiReactionPicker } from "@plane/propel/emoji-reaction";
import type { EmojiReactionType } from "@plane/propel/emoji-reaction";
// helpers
import { groupReactions } from "@/helpers/emoji.helper";
import { queryParamGenerator } from "@/helpers/query-param-generator";
// hooks
import { useIssueDetails } from "@/hooks/store/use-issue-details";
import { useUser } from "@/hooks/store/use-user";
import useIsInIframe from "@/hooks/use-is-in-iframe";

type Props = {
  anchor: string;
  commentId: string;
};

export const CommentReactions = observer(function CommentReactions(props: Props) {
  const { anchor, commentId } = props;
  // state
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const router = useRouter();
  const pathName = usePathname();
  const searchParams = useSearchParams();
  // query params
  const board = searchParams.get("board") || undefined;
  const state = searchParams.get("state") || undefined;
  const priority = searchParams.get("priority") || undefined;
  const labels = searchParams.get("labels") || undefined;

  // hooks
  const { addCommentReaction, removeCommentReaction, details, peekId } = useIssueDetails();
  const { data: user } = useUser();
  const isInIframe = useIsInIframe();

  const commentReactions = useMemo(() => {
    if (!peekId) return [];
    const peekDetails = details[peekId];
    if (!peekDetails) return [];
    const comment = peekDetails.comments?.find((c) => c.id === commentId);
    return comment?.comment_reactions ?? [];
  }, [peekId, details, commentId]);

  const groupedReactions = useMemo(() => {
    if (!peekId) return {};
    return groupReactions(commentReactions ?? [], "reaction");
  }, [peekId, commentReactions]);

  const userReactions = commentReactions?.filter((r) => r?.actor_detail?.id === user?.id);

  const handleAddReaction = (reactionHex: string) => {
    if (!anchor || !peekId) return;
    addCommentReaction(anchor, peekId, commentId, reactionHex);
  };

  const handleRemoveReaction = (reactionHex: string) => {
    if (!anchor || !peekId) return;
    removeCommentReaction(anchor, peekId, commentId, reactionHex);
  };

  const handleReactionClick = (reactionHex: string) => {
    const userReaction = userReactions?.find((r) => r.actor_detail.id === user?.id && r.reaction === reactionHex);

    if (userReaction) handleRemoveReaction(reactionHex);
    else handleAddReaction(reactionHex);
  };

  // derived values
  const { queryParam } = queryParamGenerator({ peekId, board, state, priority, labels });

  // Transform reactions data to Propel EmojiReactionType format
  const propelReactions: EmojiReactionType[] = useMemo(() => {
    const REACTIONS_LIMIT = 1000;

    return Object.keys(groupedReactions || {})
      .filter((reaction) => groupedReactions?.[reaction]?.length > 0)
      .map((reaction) => {
        const reactionList = groupedReactions?.[reaction] ?? [];
        const userNames = reactionList
          .map((r) => r?.actor_detail?.display_name)
          .filter((name): name is string => !!name)
          .slice(0, REACTIONS_LIMIT);

        return {
          emoji: stringToEmoji(reaction),
          count: reactionList.length,
          reacted: commentReactions?.some((r) => r?.actor_detail?.id === user?.id && r.reaction === reaction) || false,
          users: userNames,
        };
      });
  }, [groupedReactions, commentReactions, user?.id]);

  const handleEmojiClick = (emoji: string) => {
    if (isInIframe) return;
    if (!user) {
      router.push(`/?next_path=${pathName}?${queryParam}`);
      return;
    }
    // Convert emoji back to decimal string format for the API
    const emojiCodePoints = Array.from(emoji)
      .map((char) => char.codePointAt(0))
      .filter((cp): cp is number => cp !== undefined);
    const reactionString = emojiCodePoints.join("-");
    handleReactionClick(reactionString);
  };

  const handleEmojiSelect = (emoji: string) => {
    if (!user) {
      router.push(`/?next_path=${pathName}?${queryParam}`);
      return;
    }
    // emoji is already in decimal string format from EmojiReactionPicker
    handleReactionClick(emoji);
  };

  return (
    <div className="mt-2">
      <EmojiReactionPicker
        isOpen={isPickerOpen}
        handleToggle={setIsPickerOpen}
        onChange={handleEmojiSelect}
        disabled={isInIframe}
        label={
          <EmojiReactionGroup
            reactions={propelReactions}
            onReactionClick={handleEmojiClick}
            showAddButton={!isInIframe}
            onAddReaction={() => setIsPickerOpen(true)}
          />
        }
        placement="bottom-start"
      />
    </div>
  );
});
