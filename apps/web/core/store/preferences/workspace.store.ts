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
// plane imports
import type { WorkspacePreferences, TExploredFeatures, TTips, TGettingStartedChecklistKeys } from "@plane/types";
// services
import workspacePreferencesService from "@/services/workspace-preferences.service";

// Fields on WorkspacePreferences that are Record<string, boolean | null>
type PreferencesRecordField = "explored_features" | "tips" | "getting_started_checklist";

// Maps each record field key to its typed update payload
type PreferencesRecordUpdates = {
  explored_features: Partial<Record<TExploredFeatures, boolean>>;
  tips: Partial<Record<TTips, boolean>>;
  getting_started_checklist: Partial<Record<TGettingStartedChecklistKeys, boolean>>;
};

export interface WorkspacePreferencesStoreType {
  loader: boolean;
  getPreferencesBySlug: (workspaceSlug: string) => WorkspacePreferences | undefined;
  fetchPreferences: (workspaceSlug: string) => Promise<WorkspacePreferences>;
  updateExploredFeatures: (
    workspaceSlug: string,
    exploredFeatures: Partial<Record<TExploredFeatures, boolean>>
  ) => Promise<WorkspacePreferences>;
  updateTips: (workspaceSlug: string, tips: Partial<Record<TTips, boolean>>) => Promise<WorkspacePreferences>;
  updateChecklist: (
    workspaceSlug: string,
    checklist: Partial<Record<TGettingStartedChecklistKeys, boolean>>
  ) => Promise<WorkspacePreferences>;
  updateChecklistIfNotDoneAlready: (workspaceSlug: string, key: TGettingStartedChecklistKeys) => Promise<void>;
  mutateDraftWorkItemsCount: (workspaceSlug: string, increment: number) => void;
  mutateActiveCyclesCount: (workspaceSlug: string, increment: number) => void;
  getGettingStartedChecklistBySlug: (
    workspaceSlug: string
  ) => Record<TGettingStartedChecklistKeys, boolean | null> | undefined;
}

export class WorkspacePreferencesStore implements WorkspacePreferencesStoreType {
  loader: boolean = false;
  private preferencesMap: Map<string, WorkspacePreferences> = new Map();

  constructor() {
    makeObservable<WorkspacePreferencesStore, "preferencesMap">(this, {
      loader: observable.ref,
      preferencesMap: observable,
      fetchPreferences: action,
    });
  }

  getPreferencesBySlug = computedFn((workspaceSlug: string): WorkspacePreferences | undefined =>
    this.preferencesMap.get(workspaceSlug)
  );

  fetchPreferences = async (workspaceSlug: string): Promise<WorkspacePreferences> => {
    this.loader = true;
    try {
      const response = await workspacePreferencesService.fetchPreferences(workspaceSlug);
      runInAction(() => {
        this.preferencesMap.set(workspaceSlug, response);
        this.loader = false;
      });
      return response;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
      });
      throw error;
    }
  };

  /**
   * Generic helper to update a record-type preferences field (explored_features, tips, getting_started_checklist).
   * Filters out null values from existing data before merging with the update payload.
   */
  private updatePreferencesField = async <K extends PreferencesRecordField>(
    fieldKey: K,
    workspaceSlug: string,
    updates: PreferencesRecordUpdates[K]
  ): Promise<WorkspacePreferences> => {
    const existing = this.preferencesMap.get(workspaceSlug);
    const existingData = existing?.[fieldKey];

    // Filter out null values from existing data
    const filteredExisting: Record<string, boolean> = {};
    if (existingData && typeof existingData === "object") {
      for (const [key, value] of Object.entries(existingData)) {
        if (value !== null && typeof value === "boolean") {
          filteredExisting[key] = value;
        }
      }
    }

    const response = await workspacePreferencesService.updatePreferences(workspaceSlug, {
      [fieldKey]: { ...filteredExisting, ...updates },
    });

    runInAction(() => {
      const current = this.preferencesMap.get(workspaceSlug);
      this.preferencesMap.set(workspaceSlug, {
        ...current,
        [fieldKey]: { ...current?.[fieldKey], ...updates },
      } as WorkspacePreferences);
    });

    return response;
  };

  updateExploredFeatures = async (
    workspaceSlug: string,
    exploredFeatures: Partial<Record<TExploredFeatures, boolean>>
  ): Promise<WorkspacePreferences> => this.updatePreferencesField("explored_features", workspaceSlug, exploredFeatures);

  updateTips = async (workspaceSlug: string, tips: Partial<Record<TTips, boolean>>): Promise<WorkspacePreferences> =>
    this.updatePreferencesField("tips", workspaceSlug, tips);

  updateChecklist = async (
    workspaceSlug: string,
    checklist: Partial<Record<TGettingStartedChecklistKeys, boolean>>
  ): Promise<WorkspacePreferences> =>
    this.updatePreferencesField("getting_started_checklist", workspaceSlug, checklist);

  updateChecklistIfNotDoneAlready = async (workspaceSlug: string, key: TGettingStartedChecklistKeys): Promise<void> => {
    const checklist = this.getGettingStartedChecklistBySlug(workspaceSlug);
    if (!checklist?.[key]) {
      await this.updateChecklist(workspaceSlug, { [key]: true });
    }
  };

  /**
   * Locally increment/decrement the draft issue count (no API call — the count is server-computed on fetch).
   */
  mutateDraftWorkItemsCount = (workspaceSlug: string, increment: number): void => {
    const current = this.preferencesMap.get(workspaceSlug);
    if (!current) return;
    this.preferencesMap.set(workspaceSlug, {
      ...current,
      draft_issue_count: (current.draft_issue_count ?? 0) + increment,
    });
  };

  /**
   * Locally increment/decrement the active cycles count (no API call — the count is server-computed on fetch).
   */
  mutateActiveCyclesCount = (workspaceSlug: string, increment: number): void => {
    const current = this.preferencesMap.get(workspaceSlug);
    if (!current) return;
    this.preferencesMap.set(workspaceSlug, {
      ...current,
      active_cycles_count: (current.active_cycles_count ?? 0) + increment,
    });
  };

  getGettingStartedChecklistBySlug = computedFn(
    (workspaceSlug: string): Record<TGettingStartedChecklistKeys, boolean | null> | undefined =>
      this.preferencesMap.get(workspaceSlug)?.getting_started_checklist
  );
}
