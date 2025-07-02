import concat from "lodash/concat";
import set from "lodash/set";
import uniq from "lodash/uniq";
import update from "lodash/update";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import {
  EIssuePropertyType,
  IIssueProperty,
  IIssueType,
  IWorkItemTypeStoreInstanceServices,
  TIssueProperty,
  TIssuePropertyOption,
  TIssuePropertyPayload,
  TIssueType,
  TLogoProps,
} from "@plane/types";
// plane web store
import { IssueProperty } from "@/plane-web/store/issue-types";
import { RootStore } from "@/plane-web/store/root.store";

type TIssueTypeStore = {
  root: RootStore;
  services: IWorkItemTypeStoreInstanceServices;
  issueTypeData: TIssueType;
};

export class IssueType implements IIssueType {
  // properties
  id: string | undefined = undefined;
  name: string | undefined = undefined;
  description: string | undefined = undefined;
  logo_props: TLogoProps | undefined = undefined;
  is_active: boolean | undefined = undefined;
  is_default: boolean | undefined = undefined;
  issue_exists: boolean | undefined = undefined;
  level: number | undefined = undefined;
  is_epic: boolean | undefined = undefined;
  project_ids: string[] | undefined = undefined;
  workspace: string | undefined = undefined;
  created_at: Date | undefined = undefined;
  created_by: string | undefined = undefined;
  updated_at: Date | undefined = undefined;
  updated_by: string | undefined = undefined;
  // issue properties
  properties: IIssueProperty<EIssuePropertyType>[] = [];
  // root store
  rootStore: RootStore;
  // service
  service: IWorkItemTypeStoreInstanceServices["workItemType"] | undefined;
  customPropertyService: IWorkItemTypeStoreInstanceServices["customProperty"];

  constructor(protected store: TIssueTypeStore) {
    makeObservable(this, {
      id: observable.ref,
      name: observable.ref,
      description: observable.ref,
      logo_props: observable,
      is_active: observable.ref,
      is_default: observable.ref,
      issue_exists: observable.ref,
      level: observable.ref,
      is_epic: observable.ref,
      project_ids: observable.ref,
      workspace: observable.ref,
      created_at: observable.ref,
      created_by: observable.ref,
      updated_at: observable.ref,
      updated_by: observable.ref,
      properties: observable,
      // computed
      asJSON: computed,
      activeProperties: computed,
      // actions
      updateType: action,
      addOrUpdateProperty: action,
      createProperty: action,
      deleteProperty: action,
    });

    const { root, services, issueTypeData } = store;
    // root store
    this.rootStore = root;
    // issue type data
    this.id = issueTypeData.id;
    this.name = issueTypeData.name;
    this.description = issueTypeData.description;
    this.logo_props = issueTypeData.logo_props;
    this.is_active = issueTypeData.is_active;
    this.is_default = issueTypeData.is_default;
    this.issue_exists = issueTypeData.issue_exists;
    this.level = issueTypeData.level;
    this.is_epic = issueTypeData.is_epic;
    this.project_ids = issueTypeData.project_ids;
    this.workspace = issueTypeData.workspace;
    this.created_at = issueTypeData.created_at;
    this.created_by = issueTypeData.created_by;
    this.updated_at = issueTypeData.updated_at;
    this.updated_by = issueTypeData.updated_by;
    this.properties = [];
    // service
    this.service = services.workItemType;
    this.customPropertyService = services.customProperty;
  }

