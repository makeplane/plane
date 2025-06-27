// services
import { ProjectPageConfig } from "@/ce/document-types/project-page-handler";
import { BasePageService, IBasePageParams } from "@/core/services/base-page.service";

/**
 * Service for handling project page operations
 */
export class ProjectPageService extends BasePageService {
  /**
   * Gets the base URL path for project pages
   */
  protected getBasePath<TConfig extends ProjectPageConfig>(params: IBasePageParams<TConfig>): string {
    const { pageId, config } = params;
    const { workspaceSlug, projectId } = config;

    // Handle project pages
    return `/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}`;
  }
}
