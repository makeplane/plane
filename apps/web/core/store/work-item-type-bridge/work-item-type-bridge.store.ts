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

import { computed, makeObservable } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type {
  EIssuePropertyType,
  IIssueProperty,
  IIssueType,
  IIssueTypesStore,
  TEpicPropertiesOptions,
  TIssueType,
  TIssueTypesPromise,
  TLoader,
  TWorkItemTypesPropertiesOptions,
} from "@plane/types";
import { EWorkItemConversionType, EWorkItemTypeEntity } from "@plane/types";
// stores
import { IssueTypes } from "@/store/issue-types";
import type { RootStore } from "@/plane-web/store/root.store";
// types
import { EWorkspaceFeatures } from "@/types/workspace-feature";

/**
 * Bridge store that sits between consumer hooks and the underlying old/new work item type stores.
 * Checks the WORKSPACE_WORK_ITEM_TYPES feature flag and routes data reads to the correct store.
 *
 * - When feature flag is OFF: all calls delegate to the old IssueTypes store
 * - When feature flag is ON: read methods route to the new workspace-level stores,
 *   wrapping new instances in Proxy adapters to provide the IIssueType interface
 * - Fetch/write actions always delegate to the old store
 * - Epic-related methods always delegate to the old store
 *
 * The old IssueTypes store is owned privately by this bridge — no other code should
 * instantiate or access it directly.
 */
export class WorkItemTypeBridgeStore implements IIssueTypesStore {
  private oldStore: IIssueTypesStore;

  constructor(private rootStore: RootStore) {
    this.oldStore = new IssueTypes(rootStore);
    makeObservable(this, {
      data: computed,
    });
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private get currentWorkspaceSlug(): string {
    return this.rootStore.router.workspaceSlug ?? "";
  }

  private isNewSystemActive(workspaceSlug: string): boolean {
    return (
      this.rootStore.featureFlags.getFeatureFlag(workspaceSlug, "WORKSPACE_WORK_ITEM_TYPES", false) &&
      this.rootStore.workspaceFeatures.isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_WORK_ITEM_TYPES_ENABLED)
    );
  }

  /**
   * Wraps a new-system work item type instance in a Proxy that adds
   * `activeProperties`, `getPropertyById`, `properties` (as IIssueProperty[]),
   * and `sortedProperties` — the interface consumers expect from IIssueType.
   */
  private adaptInstance = computedFn((typeId: string): IIssueType | undefined => {
    const instance = this.rootStore.workItemTypesRootStore.get(typeId);
    if (!instance) return undefined;

    const getActiveProps = () => this.getActivePropertiesForType(typeId);
    const getProps = () => this.getPropertiesForType(typeId);
    const getPropertyById = (propertyId: string) =>
      this.rootStore.customPropertiesRootStore.get(propertyId) as unknown as
        | IIssueProperty<EIssuePropertyType>
        | undefined;

    return new Proxy(instance, {
      get: (target, prop, receiver) => {
        if (prop === "activeProperties") return getActiveProps();
        if (prop === "getPropertyById") return getPropertyById;
        if (prop === "properties") return getProps();
        if (prop === "sortedProperties") return getProps();
        return Reflect.get(target, prop, receiver) as unknown;
      },
    }) as unknown as IIssueType;
  });

  /**
   * Resolves the active properties for a type from the custom properties store,
   * sorted by the sort order stored in the type's property refs.
   */
  private getActivePropertiesForType = computedFn((typeId: string) => {
    const instance = this.rootStore.workItemTypesRootStore.get(typeId);
    if (!instance) return [];
    const properties = this.rootStore.customPropertiesRootStore.getByIds(instance.linkedPropertyIds);
    return properties
      .filter((p) => p.is_active)
      .sort((a, b) => {
        const propertyRefs = instance.properties ?? {};
        const sortA = propertyRefs[a.id] ?? Infinity;
        const sortB = propertyRefs[b.id] ?? Infinity;
        return sortA - sortB;
      });
  });

  /**
   * Resolves all properties for a type from the custom properties store.
   */
  private getPropertiesForType = computedFn((typeId: string) => {
    const instance = this.rootStore.workItemTypesRootStore.get(typeId);
    if (!instance) return [];
    return this.rootStore.customPropertiesRootStore.getByIds(instance.linkedPropertyIds);
  });

