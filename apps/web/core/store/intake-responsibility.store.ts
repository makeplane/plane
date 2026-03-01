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
// services
import { IntakeResponsibilityService } from "@/services/intake-responsibility.service";
// store
import type { RootStore } from "@/plane-web/store/root.store";

export interface IIntakeResponsibilityStore {
  assigneesMap: Map<string, string[]>;
  fetchIntakeAssignees: (workspaceSlug: string, projectId: string) => Promise<void>;
  updateIntakeAssignees: (workspaceSlug: string, projectId: string, data: { users: string[] }) => Promise<void>;
  // computed
  getAssignees: (projectId: string) => string[];
}

export class IntakeResponsibilityStore implements IIntakeResponsibilityStore {
  // observables
  assigneesMap: Map<string, string[]> = new Map();

  // services
  intakeResponsibilityService = new IntakeResponsibilityService();

  // store
  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    makeObservable(this, {
      // observable
      assigneesMap: observable,
      // actions
      fetchIntakeAssignees: action,
      updateIntakeAssignees: action,
    });
    this.rootStore = rootStore;
  }

  // actions
  fetchIntakeAssignees = async (workspaceSlug: string, projectId: string) => {
    try {
      const assignees = await this.intakeResponsibilityService.getIntakeAssignees(workspaceSlug, projectId);
      runInAction(() => {
        this.assigneesMap.set(projectId, assignees);
      });
    } catch (error) {
      console.error("Error fetching intake assignee", error);
      throw error;
    }
  };

  updateIntakeAssignees = async (workspaceSlug: string, projectId: string, data: { users: string[] }) => {
    try {
      const { users } = await this.intakeResponsibilityService.updateIntakeAssignees(workspaceSlug, projectId, data);
      runInAction(() => {
        this.assigneesMap.set(projectId, users);
      });
    } catch (error) {
      console.error("Error updating intake assignees", error);
      throw error;
    }
  };

  // computed
  getAssignees = computedFn((projectId: string) => {
    const assignees = this.assigneesMap.get(projectId);
    return assignees || [];
  });
}
