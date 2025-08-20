import { makeObservable, computed, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// constants
import { EPageAccess } from "@plane/constants";
// types
import { TPage, TPageNavigationTabs } from "@plane/types";
// utils
import { filterPagesByPageType, getPageName } from "@plane/utils";
// base store
import { WorkspacePageService } from "@/plane-web/services/page";
import { PageShareService, TPageSharedUser } from "@/plane-web/services/page/page-share.service";
import { RootStore } from "@/plane-web/store/root.store";
import { IPageContext } from "@/store/pages/base-page.service";
import { BasePageStore } from "@/store/pages/base-page.store";
// services
import { WorkspacePage, TWorkspacePage } from "./workspace-page";

/**
 * Workspace page context - only needs workspaceSlug
 */
export interface IWorkspacePageContext extends IPageContext {
  workspaceSlug: string;
}

export interface IWorkspacePageStore
  extends BasePageStore<TWorkspacePage, WorkspacePageService, IWorkspacePageContext> {
  // All common properties are inherited from BasePageStore
  // Only workspace-specific properties here
  currentWorkspacePageIds: string[] | undefined;

  // Workspace-specific methods
  getCurrentWorkspacePageIdsByType: (pageType: TPageNavigationTabs) => string[] | undefined;
  getCurrentWorkspaceFilteredPageIdsByType: (pageType: TPageNavigationTabs) => string[] | undefined;
}

/**
 * Workspace-specific page store
 * Extends BasePageStore with workspace-specific functionality
 */
export class WorkspacePageStore
  extends BasePageStore<TWorkspacePage, WorkspacePageService, IWorkspacePageContext>
  implements IWorkspacePageStore
{
  // Initialize the service
  protected service: WorkspacePageService;

  constructor(store: RootStore) {
    super(store);

    this.service = new WorkspacePageService();

    this.pageShareService = new PageShareService();

    // Add workspace-specific computed properties
    makeObservable(this, {
      currentWorkspacePageIds: computed,
    });
  }

  /**
   * Create a new WorkspacePage instance
   */
  protected createPageInstance(page: TPage): TWorkspacePage {
    return new WorkspacePage(this.store, page);
  }

  /**
   * Get the context for API calls (workspaceSlug only for workspace pages)
   */
  protected getContext(): IWorkspacePageContext | undefined {
    const { workspaceSlug } = this.store.router;
    if (!workspaceSlug) return undefined;
    return { workspaceSlug };
  }

  /**
   * Filter pages that belong to the current workspace
   */
  protected filterPagesByContext(pages: TWorkspacePage[]): TWorkspacePage[] {
    const workspaceId = this.getCurrentContextId();
    if (!workspaceId) return [];
    return pages.filter((page) => page.workspace === workspaceId);
  }

  /**
   * Get the current workspace ID from store
   */
  protected getCurrentContextId(): string | undefined {
    return this.store.workspaceRoot.currentWorkspace?.id;
  }

  /**
   * Get all page IDs for the current workspace
   */
  get currentWorkspacePageIds() {
    const workspaceId = this.getCurrentContextId();
    if (!workspaceId) return undefined;

    const pagesList = this.getAllPages().filter((p) => p.workspace === workspaceId);
    return pagesList.map((page) => page?.id).filter((id): id is string => id !== undefined);
  }

  /**
   * Get page IDs by type for the current workspace
   * Note: This method has slightly different logic than project pages
   */
  getCurrentWorkspacePageIdsByType = computedFn((pageType: TPageNavigationTabs) => {
    const workspaceId = this.getCurrentContextId();
    if (!workspaceId) return undefined;

    // Workspace pages filter by page type and only include top-level pages
    let pagesByType = filterPagesByPageType(pageType, Array.from(this.data.values()));
    pagesByType = pagesByType.filter((p) => p.workspace === workspaceId && !p?.parent_id);

    return pagesByType.map((page) => page?.id).filter((id): id is string => id !== undefined);
  });

  /**
   * Get filtered page IDs by type
   */
  getCurrentWorkspaceFilteredPageIdsByType = computedFn((pageType: TPageNavigationTabs) => {
    const workspaceId = this.getCurrentContextId();
    if (!workspaceId) return undefined;

    switch (pageType) {
      case "public":
        return this.getPageIdsByCategory("public");
      case "private":
        return this.getPageIdsByCategory("private");
      case "archived":
        return this.getPageIdsByCategory("archived");
      case "shared":
        return this.getPageIdsByCategory("shared");
      default:
        return [];
    }
  });

  // ===== OVERRIDE BASE METHODS FOR WORKSPACE-SPECIFIC BEHAVIOR =====

  /**
   * Override categorizePages to handle shared pages differently
   * Workspace pages have a separate "shared" tab
   */
  protected categorizePages(pages: TWorkspacePage[]) {
    // Get base categorization
    const baseCategories = super.categorizePages(pages);

    // Workspace pages show shared pages in a separate tab
    // So we need to adjust the logic slightly
    const publicPages = pages.filter(
      (page) =>
        page?.access === EPageAccess.PUBLIC &&
        !page?.parent_id &&
        !page?.archived_at &&
        !page?.deleted_at &&
        !page?.is_shared // Exclude shared pages from public
    );

    const publicIds = publicPages
      .sort((a, b) => getPageName(a.name).toLowerCase().localeCompare(getPageName(b.name).toLowerCase()))
      .map((page) => page?.id)
      .filter((id): id is string => id !== undefined);

    // Return with workspace-specific public page logic
    return {
      ...baseCategories,
      publicIds,
    };
  }

  /**
   * Fetch shared users for a workspace page
   */
  async fetchPageSharedUsers(pageId: string) {
    try {
      const { workspaceSlug } = this.store.router;
      if (!workspaceSlug || !pageId) return;

      const sharedUsers = await this.pageShareService.getWorkspacePageSharedUsers(workspaceSlug, pageId);

      const finalUsers = sharedUsers.map((user) => ({
        user_id: user.user_id,
        access: user.access,
      }));

      runInAction(() => {
        const page = this.getPageById(pageId);
        if (page && finalUsers) {
          page.updateSharedUsers(finalUsers);
        }
      });
    } catch (error) {
      runInAction(() => {
        this.loader = undefined;
        this.error = {
          title: "Failed",
          description: "Failed to fetch page shared users. Please try again later.",
        };
      });
      throw error;
    }
  }

  /**
   * Update shared users for a workspace page
   */
  async bulkUpdatePageSharedUsers(pageId: string, sharedUsers: TPageSharedUser[]) {
    const oldSharedUsers = this.getPageById(pageId)?.sharedUsers || [];

    try {
      const { workspaceSlug } = this.store.router;
      if (!workspaceSlug || !pageId) return;

      const page = this.getPageById(pageId);
      if (!page) return;

      // Optimistic update
      runInAction(() => {
        page.is_shared = sharedUsers.length > 0;
        page.updateSharedUsers(sharedUsers);
      });

      // API call
      await this.pageShareService.bulkUpdateWorkspacePageSharedUsers(workspaceSlug, pageId, sharedUsers);
    } catch (error) {
      runInAction(() => {
        // Revert on error
        const page = this.getPageById(pageId);
        if (page) {
          page.is_shared = oldSharedUsers.length > 0;
          page.updateSharedUsers(oldSharedUsers);
        }
        this.loader = undefined;
        this.error = {
          title: "Failed",
          description: "Failed to bulk update page shared users. Please try again later.",
        };
      });
      throw error;
    }
  }
}
