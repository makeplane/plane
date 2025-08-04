// plane imports
import { API_BASE_URL } from "@plane/constants";
import { ETemplateType, TPageTemplate } from "@plane/types";
// local imports
import { ProjectLevelTemplateServiceBase } from "./project-level-base.service";
import { WorkspaceLevelTemplateServiceBase } from "./workspace-level-base.service";

/**
 * Service class for managing page templates
 * @extends {WorkspaceLevelTemplateServiceBase}
 */
class WorkspacePageTemplateService extends WorkspaceLevelTemplateServiceBase<TPageTemplate> {
  constructor(BASE_URL?: string) {
    super(ETemplateType.PAGE, BASE_URL || API_BASE_URL);
  }
}
export const workspacePageTemplateService = new WorkspacePageTemplateService();

/**
 * Service class for managing page templates
 * @extends {ProjectLevelTemplateServiceBase}
 */
class ProjectPageTemplateService extends ProjectLevelTemplateServiceBase<TPageTemplate> {
  constructor(BASE_URL?: string) {
    super(ETemplateType.PAGE, BASE_URL || API_BASE_URL);
  }
}
export const projectPageTemplateService = new ProjectPageTemplateService();
