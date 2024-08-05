import set from "lodash/set";
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
import { EIssuePropertyType, TIssueProperty, TIssuePropertyOption, TIssueType } from "@/plane-web/types";

export interface IIssueType extends TIssueType {
  properties: IIssueProperty<EIssuePropertyType>[];
  // computed
  asJSON: TIssueType | undefined;
  activeProperties: IIssueProperty<EIssuePropertyType>[];
  // computed function
  getPropertyById: <T extends EIssuePropertyType>(propertyId: string) => IIssueProperty<T> | undefined;
  // helper actions
  sortAndUpdateProperties: (propertyData: IIssueProperty<EIssuePropertyType>) => void;
  // actions
  updateType: (issueTypeData: Partial<TIssueType>) => Promise<TIssueType | undefined>;
  addProperty: (propertyData: TIssueProperty<EIssuePropertyType>, propertyOptions?: TIssuePropertyOption[]) => void;
  createProperty: (
    propertyData: Partial<TIssueProperty<EIssuePropertyType>>
  ) => Promise<TIssueProperty<EIssuePropertyType> | undefined>;
  deleteProperty: (propertyId: string) => Promise<void>;
}

export class IssueType implements IIssueType {
  // properties
  id: string | undefined;
  name: string | undefined;
  description: string | undefined;
  logo_props: TLogoProps | undefined;
  sort_order: number | undefined;
  is_active: boolean | undefined;
  is_default: boolean | undefined;
  issue_exists: boolean | undefined;
  weight: number | undefined;
  project: string | undefined;
  workspace: string | undefined;
  created_at: Date | undefined;
  created_by: string | undefined;
  updated_at: Date | undefined;
  updated_by: string | undefined;
  // issue properties
  properties: IIssueProperty<EIssuePropertyType>[] = [];
  // service
  service: IssueTypesService;
  issuePropertyService: IssuePropertiesService;

  constructor(
    private store: RootStore,
    issueTypeData: TIssueType
  ) {
    this.id = issueTypeData.id ?? undefined;
    this.name = issueTypeData.name ?? undefined;
    this.description = issueTypeData.description ?? undefined;
    this.logo_props = issueTypeData.logo_props ?? undefined;
    this.sort_order = issueTypeData.sort_order ?? undefined;
    this.is_active = issueTypeData.is_active ?? undefined;
    this.is_default = issueTypeData.is_default ?? undefined;
    this.issue_exists = issueTypeData.issue_exists ?? undefined;
    this.weight = issueTypeData.weight ?? undefined;
    this.project = issueTypeData.project ?? undefined;
    this.workspace = issueTypeData.workspace ?? undefined;
    this.created_at = issueTypeData.created_at ?? undefined;
    this.created_by = issueTypeData.created_by ?? undefined;
    this.updated_at = issueTypeData.updated_at ?? undefined;
    this.updated_by = issueTypeData.updated_by ?? undefined;
    this.properties = [];
    // service
    this.service = new IssueTypesService();
    this.issuePropertyService = new IssuePropertiesService();

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
      // helper actions
      sortAndUpdateProperties: action,
      // actions
      updateType: action,
      addProperty: action,
      createProperty: action,
      deleteProperty: action,
    });
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

  // helper actions
  /**
   * @description Sort and update properties
   * @param propertyData Issue property data
   */
  // TODO: remove if not required
  sortAndUpdateProperties = (propertyData: IIssueProperty<EIssuePropertyType>) => {
    const updatedProperties = [...this.properties, propertyData].sort((a, b) => {
      if (a.sort_order && b.sort_order) return a.sort_order - b.sort_order;
      return 0;
    });
    set(this, "properties", updatedProperties);
  };

  // actions
  /**
   * @description Update issue type
   * @param issueTypeData Issue type data
   */
  updateType = async (issueTypeData: Partial<TIssueType>) => {
    const { workspaceSlug, projectId } = this.store.router;
    if (!workspaceSlug || !projectId || !this.id) return undefined;

    try {
      await this.service.update(workspaceSlug, projectId, this.id, issueTypeData);
      runInAction(() => {
        for (const key in issueTypeData) {
          if (issueTypeData.hasOwnProperty(key)) {
            const issueTypeKey = key as keyof TIssueType;
            set(this, issueTypeKey, issueTypeData[issueTypeKey] ?? undefined);
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
    propertyOptions?: TIssuePropertyOption[]
  ) => {
    try {
      const issueProperty = new IssueProperty<EIssuePropertyType>(this.store, issuePropertyData);
      this.sortAndUpdateProperties(issueProperty);
      if (propertyOptions && propertyOptions.length) {
        for (const propertyOptionData of propertyOptions) {
          issueProperty.addPropertyOption(propertyOptionData);
        }
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  /**
   * @description Create an issue property
   * @param propertyData Issue property data
   */
  createProperty = async (propertyData: Partial<TIssueProperty<EIssuePropertyType>>) => {
    const { workspaceSlug, projectId } = this.store.router;
    if (!workspaceSlug || !projectId || !this.id) return;

    try {
      const issueProperty = await this.issuePropertyService.create(workspaceSlug, projectId, this.id, propertyData);
      runInAction(() => {
        this.addProperty(issueProperty);
      });
      return issueProperty;
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
