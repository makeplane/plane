/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { set, sortBy, unset } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import type { IBaseLabel, IBaseLabelTree } from "@plane/types";
// helpers
import { buildTree } from "@plane/utils";
// services
import { WorkspaceProjectLabelService } from "@/services/workspace_project_label.service";
// store
import type { RootStore } from "@/plane-web/store/root.store";

export type TWorkspaceProjectLabelLoader = "init" | "mutation" | undefined;

export interface IWorkspaceProjectLabelsStore {
  // observables
  loader: TWorkspaceProjectLabelLoader;
  labelMap: Record<string, IBaseLabel>;

  // computed
  workspaceLabels: IBaseLabel[] | undefined;
  workspaceLabelsTree: IBaseLabelTree[] | undefined;

  // computed methods
  getLabelById: (labelId: string) => IBaseLabel | undefined;
  getWorkspaceLabelsByWorkspaceId: (workspaceId: string) => IBaseLabel[] | undefined;

  // actions
  fetchWorkspaceProjectLabels: (workspaceSlug: string) => Promise<IBaseLabel[]>;
  createLabel: (workspaceSlug: string, data: Partial<IBaseLabel>) => Promise<IBaseLabel>;
  updateLabel: (workspaceSlug: string, labelId: string, data: Partial<IBaseLabel>) => Promise<IBaseLabel>;
  updateLabelPosition: (
    workspaceSlug: string,
    draggingLabelId: string,
    droppedParentId: string | null,
    droppedLabelId: string | undefined,
    dropAtEndOfList: boolean
  ) => Promise<void>;
  deleteLabel: (workspaceSlug: string, labelId: string) => Promise<void>;
}

export class WorkspaceProjectLabelsStore implements IWorkspaceProjectLabelsStore {
  // observables
  loader: TWorkspaceProjectLabelLoader = undefined;
  labelMap: Record<string, IBaseLabel> = {};
  // services
  workspaceProjectLabelService: WorkspaceProjectLabelService;

