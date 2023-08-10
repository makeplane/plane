// mobx
import { action, observable, runInAction, makeObservable } from "mobx";

// services
import issueService from "services/issues.service";

// types
import type { IIssueLabels, LabelForm, ICurrentUserResponse } from "types";

class LabelStore {
  labels: IIssueLabels[] = [];
  rootStore: any | null = null;

  constructor(_rootStore: any | null = null) {
    makeObservable(this, {
      labels: observable.ref,
      loadLabels: action,
      createLabel: action,
      updateLabel: action,
      deleteLabel: action,
    });

    this.rootStore = _rootStore;
  }

  loadLabels = async (workspaceSlug: string, projectId: string) => {
    try {
      const labelsResponse: IIssueLabels[] = await issueService.getIssueLabels(
        workspaceSlug,
        projectId
      );
      runInAction(() => {
        this.labels = labelsResponse;
      });
    } catch (error) {
      console.error("Fetching labels error", error);
    }
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
      runInAction(() => {
        this.labels.push(labelResponse);
      });
    } catch (error) {
      console.error("Creating label error", error);
    }
  };

  updateLabel = async (
    workspaceSlug: string,
    projectId: string,
    labelId: string,
    labelForm: LabelForm,
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
      runInAction(() => {
        const labelIndex = this.labels.findIndex((label) => label.id === labelId);
        this.labels[labelIndex] = labelResponse;
      });
    } catch (error) {
      console.error("Updating label error", error);
    }
  };

  deleteLabel = async (
    workspaceSlug: string,
    projectId: string,
    labelId: string,
    user: ICurrentUserResponse
  ) => {
    try {
      await issueService.deleteIssueLabel(workspaceSlug, projectId, labelId, user);
      runInAction(() => {
        this.labels = this.labels.filter((label) => label.id !== labelId);
      });
    } catch (error) {
      console.error("Deleting label error", error);
    }
  };
}

export default LabelStore;
