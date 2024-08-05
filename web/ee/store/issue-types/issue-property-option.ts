import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// types
import { TLogoProps } from "@plane/types";
// plane web services
import { IssuePropertyOptionsService } from "@/plane-web/services/issue-types";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";
// plane web types
import { TIssuePropertyOption } from "@/plane-web/types";

export interface IIssuePropertyOption extends TIssuePropertyOption {
  // computed
  asJSON: TIssuePropertyOption | undefined;
  // actions
  updatePropertyOption: (issuePropertyId: string, propertyOptionData: Partial<TIssuePropertyOption>) => Promise<void>;
}

export class IssuePropertyOption implements IIssuePropertyOption {
  // properties
  id: string | undefined;
  name: string | undefined;
  sort_order: number | undefined;
  property: string | undefined;
  description: string | undefined;
  logo_props: TLogoProps | undefined;
  is_active: boolean | undefined;
  parent: string | undefined;
  is_default: boolean | undefined;
  created_at: Date | undefined;
  created_by: string | undefined;
  updated_at: Date | undefined;
  updated_by: string | undefined;
  // service
  service: IssuePropertyOptionsService;

  constructor(
    private store: RootStore,
    propertyOptionData: TIssuePropertyOption
  ) {
    this.id = propertyOptionData.id ?? undefined;
    this.name = propertyOptionData.name ?? undefined;
    this.sort_order = propertyOptionData.sort_order ?? undefined;
    this.property = propertyOptionData.property ?? undefined;
    this.description = propertyOptionData.description ?? undefined;
    this.logo_props = propertyOptionData.logo_props ?? undefined;
    this.is_active = propertyOptionData.is_active ?? undefined;
    this.parent = propertyOptionData.parent ?? undefined;
    this.is_default = propertyOptionData.is_default ?? undefined;
    this.created_at = propertyOptionData.created_at ?? undefined;
    this.created_by = propertyOptionData.created_by ?? undefined;
    this.updated_at = propertyOptionData.updated_at ?? undefined;
    this.updated_by = propertyOptionData.updated_by ?? undefined;
    // service
    this.service = new IssuePropertyOptionsService();

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
      // actions
      updatePropertyOption: action,
    });
  }

  // computed
  /**
   * @description Get issue property option as JSON
   * @returns {TIssuePropertyOption  */
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
  updatePropertyOption = async (issuePropertyId: string, propertyOptionData: Partial<TIssuePropertyOption>) => {
    const { workspaceSlug, projectId } = this.store.router;
    if (!workspaceSlug || !projectId || !issuePropertyId || !this.id) return undefined;

    try {
      await this.service.update(workspaceSlug, projectId, issuePropertyId, this.id, propertyOptionData);
      runInAction(() => {
        for (const key in propertyOptionData) {
          if (propertyOptionData.hasOwnProperty(key)) {
            const propertyKey = key as keyof TIssuePropertyOption;
            set(this, propertyKey, propertyOptionData[propertyKey] ?? undefined);
          }
        }
      });
    } catch (error) {
      console.error("IssuePropertyOption -> updatePropertyOption -> error", error);
      throw error;
    }
  };
}
