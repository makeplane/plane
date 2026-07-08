/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set, sortBy } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type { IIssueProperty, IIssuePropertyOption } from "@plane/types";
// services
import { IssuePropertyService } from "@/services/issue-property.service";
// store
import type { CoreRootStore } from "./root.store";

export interface IIssuePropertyStore {
  // observables
  propertyMap: Record<string, IIssueProperty>;
  typePropertiesMap: Record<string, string[]>;
  // loaders
  fetchedTypeMap: Record<string, boolean>;
  // computed actions
  getPropertyById: (propertyId: string | null | undefined) => IIssueProperty | undefined;
  getTypeProperties: (typeId: string | null | undefined, activeOnly?: boolean) => IIssueProperty[] | undefined;
  getTypePropertyIds: (typeId: string | null | undefined) => string[] | undefined;
  // fetch actions
  fetchTypeProperties: (workspaceSlug: string, projectId: string, typeId: string) => Promise<IIssueProperty[]>;
  // property crud
  createProperty: (
    workspaceSlug: string,
    projectId: string,
    typeId: string,
    data: Partial<IIssueProperty>
  ) => Promise<IIssueProperty>;
  updateProperty: (
    workspaceSlug: string,
    projectId: string,
    typeId: string,
    propertyId: string,
    data: Partial<IIssueProperty>
  ) => Promise<IIssueProperty | undefined>;
  deleteProperty: (workspaceSlug: string, projectId: string, typeId: string, propertyId: string) => Promise<void>;
  // option crud
  createOption: (
    workspaceSlug: string,
    projectId: string,
    propertyId: string,
    data: Partial<IIssuePropertyOption>
  ) => Promise<IIssuePropertyOption>;
  updateOption: (
    workspaceSlug: string,
    projectId: string,
    propertyId: string,
    optionId: string,
    data: Partial<IIssuePropertyOption>
  ) => Promise<IIssuePropertyOption | undefined>;
  deleteOption: (workspaceSlug: string, projectId: string, propertyId: string, optionId: string) => Promise<void>;
}

