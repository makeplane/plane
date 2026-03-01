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

import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import type { TEpicMeta, TIssue, TLoader } from "@plane/types";
// services
import { epicService } from "@/services/issue-types/epics/epic.service";
import { store } from "@/lib/store-context";

export interface IEpicMetaStore {
  // computed
  getProjectEpicIds: (projectId: string) => string[];
  getEpicMetaById: (projectId: string, epicId: string) => TEpicMeta | undefined;

  // actions
  fetchEpicsMeta: (workspaceSlug: string, projectId: string) => Promise<void>;
}

export class EpicMetaStore implements IEpicMetaStore {
  // observables
  private epicMetaMap: Map<string, Map<string, TEpicMeta>> = new Map();
  private epicMetaLoaderMap: Map<string, TLoader> = new Map();

  constructor() {
    makeObservable<EpicMetaStore, "epicMetaMap" | "epicMetaLoaderMap">(this, {
      // observables
      epicMetaMap: observable,
      epicMetaLoaderMap: observable,

      // actions
      fetchEpicsMeta: action,
    });
  }

  // computed
  /**
   * @description Returns all epic IDs for a project by combining epics from both the meta store
   * and work item store. This ensures we capture epics from the initial load as well as any
   * newly created epics that may not yet be in the meta store.
   * @param {string} projectId - The project ID to get epic IDs for
   * @returns {string[]} Array of unique epic IDs
   */
  getProjectEpicIds: IEpicMetaStore["getProjectEpicIds"] = computedFn((projectId) => {
    const epicIdsFromWorkItemStore = store.issue.issues.getProjectEpicIds(projectId);
    const projectMap = this.epicMetaMap.get(projectId);
    const epicIdsFromEpicMetaStore = projectMap ? Array.from(projectMap.keys()) : [];
    return Array.from(new Set([...epicIdsFromWorkItemStore, ...epicIdsFromEpicMetaStore]));
  });

  /**
   * @description Returns the epic meta data for a given epic ID. Checks both the work item store
   * and the epic meta store to get the latest data, prioritizing the work item store data.
   * @param {string} projectId - The project ID to get epic meta for
   * @param {string} epicId - The epic ID to get epic meta for
   * @returns {TEpicMeta | undefined} The epic meta for the epic ID, or undefined if not found
   */
  getEpicMetaById: IEpicMetaStore["getEpicMetaById"] = computedFn((projectId, epicId) => {
    const epicDetailFromWorkItemStore = store.issue.issues.getIssueById(epicId);
    const epicMetaFromWorkItemStore = this.convertEpicDetailToEpicMeta(epicDetailFromWorkItemStore);

    // Prioritize the epic meta from the work item store to get the latest data
    if (epicMetaFromWorkItemStore) return epicMetaFromWorkItemStore;

    // If the epic meta is not found in the work item store, then get it from the epic meta store
    const projectMap = this.epicMetaMap.get(projectId);
    if (!projectMap) return undefined;
    const epicMetaFromEpicMetaStore = projectMap.get(epicId);
    return epicMetaFromEpicMetaStore;
  });

  // actions
  /**
   * @description Fetches the epic meta data for a project and stores it in the epic meta store.
   * @param {string} workspaceSlug - The workspace slug to fetch the epic meta data from
   * @param {string} projectId - The project ID to fetch the epic meta data for
   * @returns {Promise<void>} A promise that resolves when the epic meta data is fetched and stored
   */
  fetchEpicsMeta: IEpicMetaStore["fetchEpicsMeta"] = async (workspaceSlug, projectId) => {
    try {
      this.epicMetaLoaderMap.set(projectId, this.epicMetaMap.has(projectId) ? "mutation" : "init-loader");

      const epics = await epicService.listEpicsMeta(workspaceSlug, projectId);

      runInAction(() => {
        if (!this.epicMetaMap.has(projectId)) {
          this.epicMetaMap.set(projectId, new Map());
        }

        const projectMap = this.epicMetaMap.get(projectId)!;

        epics.forEach((epic) => {
          projectMap.set(epic.id, epic);
        });

        this.epicMetaLoaderMap.set(projectId, "loaded");
      });
    } catch (error) {
      runInAction(() => {
        this.epicMetaLoaderMap.set(projectId, undefined);
      });
      throw error;
    }
  };

  // private helper methods
  /**
   * @description Converts an epic detail object to a TEpicMeta object.
   * @param {TIssue | undefined} epicDetail - The epic detail object to convert
   * @returns {TEpicMeta | undefined} The converted epic meta object, or undefined if not found
   */
  private convertEpicDetailToEpicMeta = (epicDetail: TIssue | undefined): TEpicMeta | undefined => {
    if (!epicDetail) return undefined;

    const projectIdentifier = store.projectRoot.project.getProjectIdentifierById(epicDetail.project_id);
    if (!projectIdentifier) return undefined;

    return {
      id: epicDetail.id,
      name: epicDetail.name,
      project_identifier: projectIdentifier,
      sequence_id: epicDetail.sequence_id,
    };
  };
}
