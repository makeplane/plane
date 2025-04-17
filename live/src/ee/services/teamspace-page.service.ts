// services
import { BasePageService, IBasePageParams } from "@/core/services/base-page.service";
import { TeamspacePageConfig } from "../document-types/teamspace-page-handler";

export class TeamspacePageService extends BasePageService {
  /**
   * Gets the base URL path for workspace pages
   */
  protected getBasePath<TConfig extends TeamspacePageConfig>(params: IBasePageParams<TConfig>): string {
    const { pageId, config } = params;
    const { workspaceSlug, teamspaceId } = config;
    return `/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${pageId}`;
  }
}
