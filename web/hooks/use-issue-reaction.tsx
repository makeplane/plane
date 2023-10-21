import useSWR from "swr";

// fetch keys
import { ISSUE_REACTION_LIST } from "constants/fetch-keys";
// helpers
import { groupReactions } from "helpers/emoji.helper";
// services
import { IssueReactionService } from "services/issue";
// hooks
import useUser from "./use-user";

const issueReactionService = new IssueReactionService();

const useIssueReaction = (
  workspaceSlug?: string | string[] | null,
  projectId?: string | string[] | null,
  issueId?: string | string[] | null
) => {
  const user = useUser();

  const {
    data: reactions,
    mutate: mutateReaction,
    error,
  } = useSWR(
    workspaceSlug && projectId && issueId
      ? ISSUE_REACTION_LIST(workspaceSlug.toString(), projectId.toString(), issueId.toString())
      : null,
    workspaceSlug && projectId && issueId
      ? () =>
          issueReactionService.listIssueReactions(workspaceSlug.toString(), projectId.toString(), issueId.toString())
      : null
  );

  const groupedReactions = groupReactions(reactions || [], "reaction");

  /**
   * @description Use this function to create user's reaction to an issue. This function will mutate the reactions state.
   * @param {string} reaction
   * @example handleReactionCreate("128077") // hexa-code of the emoji
   */

  const handleReactionCreate = async (reaction: string) => {
    if (!workspaceSlug || !projectId || !issueId) return;

    const data = await issueReactionService.createIssueReaction(
      workspaceSlug.toString(),
      projectId.toString(),
      issueId.toString(),
      { reaction },
      user.user
    );

    mutateReaction((prev: any) => [...(prev || []), data]);
  };

  /**
   * @description Use this function to delete user's reaction from an issue. This function will mutate the reactions state.
   * @param {string} reaction
   * @example handleReactionDelete("123") // 123 -> is emoji hexa-code
   */

  const handleReactionDelete = async (reaction: string) => {
    if (!workspaceSlug || !projectId || !issueId) return;

    mutateReaction(
      (prevData: any) => prevData?.filter((r: any) => r.actor !== user?.user?.id || r.reaction !== reaction) || [],
      false
    );

    await issueReactionService.deleteIssueReaction(
      workspaceSlug.toString(),
      projectId.toString(),
      issueId.toString(),
      reaction,
      user.user
    );

    mutateReaction();
  };

  return {
    isLoading: !reactions && !error,
    reactions,
    groupedReactions,
    handleReactionCreate,
    handleReactionDelete,
    mutateReaction,
  } as const;
};

export default useIssueReaction;
