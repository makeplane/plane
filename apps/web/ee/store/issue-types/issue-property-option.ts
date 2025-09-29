import { set } from "lodash-es";
import { action, computed, makeObservable, observable } from "mobx";
// plane imports
import { TLogoProps, TIssuePropertyOption, IIssuePropertyOption } from "@plane/types";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";

export class IssuePropertyOption implements IIssuePropertyOption {
  // properties
  id: string | undefined = undefined;
  name: string | undefined = undefined;
  sort_order: number | undefined = undefined;
  property: string | undefined = undefined;
  description: string | undefined = undefined;
  logo_props: TLogoProps | undefined = undefined;
  is_active: boolean | undefined = undefined;
  parent: string | undefined = undefined;
  is_default: boolean | undefined = undefined;
  created_at: Date | undefined = undefined;
  created_by: string | undefined = undefined;
  updated_at: Date | undefined = undefined;
  updated_by: string | undefined = undefined;

  constructor(
    private store: RootStore,
    protected propertyOptionData: TIssuePropertyOption
  ) {
    makeObservable(this, {
      id: observable.ref,
      name: observable.ref,
      sort_order: observable.ref,
      property: observable.ref,
      description: observable.ref,
      logo_props: observable,
      is_active: observable.ref,
      parent: observable.ref,
      is_default: observable.ref,
      created_at: observable.ref,
      created_by: observable.ref,
      updated_at: observable.ref,
      updated_by: observable.ref,
      // computed
      asJSON: computed,
      // helper action
      updateOptionData: action,
    });

    this.id = propertyOptionData.id;
    this.name = propertyOptionData.name;
    this.sort_order = propertyOptionData.sort_order;
    this.property = propertyOptionData.property;
    this.description = propertyOptionData.description;
    this.logo_props = propertyOptionData.logo_props;
    this.is_active = propertyOptionData.is_active;
    this.parent = propertyOptionData.parent;
    this.is_default = propertyOptionData.is_default;
    this.created_at = propertyOptionData.created_at;
    this.created_by = propertyOptionData.created_by;
    this.updated_at = propertyOptionData.updated_at;
    this.updated_by = propertyOptionData.updated_by;
  }

  // computed
  /**
   * @description Get issue property option as JSON
   * @returns {TIssuePropertyOption}
   */
  get asJSON(): TIssuePropertyOption {
    return {
      id: this.id,
      name: this.name,
      sort_order: this.sort_order,
      property: this.property,
      description: this.description,
      is_active: this.is_active,
      logo_props: this.logo_props,
      parent: this.parent,
      is_default: this.is_default,
      created_at: this.created_at,
      created_by: this.created_by,
      updated_at: this.updated_at,
      updated_by: this.updated_by,
    };
  }

  // actions
  /**
   * @description Update issue property option data
   * @param {Partial<TIssuePropertyOption>} propertyOptionData
   */
  updateOptionData = (propertyOptionData: Partial<TIssuePropertyOption>) => {
    for (const key in propertyOptionData) {
      if (propertyOptionData.hasOwnProperty(key)) {
        const propertyKey = key as keyof TIssuePropertyOption;
        set(this, propertyKey, propertyOptionData[propertyKey] ?? undefined);
      }
    }
  };
}
