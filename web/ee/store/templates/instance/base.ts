import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// plane imports
import { EUserPermissions, EUserProjectRoles, EUserWorkspaceRoles, TUserPermissions } from "@plane/constants";
import { IBaseTemplateActionCallbacks, TBaseTemplate, TBaseTemplateWithData } from "@plane/types";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";

export type TBaseTemplateInstanceProps<T extends TBaseTemplateWithData> = {
  root: RootStore;
  updateActionCallback: IBaseTemplateActionCallbacks<T>["update"];
  baseTemplateData: T;
};

export interface IBaseTemplateInstance<T extends TBaseTemplateWithData>
  extends TBaseTemplate<T["template_type"], T["template_data"]> {
  // computed
  asJSON: T;
  getUserRoleForTemplateInstance:
    | TUserPermissions
    | EUserPermissions
    | EUserWorkspaceRoles
    | EUserProjectRoles
    | undefined;
  canCurrentUserEditTemplate: boolean;
  canCurrentUserDeleteTemplate: boolean;
  // helper actions
  mutateInstance: (templateData: Partial<T>) => void;
  // actions
  update: (templateData: Partial<T>) => Promise<void>;
}

export abstract class BaseTemplateInstance<T extends TBaseTemplateWithData> implements IBaseTemplateInstance<T> {
  // properties
  id: T["id"];
  name: T["name"];
  short_description: T["short_description"];
  template_type: T["template_type"];
  template_data: T["template_data"];
  is_published: T["is_published"];
  description_html: T["description_html"];
  category_ids: T["category_ids"];
  company_name: T["company_name"];
  attachment_ids: T["attachment_ids"];
  workspace: T["workspace"];
  project: T["project"];
  created_at: T["created_at"];
  updated_at: T["updated_at"];

  // root store
  protected rootStore: TBaseTemplateInstanceProps<T>["root"];

  // service
  protected updateActionCallback: TBaseTemplateInstanceProps<T>["updateActionCallback"];

  constructor(protected store: TBaseTemplateInstanceProps<T>) {
    const { root, updateActionCallback, baseTemplateData } = store;

    // properties
    this.id = baseTemplateData.id;
    this.name = baseTemplateData.name;
    this.short_description = baseTemplateData.short_description;
    this.template_type = baseTemplateData.template_type;
    this.template_data = baseTemplateData.template_data;
    this.is_published = baseTemplateData.is_published;
    this.description_html = baseTemplateData.description_html;
    this.category_ids = baseTemplateData.category_ids;
    this.company_name = baseTemplateData.company_name;
    this.attachment_ids = baseTemplateData.attachment_ids;
    this.workspace = baseTemplateData.workspace;
    this.project = baseTemplateData.project;
    this.created_at = baseTemplateData.created_at;
    this.updated_at = baseTemplateData.updated_at;

    // root store
    this.rootStore = root;

    // service
    this.updateActionCallback = updateActionCallback;

    makeObservable(this, {
      // observables
      id: observable.ref,
      name: observable.ref,
      short_description: observable.ref,
      template_type: observable.ref,
      template_data: observable,
      description_html: observable.ref,
      is_published: observable.ref,
      category_ids: observable,
      company_name: observable.ref,
      attachment_ids: observable,
      workspace: observable.ref,
      project: observable.ref,
      created_at: observable.ref,
      updated_at: observable.ref,
      // computed
      asJSON: computed,
      getUserRoleForTemplateInstance: computed,
      canCurrentUserEditTemplate: computed,
      canCurrentUserDeleteTemplate: computed,
      // actions
      mutateInstance: action,
      update: action,
    });
  }

  // computed
  /**
   * @description Returns the template as JSON
   */
  get asJSON(): T {
    const baseObject = {
      id: this.id,
      name: this.name,
      short_description: this.short_description,
      template_type: this.template_type,
      template_data: this.template_data,
      description_html: this.description_html,
      is_published: this.is_published,
      category_ids: this.category_ids,
      company_name: this.company_name,
      attachment_ids: this.attachment_ids,
      workspace: this.workspace,
      project: this.project,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
    // always make sure that all the fields are present in the base object
    // return the base object as the type T
    return baseObject as T;
  }

  /**
   * @description Returns the user role for the template instance
   */
  get getUserRoleForTemplateInstance() {
    const workspaceSlug = this.rootStore.workspaceRoot.getWorkspaceById(this.workspace)?.slug;
    if (!workspaceSlug) return undefined;

    if (this.project) {
      return this.rootStore.user.permission.projectPermissionsByWorkspaceSlugAndProjectId(workspaceSlug, this.project);
    }

    return this.rootStore.user.permission.workspaceInfoBySlug(workspaceSlug)?.role ?? undefined;
  }

  // abstract computed
  abstract get canCurrentUserEditTemplate(): boolean;
  abstract get canCurrentUserDeleteTemplate(): boolean;

  // helper actions
  /**
   * @description Update template instance
   * @param templateData Template data
   */
  mutateInstance = action((templateData: Partial<T>): void => {
    if (!this.id) return;
    runInAction(() => {
      for (const key in templateData) {
        if (templateData.hasOwnProperty(key)) {
          const templateKey = key as keyof T;
          set(this, templateKey, templateData[templateKey]);
        }
      }
    });
  });

  // actions
  /**
   * @description Updates the template on the server and updates the instance
   * @param workspaceSlug Workspace slug
   * @param templateData Template data
   */
  update = action(async (templateData: Partial<T>): Promise<void> => {
    if (!this.id) return;
    try {
      const updatedTemplate = await this.updateActionCallback(this.id, templateData);
      this.mutateInstance(updatedTemplate);
    } catch (error) {
      console.error("BaseTemplateInstance.update -> error", error);
      throw error;
    }
  });
}
