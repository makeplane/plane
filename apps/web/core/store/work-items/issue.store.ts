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
// types
import type { TIssue, TIssuePropertyValues } from "@plane/types";
// helpers
import { getCurrentDateTimeInISO } from "@plane/utils";
import { rootStore } from "@/lib/store-context";
// services
import { IssueService } from "@/services/issue";

/**
 * Normalizes raw property_values from the /work-items/ endpoint to string[] format.
 * Backend returns heterogeneous types (objects for OPTION, booleans, numbers)
 * that must be coerced to string arrays for the UI layer.
 */
function normalizePropertyValues(raw: Record<string, unknown[]>): TIssuePropertyValues {
  const normalized: TIssuePropertyValues = {};
  for (const [propertyId, values] of Object.entries(raw)) {
    if (!Array.isArray(values)) continue;
    normalized[propertyId] = values.map((v) => {
      if (typeof v === "object" && v !== null && "id" in v) return String((v as { id: unknown }).id);
      return String(v);
    });
  }
  return normalized;
}

export type IIssueStore = {
  // actions
  fetchWorkItems(workspaceSlug: string, projectId: string, issueIds: string[]): Promise<TIssue[]>;
  addIssue(issues: TIssue[]): void;
  addIssueIdentifier(issueIdentifier: string, issueId: string): void;
  updateIssue(issueId: string, issue: Partial<TIssue>): void;
  updateWorkItemWithoutSideEffects(workItemId: string, workItem: Partial<TIssue>): void;
  removeIssue(issueId: string): void;
  // helper methods
  getIssueById(issueId: string): undefined | TIssue;
  getIssueIdByIdentifier(issueIdentifier: string): undefined | string;
  getIssuesByIds(issueIds: string[], type: "archived" | "un-archived"): TIssue[]; // Record defines issue_id as key and TIssue as value
  getProjectWorkItemIds(projectId: string): string[];
  getProjectEpicIds(projectId: string): string[];
};

export class IssueStore implements IIssueStore {
  // observables
  private workItemsMap: Map<string, TIssue> = new Map();
  private workItemsIdentifierMap: Map<string, string> = new Map();
  // service
  issueService;

  constructor() {
    makeObservable<IssueStore, "workItemsMap" | "workItemsIdentifierMap">(this, {
      // observable
      workItemsMap: observable,
      workItemsIdentifierMap: observable,
      // actions
      addIssue: action,
      addIssueIdentifier: action,
      updateIssue: action,
      updateWorkItemWithoutSideEffects: action,
      removeIssue: action,
    });
    this.issueService = new IssueService();
  }

  // actions
  /**
   * @description This method will add issues to the workItemsMap
   * @param {TIssue[]} issues
   * @returns {void}
   */
  addIssue = (issues: TIssue[]): void => {
    if (issues && issues.length <= 0) return;
    runInAction(() => {
      issues.forEach((issue) => {
        // Normalize property_values from backend heterogeneous types to string[]
        if (issue.property_values) {
          issue = {
            ...issue,
            property_values: normalizePropertyValues(issue.property_values as Record<string, unknown[]>),
          };
        }
        // add issue identifier to the workItemsIdentifierMap
        const projectIdentifier = rootStore.projectRoot.project.getProjectIdentifierById(issue?.project_id);
        const workItemSequenceId = issue?.sequence_id;
        const issueIdentifier = `${projectIdentifier}-${workItemSequenceId}`;
        this.workItemsIdentifierMap.set(issueIdentifier, issue.id);
        const existingWorkItem = this.workItemsMap.get(issue.id);
        if (!existingWorkItem) this.workItemsMap.set(issue.id, issue);
        else this.workItemsMap.set(issue.id, { ...existingWorkItem, ...issue });
      });
    });
  };

  /**
   * @description This method will add issue_identifier to the workItemsIdentifierMap
   * @param issueIdentifier
   * @param issueId
   * @returns {void}
   */
  addIssueIdentifier = (issueIdentifier: string, issueId: string): void => {
    if (!issueIdentifier || !issueId) return;
    runInAction(() => {
      this.workItemsIdentifierMap.set(issueIdentifier, issueId);
    });
  };

  fetchWorkItems = async (workspaceSlug: string, projectId: string, issueIds: string[]) => {
    const issues = await this.issueService.retrieveIssues(workspaceSlug, projectId, issueIds);

    runInAction(() => {
      issues.forEach((issue) => {
        const existingWorkItem = this.workItemsMap.get(issue.id);
        if (!existingWorkItem) this.workItemsMap.set(issue.id, issue);
        else this.workItemsMap.set(issue.id, { ...existingWorkItem, ...issue });
      });
    });

    return issues;
  };

