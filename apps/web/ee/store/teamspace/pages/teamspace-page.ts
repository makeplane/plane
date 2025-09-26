import { set } from "lodash-es";
import { action, computed, makeObservable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { EPageAccess, EUserPermissions } from "@plane/constants";
import { EUserWorkspaceRoles, TPage } from "@plane/types";
import { getPageName } from "@plane/utils";
// plane web services
import { TeamspacePageService } from "@/plane-web/services/teamspace/teamspace-pages.service";
// store
import { RootStore } from "@/plane-web/store/root.store";
import { BasePage, TPageInstance } from "@/store/pages/base-page";

const teamspacePageService = new TeamspacePageService();

export type TTeamspacePage = TPageInstance;

export class TeamspacePage extends BasePage implements TTeamspacePage {
  constructor(store: RootStore, page: TPage) {
    // required fields for API calls
    const { workspaceSlug } = store.router;
    const teamspaceId = page.team;
    // initialize base instance
    super(store, page, {
      update: async (payload) => {
        if (!workspaceSlug || !teamspaceId || !page.id) throw new Error("Missing required fields.");
        return await teamspacePageService.update(workspaceSlug, teamspaceId, page.id, payload);
      },
      updateDescription: async (document) => {
        if (!workspaceSlug || !teamspaceId || !page.id) throw new Error("Missing required fields.");
        await teamspacePageService.updateDescription(workspaceSlug, teamspaceId, page.id, document);
      },
      updateAccess: async (payload) => {
        if (!workspaceSlug || !teamspaceId || !page.id) throw new Error("Missing required fields.");
        await teamspacePageService.updateAccess(workspaceSlug, teamspaceId, page.id, payload);
      },
      lock: async () => {
        if (!workspaceSlug || !teamspaceId || !page.id) throw new Error("Missing required fields.");
        await teamspacePageService.lock(workspaceSlug, teamspaceId, page.id);
      },
      unlock: async () => {
        if (!workspaceSlug || !teamspaceId || !page.id) throw new Error("Missing required fields.");
        await teamspacePageService.unlock(workspaceSlug, teamspaceId, page.id);
      },
      archive: async () => {
        if (!workspaceSlug || !teamspaceId || !page.id) throw new Error("Missing required fields.");
        return await teamspacePageService.archive(workspaceSlug, teamspaceId, page.id);
      },
      restore: async () => {
        if (!workspaceSlug || !teamspaceId || !page.id) throw new Error("Missing required fields.");
        await teamspacePageService.restore(workspaceSlug, teamspaceId, page.id);
      },
      duplicate: async () => {
        if (!workspaceSlug || !teamspaceId || !page.id) throw new Error("Missing required fields.");
        return await teamspacePageService.duplicate(workspaceSlug, teamspaceId, page.id);
      },
    });
    makeObservable(this, {
      // computed
      parentPageIds: computed,
      subPageIds: computed,
      canCurrentUserAccessPage: computed,
      canCurrentUserEditPage: computed,
      canCurrentUserDuplicatePage: computed,
      canCurrentUserLockPage: computed,
      canCurrentUserChangeAccess: computed,
      canCurrentUserArchivePage: computed,
      canCurrentUserDeletePage: computed,
      canCurrentUserFavoritePage: computed,
      canCurrentUserMovePage: computed,
      canCurrentUserCommentOnPage: computed,
      isContentEditable: computed,
      // actions
      fetchSubPages: action,
    });
  }

  get parentPageIds() {
    const immediateParent = this.parent_id;
    if (!immediateParent) return [];
    const parentPageIds = [immediateParent];
    let parent = this.rootStore.workspacePages.data[immediateParent];
    while (parent?.parent_id) {
      parentPageIds.push(parent.parent_id);
      parent = this.rootStore.workspacePages.data[parent.parent_id];
    }
    return parentPageIds.filter((id): id is string => id !== undefined);
  }

  get subPageIds() {
    const pages = Object.values(this.rootStore.teamspaceRoot.teamspacePage.data);
    const filteredPages = pages.filter((page) => page.parent_id === this.id && !page.deleted_at);

    // Sort pages alphabetically by name
    const sortedPages = filteredPages.sort((a, b) =>
      getPageName(a.name).toLowerCase().localeCompare(getPageName(b.name).toLowerCase())
    );

    return sortedPages.map((page) => page.id).filter((id): id is string => id !== undefined);
  }

  get subPages() {
    return this.subPageIds.map((id) => this.rootStore.projectPages.data[id]);
  }

  private getUserWorkspaceRole = computedFn((): EUserWorkspaceRoles | EUserPermissions | undefined => {
    const { workspaceSlug } = this.rootStore.router;
    if (!workspaceSlug || !this.team) return;
    const userRole = this.rootStore.user.permission.getWorkspaceRoleByWorkspaceSlug(workspaceSlug);
    return userRole;
  });

  /**
   * @description returns true if the current logged in user can access the page
   */
  get canCurrentUserAccessPage() {
    // Owner can always access
    if (this.isCurrentUserOwner) return true;

    // Shared access takes precedence over role-based access
    if (this.hasSharedAccess) {
      return this.canViewWithSharedAccess;
    }

    // Fallback to regular access control
    const isPagePublic = this.access === EPageAccess.PUBLIC;
    return isPagePublic;
  }

  /**
   * @description returns true if the current logged in user can edit the page
   */
  get canCurrentUserEditPage() {
    // Owner can always edit
    if (this.isCurrentUserOwner) return true;

    // Shared access takes precedence over role-based access
    if (this.hasSharedAccess) {
      return this.canEditWithSharedAccess;
    }

    // Fallback to regular access control
    const userRole = this.getUserWorkspaceRole();
    const isPagePublic = this.access === EPageAccess.PUBLIC;
    return isPagePublic && !!userRole && userRole >= EUserWorkspaceRoles.MEMBER;
  }

  /**
   * @description returns true if the current logged in user can create a duplicate the page
   */
  get canCurrentUserDuplicatePage() {
    // Owner can always duplicate
    if (this.isCurrentUserOwner) return true;

    // Shared access users can only duplicate if they have edit access
    if (this.hasSharedAccess) {
      return this.canEditWithSharedAccess;
    }

    // Fallback to regular access control
    const userRole = this.getUserWorkspaceRole();
    return !!userRole && userRole >= EUserWorkspaceRoles.MEMBER;
  }

  /**
   * @description returns true if the current logged in user can lock the page
   */
  get canCurrentUserLockPage() {
    // Only owner can lock/unlock pages with shared access
    if (this.hasSharedAccess) {
      return this.isCurrentUserOwner;
    }

    // Fallback to regular access control
    const userRole = this.getUserWorkspaceRole();
    return this.isCurrentUserOwner || userRole === EUserWorkspaceRoles.ADMIN;
  }

  /**
   * @description changing page access is not supported in teamspace pages
   */
  get canCurrentUserChangeAccess() {
    return false;
  }

  /**
   * @description returns true if the current logged in user can archive the page
   */
  get canCurrentUserArchivePage() {
    const userRole = this.getUserWorkspaceRole();
    return this.isCurrentUserOwner || userRole === EUserWorkspaceRoles.ADMIN;
  }

  /**
   * @description returns true if the current logged in user can delete the page
   */
  get canCurrentUserDeletePage() {
    // Shared access users cannot delete pages
    if (this.hasSharedAccess) {
      return this.isCurrentUserOwner;
    }

    // Fallback to regular access control
    const userRole = this.getUserWorkspaceRole();
    return this.isCurrentUserOwner || userRole === EUserWorkspaceRoles.ADMIN;
  }

  /**
   * @description returns true if the current logged in user can favorite the page
   */
  get canCurrentUserFavoritePage() {
    const userRole = this.getUserWorkspaceRole();
    return !!userRole && userRole >= EUserWorkspaceRoles.MEMBER;
  }

  /**
   * @description returns true if the current logged in user can move the page
   */
  get canCurrentUserMovePage() {
    return false;
  }

  /**
   * @description returns true if the current logged in user can comment on the page/reply to the comments
   */
  get canCurrentUserCommentOnPage() {
    const userRole = this.getUserWorkspaceRole();
    return this.isCurrentUserOwner || userRole === EUserWorkspaceRoles.ADMIN;
  }

  /**
   * @description returns true if the page can be edited
   */
  get isContentEditable() {
    const isArchived = this.archived_at;
    const isLocked = this.is_locked;

    // Can't edit if archived or locked
    if (isArchived || isLocked) return false;

    // Owner can always edit (if not archived/locked)
    if (this.isCurrentUserOwner) return true;

    // Shared access takes precedence
    if (this.hasSharedAccess) {
      return this.canEditWithSharedAccess;
    }

    // Fallback to regular access control
    const userRole = this.getUserWorkspaceRole();
    const isPublic = this.access === EPageAccess.PUBLIC;

    return isPublic && !!userRole && userRole >= EUserWorkspaceRoles.MEMBER;
  }

  getRedirectionLink = computedFn(() => {
    const { workspaceSlug } = this.rootStore.router;
    return `/${workspaceSlug}/teamspaces/${this.team}/pages/${this.id}`;
  });

  fetchSubPages = async () => {
    try {
      const { workspaceSlug } = this.rootStore.router ?? {};
      const teamspaceId = this.team;
      if (!workspaceSlug || !teamspaceId || !this.id) throw new Error("Required fields not found");
      const subPages = await teamspacePageService.fetchSubPages(workspaceSlug, teamspaceId, this.id);

      runInAction(() => {
        for (const page of subPages) {
          if (page?.id)
            set(this.rootStore.teamspaceRoot.teamspacePage.data, [page.id], new TeamspacePage(this.rootStore, page));
        }
      });
    } catch (error) {
      console.error("Error in fetching sub-pages", error);
      throw error;
    }
  };
}
