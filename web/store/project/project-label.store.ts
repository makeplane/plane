import { observable, action, makeObservable, runInAction, computed } from "mobx";
// types
import { RootStore } from "../root";
import { IIssueLabel, IIssueLabelTree } from "types";
// services
import { IssueLabelService } from "services/issue";
import { ProjectService } from "services/project";
import { buildTree } from "helpers/array.helper";

export interface IProjectLabelStore {
  loader: boolean;
  error: any | null;
  labels: {
    [projectId: string]: IIssueLabel[] | null; // project_id: labels
  } | null;
  // computed
  projectLabels: IIssueLabel[] | null;
  projectLabelsTree: IIssueLabelTree[] | null;
  projectLabelIds: (isLayoutRender?: boolean) => string[];
  // actions
  getProjectLabelById: (labelId: string) => IIssueLabel | null;
  fetchProjectLabels: (workspaceSlug: string, projectId: string) => Promise<void>;
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
  ) => Promise<IIssueLabel>;
  deleteLabel: (workspaceSlug: string, projectId: string, labelId: string) => Promise<void>;
}

export class ProjectLabelStore implements IProjectLabelStore {
  loader: boolean = false;
  error: any | null = null;
  labels: {
    [projectId: string]: IIssueLabel[]; // projectId: labels
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
      projectLabelsTree: computed,
      // actions
      getProjectLabelById: action,
      fetchProjectLabels: action,
      createLabel: action,
      updateLabel: action,
      updateLabelPosition: action,
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

  get projectLabelsTree() {
    if (!this.rootStore.project.projectId) return null;
    const currentProjectLabels = this.labels?.[this.rootStore.project.projectId];
    if (!currentProjectLabels) return null;

    currentProjectLabels.sort((labelA: IIssueLabel, labelB: IIssueLabel) => labelB.sort_order - labelA.sort_order);
    return buildTree(currentProjectLabels);
  }

  getProjectLabelById = (labelId: string) => {
    if (!this.rootStore.project.projectId) return null;
    const labels = this.projectLabels;
    if (!labels) return null;
    const labelInfo: IIssueLabel | null = labels.find((label) => label.id === labelId) || null;
    return labelInfo;
  };

  projectLabelIds = (isLayoutRender: boolean = false) => {
    if (!this.projectLabels) return [];
    let labelIds = (this.projectLabels ?? []).map((label) => label.id);
    labelIds = isLayoutRender ? [...labelIds, "None"] : labelIds;
    return labelIds;
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

  createLabel = async (workspaceSlug: string, projectId: string, data: Partial<IIssueLabel>) => {
    try {
      const response = await this.issueLabelService.createIssueLabel(workspaceSlug, projectId, data);

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

  updateLabelPosition = async (
    workspaceSlug: string,
    projectId: string,
    labelId: string,
    parentId: string | null | undefined,
    index: number,
    isSameParent: boolean,
    prevIndex: number | undefined
  ) => {
    const labels = this.labels;
    const currLabel = labels?.[projectId]?.find((label) => label.id === labelId);
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

  updateLabel = async (workspaceSlug: string, projectId: string, labelId: string, data: Partial<IIssueLabel>) => {
    const originalLabel = this.getProjectLabelById(labelId);

    runInAction(() => {
      this.labels = {
        ...this.labels,
        [projectId]:
          this.labels?.[projectId]?.map((label) => (label.id === labelId ? { ...label, ...data } : label)) || [],
      };
    });

    try {
      const response = await this.issueLabelService.patchIssueLabel(workspaceSlug, projectId, labelId, data);

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
      await this.issueLabelService.deleteIssueLabel(workspaceSlug, projectId, labelId);
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