  /**
   * @description This method will update the issue in the workItemsMap
   * @param {string} issueId
   * @param {Partial<TIssue>} issue
   * @returns {void}
   */
  updateIssue = (issueId: string, issue: Partial<TIssue>): void => {
    runInAction(() => {
      const existingWorkItem = this.workItemsMap.get(issueId);
      if (!existingWorkItem) return;
      const currentDateTime = getCurrentDateTimeInISO();

      const completedAtUpdate =
        issue.state_id && existingWorkItem.state_id !== issue.state_id
          ? {
              completed_at:
                rootStore.state.getStateById(issue.state_id)?.group === "completed" ? currentDateTime : null,
            }
          : {};
      const updatedIssue: TIssue = {
        ...existingWorkItem,
        ...issue,
        ...completedAtUpdate,
        updated_at: currentDateTime,
        last_activity_at: currentDateTime,
      };

      this.workItemsMap.set(issueId, updatedIssue);
    });
  };

  /**
   * @description This method updates the work item in the workItemsMap without side-effects.
   * Used for rollback/fallback and data sync paths where payload is the source of truth.
   * @param {string} workItemId
   * @param {Partial<TIssue>} workItem
   * @returns {void}
   */
  updateWorkItemWithoutSideEffects = (workItemId: string, workItem: Partial<TIssue>): void => {
    runInAction(() => {
      const existingWorkItem = this.workItemsMap.get(workItemId);
      if (!existingWorkItem) return;

      const updatedWorkItem: TIssue = {
        ...existingWorkItem,
        ...workItem,
      };

      this.workItemsMap.set(workItemId, updatedWorkItem);
    });
  };

  /**
   * @description This method will remove the issue from the workItemsMap
   * @param {string} issueId
   * @returns {void}
   */
  removeIssue = (issueId: string): void => {
    if (!issueId || !this.workItemsMap.has(issueId)) return;
    runInAction(() => {
      this.workItemsMap.delete(issueId);
    });
  };

  // helper methods
  /**
   * @description This method will return the issue from the workItemsMap
   * @param {string} issueId
   * @returns {TIssue | undefined}
   */
  getIssueById = computedFn((issueId: string) => {
    if (!issueId || !this.workItemsMap.has(issueId)) return undefined;
    return this.workItemsMap.get(issueId);
  });

  /**
   * @description This method will return the issue_id from the workItemsIdentifierMap
   * @param {string} issueIdentifier
   * @returns {string | undefined}
   */
  getIssueIdByIdentifier = computedFn((issueIdentifier: string) => {
    if (!issueIdentifier || !this.workItemsIdentifierMap.has(issueIdentifier)) return undefined;
    return this.workItemsIdentifierMap.get(issueIdentifier);
  });

  /**
   * @description This method will return the issues from the workItemsMap
   * @param {string[]} issueIds
   * @param {boolean} archivedIssues
   * @returns {Record<string, TIssue> | undefined}
   */
  getIssuesByIds = computedFn((issueIds: string[], type: "archived" | "un-archived") => {
    if (!issueIds || issueIds.length <= 0) return [];
    const filteredIssues: TIssue[] = [];
    Object.values(issueIds).forEach((issueId) => {
      // if type is archived then check archived_at is not null
      // if type is un-archived then check archived_at is null
      const issue = this.workItemsMap.get(issueId);
      if (issue && ((type === "archived" && issue.archived_at) || (type === "un-archived" && !issue?.archived_at))) {
        filteredIssues.push(issue);
      }
    });
    return filteredIssues;
  });

  /**
   * @description This method will return the work item ids for the project
   * @param {string} projectId
   * @returns {string[]}
   */
  getProjectWorkItemIds = computedFn((projectId: string) => {
    return Array.from(this.workItemsMap.values())
      .filter((issue) => issue.project_id === projectId && !issue.is_epic)
      .map((issue) => issue.id);
  });

  /**
   * @description This method will return the epic ids for the project
   * @param {string} projectId
   * @returns {string[]}
   */
  getProjectEpicIds = computedFn((projectId: string) => {
    return Array.from(this.workItemsMap.values())
      .filter((issue) => issue.project_id === projectId && issue.is_epic)
      .map((issue) => issue.id);
  });
}