  // computed
  /**
   * @description Returns the work item type as JSON
   */
  get asJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      logo_props: this.logo_props,
      is_active: this.is_active,
      is_default: this.is_default,
      issue_exists: this.issue_exists,
      level: this.level,
      is_epic: this.is_epic,
      project_ids: this.project_ids,
      workspace: this.workspace,
      created_at: this.created_at,
      created_by: this.created_by,
      updated_at: this.updated_at,
      updated_by: this.updated_by,
    };
  }

  /**
   * @description Get active properties
   */
  get activeProperties() {
    return this.properties.filter((property) => property.is_active);
  }

  // computed function
  /**
   * @description Get issue property by ID
   * @param propertyId
   * @returns {IIssueProperty<T> | undefined}
   */
  getPropertyById = computedFn(
    <T extends EIssuePropertyType>(propertyId: string): IIssueProperty<T> | undefined =>
      this.properties.find((property) => property.id === propertyId) as IIssueProperty<T> | undefined
  );

  // actions
  /**
   * @description Update work item type
   * @param issueTypeData Work item type data
   * @param shouldSync If False then only work item type is to be updated in the store not call API to update
   */
  updateType = async (issueTypeData: Partial<TIssueType>, shouldSync: boolean = true) => {
    const { workspaceSlug, projectId } = this.rootStore.router;
    if (!workspaceSlug || !this.id) return undefined;
    try {
      let issueType: Partial<TIssueType> = issueTypeData;
      if (shouldSync) {
        if (!this.service || !this.service.update) throw new Error("Work item type update service not available.");
        issueType = await this.service.update({
          workspaceSlug,
          projectId: projectId,
          issueTypeId: this.id,
          data: issueTypeData,
        });
      }
      runInAction(() => {
        for (const key in issueType) {
          if (issueType.hasOwnProperty(key)) {
            const issueTypeKey = key as keyof TIssueType;
            set(this, issueTypeKey, issueType[issueTypeKey] ?? undefined);
          }
        }
      });
    } catch (error) {
      console.error("IssueType.updateType -> error", error);
      throw error;
    }
  };

  /**
   * @description Add a property to the issue type
   * @param issueProperty Issue property data
   */
  addOrUpdateProperty = async (
    issuePropertyData: TIssueProperty<EIssuePropertyType>,
    propertyOptions: TIssuePropertyOption[]
  ) => {
    try {
      const existingProperty = this.properties.find((property) => property.id === issuePropertyData.id);
      let issueProperty: IIssueProperty<EIssuePropertyType>;
      if (existingProperty) {
        issueProperty = existingProperty;
        issueProperty.updatePropertyData(issuePropertyData);
      } else {
        issueProperty = new IssueProperty({
          root: this.rootStore,
          services: this.store.services,
          propertyData: issuePropertyData,
        });
      }
      update(this, "properties", (properties) => uniq(concat(properties, issueProperty)));
      if (propertyOptions && propertyOptions.length) {
        issueProperty.addOrUpdatePropertyOptions(propertyOptions);
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  /**
   * @description Create an issue property
   * @param {TIssuePropertyPayload} propertyData Issue property data
   */
  createProperty = async (propertyData: TIssuePropertyPayload) => {
    const { workspaceSlug, projectId } = this.rootStore.router;
    if (!workspaceSlug || !this.id) return;

    try {
      const issuePropertyResponse = await this.customPropertyService.create({
        workspaceSlug,
        projectId,
        issueTypeId: this.id,
        data: propertyData,
      });
      const { options, ...issuePropertyData } = issuePropertyResponse;
      runInAction(() => {
        this.addOrUpdateProperty(issuePropertyData, options);
      });
      return issuePropertyData;
    } catch (error) {
      console.error("IssueType.createProperty -> error", error);
      throw error;
    }
  };

  /**
   * @description Delete an issue property
   * @param propertyId Issue property ID
   */
  deleteProperty = async (propertyId: string) => {
    const { workspaceSlug, projectId } = this.rootStore.router;
    if (!workspaceSlug || !this.id) return;

    try {
      await this.customPropertyService.deleteProperty({
        workspaceSlug,
        projectId,
        issueTypeId: this.id,
        customPropertyId: propertyId,
      });
      runInAction(() => {
        const updatedProperties = this.properties.filter((property) => property.id !== propertyId);
        set(this, "properties", updatedProperties);
      });
    } catch (error) {
      console.error("IssueType.deleteProperty -> error", error);
      throw error;
    }
  };
}
