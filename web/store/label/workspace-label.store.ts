import { action, computed, makeObservable, runInAction } from "mobx";
import { set } from "lodash";
// services
import { IssueLabelService } from "services/issue";
// types
import { RootStore } from "store/root.store";
import { IIssueLabel } from "types";

export interface IWorkspaceLabelStore {
  // computed
  workspaceLabels: IIssueLabel[] | undefined;
  // actions
  fetchWorkspaceLabels: (workspaceSlug: string) => Promise<IIssueLabel[]>;
}

export class WorkspaceLabelStore implements IWorkspaceLabelStore {
  // root store
  rootStore;
  // root store labelMap
  labelMap: Record<string, IIssueLabel> = {};
  // services
  issueLabelService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // computed
      workspaceLabels: computed,
      // actions
      fetchWorkspaceLabels: action,
    });

    // root store
    this.rootStore = _rootStore;
    this.labelMap = this.rootStore.labelRoot.labelMap;
    // services
    this.issueLabelService = new IssueLabelService();
  }

  /**
   * Returns the labelMap belongs to a specific workspace
   */
  get workspaceLabels() {
    const currentWorkspaceDetails = this.rootStore.workspaceRoot.currentWorkspace;
    if (!currentWorkspaceDetails) return;
    return Object.values(this.labelMap).filter((label) => label.workspace === currentWorkspaceDetails.id);
  }

  /**
   * Fetches all the labelMap belongs to a specific project
   * @param workspaceSlug
   * @param projectId
   * @returns Promise<IIssueLabel[]>
   */
  fetchWorkspaceLabels = async (workspaceSlug: string) => {
    const response = await this.issueLabelService.getWorkspaceIssueLabels(workspaceSlug);
    runInAction(() => {
      response.forEach((label) => {
        set(this.labelMap, [label.id], label);
      });
    });
    return response;
  };
}
