import { makeObservable, observable, action, runInAction, computed } from "mobx";
import keyBy from "lodash/keyBy";
import omit from "lodash/omit";
// services
import { IssueLabelService } from "services/issue";
// types
import { IIssueLabel, IIssueLabelTree } from "types";
// helpers
import { buildTree } from "helpers/array.helper";
// store
import { RootStore } from "./root.store";

export interface ILabelStore {
  labels: { [key: string]: IIssueLabel };
  projectLabels: IIssueLabel[] | undefined;
  projectLabelsTree: IIssueLabelTree[] | undefined;
  fetchProjectLabels: (workspaceSlug: string, projectId: string) => Promise<IIssueLabel[]>;
  createLabel: (workspaceSlug: string, projectId: string, data: Partial<IIssueLabel>) => Promise<IIssueLabel>;
  updateLabel: (
    workspaceSlug: string,
    projectId: string,
    labelId: string,
    data: Partial<IIssueLabel>
  ) => Promise<IIssueLabel>;
  updateLabelPosition: (
    workspaceSlug: string,
    projectId: string,
    labelId: string,
    parentId: string | null | undefined,
    index: number,
    isSameParent: boolean,
    prevIndex: number | undefined
  ) => Promise<IIssueLabel | undefined>;
  deleteLabel: (workspaceSlug: string, projectId: string, labelId: string) => Promise<void>;
}

export class LabelStore {
  labels: { [key: string]: IIssueLabel } = {};
  issueLabelService;
  router;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      labels: observable.ref,
      // computed
      projectLabels: computed,
      projectLabelsTree: computed,
      // actions
      fetchProjectLabels: action,
      createLabel: action,
      updateLabel: action,
      updateLabelPosition: action,
    });
    this.issueLabelService = new IssueLabelService();
    this.router = _rootStore.app.router;
  }

  /**
   * Returns the labels belongs to a specific project
   */
  get projectLabels() {
    if (!this.router.query?.projectId) return;
    return Object.values(this.labels).filter((label) => label.project === this.router.query.projectId);
  }

  /**
   * Returns the labels in a tree format
   */
  get projectLabelsTree() {
    if (!this.projectLabels) return;
    return buildTree(this.projectLabels);
  }

  /**
   * Fetches all the labels belongs to a specific project
   * @param workspaceSlug
   * @param projectId
   * @returns Promise<IIssueLabel[]>
   */
  fetchProjectLabels = async (workspaceSlug: string, projectId: string) => {
    const response = await this.issueLabelService.getProjectIssueLabels(workspaceSlug, projectId);
    runInAction(() => {
      this.labels = {
        ...this.labels,
        ...keyBy(response, "id"),
      };
    });
    return response;
  };

  /**
   * Creates a new label for a specific project and add it to the store
   * @param workspaceSlug
   * @param projectId
   * @param data
   * @returns Promise<IIssueLabel>
   */
  createLabel = async (workspaceSlug: string, projectId: string, data: Partial<IIssueLabel>) => {
    const response = await this.issueLabelService.createIssueLabel(workspaceSlug, projectId, data);
    runInAction(() => {
      this.labels = {
        ...this.labels,
        [response.id]: response,
      };
    });
    return response;
  };

  /**
   * Updates a label for a specific project and update it in the store
   * @param workspaceSlug
   * @param projectId
   * @param labelId
   * @param data
   * @returns Promise<IIssueLabel>
   */
  updateLabel = async (workspaceSlug: string, projectId: string, labelId: string, data: Partial<IIssueLabel>) => {
    const originalLabel = this.labels[labelId];
    try {
      runInAction(() => {
        this.labels = {
          ...this.labels,
          [labelId]: { ...this.labels[labelId], ...data },
        };
      });
      const response = await this.issueLabelService.patchIssueLabel(workspaceSlug, projectId, labelId, data);
      return response;
    } catch (error) {
      console.log("Failed to update label from project store");
      runInAction(() => {
        this.labels = {
          ...this.labels,
          [labelId]: { ...this.labels[labelId], ...originalLabel },
        };
      });
      throw error;
    }
  };

  /**
   * updates the sort order of a label and updates the label information using API.
   * @param workspaceSlug
   * @param projectId
   * @param labelId
   * @param parentId
   * @param index
   * @param isSameParent
   * @param prevIndex
   * @returns
   */
  updateLabelPosition = async (
    workspaceSlug: string,
    projectId: string,
    labelId: string,
    parentId: string | null | undefined,
    index: number,
    isSameParent: boolean,
    prevIndex: number | undefined
  ) => {
    const currLabel = this.labels?.[labelId];
    const labelTree = this.projectLabelsTree;

    let currentArray: IIssueLabel[];

    if (!currLabel || !labelTree) return;

    const data: Partial<IIssueLabel> = { parent: parentId };
    //find array in which the label is to be added
    if (!parentId) currentArray = labelTree;
    else currentArray = labelTree?.find((label) => label.id === parentId)?.children || [];

    //Add the array at the destination
    if (isSameParent && prevIndex !== undefined) currentArray.splice(prevIndex, 1);

    currentArray.splice(index, 0, currLabel);

    //if currently adding to a new array, then let backend assign a sort order
    if (currentArray.length > 1) {
      let prevSortOrder: number | undefined, nextSortOrder: number | undefined;

      if (typeof currentArray[index - 1] !== "undefined") {
        prevSortOrder = currentArray[index - 1].sort_order;
      }

      if (typeof currentArray[index + 1] !== "undefined") {
        nextSortOrder = currentArray[index + 1].sort_order;
      }

      let sortOrder: number;

      //based on the next and previous labels calculate current sort order
      if (prevSortOrder && nextSortOrder) {
        sortOrder = (prevSortOrder + nextSortOrder) / 2;
      } else if (nextSortOrder) {
        sortOrder = nextSortOrder + 10000;
      } else {
        sortOrder = prevSortOrder! / 2;
      }

      data.sort_order = sortOrder;
    }

    return this.updateLabel(workspaceSlug, projectId, labelId, data);
  };

  /**
   * Delete the label from the project and remove it from the labels object
   * @param workspaceSlug
   * @param projectId
   * @param labelId
   */
  deleteLabel = async (workspaceSlug: string, projectId: string, labelId: string) => {
    const originalLabel = this.labels[labelId];
    runInAction(() => {
      this.labels = omit(this.labels, labelId);
    });
    try {
      // deleting using api
      await this.issueLabelService.deleteIssueLabel(workspaceSlug, projectId, labelId);
    } catch (error) {
      console.log("Failed to delete label from project store");
      // reverting back to original label list
      runInAction(() => {
        this.labels = {
          ...this.labels,
          [labelId]: originalLabel,
        };
      });
    }
  };
}
