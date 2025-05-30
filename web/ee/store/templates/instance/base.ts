import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// plane imports
import { EUserPermissions, EUserProjectRoles, EUserWorkspaceRoles, TUserPermissions } from "@plane/constants";
import { IBaseTemplateActionCallbacks, TBaseTemplate, TBaseTemplateWithData, TPublishTemplateForm } from "@plane/types";
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
  asPublishableJSON: TPublishTemplateForm<T["template_type"], T["template_data"]>;
  getWorkspaceSlugForTemplateInstance: string | undefined;
  getUserRoleForTemplateInstance:
    | TUserPermissions
    | EUserPermissions
    | EUserWorkspaceRoles
    | EUserProjectRoles
    | undefined;
  canCurrentUserEditTemplate: boolean;
  canCurrentUserDeleteTemplate: boolean;
  canCurrentUserPublishTemplate: boolean;
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
  categories: T["categories"];
  company_name: T["company_name"];
  contact_email: T["contact_email"];
  keywords: T["keywords"];
  privacy_policy_url: T["privacy_policy_url"];
  terms_of_service_url: T["terms_of_service_url"];
  attachments: T["attachments"];
  attachments_urls: T["attachments_urls"];
  website: T["website"];
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
    this.categories = baseTemplateData.categories;
    this.company_name = baseTemplateData.company_name;
    this.contact_email = baseTemplateData.contact_email;
    this.keywords = baseTemplateData.keywords;
    this.privacy_policy_url = baseTemplateData.privacy_policy_url;
    this.terms_of_service_url = baseTemplateData.terms_of_service_url;
    this.attachments = baseTemplateData.attachments;
    this.attachments_urls = baseTemplateData.attachments_urls;
    this.website = baseTemplateData.website;
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
      categories: observable,
      keywords: observable,
      company_name: observable.ref,
      contact_email: observable.ref,
      privacy_policy_url: observable.ref,
      terms_of_service_url: observable.ref,
      attachments: observable,
      attachments_urls: observable,
      website: observable.ref,
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
      categories: this.categories,
      company_name: this.company_name,
      contact_email: this.contact_email,
      keywords: this.keywords,
      privacy_policy_url: this.privacy_policy_url,
      terms_of_service_url: this.terms_of_service_url,
      attachments: this.attachments,
      attachments_urls: this.attachments_urls,
      website: this.website,
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
   * @description Returns the template as a publishable JSON object
   */
  get asPublishableJSON(): TPublishTemplateForm<T["template_type"], T["template_data"]> {
    return {
      id: this.id,
      name: this.name,
      short_description: this.short_description,
      description_html: this.description_html,
      categories: this.categories,
      company_name: this.company_name,
      contact_email: this.contact_email,
      keywords: this.keywords,
      privacy_policy_url: this.privacy_policy_url,
      terms_of_service_url: this.terms_of_service_url,
      attachments: this.attachments,
      attachments_urls: this.attachments_urls,
      website: this.website,
    };
  }

  /**
   * @description Returns the workspace slug for the template instance
   */
  get getWorkspaceSlugForTemplateInstance() {
    return this.rootStore.workspaceRoot.getWorkspaceById(this.workspace)?.slug;
  }

  /**
   * @description Returns the user role for the template instance
   */
  get getUserRoleForTemplateInstance() {
    const workspaceSlug = this.rootStore.workspaceRoot.getWorkspaceById(this.workspace)?.slug;
    if (!workspaceSlug) return undefined;

    if (this.project) {
      return this.rootStore.user.permission.getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug, this.project);
    }

    return this.rootStore.user.permission.workspaceInfoBySlug(workspaceSlug)?.role ?? undefined;
  }

  // abstract computed
  abstract get canCurrentUserEditTemplate(): boolean;
  abstract get canCurrentUserDeleteTemplate(): boolean;
  abstract get canCurrentUserPublishTemplate(): boolean;

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
      const updatedTemplate = await this.updateActionCallback(this.id, {
        // Include project and workspace to route update request to correct service
        project: this.project,
        workspace: this.workspace,
        ...templateData,
      });
      this.mutateInstance(updatedTemplate);
    } catch (error) {
      console.error("BaseTemplateInstance.update -> error", error);
      throw error;
    }
  });
}