  // ---------------------------------------------------------------------------
  // Observables (pass-through to old store)
  // ---------------------------------------------------------------------------

  get loader(): TLoader {
    return this.oldStore.loader;
  }

  get issueTypePromise(): TIssueTypesPromise | undefined {
    return this.oldStore.issueTypePromise;
  }

  get propertiesLoader(): Record<string, Record<EWorkItemTypeEntity, TLoader>> {
    return this.oldStore.propertiesLoader;
  }

  get propertiesFetchedMap(): Record<string, Record<EWorkItemTypeEntity, boolean>> {
    return this.oldStore.propertiesFetchedMap;
  }

  get issueTypes(): Record<string, IIssueType> {
    return this.oldStore.issueTypes;
  }

  get projectEpics(): Record<string, IIssueType> {
    return this.oldStore.projectEpics;
  }

  // ---------------------------------------------------------------------------
  // Computed: data
  // ---------------------------------------------------------------------------

  get data(): Record<string, IIssueType> {
    if (this.isNewSystemActive(this.currentWorkspaceSlug)) {
      const newTypes = this.rootStore.workItemTypesRootStore.allTypes;
      const result: Record<string, IIssueType> = {};
      for (const type of newTypes) {
        const adapted = this.adaptInstance(type.id);
        if (adapted) result[type.id] = adapted;
      }
      // Include old epics — they always come from the old store
      const oldData = this.oldStore.data;
      for (const [id, type] of Object.entries(oldData)) {
        if (type.is_epic) result[id] = type;
      }
      return result;
    }
    return this.oldStore.data;
  }

  // ---------------------------------------------------------------------------
  // Routed computed functions
  // ---------------------------------------------------------------------------

  getIssueTypeIds = computedFn((activeOnly: boolean): string[] => {
    if (this.isNewSystemActive(this.currentWorkspaceSlug)) {
      const allTypes = this.rootStore.workItemTypesRootStore.allTypes;
      return allTypes.filter((t) => !activeOnly || t.is_active).map((t) => t.id);
    }
    return this.oldStore.getIssueTypeIds(activeOnly);
  });

  getIssueTypeById = computedFn((issueTypeId: string): IIssueType | undefined => {
    if (this.isNewSystemActive(this.currentWorkspaceSlug)) {
      return this.data[issueTypeId];
    }
    return this.oldStore.getIssueTypeById(issueTypeId);
  });

  getIssuePropertyById = computedFn((customPropertyId: string): IIssueProperty<EIssuePropertyType> | undefined => {
    if (this.isNewSystemActive(this.currentWorkspaceSlug)) {
      // Try the new workspace-level custom properties store first.
      const fromNew = this.rootStore.customPropertiesRootStore.get(customPropertyId) as unknown as
        | IIssueProperty<EIssuePropertyType>
        | undefined;
      if (fromNew) return fromNew;
      // Fall back to the old store for epic properties (and any other properties not in the new store).
      return this.oldStore.getIssuePropertyById(customPropertyId);
    }
    return this.oldStore.getIssuePropertyById(customPropertyId);
  });

  getProjectWorkItemPropertiesLoader = computedFn((projectId: string, entityType: EWorkItemTypeEntity): TLoader => {
    if (entityType === EWorkItemTypeEntity.EPIC || !this.isNewSystemActive(this.currentWorkspaceSlug)) {
      return this.oldStore.getProjectWorkItemPropertiesLoader(projectId, entityType);
    }
    // New system: properties are pre-fetched at workspace level
    const loader = this.rootStore.workItemTypesRootStore.workspaceWorkItemTypesStore.getLoaderByWorkspaceSlug(
      this.currentWorkspaceSlug
    );
    return loader ?? "init-loader";
  });

  getProjectWorkItemPropertiesFetchedMap = computedFn((projectId: string, entityType: EWorkItemTypeEntity): boolean => {
    if (entityType === EWorkItemTypeEntity.EPIC || !this.isNewSystemActive(this.currentWorkspaceSlug)) {
      return this.oldStore.getProjectWorkItemPropertiesFetchedMap(projectId, entityType);
    }
    // New system: check if workspace data is loaded
    const loader = this.rootStore.workItemTypesRootStore.workspaceWorkItemTypesStore.getLoaderByWorkspaceSlug(
      this.currentWorkspaceSlug
    );
    const workItemTypes =
      this.rootStore.workItemTypesRootStore.workspaceWorkItemTypesStore.getWorkItemTypesByWorkspaceSlug(
        this.currentWorkspaceSlug
      );
    return loader === "loaded" || workItemTypes.length > 0;
  });

