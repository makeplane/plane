/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set, sortBy } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import type {
  IProjectCustomField,
  IProjectCustomFieldOption,
  IProjectCustomFieldValue,
  TProjectCustomFieldValuePayload,
} from "@plane/types";
// services
import { ProjectCustomFieldService } from "@/services/project";
// store
import type { CoreRootStore } from "./root.store";

export interface IProjectCustomFieldStore {
  // loaders
  fetchedMap: Record<string, boolean>;
  optionsFetchedMap: Record<string, boolean>;
  // observables
  fieldMap: Record<string, IProjectCustomField>;
  valueMap: Record<string, IProjectCustomFieldValue>;
  optionMap: Record<string, IProjectCustomFieldOption>;
  // computed
  projectCustomFields: IProjectCustomField[] | undefined;
  // computed actions
  getProjectCustomFields: (projectId: string | undefined | null) => IProjectCustomField[] | undefined;
  getFieldValue: (fieldId: string) => IProjectCustomFieldValue | undefined;
  getFieldOptions: (fieldId: string) => IProjectCustomFieldOption[] | undefined;
  // fetch actions
  fetchProjectCustomFields: (workspaceSlug: string, projectId: string) => Promise<IProjectCustomField[]>;
  fetchProjectCustomFieldValues: (workspaceSlug: string, projectId: string) => Promise<IProjectCustomFieldValue[]>;
  fetchFieldOptions: (
    workspaceSlug: string,
    projectId: string,
    fieldId: string
  ) => Promise<IProjectCustomFieldOption[]>;
  // crud actions
  createCustomField: (
    workspaceSlug: string,
    projectId: string,
    data: Partial<IProjectCustomField>
  ) => Promise<IProjectCustomField>;
  updateCustomField: (
    workspaceSlug: string,
    projectId: string,
    fieldId: string,
    data: Partial<IProjectCustomField>
  ) => Promise<IProjectCustomField>;
  deleteCustomField: (workspaceSlug: string, projectId: string, fieldId: string) => Promise<void>;
  setCustomFieldValue: (
    workspaceSlug: string,
    projectId: string,
    fieldId: string,
    data: TProjectCustomFieldValuePayload
  ) => Promise<IProjectCustomFieldValue>;
  createFieldOption: (
    workspaceSlug: string,
    projectId: string,
    fieldId: string,
    name: string
  ) => Promise<IProjectCustomFieldOption>;
  deleteFieldOption: (workspaceSlug: string, projectId: string, fieldId: string, optionId: string) => Promise<void>;
}

export class ProjectCustomFieldStore implements IProjectCustomFieldStore {
  // root store
  rootStore;
  // observables
  fieldMap: Record<string, IProjectCustomField> = {};
  valueMap: Record<string, IProjectCustomFieldValue> = {};
  optionMap: Record<string, IProjectCustomFieldOption> = {};
  // loaders
  fetchedMap: Record<string, boolean> = {};
  optionsFetchedMap: Record<string, boolean> = {};
  // services
  projectCustomFieldService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      fieldMap: observable,
      valueMap: observable,
      optionMap: observable,
      fetchedMap: observable,
      optionsFetchedMap: observable,
      // computed
      projectCustomFields: computed,

