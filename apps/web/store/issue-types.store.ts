/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, makeObservable, observable, runInAction } from "mobx";
// plane imports
import type { TCreateIssueType, TIssueType, TUpdateIssueType } from "@plane/types";
// plane web imports
import { IssueTypesService } from "@/services/issue-types";
import type { CoreRootStore } from "./root.store";

export interface IIssueTypesStore {
  issueTypes: Record<string, TIssueType>;
  projectIssueTypes: Record<string, TIssueType[]>;
  workspaceIssueTypes: TIssueType[];
  getIssueTypeById: (id: string) => TIssueType | undefined;
  getProjectIssueTypes: (projectId: string) => TIssueType[];
  fetchProjectIssueTypes: (workspaceSlug: string, projectId: string) => Promise<TIssueType[]>;
  fetchWorkspaceIssueTypes: (workspaceSlug: string) => Promise<TIssueType[]>;
  createIssueType: (workspaceSlug: string, projectId: string, data: TCreateIssueType) => Promise<TIssueType>;
  updateIssueType: (
    workspaceSlug: string,
    projectId: string,
    typeId: string,
    data: TUpdateIssueType
  ) => Promise<TIssueType>;
  deleteIssueType: (workspaceSlug: string, projectId: string, typeId: string) => Promise<void>;
  enableIssueTypes: (workspaceSlug: string, projectId: string) => Promise<TIssueType>;
}

export class IssueTypesStore implements IIssueTypesStore {
  issueTypes: Record<string, TIssueType> = {};
  projectIssueTypes: Record<string, TIssueType[]> = {};
  workspaceIssueTypes: TIssueType[] = [];
  service: IssueTypesService;
  rootStore: CoreRootStore;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      issueTypes: observable,
      projectIssueTypes: observable,
      workspaceIssueTypes: observable,
      getIssueTypeById: action,
      fetchProjectIssueTypes: action,
      fetchWorkspaceIssueTypes: action,
      createIssueType: action,
      updateIssueType: action,
      deleteIssueType: action,
      enableIssueTypes: action,
    });
    this.rootStore = _rootStore;
    this.service = new IssueTypesService();
  }

  getIssueTypeById = (id: string) => this.issueTypes[id];

  getProjectIssueTypes = (projectId: string) => this.projectIssueTypes[projectId] ?? [];

  private setTypes = (types: TIssueType[]) => {
    const next = { ...this.issueTypes };
    types.forEach((t) => (next[t.id] = t));
    this.issueTypes = next;
  };

  fetchProjectIssueTypes = async (workspaceSlug: string, projectId: string) => {
    const types = await this.service.getProjectIssueTypes(workspaceSlug, projectId);
    runInAction(() => {
      this.setTypes(types);
      this.projectIssueTypes = { ...this.projectIssueTypes, [projectId]: types };
    });
    return types;
  };

  fetchWorkspaceIssueTypes = async (workspaceSlug: string) => {
    const types = await this.service.getWorkspaceIssueTypes(workspaceSlug);
    runInAction(() => {
      this.setTypes(types);
      this.workspaceIssueTypes = types;
    });
    return types;
  };

  createIssueType = async (workspaceSlug: string, projectId: string, data: TCreateIssueType) => {
    const type = await this.service.createIssueType(workspaceSlug, projectId, data);
    runInAction(() => this.setTypes([type]));
    return type;
  };

  updateIssueType = async (workspaceSlug: string, projectId: string, typeId: string, data: TUpdateIssueType) => {
    const type = await this.service.updateIssueType(workspaceSlug, projectId, typeId, data);
    runInAction(() => this.setTypes([type]));
    return type;
  };

  deleteIssueType = async (workspaceSlug: string, projectId: string, typeId: string) => {
    await this.service.deleteIssueType(workspaceSlug, projectId, typeId);
    runInAction(() => {
      const next = { ...this.issueTypes };
      delete next[typeId];
      this.issueTypes = next;
    });
  };

  enableIssueTypes = async (workspaceSlug: string, projectId: string) => {
    const type = await this.service.enableIssueTypes(workspaceSlug, projectId);
    runInAction(() => this.setTypes([type]));
    return type;
  };
}