  getProjectIssueTypeIds = computedFn((projectId: string): string[] => {
    if (this.isNewSystemActive(this.currentWorkspaceSlug)) {
      const types =
        this.rootStore.workItemTypesRootStore.projectWorkItemTypesStore.getWorkItemTypesByProjectId(projectId);
      return types.map((t) => t.id);
    }
    return this.oldStore.getProjectIssueTypeIds(projectId);
  });

  getProjectIssueTypes = computedFn((projectId: string, activeOnly: boolean): Record<string, IIssueType> => {
    if (this.isNewSystemActive(this.currentWorkspaceSlug)) {
      const types =
        this.rootStore.workItemTypesRootStore.projectWorkItemTypesStore.getWorkItemTypesByProjectId(projectId);
      const filtered = activeOnly ? types.filter((t) => t.is_active) : types;
      return filtered.reduce(
        (acc, t) => {
          const adapted = this.adaptInstance(t.id);
          if (adapted) acc[t.id] = adapted;
          return acc;
        },
        {} as Record<string, IIssueType>
      );
    }
    return this.oldStore.getProjectIssueTypes(projectId, activeOnly);
  });

  getProjectDefaultIssueType = computedFn((projectId: string): IIssueType | undefined => {
    if (this.isNewSystemActive(this.currentWorkspaceSlug)) {
      const defaultId =
        this.rootStore.workItemTypesRootStore.projectWorkItemTypesStore.getDefaultWorkItemTypeId(projectId);
      return defaultId ? this.adaptInstance(defaultId) : undefined;
    }
    return this.oldStore.getProjectDefaultIssueType(projectId);
  });

  getProjectDefaultWorkItemTypeId = computedFn((projectId: string): string | undefined => {
    if (this.isNewSystemActive(this.currentWorkspaceSlug)) {
      return this.rootStore.workItemTypesRootStore.projectWorkItemTypesStore.getDefaultWorkItemTypeId(projectId);
    }
    return this.oldStore.getProjectDefaultWorkItemTypeId(projectId);
  });

  getIssueTypeProperties = computedFn((issueTypeId: string): IIssueProperty<EIssuePropertyType>[] => {
    if (this.isNewSystemActive(this.currentWorkspaceSlug)) {
      // Delegates to this.data which merges new adapted types + old epics.
      // For new types: proxy intercepts .properties → getPropertiesForType()
      // For epics: raw old IIssueType .properties → old store's property array
      return this.data[issueTypeId]?.properties ?? [];
    }
    return this.oldStore.getIssueTypeProperties(issueTypeId);
  });

  getIssueTypeIdsWithMandatoryProperties = computedFn((projectId: string): string[] => {
    if (this.isNewSystemActive(this.currentWorkspaceSlug)) {
      const projectTypes = this.getProjectIssueTypes(projectId, false);
      return Object.keys(projectTypes).filter((typeId) => {
        const type = projectTypes[typeId];
        return type.activeProperties.some((property) => property.is_required);
      });
    }
    return this.oldStore.getIssueTypeIdsWithMandatoryProperties(projectId);
  });

  // ---------------------------------------------------------------------------
  // Feature checks (routed)
  // ---------------------------------------------------------------------------

  isWorkItemTypeEnabledForProject = computedFn((workspaceSlug: string, projectId: string): boolean => {
    if (this.isNewSystemActive(workspaceSlug)) {
      const projectTypes =
        this.rootStore.workItemTypesRootStore.projectWorkItemTypesStore.getWorkItemTypesByProjectId(projectId);
      return projectTypes.length > 0;
    }
    return this.oldStore.isWorkItemTypeEnabledForProject(workspaceSlug, projectId);
  });

  // ---------------------------------------------------------------------------
  // Pass-through: helper actions
  // ---------------------------------------------------------------------------

