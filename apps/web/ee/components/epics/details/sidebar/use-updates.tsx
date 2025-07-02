import { useMemo } from "react";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { EUpdateEntityType, TCommentLoader, TUpdate, TUpdateComment, TUpdateOperations } from "@plane/types";
import { useUser } from "@/hooks/store";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { useUpdateDetail } from "@/plane-web/hooks/use-update-detail";
import { EpicsUpdateService } from "@/plane-web/services";

const epicService = new EpicsUpdateService();

export const useEpicUpdates = (workspaceSlug: string, projectId: string, epicId: string) => {
  // hooks
  const {
    create,
    fetch,
    remove,
    patch,
    createComment: _createComment,
    removeComment: _removeComment,
    reactions: { createReaction: _createReaction, removeReaction: _removeReaction },
    comments: { patchComment: _patchComment, fetchComments: _fetchComments },
  } = useUpdateDetail(EUpdateEntityType.EPIC);
  const {
    initiative: {
      epics: { fetchInitiativeEpics },
      fetchInitiativeAnalytics,
    },
  } = useInitiatives();
  const { data: currentUser } = useUser();
  const pathName = usePathname();

  // api call
  useSWR(
    projectId && epicId && workspaceSlug ? `EPIC_UPDATES_${epicId}_${projectId}` : null,
    projectId && epicId && workspaceSlug
      ? async () => {
          fetch(async () => {
            const response = await epicService.getUpdates(workspaceSlug, projectId, epicId);
            return response;
          }, epicId);
        }
      : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  if (!workspaceSlug || !epicId || !projectId) throw new Error("Missing required fields");

  const handleUpdateOperations: TUpdateOperations = useMemo(() => {
    const ops = {
      createUpdate: async (data: Partial<TUpdate>) => {
        await create(async () => {
          const response = await epicService.createUpdate(workspaceSlug, data, projectId, epicId);
          return response;
        }, epicId);
        if (pathName.includes("initiatives")) {
          const [workspaceSlug, _, initiativeId] = pathName.replace(/^\/+/, "").split("/");
          fetchInitiativeEpics(workspaceSlug, initiativeId);
          fetchInitiativeAnalytics(workspaceSlug, initiativeId);
        }
      },
      patchUpdate: async (updateId: string, data: Partial<TUpdate>) => {
        await patch(
          async () => {
            await epicService.patchUpdate(workspaceSlug, updateId, data, projectId, epicId);
          },
          updateId,
          data
        );
      },
      removeUpdate: async (updateId: string) => {
        await remove(
          async () => {
            await epicService.deleteUpdate(workspaceSlug, updateId, projectId, epicId);
          },
          epicId,
          updateId
        );
      },

      fetchComments: async (updateId: string, loaderType: TCommentLoader) => {
        await _fetchComments(
          async () => {
            const response = await epicService.getUpdateComments(workspaceSlug, updateId, projectId, epicId);
            return response;
          },
          updateId,
          loaderType
        );
      },

      createComment: async (updateId: string, data: Partial<TUpdateComment>) => {
        await _createComment(async () => {
          const response = await epicService.createUpdateComment(workspaceSlug, updateId, data, projectId, epicId);
          return response;
        }, updateId);
      },

      patchComment: async (commentId: string, data: Partial<TUpdateComment>) => {
        await _patchComment(
          async () => {
            await epicService.patchUpdateComment(workspaceSlug, commentId, data, projectId, epicId);
          },
          commentId,
          data
        );
      },

      removeComment: async (updateId: string, commentId: string) => {
        await _removeComment(
          async () => {
            await epicService.deleteUpdateComment(workspaceSlug, commentId, projectId, epicId);
          },
          updateId,
          commentId
        );
      },
      createReaction: async (updateId: string, reaction: string) => {
        await _createReaction(
          async () => {
            const response = await epicService.createUpdateReaction(
              workspaceSlug,
              updateId,
              {
                reaction,
              },
              projectId,
              epicId
            );
            return response;
          },
          updateId,
          reaction
        );
      },
      removeReaction: async (updateId: string, reaction: string) => {
        await _removeReaction(
          async () => {
            await epicService.deleteUpdateReaction(workspaceSlug, updateId, reaction, projectId, epicId);
          },
          updateId,
          reaction,
          currentUser?.id || ""
        );
      },
    };
    return ops;
  }, [workspaceSlug, projectId, epicId]);

  return {
    handleUpdateOperations,
  };
};
