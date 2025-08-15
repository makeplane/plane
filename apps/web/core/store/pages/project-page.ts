import set from "lodash/set";
import { action, computed, makeObservable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// constants
import { EPageAccess, EUserPermissions } from "@plane/constants";
import { TPage } from "@plane/types";
// utils
import { getPageName } from "@plane/utils";
// plane web store
import type { RootStore } from "@/plane-web/store/root.store";
// services
import { ProjectPageService } from "@/services/page";
const projectPageService = new ProjectPageService();
// store
import { BasePage, type TPageInstance } from "./base-page";

export type TProjectPage = TPageInstance;

export class ProjectPage extends BasePage implements TProjectPage {
  constructor(store: RootStore, page: TPage) {
    // required fields for API calls
    const { workspaceSlug } = store.router;
    const projectId = page.project_ids?.[0];
    // initialize base instance
    super(store, page, {
      update: async (payload) => {
        if (!workspaceSlug || !projectId || !page.id) throw new Error("Missing required fields.");
        return await projectPageService.update(workspaceSlug, projectId, page.id, payload);
      },
      updateDescription: async (document) => {
        if (!workspaceSlug || !projectId || !page.id) throw new Error("Missing required fields.");
        await projectPageService.updateDescription(workspaceSlug, projectId, page.id, document);
      },
      updateAccess: async (payload) => {
        if (!workspaceSlug || !projectId || !page.id) throw new Error("Missing required fields.");
        await projectPageService.updateAccess(workspaceSlug, projectId, page.id, payload);
      },
      lock: async (recursive: boolean) => {
        if (!workspaceSlug || !projectId || !page.id) throw new Error("Missing required fields.");
        await projectPageService.lock(workspaceSlug, projectId, page.id, recursive);
      },
      unlock: async (recursive: boolean) => {
        if (!workspaceSlug || !projectId || !page.id) throw new Error("Missing required fields.");
        await projectPageService.unlock(workspaceSlug, projectId, page.id, recursive);
      },
      archive: async () => {
        if (!workspaceSlug || !projectId || !page.id) throw new Error("Missing required fields.");
        return await projectPageService.archive(workspaceSlug, projectId, page.id);
      },
      restore: async () => {
        if (!workspaceSlug || !projectId || !page.id) throw new Error("Missing required fields.");
        await projectPageService.restore(workspaceSlug, projectId, page.id);
      },
      duplicate: async () => {
        if (!workspaceSlug || !projectId || !page.id) throw new Error("Missing required fields.");
        return await projectPageService.duplicate(workspaceSlug, projectId, page.id);
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
    const pages = Object.values(this.rootStore.projectPages.data);
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

  private getHighestRoleAcrossProjects = computedFn((): EUserPermissions | undefined => {
    const { workspaceSlug } = this.rootStore.router;
    if (!workspaceSlug || !this.project_ids?.length) return;
    let highestRole: EUserPermissions | undefined = undefined;
    this.project_ids.map((projectId) => {
      const currentUserProjectRole = this.rootStore.user.permission.getProjectRoleByWorkspaceSlugAndProjectId(
        workspaceSlug?.toString() || "",
        projectId?.toString() || ""
      );
      if (currentUserProjectRole) {
        if (!highestRole) highestRole = currentUserProjectRole;
        else if (currentUserProjectRole > highestRole) highestRole = currentUserProjectRole;
      }
    });
    return highestRole;
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
    const highestRole = this.getHighestRoleAcrossProjects();
    const isPagePublic = this.access === EPageAccess.PUBLIC;
    return isPagePublic && !!highestRole && highestRole >= EUserPermissions.MEMBER;
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
    const highestRole = this.getHighestRoleAcrossProjects();
    return !!highestRole && highestRole >= EUserPermissions.MEMBER;
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
    const highestRole = this.getHighestRoleAcrossProjects();
    return this.isCurrentUserOwner || highestRole === EUserPermissions.ADMIN;
  }

  /**
   * @description returns true if the current logged in user can change the access of the page
   */
  get canCurrentUserChangeAccess() {
    // Only owner can change access with shared access
    if (this.hasSharedAccess) {
      return this.isCurrentUserOwner;
    }

    // Fallback to regular access control
    const highestRole = this.getHighestRoleAcrossProjects();
    return this.isCurrentUserOwner || highestRole === EUserPermissions.ADMIN;
  }

  /**
   * @description returns true if the current logged in user can archive the page
   */
  get canCurrentUserArchivePage() {
    // Shared access users cannot archive pages
    if (this.hasSharedAccess) {
      return this.isCurrentUserOwner;
    }

    // Fallback to regular access control
    const highestRole = this.getHighestRoleAcrossProjects();
    return this.isCurrentUserOwner || highestRole === EUserPermissions.ADMIN;
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
    const highestRole = this.getHighestRoleAcrossProjects();
    return this.isCurrentUserOwner || highestRole === EUserPermissions.ADMIN;
  }

  /**
   * @description returns true if the current logged in user can favorite the page
   */
  get canCurrentUserFavoritePage() {
    // Owner can always favorite
    if (this.isCurrentUserOwner) return true;

    // Shared access users can favorite if they have at least view access
    if (this.hasSharedAccess) {
      return this.canViewWithSharedAccess;
    }

    // Fallback to regular access control
    const highestRole = this.getHighestRoleAcrossProjects();
    return !!highestRole && highestRole >= EUserPermissions.MEMBER;
  }

  /**
   * @description returns true if the current logged in user can move the page
   */
  get canCurrentUserMovePage() {
    // Shared access users cannot move pages
    if (this.hasSharedAccess) {
      return this.isCurrentUserOwner;
    }

    // Fallback to regular access control
    const highestRole = this.getHighestRoleAcrossProjects();
    return this.isCurrentUserOwner || highestRole === EUserPermissions.ADMIN;
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
    const highestRole = this.getHighestRoleAcrossProjects();
    const isPublic = this.access === EPageAccess.PUBLIC;

    return isPublic && !!highestRole && highestRole >= EUserPermissions.MEMBER;
  }

  getRedirectionLink = computedFn(() => {
    const { workspaceSlug } = this.rootStore.router;
    return `/${workspaceSlug}/projects/${this.project_ids?.[0]}/pages/${this.id}`;
  });

  fetchSubPages = async () => {
    try {
      const { workspaceSlug } = this.rootStore.router ?? {};
      const projectId = this.project_ids?.[0];
      if (!workspaceSlug || !projectId || !this.id) throw new Error("Required fields not found");
      const subPages = await projectPageService.fetchSubPages(workspaceSlug, projectId, this.id);

      runInAction(() => {
        for (const page of subPages) {
          if (page?.id) set(this.rootStore.projectPages.data, [page.id], new ProjectPage(this.rootStore, page));
        }
      });
    } catch (error) {
      console.error("Error in fetching sub-pages", error);
      throw error;
    }
  };
}