export class IssuePropertyStore implements IIssuePropertyStore {
  // observables
  propertyMap: Record<string, IIssueProperty> = {};
  typePropertiesMap: Record<string, string[]> = {};
  // loaders
  fetchedTypeMap: Record<string, boolean> = {};
  // root store
  rootStore: CoreRootStore;
  // services
  issuePropertyService: IssuePropertyService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      propertyMap: observable,
      typePropertiesMap: observable,
      fetchedTypeMap: observable,
      // fetch actions
      fetchTypeProperties: action,
      // property crud
      createProperty: action,
      updateProperty: action,
      deleteProperty: action,
      // option crud
      createOption: action,
      updateOption: action,
      deleteOption: action,
    });
    this.rootStore = _rootStore;
    this.issuePropertyService = new IssuePropertyService();
  }

  /**
   * @description returns a property definition by id
   */
  getPropertyById = computedFn((propertyId: string | null | undefined) => {
    if (!propertyId) return undefined;
    return this.propertyMap[propertyId] ?? undefined;
  });

  /**
   * @description returns the properties of a work item type, sorted by sort order
   * @param activeOnly - when true only the active properties are returned
   */
  getTypeProperties = computedFn((typeId: string | null | undefined, activeOnly = false) => {
    if (!typeId || !this.fetchedTypeMap[typeId]) return undefined;
    const propertyIds = this.typePropertiesMap[typeId] ?? [];
    const properties = propertyIds
      .map((propertyId) => this.propertyMap[propertyId])
      .filter((property): property is IIssueProperty => Boolean(property) && (!activeOnly || property.is_active));
    return sortBy(properties, ["sort_order"]);
  });

  /**
   * @description returns the property ids of a work item type
   */
  getTypePropertyIds = computedFn((typeId: string | null | undefined) => {
    const properties = this.getTypeProperties(typeId);
    return properties?.map((property) => property.id);
  });

  /**
   * @description fetches the properties (with their options) of a work item type
   */
  fetchTypeProperties = async (workspaceSlug: string, projectId: string, typeId: string) => {
    const response = await this.issuePropertyService.list(workspaceSlug, projectId, typeId);
    runInAction(() => {
      response.forEach((property) => {
        set(this.propertyMap, [property.id], property);
      });
      set(
        this.typePropertiesMap,
        [typeId],
        response.map((property) => property.id)
      );
      set(this.fetchedTypeMap, typeId, true);
    });
    return response;
  };

  /**
   * @description creates a property on a work item type and adds it to the store
   */
  createProperty = async (workspaceSlug: string, projectId: string, typeId: string, data: Partial<IIssueProperty>) =>
    await this.issuePropertyService.create(workspaceSlug, projectId, typeId, data).then((response) => {
      runInAction(() => {
        set(this.propertyMap, [response.id], response);
        const propertyIds = this.typePropertiesMap[typeId] ?? [];
        if (!propertyIds.includes(response.id)) {
          set(this.typePropertiesMap, [typeId], [...propertyIds, response.id]);
        }
      });
      return response;
    });

  /**
   * @description updates a property, reverting the optimistic write on failure
   */
  updateProperty = async (
    workspaceSlug: string,
    projectId: string,
    typeId: string,
    propertyId: string,
    data: Partial<IIssueProperty>
  ) => {
    const originalProperty = this.propertyMap[propertyId];
    try {
      runInAction(() => {
        set(this.propertyMap, [propertyId], { ...this.propertyMap?.[propertyId], ...data });
      });
      const response = await this.issuePropertyService.update(workspaceSlug, projectId, typeId, propertyId, data);
      runInAction(() => {
        set(this.propertyMap, [propertyId], response);
      });
      return response;
    } catch (error) {
      runInAction(() => {
        set(this.propertyMap, [propertyId], originalProperty);
      });
      throw error;
    }
  };

  /**
   * @description deletes a property from a work item type and the store
   */
  deleteProperty = async (workspaceSlug: string, projectId: string, typeId: string, propertyId: string) => {
    if (!this.propertyMap?.[propertyId]) return;
    await this.issuePropertyService.destroy(workspaceSlug, projectId, typeId, propertyId);
    runInAction(() => {
      delete this.propertyMap[propertyId];
      const propertyIds = this.typePropertiesMap[typeId] ?? [];
      set(
        this.typePropertiesMap,
        [typeId],
        propertyIds.filter((id) => id !== propertyId)
      );
    });
  };

  /**
   * @description creates an option on an OPTION property and appends it to the property
   */
  createOption = async (
    workspaceSlug: string,
    projectId: string,
    propertyId: string,
    data: Partial<IIssuePropertyOption>
  ) =>
    await this.issuePropertyService.createOption(workspaceSlug, projectId, propertyId, data).then((response) => {
      runInAction(() => {
        const property = this.propertyMap[propertyId];
        if (property) {
          set(this.propertyMap, [propertyId, "options"], [...(property.options ?? []), response]);
        }
      });
      return response;
    });

  /**
   * @description updates an option of an OPTION property in place
   */
  updateOption = async (
    workspaceSlug: string,
    projectId: string,
    propertyId: string,
    optionId: string,
    data: Partial<IIssuePropertyOption>
  ) => {
    const response = await this.issuePropertyService.updateOption(workspaceSlug, projectId, propertyId, optionId, data);
    runInAction(() => {
      const property = this.propertyMap[propertyId];
      if (property) {
        set(
          this.propertyMap,
          [propertyId, "options"],
          (property.options ?? []).map((option) => (option.id === optionId ? response : option))
        );
      }
    });
    return response;
  };

  /**
   * @description deletes an option of an OPTION property from the store
   */
  deleteOption = async (workspaceSlug: string, projectId: string, propertyId: string, optionId: string) => {
    await this.issuePropertyService.destroyOption(workspaceSlug, projectId, propertyId, optionId);
    runInAction(() => {
      const property = this.propertyMap[propertyId];
      if (property) {
        set(
          this.propertyMap,
          [propertyId, "options"],
          (property.options ?? []).filter((option) => option.id !== optionId)
        );
      }
    });
  };
}
