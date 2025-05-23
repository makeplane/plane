// plane imports
import { EUserPermissions } from "@plane/constants";
import { TWorkItemTemplate } from "@plane/types";
// local imports
import { BaseTemplateInstance, IBaseTemplateInstance, TBaseTemplateInstanceProps } from "./base";

export type TWorkItemTemplateInstanceProps = TBaseTemplateInstanceProps<TWorkItemTemplate>;

// export interface IWorkItemTemplateInstance extends IBaseTemplate<TWorkItemTemplate> { }
export type IWorkItemTemplateInstance = IBaseTemplateInstance<TWorkItemTemplate>;

export class WorkItemTemplateInstance
  extends BaseTemplateInstance<TWorkItemTemplate>
  implements IWorkItemTemplateInstance
{
  constructor(protected store: TWorkItemTemplateInstanceProps) {
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
