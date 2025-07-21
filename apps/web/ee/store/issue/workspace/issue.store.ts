import { runInAction } from "mobx";
import { TIssue, IBlockUpdateDependencyData } from "@plane/types";
import { IIssueRootStore } from "@/store/issue/root.store";
import { IWorkspaceIssuesFilter } from "@/store/issue/workspace/filter.store";
import {
  IWorkspaceIssues as ICoreWorkspaceIssues,
  WorkspaceIssues as CoreWorkspaceIssues,
} from "@/store/issue/workspace/issue.store";

export interface IWorkspaceIssues extends ICoreWorkspaceIssues {
  updateIssueDates: (workspaceSlug: string, updates: IBlockUpdateDependencyData[]) => Promise<void>;
}

export class WorkspaceIssues extends CoreWorkspaceIssues implements IWorkspaceIssues {
  constructor(_rootStore: IIssueRootStore, issueFilterStore: IWorkspaceIssuesFilter) {
    super(_rootStore, issueFilterStore);
  }

  /**
   * @description Update the issue dates in the workspace
   * @param { string } workspaceSlug
   * @param { IBlockUpdateDependencyData[] } updates
   */
  updateIssueDates = async (workspaceSlug: string, updates: IBlockUpdateDependencyData[]) => {
    const issueDatesBeforeChange: IBlockUpdateDependencyData[] = [];
    try {
      const getIssueById = this.rootIssueStore.issues.getIssueById;
      runInAction(() => {
        for (const update of updates) {
          const dates: Partial<TIssue> = {};
          if (update.start_date) dates.start_date = update.start_date;
          if (update.target_date) dates.target_date = update.target_date;

          const currIssue = getIssueById(update.id);

          if (currIssue) {
            issueDatesBeforeChange.push({
              id: update.id,
              start_date: currIssue.start_date ?? undefined,
              target_date: currIssue.target_date ?? undefined,
            });
          }

          if (update.meta?.project_id) {
            this.issueUpdate(workspaceSlug, update.meta.project_id, update.id, dates, false);
          }
        }
      });

      await this.workspaceService.updateWorkItemDates(workspaceSlug, updates);
    } catch (e) {
      runInAction(() => {
        for (const update of issueDatesBeforeChange) {
          const dates: Partial<TIssue> = {};
          if (update.start_date) dates.start_date = update.start_date;
          if (update.target_date) dates.target_date = update.target_date;

          if (update.meta?.project_id) {
            this.issueUpdate(workspaceSlug, update.meta.project_id, update.id, dates, false);
          }
        }
      });
      console.error("error while updating Timeline dependencies");
      throw e;
    }
  };
}
