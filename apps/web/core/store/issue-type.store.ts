/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set, sortBy } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type { IIssueType } from "@plane/types";
// services
import { IssueTypeService } from "@/services/issue-type.service";
// store
import type { CoreRootStore } from "./root.store";

export interface IIssueTypeStore {
  // observables
  issueTypeMap: Record<string, IIssueType>;
  projectIssueTypesMap: Record<string, string[]>;
  // loaders
  fetchedMap: Record<string, boolean>;
  // computed
  projectIssueTypes: IIssueType[] | undefined;
  // computed actions
  getIssueTypeById: (issueTypeId: string | null | undefined) => IIssueType | undefined;
  getProjectIssueTypes: (projectId: string | null | undefined, activeOnly?: boolean) => IIssueType[] | undefined;
  getProjectIssueTypeIds: (projectId: string | null | undefined) => string[] | undefined;
  getProjectDefaultIssueTypeId: (projectId: string | null | undefined) => string | undefined;
  getProjectEpicId: (projectId: string | null | undefined) => string | undefined;
  // fetch actions
  fetchProjectIssueTypes: (workspaceSlug: string, projectId: string) => Promise<IIssueType[]>;
  // activation (irreversible; backend seeds the default + epic types)
  enableIssueTypes: (workspaceSlug: string, projectId: string) => Promise<IIssueType[]>;
  // crud actions
  createIssueType: (workspaceSlug: string, projectId: string, data: Partial<IIssueType>) => Promise<IIssueType>;
  updateIssueType: (
    workspaceSlug: string,
    projectId: string,
    issueTypeId: string,
    data: Partial<IIssueType>
  ) => Promise<IIssueType | undefined>;
  deleteIssueType: (workspaceSlug: string, projectId: string, issueTypeId: string) => Promise<void>;
}

