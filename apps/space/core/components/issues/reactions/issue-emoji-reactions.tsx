import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
// lib
import { stringToEmoji } from "@plane/propel/emoji-icon-picker";
import { EmojiReactionGroup, EmojiReactionPicker } from "@plane/propel/emoji-reaction";
import type { EmojiReactionType } from "@plane/propel/emoji-reaction";
// helpers
import { groupReactions } from "@/helpers/emoji.helper";
import { queryParamGenerator } from "@/helpers/query-param-generator";
// hooks
import { useIssueDetails } from "@/hooks/store/use-issue-details";
import { useUser } from "@/hooks/store/use-user";

type IssueEmojiReactionsProps = {
  anchor: string;
  issueIdFromProps?: string;
};

export const IssueEmojiReactions = observer(function IssueEmojiReactions(props: IssueEmojiReactionsProps) {
  const { anchor, issueIdFromProps } = props;
  // state
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  // router
  const router = useRouter();
  const pathName = usePathname();
  const searchParams = useSearchParams();
  // query params
  const peekId = searchParams.get("peekId") || undefined;
  const board = searchParams.get("board") || undefined;
  const state = searchParams.get("state") || undefined;
  const priority = searchParams.get("priority") || undefined;
  const labels = searchParams.get("labels") || undefined;
  // store hooks
  const issueDetailsStore = useIssueDetails();
  const { data: user } = useUser();

  const issueId = issueIdFromProps ?? issueDetailsStore.peekId;
  const reactions = issueDetailsStore.details[issueId ?? ""]?.reaction_items ?? [];
  const groupedReactions = groupReactions(reactions, "reaction");

  const userReactions = reactions.filter((r) => r.actor_details?.id === user?.id);

  const handleAddReaction = (reactionHex: string) => {
    if (!issueId) return;
    issueDetailsStore.addIssueReaction(anchor, issueId, reactionHex);
  };

  const handleRemoveReaction = (reactionHex: string) => {
    if (!issueId) return;
    issueDetailsStore.removeIssueReaction(anchor, issueId, reactionHex);
  };

  const handleReactionClick = (reactionHex: string) => {
    const userReaction = userReactions?.find((r) => r.actor_details?.id === user?.id && r.reaction === reactionHex);
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
          .map((r) => r?.actor_details?.display_name)
          .filter((name): name is string => !!name)
          .slice(0, REACTIONS_LIMIT);

        return {
          emoji: stringToEmoji(reaction),
          count: reactionList.length,
          reacted: reactionList.some((r) => r?.actor_details?.id === user?.id && r.reaction === reaction),
          users: userNames,
        };
      });
  }, [groupedReactions, user?.id]);

  const handleEmojiClick = (emoji: string) => {
    if (!user) {
      router.push(`/?next_path=${pathName}?${queryParam}`);
      return;
    }
    // Convert emoji back to decimal string format for the API
    const emojiCodePoints = Array.from(emoji).map((char) => char.codePointAt(0));
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
    <EmojiReactionPicker
      isOpen={isPickerOpen}
      handleToggle={setIsPickerOpen}
      onChange={handleEmojiSelect}
      label={
        <EmojiReactionGroup
          reactions={propelReactions}
          onReactionClick={handleEmojiClick}
          showAddButton
          onAddReaction={() => setIsPickerOpen(true)}
        />
      }
      placement="bottom-start"
    />
  );
});
