// mobx
import { action, observable, runInAction, makeAutoObservable } from "mobx";

// services
import issueService from "services/issues.service";

// types
import type { IIssueLabels, ICurrentUserResponse, LabelForm } from "types";

class LabelStore {
  labels: IIssueLabels[] = [];
  isLabelsLoading: boolean = false;
  rootStore: any | null = null;

  constructor(_rootStore: any | null = null) {
    makeAutoObservable(this, {
      labels: observable.ref,
      loadLabels: action,
      isLabelsLoading: observable,
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
    this.isLabelsLoading = this.labels.length === 0;
    try {
      const labelsResponse: IIssueLabels[] = await issueService.getIssueLabels(
        workspaceSlug,
        projectId
      );

      const _labels = [...(labelsResponse || [])].map((label) => ({
        id: label.id,
        name: label.name,
        description: label.description,
        color: label.color,
        parent: label.parent,
      }));

      runInAction(() => {
        this.labels = _labels;
        this.isLabelsLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.isLabelsLoading = false;
      });
      console.error("Fetching labels error", error);
    }
  };

  getLabelById = (labelId: string) => this.labels.find((label) => label.id === labelId);

  getLabelChildren = (labelId: string) => this.labels.filter((label) => label.parent === labelId);

  /**
   * For provided query, this function returns all labels that contain query in their name from the labels store.
   * @param query - query string
   * @returns {IIssueLabels[]} array of labels that contain query in their name
   * @example
   * getFilteredLabels("labe") // [{ id: "1", name: "label1", description: "", color: "", parent: null }]
   */
  getFilteredLabels = (query: string): IIssueLabels[] =>
    this.labels.filter((label) => label.name.includes(query));

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

      const _label = [
        ...this.labels,
        {
          id: labelResponse.id,
          name: labelResponse.name,
          description: labelResponse.description,
          color: labelResponse.color,
          parent: labelResponse.parent,
        },
      ].sort((a, b) => a.name.localeCompare(b.name));

      runInAction(() => {
        this.labels = _label;
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

      const _labels = [...this.labels]
        .map((label) => {
          if (label.id === labelId) {
            return {
              id: labelResponse.id,
              name: labelResponse.name,
              description: labelResponse.description,
              color: labelResponse.color,
              parent: labelResponse.parent,
            };
          }
          return label;
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      runInAction(() => {
        this.labels = _labels;
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

      const _labels = [...this.labels].filter((label) => label.id !== labelId);

      runInAction(() => {
        this.labels = _labels;
      });
    } catch (error) {
      console.error("Deleting label error", error);
    }
  };
}

export default LabelStore;