export class IssueTypeStore implements IIssueTypeStore {
  // observables
  issueTypeMap: Record<string, IIssueType> = {};
  projectIssueTypesMap: Record<string, string[]> = {};
  // loaders
  fetchedMap: Record<string, boolean> = {};
  // root store
  rootStore: CoreRootStore;
  router;
  // services
  issueTypeService: IssueTypeService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      issueTypeMap: observable,
      projectIssueTypesMap: observable,
      fetchedMap: observable,
      // computed
      projectIssueTypes: computed,
      // fetch actions
      fetchProjectIssueTypes: action,
      enableIssueTypes: action,
      // crud actions
      createIssueType: action,
      updateIssueType: action,
      deleteIssueType: action,
    });
    this.rootStore = _rootStore;
    this.router = _rootStore.router;
    this.issueTypeService = new IssueTypeService();
  }

  /**
   * Returns the issue types belonging to the current project
   */
  get projectIssueTypes() {
    const projectId = this.router.projectId;
    return this.getProjectIssueTypes(projectId, false);
  }

  /**
   * @description returns issue type details using issue type id
   * @param issueTypeId
   */
  getIssueTypeById = computedFn((issueTypeId: string | null | undefined) => {
    if (!issueTypeId) return undefined;
    return this.issueTypeMap[issueTypeId] ?? undefined;
  });

  /**
   * @description returns the issue types belonging to a project
   * @param projectId
   * @param activeOnly - when true only the active types are returned
   */
  getProjectIssueTypes = computedFn((projectId: string | null | undefined, activeOnly = false) => {
    if (!projectId || !this.fetchedMap[projectId]) return undefined;
    const issueTypeIds = this.projectIssueTypesMap[projectId] ?? [];
    const issueTypes = issueTypeIds
      .map((issueTypeId) => this.issueTypeMap[issueTypeId])
      .filter((issueType): issueType is IIssueType => Boolean(issueType) && (!activeOnly || issueType.is_active));
    return sortBy(issueTypes, ["level", "name"]);
  });

  /**
   * @description returns the issue type ids belonging to a project
   * @param projectId
   */
  getProjectIssueTypeIds = computedFn((projectId: string | null | undefined) => {
    const issueTypes = this.getProjectIssueTypes(projectId, false);
    return issueTypes?.map((issueType) => issueType.id);
  });

  /**
   * @description returns the default issue type id for a project
   * @param projectId
   */
  getProjectDefaultIssueTypeId = computedFn((projectId: string | null | undefined) => {
    const issueTypes = this.getProjectIssueTypes(projectId, true);
    return issueTypes?.find((issueType) => issueType.is_default && !issueType.is_epic)?.id;
  });

  /**
   * @description returns the epic issue type id for a project
   * @param projectId
   */
  getProjectEpicId = computedFn((projectId: string | null | undefined) => {
    const issueTypes = this.getProjectIssueTypes(projectId, false);
    return issueTypes?.find((issueType) => issueType.is_epic)?.id;
  });

  /**
   * @description fetches the issue types of a project
   * @param workspaceSlug
   * @param projectId
   */
  fetchProjectIssueTypes = async (workspaceSlug: string, projectId: string) => {
    const issueTypesResponse = await this.issueTypeService.list(workspaceSlug, projectId);
    runInAction(() => {
      issueTypesResponse.forEach((issueType) => {
        set(this.issueTypeMap, [issueType.id], issueType);
      });
      set(
        this.projectIssueTypesMap,
        [projectId],
        issueTypesResponse.map((issueType) => issueType.id)
      );
      set(this.fetchedMap, projectId, true);
    });
    return issueTypesResponse;
  };

  /**
   * @description enables work item types on a project (irreversible); the backend seeds the
   * default "Work Item" and "Epic" types and returns the full type list, which is stored.
   * @param workspaceSlug
   * @param projectId
   */
  enableIssueTypes = async (workspaceSlug: string, projectId: string) => {
    const issueTypesResponse = await this.issueTypeService.enable(workspaceSlug, projectId);
    runInAction(() => {
      issueTypesResponse.forEach((issueType) => {
        set(this.issueTypeMap, [issueType.id], issueType);
      });
      set(
        this.projectIssueTypesMap,
        [projectId],
        issueTypesResponse.map((issueType) => issueType.id)
      );
      set(this.fetchedMap, projectId, true);
    });
    return issueTypesResponse;
  };

  /**
   * @description creates a new issue type in a project and adds it to the store
   * @param workspaceSlug
   * @param projectId
   * @param data
   */
  createIssueType = async (workspaceSlug: string, projectId: string, data: Partial<IIssueType>) =>
    await this.issueTypeService.create(workspaceSlug, projectId, data).then((response) => {
      runInAction(() => {
        set(this.issueTypeMap, [response.id], response);
        const projectIssueTypeIds = this.projectIssueTypesMap[projectId] ?? [];
        if (!projectIssueTypeIds.includes(response.id)) {
          set(this.projectIssueTypesMap, [projectId], [...projectIssueTypeIds, response.id]);
        }
      });
      return response;
    });

  /**
   * @description updates the issue type details, reverting on failure
   * @param workspaceSlug
   * @param projectId
   * @param issueTypeId
   * @param data
   */
  updateIssueType = async (
    workspaceSlug: string,
    projectId: string,
    issueTypeId: string,
    data: Partial<IIssueType>
  ) => {
    const originalIssueType = this.issueTypeMap[issueTypeId];
    try {
      runInAction(() => {
        set(this.issueTypeMap, [issueTypeId], { ...this.issueTypeMap?.[issueTypeId], ...data });
      });
      const response = await this.issueTypeService.update(workspaceSlug, projectId, issueTypeId, data);
      return response;
    } catch (error) {
      runInAction(() => {
        set(this.issueTypeMap, [issueTypeId], originalIssueType);
      });
      throw error;
    }
  };

  /**
   * @description deletes the issue type from the store
   * @param workspaceSlug
   * @param projectId
   * @param issueTypeId
   */
  deleteIssueType = async (workspaceSlug: string, projectId: string, issueTypeId: string) => {
    if (!this.issueTypeMap?.[issueTypeId]) return;
    await this.issueTypeService.destroy(workspaceSlug, projectId, issueTypeId);
    runInAction(() => {
      delete this.issueTypeMap[issueTypeId];
      const projectIssueTypeIds = this.projectIssueTypesMap[projectId] ?? [];
      set(
        this.projectIssueTypesMap,
        [projectId],
        projectIssueTypeIds.filter((id) => id !== issueTypeId)
      );
    });
  };
}
