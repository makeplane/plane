import { useMemo } from "react";
import { EUpdateStatus } from "@plane/types";
import { InitiativesUpdateService } from "@/plane-web/services";

const initiativeUpdateService = new InitiativesUpdateService();

export const useInitiativeUpdates = (workspaceSlug: string, initiativeId: string) => {
  if (!workspaceSlug || !initiativeId) throw new Error("Missing required fields");

  const handleUpdateOperations = useMemo(() => {
    const ops = {
      fetchUpdates: async (params?: { search: EUpdateStatus }) => {
        const response = await initiativeUpdateService.getUpdates(workspaceSlug, initiativeId, params);
        return response;
      },
      fetchProjectUpdates: async (params?: { search: EUpdateStatus }) => {
        const response = await initiativeUpdateService.getUpdates(workspaceSlug, initiativeId, params);
        return response.project_updates;
      },
      fetchEpicUpdates: async (params?: { search: EUpdateStatus }) => {
        const response = await initiativeUpdateService.getUpdates(workspaceSlug, initiativeId, params);
        return response.epic_updates;
      },
    };
    return ops;
  }, [workspaceSlug, initiativeId]);

  return {
    handleUpdateOperations,
  };
};