  constructor(public store: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      labelMap: observable,
      // computed
      workspaceLabels: computed,
      workspaceLabelsTree: computed,
      // actions
      fetchWorkspaceProjectLabels: action,
      createLabel: action,
      updateLabel: action,
      updateLabelPosition: action,
      deleteLabel: action,
    });
    // services
    this.workspaceProjectLabelService = new WorkspaceProjectLabelService();
  }

  /**
   * @description get all workspace labels sorted by sort_order
   * @returns { IBaseLabel[] | undefined }
   */
  get workspaceLabels(): IBaseLabel[] | undefined {
    const currentWorkspace = this.store.workspaceRoot.currentWorkspace;
    if (!currentWorkspace) return undefined;
    return this.getWorkspaceLabelsByWorkspaceId(currentWorkspace.id);
  }

  /**
   * @description get workspace labels in tree format
   * @returns { IBaseLabelTree[] | undefined }
   */
  get workspaceLabelsTree(): IBaseLabelTree[] | undefined {
    if (!this.workspaceLabels) return undefined;
    // Normalize labels to ensure parent field exists (buildTree expects parent to be null, not undefined)
    const normalizedLabels = this.workspaceLabels.map((label) => ({
      ...label,
      parent: label.parent ?? null,
    }));
    // buildTree expects IIssueLabel[] but only uses parent/id fields which exist in IBaseLabel
    return buildTree(normalizedLabels as any) as IBaseLabelTree[];
  }

  /**
   * @description get label by id
   * @param { string } labelId
   * @returns { IBaseLabel | undefined }
   */
  getLabelById = computedFn((labelId: string): IBaseLabel | undefined => this.labelMap[labelId] || undefined);

  /**
   * @description get workspace labels by workspace id
   * @param { string } workspaceId
   * @returns { IBaseLabel[] | undefined }
   */
  getWorkspaceLabelsByWorkspaceId = computedFn((workspaceId: string): IBaseLabel[] | undefined => {
    if (!workspaceId) return undefined;
    // Handle both workspace_id (new API) and workspace (legacy API) field names
    const labels = Object.values(this.labelMap).filter(
      (label) => label.workspace_id === workspaceId || (label as any).workspace === workspaceId
    );
    return sortBy(labels, "sort_order");
  });

  /**
   * @description fetch workspace project labels
   * @param { string } workspaceSlug
   * @returns { Promise<IBaseLabel[]> }
   */
  fetchWorkspaceProjectLabels = async (workspaceSlug: string): Promise<IBaseLabel[]> => {
    this.loader = "init";
    try {
      const labels = await this.workspaceProjectLabelService.getWorkspaceProjectLabels(workspaceSlug);
      runInAction(() => {
        labels.forEach((label) => {
          set(this.labelMap, label.id, label);
        });
        // update
      });
      return labels;
    } catch (error) {
      console.error("workspace project labels -> fetchWorkspaceProjectLabels", error);
      throw error;
    } finally {
      runInAction(() => {
        this.loader = undefined;
      });
    }
  };

  /**
   * @description create a new workspace project label
   * @param { string } workspaceSlug
   * @param { Partial<IBaseLabel> } data
   * @returns { Promise<IBaseLabel> }
   */
  createLabel = async (workspaceSlug: string, data: Partial<IBaseLabel>): Promise<IBaseLabel> => {
    try {
      const label = await this.workspaceProjectLabelService.createWorkspaceProjectLabel(workspaceSlug, data);
      runInAction(() => {
        set(this.labelMap, label.id, label);
      });
      return label;
    } catch (error) {
      console.error("workspace project labels -> createLabel", error);
      throw error;
    }
  };

  /**
   * @description update a workspace project label
   * @param { string } workspaceSlug
   * @param { string } labelId
   * @param { Partial<IBaseLabel> } data
   * @returns { Promise<IBaseLabel> }
   */
  updateLabel = async (workspaceSlug: string, labelId: string, data: Partial<IBaseLabel>): Promise<IBaseLabel> => {
    const originalLabel = this.labelMap[labelId];
    try {
      // optimistic update
      runInAction(() => {
        set(this.labelMap, labelId, { ...originalLabel, ...data });
      });
      const label = await this.workspaceProjectLabelService.updateWorkspaceProjectLabel(workspaceSlug, labelId, data);
      return label;
    } catch (error) {
      // rollback on error
      runInAction(() => {
        set(this.labelMap, labelId, originalLabel);
      });
      console.error("workspace project labels -> updateLabel", error);
      throw error;
    }
  };

  /**
   * @description update label position (drag and drop)
   * @param { string } workspaceSlug
   * @param { string } draggingLabelId
   * @param { string | null } droppedParentId
   * @param { string | undefined } droppedLabelId
   * @param { boolean } dropAtEndOfList
   * @returns { Promise<void> }
   */
  updateLabelPosition = async (
    workspaceSlug: string,
    draggingLabelId: string,
    droppedParentId: string | null,
    droppedLabelId: string | undefined,
    dropAtEndOfList: boolean
  ): Promise<void> => {
    const currLabel = this.labelMap[draggingLabelId];
    const labelTree = this.workspaceLabelsTree;
    let currentArray: IBaseLabel[];

    if (!currLabel || !labelTree) return;

    // If dropped in same parent without specific target, keep original position
    if (currLabel.parent === droppedParentId && !droppedLabelId) return;

    const data: Partial<IBaseLabel> = { parent: droppedParentId };

    // Find array in which the label is to be added
    if (!droppedParentId) {
      currentArray = labelTree;
    } else {
      currentArray = labelTree.find((label) => label.id === droppedParentId)?.children || [];
    }

    let droppedLabelIndex = currentArray.findIndex((label) => label.id === droppedLabelId);
    // If position cannot be determined, drop at end of list
    if (dropAtEndOfList || droppedLabelIndex === -1) droppedLabelIndex = currentArray.length;

    // Calculate sort order if array has items
    if (currentArray.length > 0) {
      let prevSortOrder: number | undefined;
      let nextSortOrder: number | undefined;

      if (typeof currentArray[droppedLabelIndex - 1] !== "undefined") {
        prevSortOrder = currentArray[droppedLabelIndex - 1].sort_order;
      }
      if (typeof currentArray[droppedLabelIndex] !== "undefined") {
        nextSortOrder = currentArray[droppedLabelIndex].sort_order;
      }

      let sortOrder = 65535;
      if (prevSortOrder && nextSortOrder) {
        sortOrder = (prevSortOrder + nextSortOrder) / 2;
      } else if (nextSortOrder) {
        sortOrder = nextSortOrder / 2;
      } else if (prevSortOrder) {
        sortOrder = prevSortOrder + 10000;
      }
      data.sort_order = sortOrder;
    }

    return this.updateLabel(workspaceSlug, draggingLabelId, data).then(() => undefined);
  };

  /**
   * @description delete a workspace project label
   * @param { string } workspaceSlug
   * @param { string } labelId
   * @returns { Promise<void> }
   */
  deleteLabel = async (workspaceSlug: string, labelId: string): Promise<void> => {
    const currentLabel = this.labelMap[labelId];
    if (!currentLabel) return;

    try {
      // optimistic delete
      runInAction(() => {
        unset(this.labelMap, labelId);
      });
      await this.workspaceProjectLabelService.deleteWorkspaceProjectLabel(workspaceSlug, labelId);
    } catch (error) {
      // rollback on error
      runInAction(() => {
        set(this.labelMap, labelId, currentLabel);
      });
      console.error("workspace project labels -> deleteLabel", error);
      throw error;
    }
  };
}
