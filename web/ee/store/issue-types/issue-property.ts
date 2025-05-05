import concat from "lodash/concat";
import set from "lodash/set";
import uniq from "lodash/uniq";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// types
import { computedFn } from "mobx-utils";
// plane imports
import { EIssuePropertyType, EIssuePropertyRelationType } from "@plane/constants";
import {
  TLogoProps,
  TIssueProperty,
  TIssuePropertyPayload,
  TIssuePropertySettingsMap,
  TIssuePropertyOption,
  IIssueProperty,
  IIssuePropertyOption,
  ICustomPropertyStoreInstanceServices,
} from "@plane/types";
// plane web store
import { IssuePropertyOption } from "@/plane-web/store/issue-types";
import { RootStore } from "@/plane-web/store/root.store";

type TIssuePropertyStore<T extends EIssuePropertyType> = {
  root: RootStore;
  services: ICustomPropertyStoreInstanceServices;
  propertyData: TIssueProperty<T>;
};

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
  // root store
  rootStore: RootStore;
  // service
  service: ICustomPropertyStoreInstanceServices["customProperty"];
  propertyOptionService: ICustomPropertyStoreInstanceServices["customPropertyOption"];

  constructor(protected store: TIssuePropertyStore<T>) {
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
      addOrUpdatePropertyOptions: action,
      updateProperty: action,
      createPropertyOption: action,
      deletePropertyOption: action,
    });

    const { root, propertyData, services } = store;
    // root store
    this.rootStore = root;
    // properties
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
    this.service = services.customProperty;
    this.propertyOptionService = services.customPropertyOption;
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
   * @returns {TIssuePropertyOption[]}
   */
  get sortedActivePropertyOptions(): TIssuePropertyOption[] {
    return this.propertyOptions
      .map((option) => option?.asJSON)
      ?.filter((option) => option?.is_active)
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

  // helper actions
  /**
   * @description Update property data
   * @param {TIssueProperty<EIssuePropertyType>} propertyData
   */
  updatePropertyData = (propertyData: TIssueProperty<EIssuePropertyType>) => {
    for (const key in propertyData) {
      if (propertyData.hasOwnProperty(key)) {
        const propertyKey = key as keyof TIssueProperty<T>;
        set(this, propertyKey, propertyData[propertyKey] ?? undefined);
      }
    }
  };

  /**
   * @description Add or update property option
   * @param {TIssuePropertyOption[]} propertyOptionsData
   */
  addOrUpdatePropertyOptions = (propertyOptionsData: TIssuePropertyOption[]) => {
    try {
      // add or update property option
      for (const option of propertyOptionsData) {
        if (!option.id) continue;
        const existingPropertyOption = this.getPropertyOptionById(option.id);
        if (existingPropertyOption) {
          // update the existing property option
          existingPropertyOption.updateOptionData(option);
        } else {
          const issuePropertyOption = new IssuePropertyOption(this.rootStore, option);
          const updatedPropertyOptions = uniq(concat(this.propertyOptions, issuePropertyOption));
          // add or update property option
          runInAction(() => {
            set(this, "propertyOptions", updatedPropertyOptions);
          });
        }
      }
    } catch (error) {
      console.error("IssueProperty -> addOrUpdatePropertyOptions -> error", error);
      throw error;
    }
  };

  // actions
  /**
   * @description Create a new property option
   * @param {Partial<TIssuePropertyOption>} propertyOption
   */
  createPropertyOption = async (propertyOption: Partial<TIssuePropertyOption>) => {
    const { workspaceSlug, projectId } = this.rootStore.router;
    if (!workspaceSlug || !this.id) return undefined;

    try {
      const issuePropertyOption = await this.propertyOptionService.create({
        workspaceSlug,
        projectId,
        customPropertyId: this.id,
        data: propertyOption,
      });
      runInAction(() => {
        this.addOrUpdatePropertyOptions([issuePropertyOption]);
      });

      return issuePropertyOption;
    } catch (error) {
      console.error("IssueProperty -> createPropertyOption -> error", error);
      throw error;
    }
  };

  /**
   * @description Update issue property data
   * @param {TIssuePropertyPayload} propertyData
   */
  updateProperty = async (issueTypeId: string, propertyData: TIssuePropertyPayload) => {
    const { workspaceSlug, projectId } = this.rootStore.router;
    if (!workspaceSlug || !this.id) return undefined;

    try {
      const issuePropertyResponse = await this.service.update({
        workspaceSlug,
        projectId,
        issueTypeId,
        customPropertyId: this.id,
        data: propertyData,
      });
      runInAction(() => {
        const { options, ...issuePropertyData } = issuePropertyResponse;
        this.updatePropertyData(issuePropertyData);
        if (options && options.length) {
          this.addOrUpdatePropertyOptions(options);
        }
      });
    } catch (error) {
      console.error("IssueProperty -> updateProperty -> error", error);
      throw error;
    }
  };

  /**
   * @description Delete a property option
   * @param {string} propertyOptionId
   */
  deletePropertyOption = async (propertyOptionId: string) => {
    const { workspaceSlug, projectId } = this.rootStore.router;
    if (!workspaceSlug || !this.id) return;

    try {
      await this.propertyOptionService.deleteOption({
        workspaceSlug,
        projectId,
        customPropertyId: this.id,
        issuePropertyOptionId: propertyOptionId,
      });
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
