import { BasePageHandler } from "@/core/document-types/base-page/handlers";
import { ProjectPageService } from "@/core/services/project-page.service";
import { HocusPocusServerContext } from "@/core/types/common";

export interface ProjectPageConfig {
  projectId: string | undefined;
  workspaceSlug: string | undefined;
}

const projectPageService = new ProjectPageService();
export class ProjectPageHandler extends BasePageHandler<ProjectPageService, ProjectPageConfig> {
  protected documentType = "project_page";

  constructor() {
    super(projectPageService);
  }

  protected getConfig(context: HocusPocusServerContext): ProjectPageConfig {
    return {
      projectId: context.projectId,
      workspaceSlug: context.workspaceSlug,
    };
  }
}

export const projectPageHandler = new ProjectPageHandler();
