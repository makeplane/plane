import { observable, action, makeObservable, runInAction, computed } from "mobx";
// types
import { RootStore } from "../root";
import { IIssueLabels } from "types";
// services
import { IssueLabelService } from "services/issue";
import { ProjectService } from "services/project";

export interface IProjectLabelStore {
  loader: boolean;
  error: any | null;
  labels: {
    [projectId: string]: IIssueLabels[] | null; // project_id: labels
  } | null;
  // computed
  projectLabels: IIssueLabels[] | null;
  // actions
  getProjectLabelById: (labelId: string) => IIssueLabels | null;
  fetchProjectLabels: (workspaceSlug: string, projectId: string) => Promise<void>;
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
  labels: {
    [projectId: string]: IIssueLabels[]; // projectId: labels
  } | null = {};
  // root store
  rootStore;
  // service
  projectService;
  issueLabelService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable.ref,
      error: observable.ref,
      labels: observable.ref,
      // computed
      projectLabels: computed,
      // actions
      getProjectLabelById: action,
      fetchProjectLabels: action,
      createLabel: action,
      updateLabel: action,
      deleteLabel: action,
    });

    this.rootStore = _rootStore;
    this.projectService = new ProjectService();
    this.issueLabelService = new IssueLabelService();
  }

  get projectLabels() {
    if (!this.rootStore.project.projectId) return null;
    return this.labels?.[this.rootStore.project.projectId]?.sort((a, b) => a.name.localeCompare(b.name)) || null;
  }

  getProjectLabelById = (labelId: string) => {
    if (!this.rootStore.project.projectId) return null;
    const labels = this.projectLabels;
    if (!labels) return null;
    const labelInfo: IIssueLabels | null = labels.find((label) => label.id === labelId) || null;
    return labelInfo;
  };

  fetchProjectLabels = async (workspaceSlug: string, projectId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const labelResponse = await this.issueLabelService.getProjectIssueLabels(workspaceSlug, projectId);

      runInAction(() => {
        this.labels = {
          ...this.labels,
          [projectId]: labelResponse,
        };
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      console.error(error);
      this.loader = false;
      this.error = error;
    }
  };

  createLabel = async (workspaceSlug: string, projectId: string, data: Partial<IIssueLabels>) => {
    try {
      const response = await this.issueLabelService.createIssueLabel(
        workspaceSlug,
        projectId,
        data,
        this.rootStore.user.currentUser!
      );

      runInAction(() => {
        this.labels = {
          ...this.labels,
          [projectId]: [response, ...(this.labels?.[projectId] || [])],
        };
      });

      return response;
    } catch (error) {
      console.log("Failed to create label from project store");
      throw error;
    }
  };

  updateLabel = async (workspaceSlug: string, projectId: string, labelId: string, data: Partial<IIssueLabels>) => {
    const originalLabel = this.getProjectLabelById(labelId);

    runInAction(() => {
      this.labels = {
        ...this.labels,
        [projectId]:
          this.labels?.[projectId]?.map((label) => (label.id === labelId ? { ...label, ...data } : label)) || [],
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
        this.labels = {
          ...this.labels,
          [projectId]: (this.labels?.[projectId] || [])?.map((label) =>
            label.id === labelId ? { ...label, ...originalLabel } : label
          ),
        };
      });
      throw error;
    }
  };

  deleteLabel = async (workspaceSlug: string, projectId: string, labelId: string) => {
    const originalLabelList = this.projectLabels;

    runInAction(() => {
      this.labels = {
        ...this.labels,
        [projectId]: (this.labels?.[projectId] || [])?.filter((label) => label.id !== labelId),
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
        this.labels = {
          ...this.labels,
          [projectId]: originalLabelList || [],
        };
      });
    }
  };
}
