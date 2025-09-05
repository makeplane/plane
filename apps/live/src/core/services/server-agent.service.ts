// services
import { BasePageService, IBasePageParams } from "@/core/services/base-page.service";

export type ServerAgentConfig = Record<string, unknown>;

export class ServerAgentService extends BasePageService {
  /**
   * Gets the base URL path for workspace pages
   */
  protected getBasePath<TConfig extends ServerAgentConfig>(params: IBasePageParams<TConfig>): string {
    const { pageId } = params;
    return `/api/pages/${pageId}`;
  }
}
