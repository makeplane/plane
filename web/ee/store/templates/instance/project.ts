// plane imports
import { EUserPermissions } from "@plane/constants";
import { TProjectTemplate } from "@plane/types";
// local imports
import { BaseTemplateInstance, IBaseTemplateInstance, TBaseTemplateInstanceProps } from "./base";

export type TProjectTemplateInstanceProps = TBaseTemplateInstanceProps<TProjectTemplate>;

// export interface IProjectTemplateInstance extends IBaseTemplate<TProjectTemplate> { }
export type IProjectTemplateInstance = IBaseTemplateInstance<TProjectTemplate>;

export class ProjectTemplateInstance
  extends BaseTemplateInstance<TProjectTemplate>
  implements IProjectTemplateInstance
{
  constructor(protected store: TProjectTemplateInstanceProps) {
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
    const workspaceSlug = this.getWorkspaceSlugForTemplateInstance;
    if (!workspaceSlug) return false;
    return (
      this.rootStore.featureFlags.getFeatureFlag(workspaceSlug, "PROJECT_TEMPLATES_PUBLISH", false) &&
      this.getUserRoleForTemplateInstance === EUserPermissions.ADMIN
    );
  }

  get canCurrentUserUnpublishTemplate() {
    return this.canCurrentUserPublishTemplate && this.is_published;
  }
}
