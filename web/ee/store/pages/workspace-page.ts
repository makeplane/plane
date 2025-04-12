import set from "lodash/set";
import { computed, makeObservable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { EUserWorkspaceRoles, EPageAccess } from "@plane/constants";
import { TPage } from "@plane/types";
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
      lock: async (recursive: boolean) => {
        if (!workspaceSlug || !page.id) throw new Error("Missing required fields.");
        await workspacePageService.lock(workspaceSlug, page.id, recursive);
      },
      unlock: async (recursive: boolean) => {
        if (!workspaceSlug || !page.id) throw new Error("Missing required fields.");
        await workspacePageService.unlock(workspaceSlug, page.id, recursive);
      },
      archive: async () => {
        if (!workspaceSlug || !page.id) throw new Error("Missing required fields.");
        return await workspacePageService.archive(workspaceSlug, page.id);
      },
      restore: async () => {
        if (!workspaceSlug || !page.id) throw new Error("Missing required fields.");
        await workspacePageService.restore(workspaceSlug, page.id);
      },
      duplicate: async () => {
        if (!workspaceSlug || !page.id) throw new Error("Missing required fields.");
        return await workspacePageService.duplicate(workspaceSlug, page.id);
      },
    });
    makeObservable(this, {
      // computed
      parentPageIds: computed,
      subPageIds: computed,
      subPages: computed,
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
    const pages = Object.values(this.rootStore.workspacePages.data);
    const subPageIds = pages
      .filter((page) => page.parent_id === this.id && !page.deleted_at)
      .map((page) => page.id)
      .filter((id): id is string => id !== undefined);
    return subPageIds;
  }

  get subPages() {
    return this.subPageIds.map((id) => this.rootStore.workspacePages.data[id]);
  }

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
    const { workspaceSlug } = this.rootStore.router;
    const currentUserWorkspaceRole = this.rootStore.user.permission.workspaceInfoBySlug(
      workspaceSlug?.toString() || ""
    )?.role;
    return (
      this.isCurrentUserOwner || (!!currentUserWorkspaceRole && currentUserWorkspaceRole >= EUserWorkspaceRoles.MEMBER)
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
      this.isCurrentUserOwner || (!!currentUserWorkspaceRole && currentUserWorkspaceRole >= EUserWorkspaceRoles.MEMBER)
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

    return this.isCurrentUserOwner || currentUserWorkspaceRole === EUserWorkspaceRoles.ADMIN;
  }

  /**
   * @description returns true if the current logged in user can delete the page
   */
  get canCurrentUserDeletePage() {
    const { workspaceSlug } = this.rootStore.router;
    const currentUserWorkspaceRole = this.rootStore.user.permission.workspaceInfoBySlug(
      workspaceSlug?.toString() || ""
    )?.role;

    return this.isCurrentUserOwner || currentUserWorkspaceRole === EUserWorkspaceRoles.ADMIN;
  }

  /**
   * @description returns true if the current logged in user can favorite the page
   */
  get canCurrentUserFavoritePage() {
    const { workspaceSlug } = this.rootStore.router;
    const currentUserWorkspaceRole = this.rootStore.user.permission.workspaceInfoBySlug(
      workspaceSlug?.toString() || ""
    )?.role;

    return !!currentUserWorkspaceRole && currentUserWorkspaceRole >= EUserWorkspaceRoles.MEMBER;
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
    const { workspaceSlug } = this.rootStore.router;

    const isOwner = this.isCurrentUserOwner;
    const currentUserRole = this.rootStore.user.permission.workspaceInfoBySlug(workspaceSlug?.toString() || "")?.role;
    const isPublic = this.access === EPageAccess.PUBLIC;
    const isArchived = this.archived_at;
    const isLocked = this.is_locked;

    return (
      !isArchived &&
      !isLocked &&
      (isOwner || (isPublic && !!currentUserRole && currentUserRole >= EUserWorkspaceRoles.MEMBER))
    );
  }

  getRedirectionLink = computedFn(() => {
    const { workspaceSlug } = this.rootStore.router;
    return `/${workspaceSlug}/pages/${this.id}`;
  });

  fetchSubPages = async () => {
    try {
      const { workspaceSlug } = this.rootStore.router ?? {};
      if (!workspaceSlug || !this.id) throw new Error("Required fields not found");
      const subPages = await workspacePageService.fetchSubPages(workspaceSlug, this.id);

      runInAction(() => {
        for (const page of subPages) {
          if (page?.id) {
            const pageInstance = this.rootStore.workspacePages.getPageById(page.id);
            if (pageInstance) {
              pageInstance.mutateProperties(page);
            } else {
              set(this.rootStore.workspacePages.data, [page.id], new WorkspacePage(this.rootStore, page));
            }
          }
        }
      });
    } catch (error) {
      console.error("Error in fetching sub-pages", error);
      throw error;
    }
  };
}
