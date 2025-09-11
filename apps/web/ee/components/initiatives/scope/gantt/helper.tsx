import { useTranslation } from "@plane/i18n";
import {
  EGanttBlockType,
  EIssuesStoreType,
  IBlockUpdateData,
  IBlockUpdateDependencyData,
  TIssue,
  TProject,
} from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { IssueGanttBlock } from "@/components/issues/issue-layouts/gantt/blocks";
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import { ProjectGanttBlock } from "@/plane-web/components/projects/layouts/gantt/blocks";

export const useGanttOperations = (workspaceSlug: string) => {
  const { updateProject } = useProject();
  const { issues } = useIssues(EIssuesStoreType.GLOBAL);
  const { updateIssue } = useIssuesActions(EIssuesStoreType.EPIC);
  const { t } = useTranslation();

  // Generic error handler
  const handleUpdateError = (operation: string, error?: any) => {
    setToast({
      type: TOAST_TYPE.ERROR,
      title: t("toast.error"),
      message: `Error while ${operation}, Please try again later`,
    });
    console.error(`Gantt operation error: ${operation}`, error);
  };

  // Project update operations
  const projectOperations = {
    updateStructure: async (project: TProject, data: IBlockUpdateData): Promise<void> => {
      if (!workspaceSlug || !updateProject) return;

      try {
        const payload = { ...data };
        await updateProject(workspaceSlug.toString(), project.id, payload as Partial<TProject>);
      } catch (error) {
        handleUpdateError("updating project structure", error);
        throw error;
      }
    },

    updateDates: async (updates: IBlockUpdateDependencyData[]): Promise<void> => {
      const update = updates[0];
      if (!update || !workspaceSlug || !updateProject) return;

      try {
        const payload: Partial<TProject> = {};
        if (update.start_date) payload.start_date = update.start_date;
        if (update.target_date) payload.target_date = update.target_date;

        await updateProject(workspaceSlug.toString(), update.id, payload);
      } catch (error) {
        handleUpdateError("updating project dates", error);
        throw error;
      }
    },
  };

  // Work item update operations
  const workItemOperations = {
    updateStructure: async (issue: TIssue, data: IBlockUpdateData): Promise<void> => {
      if (!workspaceSlug || !updateIssue) return;

      try {
        const payload: any = { ...data };
        if (data.sort_order) payload.sort_order = data.sort_order.newSortOrder;

        await updateIssue(issue.project_id, issue.id, payload);
      } catch (error) {
        handleUpdateError("updating work item structure", error);
        throw error;
      }
    },

    updateDates: async (updates: IBlockUpdateDependencyData[]): Promise<void> => {
      if (!workspaceSlug) return;

      try {
        const dateUpdates = updates.map(({ id, start_date, target_date, meta }) => {
          const projectId = meta?.project_id;
          return {
            id,
            start_date,
            target_date,
            project_id: projectId,
          };
        });

        await issues.updateIssueDates(workspaceSlug.toString(), dateUpdates);
      } catch (error) {
        handleUpdateError("updating work item dates", error);
      }
    },
  };

  // Operation dispatcher based on block type
  const getOperations = (blockType: EGanttBlockType) => {
    switch (blockType) {
      case EGanttBlockType.PROJECT:
        return projectOperations;
      case EGanttBlockType.EPIC:
        return workItemOperations;
      default:
        return null;
    }
  };

  // Main handlers
  const blockStructureUpdateHandler = async (block: any, payload: IBlockUpdateData): Promise<void> => {
    const operations = getOperations(payload.meta?.type);
    if (operations) {
      await operations.updateStructure(block, payload);
    }
  };

  const blockDatesUpdateHandler = async (updates: IBlockUpdateDependencyData[]): Promise<void> => {
    const update = updates[0];
    if (!update) return;

    const operations = getOperations(update.meta?.type);
    if (operations) {
      await operations.updateDates(updates);
    }
  };

  return {
    blockStructureUpdateHandler,
    blockDatesUpdateHandler,
  };
};

/**
 * Block render map
 */
const blockRenderMap: Record<EGanttBlockType, (data: any) => React.ReactNode> = {
  [EGanttBlockType.EPIC]: (data: TIssue) => <IssueGanttBlock issueId={data.id} isEpic />,
  [EGanttBlockType.PROJECT]: (data: TProject) => <ProjectGanttBlock projectId={data.id} />,
  [EGanttBlockType.WORK_ITEM]: (data: TIssue) => <IssueGanttBlock issueId={data.id} />,
};

/**
 * Block render helper
 */
export const getBlockToRender = (data: any) => {
  const type = data.meta?.type as EGanttBlockType | undefined;
  if (!type) return null;
  return blockRenderMap[type](data);
};
