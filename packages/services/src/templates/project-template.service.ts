// plane imports
import { API_BASE_URL } from "@plane/constants";
import { ETemplateType, TProjectTemplate } from "@plane/types";
// local imports
import { WorkspaceLevelTemplateServiceBase } from "./workspace-level-base.service";

/**
 * Service class for managing project templates
 * @extends {WorkspaceLevelTemplateServiceBase}
 */
class ProjectTemplateService extends WorkspaceLevelTemplateServiceBase<TProjectTemplate> {
  constructor(BASE_URL?: string) {
    super(ETemplateType.PROJECT, BASE_URL || API_BASE_URL);
  }
}
export const projectTemplateService = new ProjectTemplateService();