      fetchProjectCustomFields: action,
      fetchProjectCustomFieldValues: action,
      fetchFieldOptions: action,
      createCustomField: action,
      updateCustomField: action,
      deleteCustomField: action,
      setCustomFieldValue: action,
      createFieldOption: action,
      deleteFieldOption: action,
    });

    // root store
    this.rootStore = _rootStore;
    // services
    this.projectCustomFieldService = new ProjectCustomFieldService();
  }

  /**
   * Returns the custom fields belonging to the current project
   */
  get projectCustomFields() {
    const projectId = this.rootStore.router.projectId;
    if (!projectId || !this.fetchedMap[projectId]) return;
    return sortBy(
      Object.values(this.fieldMap).filter((field) => field?.project_id === projectId),
      "sort_order"
    );
  }

  getProjectCustomFields = computedFn((projectId: string | undefined | null) => {
    if (!projectId || !this.fetchedMap[projectId]) return;
    return sortBy(
      Object.values(this.fieldMap).filter((field) => field?.project_id === projectId),
      "sort_order"
    );
  });

  /**
   * Returns the current project's value for a given custom field, if one has been set
   */
  getFieldValue = computedFn(
    (fieldId: string): IProjectCustomFieldValue | undefined => this.valueMap[fieldId]
  );

  /**
   * Returns the dropdown options for a given custom field, if they have been fetched
   */
  getFieldOptions = computedFn((fieldId: string): IProjectCustomFieldOption[] | undefined => {
    if (!this.optionsFetchedMap[fieldId]) return;
    return sortBy(
      Object.values(this.optionMap).filter((option) => option?.custom_field === fieldId),
      "sort_order"
    );
  });

  /**
   * Fetches the custom field definitions for a specific project
   */
  fetchProjectCustomFields = async (workspaceSlug: string, projectId: string) =>
    await this.projectCustomFieldService.getCustomFields(workspaceSlug, projectId).then((response) => {
      runInAction(() => {
        response.forEach((field) => {
          set(this.fieldMap, [field.id], field);
        });
        set(this.fetchedMap, projectId, true);
      });
      return response;
    });

  /**
   * Fetches the custom field values for a specific project
   */
  fetchProjectCustomFieldValues = async (workspaceSlug: string, projectId: string) =>
    await this.projectCustomFieldService.getCustomFieldValues(workspaceSlug, projectId).then((response) => {
      runInAction(() => {
        // Keyed by custom_field, not the value row's own id: (project, custom_field)
        // is unique per the backend constraint, and every lookup is by field id.
        response.forEach((value) => {
          set(this.valueMap, [value.custom_field], value);
        });
      });
      return response;
    });

  /**
   * Fetches the dropdown options for a specific custom field
   */
  fetchFieldOptions = async (workspaceSlug: string, projectId: string, fieldId: string) =>
    await this.projectCustomFieldService.getCustomFieldOptions(workspaceSlug, projectId, fieldId).then((response) => {
      runInAction(() => {
        response.forEach((option) => {
          set(this.optionMap, [option.id], option);
        });
        set(this.optionsFetchedMap, fieldId, true);
      });
      return response;
    });

  /**
   * Creates a new custom field definition for a project
   */
  createCustomField = async (workspaceSlug: string, projectId: string, data: Partial<IProjectCustomField>) =>
    await this.projectCustomFieldService.createCustomField(workspaceSlug, projectId, data).then((response) => {
      runInAction(() => {
        set(this.fieldMap, [response.id], response);
      });
      return response;
    });

  /**
   * Updates a custom field definition, with optimistic update + rollback on failure
   */
  updateCustomField = async (
    workspaceSlug: string,
    projectId: string,
    fieldId: string,
    data: Partial<IProjectCustomField>
  ) => {
    const originalField = this.fieldMap[fieldId];
    try {
      runInAction(() => {
        set(this.fieldMap, [fieldId], { ...originalField, ...data });
      });
      const response = await this.projectCustomFieldService.updateCustomField(
        workspaceSlug,
        projectId,
        fieldId,
        data
      );
      return response;
    } catch (error) {
      runInAction(() => {
        set(this.fieldMap, [fieldId], originalField);
      });
      throw error;
    }
  };

  /**
   * Deletes a custom field definition
   */
  deleteCustomField = async (workspaceSlug: string, projectId: string, fieldId: string) => {
    if (!this.fieldMap[fieldId]) return;
    await this.projectCustomFieldService.deleteCustomField(workspaceSlug, projectId, fieldId).then(() => {
      runInAction(() => {
        delete this.fieldMap[fieldId];
      });
    });
  };

  /**
   * Upserts the current project's value for a custom field. `data` carries exactly
   * one of value_decimal/value_text/value_date/value_option/value_member, matching
   * the field's type; the backend rejects any other combination.
   */
  setCustomFieldValue = async (
    workspaceSlug: string,
    projectId: string,
    fieldId: string,
    data: TProjectCustomFieldValuePayload
  ) =>
    await this.projectCustomFieldService.setCustomFieldValue(workspaceSlug, projectId, fieldId, data).then(
      (response) => {
        runInAction(() => {
          set(this.valueMap, [response.custom_field], response);
        });
        return response;
      }
    );

  /**
   * Adds a new dropdown option to a custom field
   */
  createFieldOption = async (workspaceSlug: string, projectId: string, fieldId: string, name: string) =>
    await this.projectCustomFieldService
      .createCustomFieldOption(workspaceSlug, projectId, fieldId, { name })
      .then((response) => {
        runInAction(() => {
          set(this.optionMap, [response.id], response);
        });
        return response;
      });

  /**
   * Removes a dropdown option from a custom field
   */
  deleteFieldOption = async (workspaceSlug: string, projectId: string, fieldId: string, optionId: string) => {
    if (!this.optionMap[optionId]) return;
    await this.projectCustomFieldService.deleteCustomFieldOption(workspaceSlug, projectId, fieldId, optionId).then(
      () => {
        runInAction(() => {
          delete this.optionMap[optionId];
        });
      }
    );
  };
}
