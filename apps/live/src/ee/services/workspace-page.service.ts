// services
import { BasePageService, IBasePageParams } from "@/core/services/base-page.service";
import { WorkspacePageConfig } from "../document-types/workspace-page-handler";

export class WorkspacePageService extends BasePageService {
  /**
   * Gets the base URL path for workspace pages
   */
  protected getBasePath<TConfig extends WorkspacePageConfig>(params: IBasePageParams<TConfig>): string {
    const { pageId, config } = params;
    const { workspaceSlug } = config;
    return `/api/workspaces/${workspaceSlug}/pages/${pageId}`;
  }
}
