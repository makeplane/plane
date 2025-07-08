// plane imports
import { API_BASE_URL } from "@plane/constants";
import { ETemplateType, TWorkItemTemplate } from "@plane/types";
// local imports
import { ProjectLevelTemplateServiceBase } from "./project-level-base.service";
import { WorkspaceLevelTemplateServiceBase } from "./workspace-level-base.service";

/**
 * Service class for managing work item templates
 * @extends {WorkspaceLevelTemplateServiceBase}
 */
class WorkspaceWorkItemTemplateService extends WorkspaceLevelTemplateServiceBase<TWorkItemTemplate> {
  constructor(BASE_URL?: string) {
    super(ETemplateType.WORK_ITEM, BASE_URL || API_BASE_URL);
  }
}
export const workspaceWorkItemTemplateService = new WorkspaceWorkItemTemplateService();

/**
 * Service class for managing work item templates
 * @extends {ProjectLevelTemplateServiceBase}
 */
class ProjectWorkItemTemplateService extends ProjectLevelTemplateServiceBase<TWorkItemTemplate> {
  constructor(BASE_URL?: string) {
    super(ETemplateType.WORK_ITEM, BASE_URL || API_BASE_URL);
  }
}
export const projectWorkItemTemplateService = new ProjectWorkItemTemplateService();