  isEpicEnabledForProject = computedFn((workspaceSlug: string, projectId: string): boolean =>
    this.oldStore.isEpicEnabledForProject(workspaceSlug, projectId)
  );

  isWorkItemTypeEntityEnabledForProject = computedFn(
    (workspaceSlug: string, projectId: string, entityType?: EWorkItemTypeEntity): boolean => {
      if (entityType === EWorkItemTypeEntity.EPIC) {
        return this.oldStore.isEpicEnabledForProject(workspaceSlug, projectId);
      }
      if (entityType === EWorkItemTypeEntity.WORK_ITEM && this.isNewSystemActive(workspaceSlug)) {
        return this.isWorkItemTypeEnabledForProject(workspaceSlug, projectId);
      }
      return this.oldStore.isWorkItemTypeEntityEnabledForProject(workspaceSlug, projectId, entityType);
    }
  );

  // ---------------------------------------------------------------------------
  // Pass-through: Epic access
  // ---------------------------------------------------------------------------

  getProjectEpicId = computedFn((projectId: string): string | undefined => this.oldStore.getProjectEpicId(projectId));

  getProjectEpicDetails = computedFn((projectId: string): IIssueType | undefined =>
    this.oldStore.getProjectEpicDetails(projectId)
  );

  // ---------------------------------------------------------------------------
  // Pass-through: helper actions
  // ---------------------------------------------------------------------------

  addOrUpdateIssueTypes = (issueTypes: TIssueType[], projectId?: string) => {
    this.oldStore.addOrUpdateIssueTypes(issueTypes, projectId);
  };

  fetchAllWorkItemTypePropertyData = (
    workspaceSlug: string,
    projectId: string
  ): Promise<TWorkItemTypesPropertiesOptions> =>
    this.oldStore.fetchAllWorkItemTypePropertyData(workspaceSlug, projectId);

  fetchAllEpicPropertyData = (workspaceSlug: string, projectId: string): Promise<TEpicPropertiesOptions> =>
    this.oldStore.fetchAllEpicPropertyData(workspaceSlug, projectId);

  fetchAllIssueTypes = (workspaceSlug: string, projectId?: string): Promise<TIssueType[]> =>
    this.oldStore.fetchAllIssueTypes(workspaceSlug, projectId);

  fetchAllEpics = (workspaceSlug: string, projectId?: string): Promise<TIssueType[]> =>
    this.oldStore.fetchAllEpics(workspaceSlug, projectId);

  // ---------------------------------------------------------------------------
  // Pass-through: actions
  // ---------------------------------------------------------------------------

  enableIssueTypes = (workspaceSlug: string, projectId: string): Promise<void> =>
    this.oldStore.enableIssueTypes(workspaceSlug, projectId);

  enableEpics = (workspaceSlug: string, projectId: string): Promise<void> =>
    this.oldStore.enableEpics(workspaceSlug, projectId);

  disableEpics = (workspaceSlug: string, projectId: string): Promise<void> =>
    this.oldStore.disableEpics(workspaceSlug, projectId);

  fetchAll = (workspaceSlug: string, projectId?: string): Promise<void> =>
    this.oldStore.fetchAll(workspaceSlug, projectId);

  fetchAllWorkItemTypePropertiesAndOptions = (workspaceSlug: string, projectId: string): Promise<void | undefined> =>
    this.oldStore.fetchAllWorkItemTypePropertiesAndOptions(workspaceSlug, projectId);

  fetchAllEpicPropertiesAndOptions = (workspaceSlug: string, projectId: string): Promise<void | undefined> =>
    this.oldStore.fetchAllEpicPropertiesAndOptions(workspaceSlug, projectId);

  fetchAllPropertiesAndOptions = (
    workspaceSlug: string,
    projectId: string,
    entityType: EWorkItemTypeEntity
  ): Promise<void | undefined> => this.oldStore.fetchAllPropertiesAndOptions(workspaceSlug, projectId, entityType);

  createType = (typeData: Partial<TIssueType>): Promise<TIssueType | undefined> => this.oldStore.createType(typeData);

  deleteType = (typeId: string): Promise<void> => this.oldStore.deleteType(typeId);

  convertWorkItem = (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    convertTo: EWorkItemConversionType
  ): Promise<void> => this.oldStore.convertWorkItem(workspaceSlug, projectId, issueId, convertTo);
}
