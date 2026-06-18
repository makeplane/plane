/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// mobx
import { action, observable, makeObservable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import { ECustomFieldEntityType } from "@plane/types";
import type { TCustomField, TCustomFieldValuePayload, TCustomFieldWithValue } from "@plane/types";
// services
import { CustomFieldService } from "@/services/custom-field.service";
// store
import type { CoreRootStore } from "../root.store";

export interface ICustomFieldStore {
  // observables — definitions keyed by entity type, then by field id
  customFieldsByEntity: Record<ECustomFieldEntityType, Record<string, TCustomField> | null>;
  // active, member-visible definitions used by entity create forms
  activeFieldsByEntity: Record<ECustomFieldEntityType, TCustomField[] | null>;
  // computed actions
  getCustomFieldsByEntity: (entityType: ECustomFieldEntityType) => TCustomField[] | null;
  getCustomFieldById: (entityType: ECustomFieldEntityType, fieldId: string) => TCustomField | null;
  getActiveFieldsByEntity: (entityType: ECustomFieldEntityType) => TCustomField[] | null;
  // fetch actions
  fetchCustomFields: (workspaceSlug: string, entityType: ECustomFieldEntityType) => Promise<TCustomField[]>;
  fetchActiveCustomFields: (workspaceSlug: string, entityType: ECustomFieldEntityType) => Promise<TCustomField[]>;
  // crud actions
  createCustomField: (
    workspaceSlug: string,
    entityType: ECustomFieldEntityType,
    data: Partial<TCustomField>
  ) => Promise<TCustomField>;
  updateCustomField: (
    workspaceSlug: string,
    entityType: ECustomFieldEntityType,
    fieldId: string,
    data: Partial<TCustomField>
  ) => Promise<TCustomField>;
  removeCustomField: (workspaceSlug: string, entityType: ECustomFieldEntityType, fieldId: string) => Promise<void>;
  // project value actions (not cached — fetched per form mount)
  fetchProjectValues: (workspaceSlug: string, projectId: string) => Promise<TCustomFieldWithValue[]>;
  updateProjectValues: (
    workspaceSlug: string,
    projectId: string,
    values: TCustomFieldValuePayload[]
  ) => Promise<TCustomFieldWithValue[]>;
  // work item value actions
  fetchIssueValues: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TCustomFieldWithValue[]>;
  updateIssueValues: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    values: TCustomFieldValuePayload[]
  ) => Promise<TCustomFieldWithValue[]>;
}

export class CustomFieldStore implements ICustomFieldStore {
  // observables
  customFieldsByEntity: Record<ECustomFieldEntityType, Record<string, TCustomField> | null> = {
    [ECustomFieldEntityType.PROJECT]: null,
    [ECustomFieldEntityType.WORK_ITEM]: null,
  };
  activeFieldsByEntity: Record<ECustomFieldEntityType, TCustomField[] | null> = {
    [ECustomFieldEntityType.PROJECT]: null,
    [ECustomFieldEntityType.WORK_ITEM]: null,
  };
  // services
  customFieldService;
  // root store
  rootStore;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      customFieldsByEntity: observable,
      activeFieldsByEntity: observable,
      // fetch actions
      fetchCustomFields: action,
      fetchActiveCustomFields: action,
      // CRUD actions
      createCustomField: action,
      updateCustomField: action,
      removeCustomField: action,
      // value actions
      fetchProjectValues: action,
      updateProjectValues: action,
      fetchIssueValues: action,
      updateIssueValues: action,
    });

    this.customFieldService = new CustomFieldService();
    this.rootStore = _rootStore;
  }

  /** sorted list of custom fields for an entity type */
  getCustomFieldsByEntity = computedFn((entityType: ECustomFieldEntityType) => {
    const map = this.customFieldsByEntity[entityType];
    if (!map) return null;
    // Object.values returns a fresh array, so in-place sort does not mutate the store.
    // (toSorted is ES2023 and not in this app's ES2022 type lib)
    // eslint-disable-next-line unicorn/no-array-sort
    return Object.values(map).sort((a, b) => a.sort_order - b.sort_order);
  });

  getCustomFieldById = computedFn(
    (entityType: ECustomFieldEntityType, fieldId: string) => this.customFieldsByEntity[entityType]?.[fieldId] ?? null
  );

  getActiveFieldsByEntity = computedFn((entityType: ECustomFieldEntityType) => this.activeFieldsByEntity[entityType]);

  fetchActiveCustomFields = async (workspaceSlug: string, entityType: ECustomFieldEntityType) => {
    const response = await this.customFieldService.listActive(workspaceSlug, entityType);
    runInAction(() => {
      this.activeFieldsByEntity[entityType] = response;
    });
    return response;
  };

  fetchCustomFields = async (workspaceSlug: string, entityType: ECustomFieldEntityType) => {
    const response = await this.customFieldService.list(workspaceSlug, entityType);
    const fieldMap = response.reduce<Record<string, TCustomField>>((acc, field) => {
      if (field?.id) acc[field.id] = field;
      return acc;
    }, {});
    runInAction(() => {
      this.customFieldsByEntity[entityType] = fieldMap;
    });
    return response;
  };

  createCustomField = async (
    workspaceSlug: string,
    entityType: ECustomFieldEntityType,
    data: Partial<TCustomField>
  ) => {
    const response = await this.customFieldService.create(workspaceSlug, { ...data, entity_type: entityType });
    runInAction(() => {
      if (response?.id) {
        this.customFieldsByEntity[entityType] = {
          ...this.customFieldsByEntity[entityType],
          [response.id]: response,
        };
      }
    });
    return response;
  };

  updateCustomField = async (
    workspaceSlug: string,
    entityType: ECustomFieldEntityType,
    fieldId: string,
    data: Partial<TCustomField>
  ) => {
    const response = await this.customFieldService.update(workspaceSlug, fieldId, data);
    runInAction(() => {
      const current = this.customFieldsByEntity[entityType]?.[fieldId];
      this.customFieldsByEntity[entityType] = {
        ...this.customFieldsByEntity[entityType],
        [fieldId]: { ...current, ...response },
      };
    });
    return response;
  };

  removeCustomField = async (workspaceSlug: string, entityType: ECustomFieldEntityType, fieldId: string) => {
    await this.customFieldService.destroy(workspaceSlug, fieldId);
    runInAction(() => {
      const map = { ...this.customFieldsByEntity[entityType] };
      delete map[fieldId];
      this.customFieldsByEntity[entityType] = map;
    });
  };

  fetchProjectValues = async (workspaceSlug: string, projectId: string) =>
    this.customFieldService.fetchProjectValues(workspaceSlug, projectId);

  updateProjectValues = async (workspaceSlug: string, projectId: string, values: TCustomFieldValuePayload[]) =>
    this.customFieldService.updateProjectValues(workspaceSlug, projectId, values);

  fetchIssueValues = async (workspaceSlug: string, projectId: string, issueId: string) =>
    this.customFieldService.fetchIssueValues(workspaceSlug, projectId, issueId);

  updateIssueValues = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    values: TCustomFieldValuePayload[]
  ) => this.customFieldService.updateIssueValues(workspaceSlug, projectId, issueId, values);
}
