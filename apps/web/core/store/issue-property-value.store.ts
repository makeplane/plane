/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type { IIssuePropertyValue, TIssuePropertyValues } from "@plane/types";
// services
import { IssuePropertyValueService } from "@/services/issue-property-value.service";
// store
import type { CoreRootStore } from "./root.store";

/**
 * Normalises a typed value row into its string representation by picking the
 * populated column. Mirrors the backend value display precedence.
 */
export const issuePropertyValueToString = (row: IIssuePropertyValue): string | null => {
  if (row.value_option !== null && row.value_option !== undefined) return String(row.value_option);
  if (row.value_uuid !== null && row.value_uuid !== undefined) return String(row.value_uuid);
  if (row.value_datetime !== null && row.value_datetime !== undefined) return String(row.value_datetime);
  if (row.value_decimal !== null && row.value_decimal !== undefined) return String(row.value_decimal);
  if (row.value_boolean !== null && row.value_boolean !== undefined) return row.value_boolean ? "true" : "false";
  if (row.value_text !== null && row.value_text !== undefined) return row.value_text;
  return null;
};

/**
 * Groups typed value rows by property id into the normalised form used by the
 * form/store.
 */
export const groupIssuePropertyValues = (rows: IIssuePropertyValue[]): TIssuePropertyValues => {
  const grouped: TIssuePropertyValues = {};
  rows.forEach((row) => {
    const value = issuePropertyValueToString(row);
    if (value === null) return;
    if (!grouped[row.property_id]) grouped[row.property_id] = [];
    grouped[row.property_id].push(value);
  });
  return grouped;
};

export interface IIssuePropertyValueStore {
  // observables
  valueMap: Record<string, TIssuePropertyValues>;
  // loaders
  fetchedIssueMap: Record<string, boolean>;
  // computed actions
  getIssueValues: (issueId: string | null | undefined) => TIssuePropertyValues | undefined;
  getValue: (issueId: string | null | undefined, propertyId: string | null | undefined) => string[];
  // fetch actions
  fetchIssueValues: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssuePropertyValues>;
  // set actions
  setValue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    propertyId: string,
    values: string[]
  ) => Promise<void>;
}

export class IssuePropertyValueStore implements IIssuePropertyValueStore {
  // observables
  valueMap: Record<string, TIssuePropertyValues> = {};
  // loaders
  fetchedIssueMap: Record<string, boolean> = {};
  // root store
  rootStore: CoreRootStore;
  // services
  issuePropertyValueService: IssuePropertyValueService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      valueMap: observable,
      fetchedIssueMap: observable,
      // fetch actions
      fetchIssueValues: action,
      // set actions
      setValue: action,
    });
    this.rootStore = _rootStore;
    this.issuePropertyValueService = new IssuePropertyValueService();
  }

  /**
   * @description returns every custom property value of a work item
   */
  getIssueValues = computedFn((issueId: string | null | undefined) => {
    if (!issueId) return undefined;
    return this.valueMap[issueId] ?? undefined;
  });

  /**
   * @description returns the values of a single property on a work item
   */
  getValue = computedFn((issueId: string | null | undefined, propertyId: string | null | undefined) => {
    if (!issueId || !propertyId) return [];
    return this.valueMap[issueId]?.[propertyId] ?? [];
  });

  /**
   * @description fetches every custom property value of a work item
   */
  fetchIssueValues = async (workspaceSlug: string, projectId: string, issueId: string) => {
    const response = await this.issuePropertyValueService.fetchAll(workspaceSlug, projectId, issueId);
    const grouped = groupIssuePropertyValues(response);
    runInAction(() => {
      set(this.valueMap, [issueId], grouped);
      set(this.fetchedIssueMap, issueId, true);
    });
    return grouped;
  };

  /**
   * @description replaces the value(s) of a single property on a work item
   */
  setValue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    propertyId: string,
    values: string[]
  ) => {
    const response = await this.issuePropertyValueService.setValues(
      workspaceSlug,
      projectId,
      issueId,
      propertyId,
      values
    );
    const normalised = response.map((row) => issuePropertyValueToString(row)).filter((v): v is string => v !== null);
    runInAction(() => {
      if (!this.valueMap[issueId]) set(this.valueMap, [issueId], {});
      set(this.valueMap, [issueId, propertyId], normalised);
    });
  };
}
