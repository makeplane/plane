// services
import { BasePageService, IBasePageParams, IUpdateDescriptionParams } from "@/core/services/base-page.service";

export type SyncAgentConfig = Record<string, unknown>;

export class SyncAgentService extends BasePageService {
  /**
   * Gets the base URL path for workspace pages
   */
  protected getBasePath<TConfig extends SyncAgentConfig>(params: IBasePageParams<TConfig>): string {
    const { pageId } = params;
    return `/api/pages/${pageId}`;
  }

  async updateDescription<TConfig extends SyncAgentConfig>(_params: IUpdateDescriptionParams<TConfig>) {
    // no op
    // since we can't prevent hocuspocus from updating the description after a
    // sync event, we need to manually override the method to not do anything
  }
}
