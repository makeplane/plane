import { concat, uniq, update, set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { CustomerPropertiesOptionsService, CustomerPropertyService } from "@plane/services";
// types
import {
  EIssuePropertyType,
  IIssuePropertiesService,
  IIssueProperty,
  IIssuePropertyOptionsService,
  TCustomerPropertiesOptions,
  TIssueProperty,
  TIssuePropertyOption,
  TIssuePropertyOptionsPayload,
  TIssuePropertyPayload,
} from "@plane/types";
// plane-web store
import { IssueProperty } from "@/plane-web/store/issue-types";
import { RootStore } from "@/plane-web/store/root.store";

export interface ICustomerPropertiesStore {
  loader: boolean;
  properties: IIssueProperty<EIssuePropertyType>[];
  // computed
  activeProperties: IIssueProperty<EIssuePropertyType>[];
  // computed function
  getPropertyById: <T extends EIssuePropertyType>(propertyId: string) => IIssueProperty<T> | undefined;
  // helper actions
  fetchAllPropertyData: (workspaceSlug: string) => Promise<TCustomerPropertiesOptions>;
  // actions
  fetchAllCustomerPropertiesAndOptions: (workspaceSlug: string) => Promise<void>;
  addOrUpdateProperty: (
    propertyData: TIssueProperty<EIssuePropertyType>,
    propertyOptions: TIssuePropertyOption[]
  ) => void;
  createProperty: (propertyData: TIssuePropertyPayload) => Promise<TIssueProperty<EIssuePropertyType> | undefined>;
  deleteProperty: (propertyId: string) => Promise<void>;
}

export class CustomerProperties implements ICustomerPropertiesStore {
  loader: boolean = false;
  properties: IIssueProperty<EIssuePropertyType>[] = [];
  // root store
  rootStore: RootStore;
  // services
  service: IIssuePropertiesService;
  propertyOptionsService: IIssuePropertyOptionsService;

  constructor(_root: RootStore) {
    makeObservable(this, {
      loader: observable.ref,
      properties: observable,
      // helper actions
      fetchAllPropertyData: action,
      // actions
      addOrUpdateProperty: action,
      createProperty: action,
      deleteProperty: action,
      // computed
      activeProperties: computed,
    });
    // root
    this.rootStore = _root;
    // services
    this.service = new CustomerPropertyService();
    this.propertyOptionsService = new CustomerPropertiesOptionsService();
  }

  /**
   * @description Get active properties
   */
  get activeProperties() {
    return this.properties.filter((property) => property.is_active);
  }

  // computed function
  /**
   * @description Get customer property by ID
   * @param customerPropertyId
   * @returns {IIssueProperty<T> | undefined}
   */
  getPropertyById = computedFn(
    <T extends EIssuePropertyType>(propertyId: string): IIssueProperty<T> | undefined =>
      this.properties.find((property) => property.id === propertyId) as IIssueProperty<T> | undefined
  );

  /**
   * Fetch all customer properties for a workspace
   * @param workspaceSlug
   * @returns Promise resolving to customer properties and options
   */
  fetchAllPropertyData = async (workspaceSlug: string): Promise<TCustomerPropertiesOptions> => {
    if (!workspaceSlug) {
      return { customerProperties: [], customerPropertyOptions: {} };
    }
    let customerProperties: TIssueProperty<EIssuePropertyType>[] = [];
    let customerPropertyOptions: TIssuePropertyOptionsPayload = {};
    try {
      const [properties, options] = await Promise.all([
        this.service.fetchAll({ workspaceSlug }),
        this.propertyOptionsService.fetchAll({ workspaceSlug }),
      ]);
      customerProperties = properties || [];
      customerPropertyOptions = options || {};
    } catch (error) {
      console.error("Error fetching work item type data:", error);
    }
    return { customerProperties, customerPropertyOptions };
  };

  /**
   * @description Fetch customer properties
   */
  fetchAllCustomerPropertiesAndOptions = async (workspaceSlug: string) => {
    if (!workspaceSlug) return;
    try {
      this.loader = true;
      const { customerProperties, customerPropertyOptions } = await this.fetchAllPropertyData(workspaceSlug);
      runInAction(async () => {
        if (customerProperties) {
          for (const customerProperty of customerProperties) {
            if (customerProperty.id) {
              this.addOrUpdateProperty(customerProperty, customerPropertyOptions[customerProperty.id]);
            }
          }
        }
        this.loader = false;
      });
    } catch (error) {
      console.error("CustomerProperties.fetchCustomerProperties -> error", error);
      throw error;
    } finally {
      this.loader = false;
    }
  };

  /**
   * @description Add a property to the customer
   * @param issueProperty Custom property data
   */
  addOrUpdateProperty = async (
    issuePropertyData: TIssueProperty<EIssuePropertyType>,
    propertyOptions: TIssuePropertyOption[]
  ) => {
    try {
      const existingProperty = this.properties.find((property) => property.id === issuePropertyData.id);
      let customerProperty: IIssueProperty<EIssuePropertyType>;
      if (existingProperty) {
        customerProperty = existingProperty;
        customerProperty.updatePropertyData(issuePropertyData);
      } else {
        customerProperty = new IssueProperty({
          root: this.rootStore,
          services: {
            customProperty: this.service,
            customPropertyOption: this.propertyOptionsService,
          },
          propertyData: issuePropertyData,
        });
      }
      update(this, "properties", (properties) => uniq(concat(properties, customerProperty)));
      if (propertyOptions && propertyOptions.length) {
        customerProperty.addOrUpdatePropertyOptions(propertyOptions);
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  /**
   * @description Create a customer property
   * @param {TIssuePropertyPayload} propertyData Customer property data
   */
  createProperty = async (propertyData: TIssuePropertyPayload) => {
    const { workspaceSlug } = this.rootStore.router;
    if (!workspaceSlug) return;

    try {
      const issuePropertyResponse = await this.service.create({
        workspaceSlug,
        data: propertyData,
      });
      const { options, ...issuePropertyData } = issuePropertyResponse;
      runInAction(() => {
        this.addOrUpdateProperty(issuePropertyData, options);
      });
      return issuePropertyData;
    } catch (error) {
      console.error("CustomerProperty.createProperty -> error", error);
      throw error;
    }
  };

  /**
   * @description Delete a customer property
   * @param propertyId Customer property ID
   */
  deleteProperty = async (propertyId: string) => {
    const { workspaceSlug } = this.rootStore.router;
    if (!workspaceSlug) return;

    try {
      await this.service.deleteProperty({
        workspaceSlug,
        customPropertyId: propertyId,
      });
      runInAction(() => {
        const updatedProperties = this.properties.filter((property) => property.id !== propertyId);
        set(this, "properties", updatedProperties);
      });
    } catch (error) {
      console.error("CustomerProperties.deleteProperty -> error", error);
      throw error;
    }
  };
}
