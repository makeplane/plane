import concat from "lodash/concat";
import set from "lodash/set";
import uniq from "lodash/uniq";
import update from "lodash/update";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// types
import { computedFn } from "mobx-utils";
import { TLogoProps } from "@plane/types";
// plane web services
import { IssuePropertiesService, IssuePropertyOptionsService } from "@/plane-web/services/issue-types";
// plane web store
import { IIssuePropertyOption, IssuePropertyOption } from "@/plane-web/store/issue-types";
import { RootStore } from "@/plane-web/store/root.store";
// plane web types
import {
  EIssuePropertyRelationType,
  EIssuePropertyType,
  TIssueProperty,
  TIssuePropertyOption,
  TIssuePropertySettingsMap,
} from "@/plane-web/types";

export interface IIssueProperty<T extends EIssuePropertyType> extends TIssueProperty<T> {
  propertyOptions: IIssuePropertyOption[];
  // computed
  asJSON: TIssueProperty<T>;
  sortedActivePropertyOptions: IIssuePropertyOption[];
  // computed function
  getPropertyOptionById: (propertyOptionId: string) => IIssuePropertyOption | undefined;
  // actions
  updateProperty: (issueTypeId: string, propertyData: Partial<TIssueProperty<T>>) => Promise<void>;
  addPropertyOption: (propertyOptionData: TIssuePropertyOption) => void;
  createPropertyOption: (propertyOption: Partial<TIssuePropertyOption>) => Promise<TIssuePropertyOption | undefined>;
  deletePropertyOption: (propertyOptionId: string) => Promise<void>;
}

export class IssueProperty<T extends EIssuePropertyType> implements IIssueProperty<T> {
  // properties
  id: string | undefined = undefined;
  name: string | undefined = undefined;
  display_name: string | undefined = undefined;
  description: string | undefined = undefined;
  logo_props: TLogoProps | undefined = undefined;
  sort_order: number | undefined = undefined;
  property_type: T | undefined = undefined;
  relation_type: EIssuePropertyRelationType | null | undefined = undefined;
  is_required: boolean | undefined = undefined;
  default_value: string[] | undefined = undefined;
  settings: TIssuePropertySettingsMap[T] | undefined = undefined;
  is_active: boolean | undefined = undefined;
  issue_type: string | undefined = undefined;
  is_multi: boolean | undefined = undefined;
  created_at: Date | undefined = undefined;
  created_by: string | undefined = undefined;
  updated_at: Date | undefined = undefined;
  updated_by: string | undefined = undefined;
  // property options
  propertyOptions: IIssuePropertyOption[] = [];
  // service
  service: IssuePropertiesService;
  propertyOptionService: IssuePropertyOptionsService;

  constructor(
    private store: RootStore,
    propertyData: TIssueProperty<T>
  ) {
    makeObservable(this, {
      id: observable.ref,
      name: observable.ref,
      display_name: observable.ref,
      description: observable.ref,
      logo_props: observable,
      sort_order: observable.ref,
      property_type: observable.ref,
      relation_type: observable.ref,
      is_required: observable.ref,
      default_value: observable,
      settings: observable.ref,
      is_active: observable.ref,
      issue_type: observable.ref,
      is_multi: observable.ref,
      created_at: observable.ref,
      created_by: observable.ref,
      updated_at: observable.ref,
      updated_by: observable.ref,
      propertyOptions: observable,
      // computed
      asJSON: computed,
      sortedActivePropertyOptions: computed,
      // actions
      updateProperty: action,
      addPropertyOption: action,
      createPropertyOption: action,
      deletePropertyOption: action,
    });

    this.id = propertyData.id;
    this.name = propertyData.name;
    this.display_name = propertyData.display_name;
    this.description = propertyData.description;
    this.logo_props = propertyData.logo_props;
    this.sort_order = propertyData.sort_order;
    this.property_type = propertyData.property_type;
    this.relation_type = propertyData.relation_type;
    this.is_required = propertyData.is_required;
    this.default_value = propertyData.default_value;
    this.settings = propertyData.settings;
    this.is_active = propertyData.is_active;
    this.issue_type = propertyData.issue_type;
    this.is_multi = propertyData.is_multi;
    this.created_at = propertyData.created_at;
    this.created_by = propertyData.created_by;
    this.updated_at = propertyData.updated_at;
    this.updated_by = propertyData.updated_by;
    // service
    this.service = new IssuePropertiesService();
    this.propertyOptionService = new IssuePropertyOptionsService();
  }

