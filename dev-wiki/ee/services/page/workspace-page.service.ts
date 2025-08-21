// types
import { TIssuePage } from "@plane/types";
// services
import { BasePageService, IWorkspacePageService } from "@/store/pages/base-page.service";
import { IWorkspacePageContext } from "@/plane-web/store/pages/workspace-page.store";

export class WorkspacePageService extends BasePageService<IWorkspacePageContext> implements IWorkspacePageService {
  constructor() {
    super();
  }

  /**
   * Gets the base URL path for workspace pages
   */
  protected getBasePath(context: IWorkspacePageContext, pageId?: string): string {
    const { workspaceSlug } = context;
    const basePath = `/api/workspaces/${workspaceSlug}/pages`;
    return pageId ? `${basePath}/${pageId}` : basePath;
  }

  /**
   * Gets the favorites URL path for workspace pages
   */
  protected getFavoritesPath(context: IWorkspacePageContext, pageId?: string): string {
    const { workspaceSlug } = context;
    const basePath = `/api/workspaces/${workspaceSlug}/favorite-pages`;
    return pageId ? `${basePath}/${pageId}` : basePath;
  }

  async searchPages(
    workspaceSlug: string,
    projectId: string,
    payload: { is_global: boolean; search: string }
  ): Promise<TIssuePage[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages-search/`, {
      params: payload,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
