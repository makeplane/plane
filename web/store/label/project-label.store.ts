import { action, computed, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
// services
import { IssueLabelService } from "services/issue";
// helpers
import { buildTree } from "helpers/array.helper";
// types
import { RootStore } from "store/root.store";
import { IIssueLabel, IIssueLabelTree } from "@plane/types";
import { ILabelRootStore } from "store/label";

export interface IProjectLabelStore {
  //Loaders
  fetchedMap: Record<string, boolean>;
  // computed
  projectLabels: IIssueLabel[] | undefined;
  projectLabelsTree: IIssueLabelTree[] | undefined;
  //computed actions
  getProjectLabels: (projectId: string) => IIssueLabel[] | undefined;
  // fetch actions
  fetchProjectLabels: (workspaceSlug: string, projectId: string) => Promise<IIssueLabel[]>;
  // crud actions
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

export class ProjectLabelStore implements IProjectLabelStore {
  // root store
  rootStore;
  // root store labelMap
  labelMap: Record<string, IIssueLabel> = {};
  //loaders
  fetchedMap: Record<string, boolean> = {};
  // services
  issueLabelService;

  constructor(_labelRoot: ILabelRootStore, _rootStore: RootStore) {
    makeObservable(this, {
      labelMap: observable,
      fetchedMap: observable,
      // computed
      projectLabels: computed,
      projectLabelsTree: computed,
      // actions
      getProjectLabels: action,

      fetchProjectLabels: action,
      createLabel: action,
      updateLabel: action,
      updateLabelPosition: action,
      deleteLabel: action,
    });

    // root store
    this.rootStore = _rootStore;
    this.labelMap = _labelRoot?.labelMap;
    // services
    this.issueLabelService = new IssueLabelService();
  }

  /**
   * Returns the labelMap belonging to the current project
   */
  get projectLabels() {
    const projectId = this.rootStore.app.router.projectId;
    if (!projectId || !this.fetchedMap[projectId] || !this.labelMap) return;
    return Object.values(this.labelMap ?? {}).filter((label) => label.project === projectId);
  }

  /**
   * Returns the labelMap in a tree format
   */
  get projectLabelsTree() {
    if (!this.projectLabels) return;
    return buildTree(this.projectLabels);
  }

  getProjectLabels = (projectId: string) => {
    if (!this.fetchedMap[projectId] || !this.labelMap) return;
    return Object.values(this.labelMap ?? {}).filter((label) => label.project === projectId);
  };

  /**
   * Fetches all the labelMap belongs to a specific project
   * @param workspaceSlug
   * @param projectId
   * @returns Promise<IIssueLabel[]>
   */
  fetchProjectLabels = async (workspaceSlug: string, projectId: string) =>
    await this.issueLabelService.getProjectLabels(workspaceSlug, projectId).then((response) => {
      runInAction(() => {
        response.forEach((label) => {
          set(this.labelMap, [label.id], label);
        });
        set(this.fetchedMap, projectId, true);
      });
      return response;
    });

  /**
   * Creates a new label for a specific project and add it to the store
   * @param workspaceSlug
   * @param projectId
   * @param data
   * @returns Promise<IIssueLabel>
   */
  createLabel = async (workspaceSlug: string, projectId: string, data: Partial<IIssueLabel>) =>
    await this.issueLabelService.createIssueLabel(workspaceSlug, projectId, data).then((response) => {
      runInAction(() => {
        set(this.labelMap, [response.id], response);
      });
      return response;
    });

  /**
   * Updates a label for a specific project and update it in the store
   * @param workspaceSlug
   * @param projectId
   * @param labelId
   * @param data
   * @returns Promise<IIssueLabel>
   */
  updateLabel = async (workspaceSlug: string, projectId: string, labelId: string, data: Partial<IIssueLabel>) => {
    const originalLabel = this.labelMap[labelId];
    try {
      runInAction(() => {
        set(this.labelMap, [labelId], { ...this.labelMap[labelId], ...data });
      });
      const response = await this.issueLabelService.patchIssueLabel(workspaceSlug, projectId, labelId, data);
      return response;
    } catch (error) {
      console.log("Failed to update label from project store");
      runInAction(() => {
        set(this.labelMap, [labelId], originalLabel);
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
    const currLabel = this.labelMap?.[labelId];
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
      //based on the next and previous labelMap calculate current sort order
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
   * Delete the label from the project and remove it from the labelMap object
   * @param workspaceSlug
   * @param projectId
   * @param labelId
   */
  deleteLabel = async (workspaceSlug: string, projectId: string, labelId: string) => {
    if (!this.labelMap[labelId]) return;
    await this.issueLabelService.deleteIssueLabel(workspaceSlug, projectId, labelId).then(() => {
      runInAction(() => {
        delete this.labelMap[labelId];
      });
    });
  };
}