  // computed
  /**
   * @description Get issue property as JSON
   * @returns {TIssueProperty}
   */
  get asJSON(): TIssueProperty<T> {
    return {
      id: this.id,
      name: this.name,
      display_name: this.display_name,
      description: this.description,
      logo_props: this.logo_props,
      sort_order: this.sort_order,
      property_type: this.property_type,
      relation_type: this.relation_type,
      is_required: this.is_required,
      default_value: this.default_value,
      settings: this.settings,
      is_active: this.is_active,
      issue_type: this.issue_type,
      is_multi: this.is_multi,
      created_at: this.created_at,
      created_by: this.created_by,
      updated_at: this.updated_at,
      updated_by: this.updated_by,
    };
  }

  /**
   * @description Get sorted active property options
   * @returns {IIssuePropertyOption[]}
   */
  get sortedActivePropertyOptions(): IIssuePropertyOption[] {
    return this.propertyOptions
      ?.filter((option) => option.is_active)
      .sort((a, b) => {
        if (a.sort_order && b.sort_order) return a.sort_order - b.sort_order;
        return 0;
      });
  }

  // computed function
  /**
   * @description Get property option by id
   * @param {string} propertyOptionId
   * @returns {IIssuePropertyOption | undefined}
   */
  getPropertyOptionById = computedFn((propertyOptionId: string): IIssuePropertyOption | undefined =>
    this.propertyOptions.find((option) => option.id === propertyOptionId)
  );

  // actions
  /**
   * @description Update issue property data
   * @param {Partial<TIssueProperty<T>>} propertyData
   */
  updateProperty = async (issueTypeId: string, propertyData: Partial<TIssueProperty<T>>) => {
    const { workspaceSlug, projectId } = this.store.router;
    if (!workspaceSlug || !projectId || !issueTypeId || !this.id) return undefined;

    try {
      const issueProperty = await this.service.update(workspaceSlug, projectId, issueTypeId, this.id, propertyData);
      runInAction(() => {
        for (const key in issueProperty) {
          if (issueProperty.hasOwnProperty(key)) {
            const propertyKey = key as keyof TIssueProperty<T>;
            set(this, propertyKey, issueProperty[propertyKey] ?? undefined);
          }
        }
      });
    } catch (error) {
      console.error("IssueProperty -> updateProperty -> error", error);
      throw error;
    }
  };

  /**
   * @description Add property option
   * @param {TIssuePropertyOption} propertyOptionData
   */
  addPropertyOption = (propertyOptionData: TIssuePropertyOption) => {
    try {
      const issuePropertyOption = new IssuePropertyOption(this.store, propertyOptionData);
      update(this, "propertyOptions", (propertyOptions) => uniq(concat(propertyOptions, issuePropertyOption)));
    } catch (error) {
      console.error("IssueProperty -> addPropertyOption -> error", error);
      throw error;
    }
  };

  /**
   * @description Create a new property option
   * @param {Partial<TIssuePropertyOption>} propertyOption
   */
  createPropertyOption = async (propertyOption: Partial<TIssuePropertyOption>) => {
    const { workspaceSlug, projectId } = this.store.router;
    if (!workspaceSlug || !projectId || !this.id) return undefined;

    try {
      const issuePropertyOption = await this.propertyOptionService.create(
        workspaceSlug,
        projectId,
        this.id,
        propertyOption
      );
      runInAction(() => {
        this.addPropertyOption(issuePropertyOption);
      });

      return issuePropertyOption;
    } catch (error) {
      console.error("IssueProperty -> createPropertyOption -> error", error);
      throw error;
    }
  };

  /**
   * @description Delete a property option
   * @param {string} propertyOptionId
   */
  deletePropertyOption = async (propertyOptionId: string) => {
    const { workspaceSlug, projectId } = this.store.router;
    if (!workspaceSlug || !projectId || !this.id) return;

    try {
      await this.propertyOptionService.deleteOption(workspaceSlug, projectId, this.id, propertyOptionId);
      runInAction(() => {
        const updatedPropertyOptions = this.propertyOptions.filter((option) => option.id !== propertyOptionId);
        set(this, "propertyOptions", updatedPropertyOptions);
      });
    } catch (error) {
      console.error("IssueProperty -> deletePropertyOption -> error", error);
      throw error;
    }
  };
}
