import useSWR from "swr";
// fetch keys
import { COMMENT_REACTION_LIST } from "@/constants/fetch-keys";
// services
import { groupReactions } from "@/helpers/emoji.helper";
import { useUser } from "@/hooks/store";
import { IssueReactionService } from "@/services/issue";
// helpers
// hooks
// services
const issueReactionService = new IssueReactionService();

const useCommentReaction: any = (
  workspaceSlug?: string | string[] | null,
  projectId?: string | string[] | null,
  commendId?: string | string[] | null
) => {
  const {
    data: commentReactions,
    mutate: mutateCommentReactions,
    error,
  } = useSWR(
    workspaceSlug && projectId && commendId
      ? COMMENT_REACTION_LIST(workspaceSlug.toString(), projectId.toString(), commendId.toString())
      : null,
    workspaceSlug && projectId && commendId
      ? () =>
          issueReactionService.listIssueCommentReactions(
            workspaceSlug.toString(),
            projectId.toString(),
            commendId.toString()
          )
      : null
  );

  const { data: currentUser } = useUser();

  const groupedReactions = groupReactions(commentReactions || [], "reaction");

  /**
   * @description Use this function to create user's reaction to an issue. This function will mutate the reactions state.
   * @param {string} reaction
   * @example handleReactionDelete("123") // 123 -> is emoji hexa-code
   */

  const handleReactionCreate = async (reaction: string) => {
    if (!workspaceSlug || !projectId || !commendId) return;

    const data = await issueReactionService.createIssueCommentReaction(
      workspaceSlug.toString(),
      projectId.toString(),
      commendId.toString(),
      { reaction }
    );

    mutateCommentReactions((prev: any) => [...(prev || []), data]);
  };

  /**
   * @description Use this function to delete user's reaction from an issue. This function will mutate the reactions state.
   * @param {string} reaction
   * @example handleReactionDelete("123") // 123 -> is emoji hexa-code
   */

  const handleReactionDelete = async (reaction: string) => {
    if (!workspaceSlug || !projectId || !commendId) return;

    mutateCommentReactions(
      (prevData: any) => prevData?.filter((r: any) => r.actor !== currentUser?.id || r.reaction !== reaction) || [],
      false
    );

    await issueReactionService.deleteIssueCommentReaction(
      workspaceSlug.toString(),
      projectId.toString(),
      commendId.toString(),
      reaction
    );

    mutateCommentReactions();
  };

  return {
    isLoading: !commentReactions && !error,
    commentReactions,
    groupedReactions,
    handleReactionCreate,
    handleReactionDelete,
    mutateCommentReactions,
  } as const;
};

export default useCommentReaction;
