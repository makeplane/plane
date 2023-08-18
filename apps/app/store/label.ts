// mobx
import { action, observable, runInAction, makeAutoObservable } from "mobx";

// services
import issueService from "services/issues.service";

// types
import type { IIssueLabels, ICurrentUserResponse, LabelForm } from "types";

type LabelDataStore = {
  [projectId: string]: {
    labels: IIssueLabels[];
    isLoading: boolean;
    isRevalidating: boolean;
    error?: any;
  };
} | null;

class LabelStore {
  data: LabelDataStore = null;
  // labels: IIssueLabels[] = [];
  // isLabelsLoading: boolean = false;
  rootStore: any | null = null;

  constructor(_rootStore: any | null = null) {
    makeAutoObservable(this, {
      // labels: observable.ref,
      data: observable.ref,
      loadLabels: action,
      // isLabelsLoading: observable,
      createLabel: action,
      updateLabel: action,
      deleteLabel: action,
    });

    this.rootStore = _rootStore;
  }

  /**
   * @description Fetch all labels of a project and hydrate labels field
   */

  loadLabels = async (workspaceSlug: string, projectId: string) => {
    // this.isLabelsLoading = this.labels.length === 0;

    this.data = this.data || {
      [projectId]: {
        // labels: [...this.labels],
        labels: [...this.getLabelsByProjectId(projectId)],
        isLoading: this.getLabelsByProjectId(projectId).length === 0,
        isRevalidating: true,
        error: null,
      },
    };

    try {
      const labelsResponse: IIssueLabels[] = await issueService.getIssueLabels(
        workspaceSlug,
        projectId
      );

      // const _labels = [...(labelsResponse || [])].map((label) => ({
      //   id: label.id,
      //   name: label.name,
      //   description: label.description,
      //   color: label.color,
      //   parent: label.parent,
      // }));

      const _data = this.data?.[projectId] || {
        labels: [
          ...labelsResponse.map((label) => ({
            id: label.id,
            name: label.name,
            description: label.description,
            color: label.color,
            parent: label.parent,
            project: label.project,
          })),
        ].sort((a, b) => a.name.localeCompare(b.name)),
        isLoading: false,
        isRevalidating: false,
      };

      runInAction(() => {
        this.data = {
          ...this.data,
          [projectId]: _data,
        };
        // this.labels = _labels;
        // this.isLabelsLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.data = {
          ...this.data,
          [projectId]: {
            labels: [...this.getLabelsByProjectId(projectId)],
            isLoading: false,
            isRevalidating: false,
            error,
          },
        };
        // this.isLabelsLoading = false;
      });
      console.error("Fetching labels error", error);
    }
  };

  // getLabelById = (labelId: string) => this.labels.find((label) => label.id === labelId);

  getLabelById = (projectId: string, labelId: string) =>
    this.data?.[projectId]?.labels.find((label) => label.id === labelId) || null;

  /**
   *
   * @param projectId
   * @returns {IIssueLabels[]} array of labels of a project
   */
  getLabelsByProjectId = (projectId: string): IIssueLabels[] =>
    this.data?.[projectId]?.labels || [];

  // getLabelChildren = (labelId: string) => this.labels.filter((label) => label.parent === labelId);

  getLabelChildren = (projectId: string, labelId: string) =>
    this.data?.[projectId]?.labels.filter((label) => label.parent === labelId) || [];

  /**
   * For provided query, this function returns all labels that contain query in their name from the labels store.
   * @param query - query string
   * @returns {IIssueLabels[]} array of labels that contain query in their name
   * @example
   * getFilteredLabels("labe") // [{ id: "1", name: "label1", description: "", color: "", parent: null }]
   */
  getFilteredLabels = (projectId: string | null, query: string): IIssueLabels[] => {
    if (!projectId) return [];
    return this.data?.[projectId]?.labels.filter((label) => label.name.includes(query)) || [];
  };

  createLabel = async (
    workspaceSlug: string,
    projectId: string,
    labelForm: LabelForm,
    user: ICurrentUserResponse
  ) => {
    try {
      const labelResponse: IIssueLabels = await issueService.createIssueLabel(
        workspaceSlug,
        projectId,
        labelForm,
        user
      );

      const _data = this.data?.[projectId] || {
        labels: [
          ...this.getLabelsByProjectId(projectId),
          {
            id: labelResponse.id,
            name: labelResponse.name,
            description: labelResponse.description,
            color: labelResponse.color,
            parent: labelResponse.parent,
            project: labelResponse.project,
          },
        ].sort((a, b) => a.name.localeCompare(b.name)),
        isLoading: false,
        isRevalidating: false,
      };

      runInAction(() => {
        this.data = {
          ...this.data,
          [projectId]: _data,
        };
      });
      return labelResponse;
    } catch (error) {
      console.error("Creating label error", error);
      return error;
    }
  };

  updateLabel = async (
    workspaceSlug: string,
    projectId: string,
    labelId: string,
    labelForm: Partial<LabelForm>,
    user: ICurrentUserResponse
  ) => {
    try {
      const labelResponse: IIssueLabels = await issueService.patchIssueLabel(
        workspaceSlug,
        projectId,
        labelId,
        labelForm,
        user
      );

      const _data = this.data?.[projectId] || {
        labels: [
          ...this.getLabelsByProjectId(projectId).map((label) => {
            if (label.id === labelId) {
              return {
                id: labelResponse.id,
                name: labelResponse.name,
                description: labelResponse.description,
                color: labelResponse.color,
                parent: labelResponse.parent,
                project: labelResponse.project,
              };
            }
            return label;
          }),
        ],
        isLoading: false,
        isRevalidating: false,
      };

      runInAction(() => {
        this.data = {
          ...this.data,
          [projectId]: _data,
        };
      });
    } catch (error) {
      console.error("Updating label error", error);
      return error;
    }
  };

  deleteLabel = async (
    workspaceSlug: string,
    projectId: string,
    labelId: string,
    user: ICurrentUserResponse
  ) => {
    try {
      issueService.deleteIssueLabel(workspaceSlug, projectId, labelId, user);

      const _data = this.data?.[projectId] || {
        labels: [...this.getLabelsByProjectId(projectId)].filter((label) => label.id !== labelId),
        isLoading: false,
        isRevalidating: false,
      };

      runInAction(() => {
        this.data = {
          ...this.data,
          [projectId]: _data,
        };
      });
    } catch (error) {
      console.error("Deleting label error", error);
    }
  };
}

export default LabelStore;
