import concat from "lodash/concat";
import set from "lodash/set";
import uniq from "lodash/uniq";
import update from "lodash/update";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// types
import { computedFn } from "mobx-utils";
import { TLogoProps } from "@plane/types";
// services
import { IssuePropertiesService, IssueTypesService } from "@/plane-web/services/issue-types";
// plane web store
import { IIssueProperty, IssueProperty } from "@/plane-web/store/issue-types";
import { RootStore } from "@/plane-web/store/root.store";
// plane web types
import {
  EIssuePropertyType,
  TIssuePropertyPayload,
  TIssueProperty,
  TIssuePropertyOption,
  TIssueType,
} from "@/plane-web/types";

export interface IIssueType extends TIssueType {
  properties: IIssueProperty<EIssuePropertyType>[];
  // computed
  asJSON: TIssueType | undefined;
  activeProperties: IIssueProperty<EIssuePropertyType>[];
  // computed function
  getPropertyById: <T extends EIssuePropertyType>(propertyId: string) => IIssueProperty<T> | undefined;
  // actions
  updateType: (issueTypeData: Partial<TIssueType>) => Promise<TIssueType | undefined>;
  addProperty: (propertyData: TIssueProperty<EIssuePropertyType>, propertyOptions: TIssuePropertyOption[]) => void;
  createProperty: (propertyData: TIssuePropertyPayload) => Promise<TIssueProperty<EIssuePropertyType> | undefined>;
  deleteProperty: (propertyId: string) => Promise<void>;
}

export class IssueType implements IIssueType {
  // properties
  id: string | undefined = undefined;
  name: string | undefined = undefined;
  description: string | undefined = undefined;
  logo_props: TLogoProps | undefined = undefined;
  sort_order: number | undefined = undefined;
  is_active: boolean | undefined = undefined;
  is_default: boolean | undefined = undefined;
  issue_exists: boolean | undefined = undefined;
  weight: number | undefined = undefined;
  project: string | undefined = undefined;
  workspace: string | undefined = undefined;
  created_at: Date | undefined = undefined;
  created_by: string | undefined = undefined;
  updated_at: Date | undefined = undefined;
  updated_by: string | undefined = undefined;
  // issue properties
  properties: IIssueProperty<EIssuePropertyType>[] = [];
  // service
  service: IssueTypesService;
  issuePropertyService: IssuePropertiesService;

  constructor(
    private store: RootStore,
    issueTypeData: TIssueType
  ) {
    makeObservable(this, {
      id: observable.ref,
      name: observable.ref,
      description: observable.ref,
      logo_props: observable,
      sort_order: observable.ref,
      is_active: observable.ref,
      is_default: observable.ref,
      issue_exists: observable.ref,
      weight: observable.ref,
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
      addProperty: action,
      createProperty: action,
      deleteProperty: action,
    });

    this.id = issueTypeData.id;
    this.name = issueTypeData.name;
    this.description = issueTypeData.description;
    this.logo_props = issueTypeData.logo_props;
    this.sort_order = issueTypeData.sort_order;
    this.is_active = issueTypeData.is_active;
    this.is_default = issueTypeData.is_default;
    this.issue_exists = issueTypeData.issue_exists;
    this.weight = issueTypeData.weight;
    this.project = issueTypeData.project;
    this.workspace = issueTypeData.workspace;
    this.created_at = issueTypeData.created_at;
    this.created_by = issueTypeData.created_by;
    this.updated_at = issueTypeData.updated_at;
    this.updated_by = issueTypeData.updated_by;
    this.properties = [];
    // service
    this.service = new IssueTypesService();
    this.issuePropertyService = new IssuePropertiesService();
  }

  // computed
  /**
   * @description Returns the issue type as JSON
   */
  get asJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      logo_props: this.logo_props,
      sort_order: this.sort_order,
      is_active: this.is_active,
      is_default: this.is_default,
      issue_exists: this.issue_exists,
      weight: this.weight,
      project: this.project,
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
   * @description Update issue type
   * @param issueTypeData Issue type data
   */
  updateType = async (issueTypeData: Partial<TIssueType>) => {
    const { workspaceSlug, projectId } = this.store.router;
    if (!workspaceSlug || !projectId || !this.id) return undefined;

    try {
      const issueType = await this.service.update(workspaceSlug, projectId, this.id, issueTypeData);
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
  addProperty = async (
    issuePropertyData: TIssueProperty<EIssuePropertyType>,
    propertyOptions: TIssuePropertyOption[]
  ) => {
    try {
      const issueProperty = new IssueProperty<EIssuePropertyType>(this.store, issuePropertyData);
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
    const { workspaceSlug, projectId } = this.store.router;
    if (!workspaceSlug || !projectId || !this.id) return;

    try {
      const issuePropertyResponse = await this.issuePropertyService.create(
        workspaceSlug,
        projectId,
        this.id,
        propertyData
      );
      const { options, ...issuePropertyData } = issuePropertyResponse;
      runInAction(() => {
        this.addProperty(issuePropertyData, options);
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
    const { workspaceSlug, projectId } = this.store.router;
    if (!workspaceSlug || !projectId || !this.id) return;

    try {
      await this.issuePropertyService.deleteProperty(workspaceSlug, projectId, this.id, propertyId);
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
