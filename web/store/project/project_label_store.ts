import { observable, action, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "../root";
import { IIssueLabels } from "types";
// services
import { IssueLabelService } from "services/issue";
import { ProjectService } from "services/project";

export interface IProjectLabelStore {
  loader: boolean;
  error: any | null;

  // labels
  createLabel: (workspaceSlug: string, projectId: string, data: Partial<IIssueLabels>) => Promise<IIssueLabels>;
  updateLabel: (
    workspaceSlug: string,
    projectId: string,
    labelId: string,
    data: Partial<IIssueLabels>
  ) => Promise<IIssueLabels>;
  deleteLabel: (workspaceSlug: string, projectId: string, labelId: string) => Promise<void>;
}

export class ProjectLabelStore implements IProjectLabelStore {
  loader: boolean = false;
  error: any | null = null;

  // root store
  rootStore;
  // service
  projectService;
  issueLabelService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable,
      error: observable,

      // labels
      createLabel: action,
      updateLabel: action,
      deleteLabel: action,
    });

    this.rootStore = _rootStore;
    this.projectService = new ProjectService();
    this.issueLabelService = new IssueLabelService();
  }

  createLabel = async (workspaceSlug: string, projectId: string, data: Partial<IIssueLabels>) => {
    try {
      const response = await this.issueLabelService.createIssueLabel(
        workspaceSlug,
        projectId,
        data,
        this.rootStore.user.currentUser!
      );

      runInAction(() => {
        this.rootStore.project.labels = {
          ...this.rootStore.project.labels,
          [projectId]: [response, ...(this.rootStore.project.labels?.[projectId] || [])],
        };
      });

      return response;
    } catch (error) {
      console.log("Failed to create label from project store");
      throw error;
    }
  };

  updateLabel = async (workspaceSlug: string, projectId: string, labelId: string, data: Partial<IIssueLabels>) => {
    const originalLabel = this.rootStore.project.getProjectLabelById(labelId);

    runInAction(() => {
      this.rootStore.project.labels = {
        ...this.rootStore.project.labels,
        [projectId]:
          this.rootStore.project.labels?.[projectId]?.map((label) =>
            label.id === labelId ? { ...label, ...data } : label
          ) || [],
      };
    });

    try {
      const response = await this.issueLabelService.patchIssueLabel(
        workspaceSlug,
        projectId,
        labelId,
        data,
        this.rootStore.user.currentUser!
      );

      return response;
    } catch (error) {
      console.log("Failed to update label from project store");
      runInAction(() => {
        this.rootStore.project.labels = {
          ...this.rootStore.project.labels,
          [projectId]: (this.rootStore.project.labels?.[projectId] || [])?.map((label) =>
            label.id === labelId ? { ...label, ...originalLabel } : label
          ),
        } as any;
      });
      throw error;
    }
  };

  deleteLabel = async (workspaceSlug: string, projectId: string, labelId: string) => {
    const originalLabelList = this.rootStore.project.projectLabels;

    runInAction(() => {
      this.rootStore.project.labels = {
        ...this.rootStore.project.labels,
        [projectId]: (this.rootStore.project.labels?.[projectId] || [])?.filter((label) => label.id !== labelId),
      };
    });

    try {
      // deleting using api
      await this.issueLabelService.deleteIssueLabel(
        workspaceSlug,
        projectId,
        labelId,
        this.rootStore.user.currentUser!
      );
    } catch (error) {
      console.log("Failed to delete label from project store");
      // reverting back to original label list
      runInAction(() => {
        this.rootStore.project.labels = {
          ...this.rootStore.project.labels,
          [projectId]: originalLabelList || [],
        };
      });
    }
  };
}
