import { computed, makeObservable } from "mobx";
import { computedFn } from "mobx-utils";
// types
import { TPage } from "@plane/types";
// constants
import { EPageAccess } from "@/constants/page";
// plane web constants
import { EUserPermissions } from "@/plane-web/constants/user-permissions";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";
// store
import { BasePage, TPageInstance } from "@/store/pages/base-page";
// services
import { WorkspacePageService } from "../../services/page";
const workspacePageService = new WorkspacePageService();

export type TWorkspacePage = TPageInstance;

export class WorkspacePage extends BasePage implements TWorkspacePage {
  constructor(store: RootStore, page: TPage) {
    // required fields for API calls
    const { workspaceSlug } = store.router;
    // initialize base instance
    super(store, page, {
      update: async (payload) => {
        if (!workspaceSlug || !page.id) throw new Error("Missing required fields.");
        return await workspacePageService.update(workspaceSlug, page.id, payload);
      },
      updateDescription: async (document) => {
        if (!workspaceSlug || !page.id) throw new Error("Missing required fields.");
        await workspacePageService.updateDescription(workspaceSlug, page.id, document);
      },
      updateAccess: async (payload) => {
        if (!workspaceSlug || !page.id) throw new Error("Missing required fields.");
        await workspacePageService.updateAccess(workspaceSlug, page.id, payload);
      },
      lock: async () => {
        if (!workspaceSlug || !page.id) throw new Error("Missing required fields.");
        await workspacePageService.lock(workspaceSlug, page.id);
      },
      unlock: async () => {
        if (!workspaceSlug || !page.id) throw new Error("Missing required fields.");
        await workspacePageService.unlock(workspaceSlug, page.id);
      },
      archive: async () => {
        if (!workspaceSlug || !page.id) throw new Error("Missing required fields.");
        return await workspacePageService.archive(workspaceSlug, page.id);
      },
      restore: async () => {
        if (!workspaceSlug || !page.id) throw new Error("Missing required fields.");
        await workspacePageService.restore(workspaceSlug, page.id);
      },
    });
    makeObservable(this, {
      // computed
      canCurrentUserEditPage: computed,
      canCurrentUserDuplicatePage: computed,
      canCurrentUserLockPage: computed,
      canCurrentUserChangeAccess: computed,
      canCurrentUserArchivePage: computed,
      canCurrentUserDeletePage: computed,
      canCurrentUserFavoritePage: computed,
      isContentEditable: computed,
    });
  }

  /**
   * @description returns true if the current logged in user can edit the page
   */
  get canCurrentUserEditPage() {
    const { workspaceSlug } = this.rootStore.router;
    const currentUserWorkspaceRole = this.rootStore.user.permission.workspaceInfoBySlug(
      workspaceSlug?.toString() || ""
    )?.role;
    return (
      this.isCurrentUserOwner || (!!currentUserWorkspaceRole && currentUserWorkspaceRole >= EUserPermissions.MEMBER)
    );
  }

  /**
   * @description returns true if the current logged in user can create a duplicate the page
   */
  get canCurrentUserDuplicatePage() {
    const { workspaceSlug } = this.rootStore.router;
    const currentUserWorkspaceRole = this.rootStore.user.permission.workspaceInfoBySlug(
      workspaceSlug?.toString() || ""
    )?.role;
    return (
      this.isCurrentUserOwner || (!!currentUserWorkspaceRole && currentUserWorkspaceRole >= EUserPermissions.MEMBER)
    );
  }

  /**
   * @description returns true if the current logged in user can lock the page
   */
  get canCurrentUserLockPage() {
    return this.isCurrentUserOwner;
  }

  /**
   * @description returns true if the current logged in user can change the access of the page
   */
  get canCurrentUserChangeAccess() {
    return this.isCurrentUserOwner;
  }

  /**
   * @description returns true if the current logged in user can archive the page
   */
  get canCurrentUserArchivePage() {
    const { workspaceSlug } = this.rootStore.router;
    const currentUserWorkspaceRole = this.rootStore.user.permission.workspaceInfoBySlug(
      workspaceSlug?.toString() || ""
    )?.role;

    return this.isCurrentUserOwner || currentUserWorkspaceRole === EUserPermissions.ADMIN;
  }

  /**
   * @description returns true if the current logged in user can delete the page
   */
  get canCurrentUserDeletePage() {
    const { workspaceSlug } = this.rootStore.router;
    const currentUserWorkspaceRole = this.rootStore.user.permission.workspaceInfoBySlug(
      workspaceSlug?.toString() || ""
    )?.role;

    return this.isCurrentUserOwner || currentUserWorkspaceRole === EUserPermissions.ADMIN;
  }

  /**
   * @description returns true if the current logged in user can favorite the page
   */
  get canCurrentUserFavoritePage() {
    const { workspaceSlug } = this.rootStore.router;
    const currentUserWorkspaceRole = this.rootStore.user.permission.workspaceInfoBySlug(
      workspaceSlug?.toString() || ""
    )?.role;

    return !!currentUserWorkspaceRole && currentUserWorkspaceRole >= EUserPermissions.MEMBER;
  }

  /**
   * @description returns true if the page can be edited
   */
  get isContentEditable() {
    const { workspaceSlug } = this.rootStore.router;

    const isOwner = this.isCurrentUserOwner;
    const currentUserRole = this.rootStore.user.permission.workspaceInfoBySlug(workspaceSlug?.toString() || "")?.role;
    const isPublic = this.access === EPageAccess.PUBLIC;
    const isArchived = this.archived_at;
    const isLocked = this.is_locked;

    return (
      !isArchived &&
      !isLocked &&
      (isOwner || (isPublic && !!currentUserRole && currentUserRole >= EUserPermissions.MEMBER))
    );
  }

  getRedirectionLink = computedFn(() => {
    const { workspaceSlug } = this.rootStore.router;
    return `/${workspaceSlug}/pages/${this.id}`;
  });
}
