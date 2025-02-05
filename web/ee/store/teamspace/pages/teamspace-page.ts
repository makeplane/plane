import { computed, makeObservable } from "mobx";
import { computedFn } from "mobx-utils";
// types
import { TPage } from "@plane/types";
// constants
import { EPageAccess } from "@/constants/page";
// plane web constants
import { EUserPermissions } from "@/plane-web/constants/user-permissions";
// plane web services
import { TeamspacePageService } from "@/plane-web/services/teamspace/teamspace-pages.service";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";
// store
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
      canCurrentUserAccessPage: computed,
      canCurrentUserEditPage: computed,
      canCurrentUserDuplicatePage: computed,
      canCurrentUserLockPage: computed,
      canCurrentUserChangeAccess: computed,
      canCurrentUserArchivePage: computed,
      canCurrentUserDeletePage: computed,
      canCurrentUserFavoritePage: computed,
      canCurrentUserMovePage: computed,
      isContentEditable: computed,
    });
  }

  private getUserWorkspaceRole = computedFn((): EUserPermissions | undefined => {
    const { workspaceSlug } = this.rootStore.router;
    if (!workspaceSlug || !this.team) return;
    const userRole: EUserPermissions | undefined =
      this.rootStore.user.permission.workspaceInfoBySlug(workspaceSlug)?.role;
    return userRole;
  });

  /**
   * @description returns true if the current logged in user can access the page
   */
  get canCurrentUserAccessPage() {
    const isPagePublic = this.access === EPageAccess.PUBLIC;
    return isPagePublic || this.isCurrentUserOwner;
  }

  /**
   * @description returns true if the current logged in user can edit the page
   */
  get canCurrentUserEditPage() {
    const userRole = this.getUserWorkspaceRole();
    const isPagePublic = this.access === EPageAccess.PUBLIC;
    return (
      (isPagePublic && !!userRole && userRole >= EUserPermissions.MEMBER) || (!isPagePublic && this.isCurrentUserOwner)
    );
  }

  /**
   * @description returns true if the current logged in user can create a duplicate the page
   */
  get canCurrentUserDuplicatePage() {
    const userRole = this.getUserWorkspaceRole();
    return !!userRole && userRole >= EUserPermissions.MEMBER;
  }

  /**
   * @description returns true if the current logged in user can lock the page
   */
  get canCurrentUserLockPage() {
    const userRole = this.getUserWorkspaceRole();
    return this.isCurrentUserOwner || userRole === EUserPermissions.ADMIN;
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
    return false;
    // const userRole = this.getUserWorkspaceRole();
    // return this.isCurrentUserOwner || userRole === EUserPermissions.ADMIN;
  }

  /**
   * @description returns true if the current logged in user can delete the page
   */
  get canCurrentUserDeletePage() {
    const userRole = this.getUserWorkspaceRole();
    return this.isCurrentUserOwner || userRole === EUserPermissions.ADMIN;
  }

  /**
   * @description returns true if the current logged in user can favorite the page
   */
  get canCurrentUserFavoritePage() {
    return false;
    // const userRole = this.getUserWorkspaceRole();
    // return !!userRole && userRole >= EUserPermissions.MEMBER;
  }

  /**
   * @description returns true if the current logged in user can move the page
   */
  get canCurrentUserMovePage() {
    return false;
  }

  /**
   * @description returns true if the page can be edited
   */
  get isContentEditable() {
    const userRole = this.getUserWorkspaceRole();
    const isOwner = this.isCurrentUserOwner;
    const isPublic = this.access === EPageAccess.PUBLIC;
    const isArchived = this.archived_at;
    const isLocked = this.is_locked;

    return !isArchived && !isLocked && (isOwner || (isPublic && !!userRole && userRole >= EUserPermissions.MEMBER));
  }

  getRedirectionLink = computedFn(() => {
    const { workspaceSlug } = this.rootStore.router;
    return `/${workspaceSlug}/teamspaces/${this.team}/pages/${this.id}`;
  });
}
