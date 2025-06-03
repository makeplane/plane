// plane imports
import { EUserPermissions } from "@plane/constants";
import { TPageTemplate } from "@plane/types";
// local imports
import { BaseTemplateInstance, IBaseTemplateInstance, TBaseTemplateInstanceProps } from "./base";

export type TPageTemplateInstanceProps = TBaseTemplateInstanceProps<TPageTemplate>;

// export interface IPageTemplateInstance extends IBaseTemplate<TPageTemplate> { }
export type IPageTemplateInstance = IBaseTemplateInstance<TPageTemplate>;

export class PageTemplateInstance extends BaseTemplateInstance<TPageTemplate> implements IPageTemplateInstance {
  constructor(protected store: TPageTemplateInstanceProps) {
    super(store);
  }

  // computed
  get canCurrentUserEditTemplate() {
    return this.getUserRoleForTemplateInstance === EUserPermissions.ADMIN;
  }

  get canCurrentUserDeleteTemplate() {
    return this.getUserRoleForTemplateInstance === EUserPermissions.ADMIN;
  }

  get canCurrentUserPublishTemplate() {
    return false;
  }
}
