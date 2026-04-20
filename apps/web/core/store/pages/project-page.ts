/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { set } from "lodash-es";
import { action, computed, makeObservable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// constants
import { EPageAccess } from "@plane/constants";
import type { TPage } from "@plane/types";
// plane web store
import type { RootStore } from "@/plane-web/store/root.store";
// services
import { ProjectPageService } from "@/services/page/project-page.service";

const projectPageService = new ProjectPageService();
// store
import { BasePage } from "./base-page";
import type { TPageInstance } from "./base-page";

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
      download: async () => {
        if (!workspaceSlug || !projectId || !page.id) throw new Error("Missing required fields.");
        await projectPageService.downloadPage(workspaceSlug, projectId, page.id);
      },
      fetchEmbeds: async (embedType) => {
        if (!workspaceSlug || !projectId || !page.id) throw new Error("Missing required fields.");
        return await projectPageService.fetchEmbeds(workspaceSlug, projectId, page.id, embedType);
      },
      fetchMentions: async (mentionType) => {
        if (!workspaceSlug || !projectId || !page.id) throw new Error("Missing required fields.");
        return await projectPageService.fetchMentions(workspaceSlug, projectId, page.id, mentionType);
      },
    });
    makeObservable<ProjectPage, "permissionMeta">(this, {
      // computed
      parentPageIds: computed,
      subPageIds: computed,
      subPages: computed,
      permissionMeta: computed,
      canCurrentUserAccessPage: computed,
      canCurrentUserEditPage: computed,
      canCurrentUserDuplicatePage: computed,
      canCurrentUserLockPage: computed,
      canCurrentUserChangeAccess: computed,
      canCurrentUserArchivePage: computed,
      canCurrentUserDeletePage: computed,
      canCurrentUserFavoritePage: computed,
      canCurrentUserMovePage: computed,
      canCurrentUserPublishPage: computed,
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
    const sortedPages = filteredPages.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    return sortedPages.map((page) => page.id).filter((id): id is string => id !== undefined);
  }

  get subPages() {
    return this.subPageIds.map((id) => this.rootStore.projectPages.data[id]);
  }

  private get permissionMeta():
    | {
        workspaceSlug: string;
        projectId: string;
        resourceMeta: { resourceId: string };
      }
    | undefined {
    if (!this.id || !this.project_ids?.length || !this.workspaceSlug) return;
    return {
      projectId: this.project_ids[0],
      workspaceSlug: this.workspaceSlug,
      resourceMeta: {
        resourceId: this.id,
      },
    };
  }

  /**
   * @description returns true if the current logged in user can access the page
   */
  get canCurrentUserAccessPage() {
    if (!this.id || !this.project_ids?.length || !this.workspaceSlug) return false;
    return (
      this.access === EPageAccess.PUBLIC ||
      this.rootStore.permissionAccessStore.can({
        resource: "page",
        action: "view",
        projectId: this.project_ids[0],
        workspaceSlug: this.workspaceSlug,
      })
    );
  }

  /**
   * @description returns true if the current logged in user can edit the page
   */
  get canCurrentUserEditPage() {
    if (!this.permissionMeta) return false;
    return this.rootStore.permissionAccessStore.can({
      resource: "page",
      action: "edit",
      ...this.permissionMeta,
    });
  }

  /**
   * @description returns true if the current logged in user can create a duplicate the page
   */
  get canCurrentUserDuplicatePage() {
    if (!this.project_ids?.length || !this.workspaceSlug) return false;
    return this.rootStore.permissionAccessStore.can({
      resource: "page",
      action: "create",
      projectId: this.project_ids[0],
      workspaceSlug: this.workspaceSlug,
    });
  }

  /**
   * @description returns true if the current logged in user can lock the page
   */
  get canCurrentUserLockPage() {
    if (!this.permissionMeta) return false;
    return this.rootStore.permissionAccessStore.can({
      resource: "page",
      action: "edit",
      ...this.permissionMeta,
    });
  }

  /**
   * @description returns true if the current logged in user can change the access of the page
   */
  get canCurrentUserChangeAccess() {
    if (!this.permissionMeta) return false;
    return this.rootStore.permissionAccessStore.can({
      resource: "page",
      action: "edit",
      ...this.permissionMeta,
    });
  }

  /**
   * @description returns true if the current logged in user can archive the page
   */
  get canCurrentUserArchivePage() {
    if (!this.permissionMeta) return false;
    return this.rootStore.permissionAccessStore.can({
      resource: "page",
      action: "edit",
      ...this.permissionMeta,
    });
  }

  /**
   * @description returns true if the current logged in user can delete the page
   */
  get canCurrentUserDeletePage() {
    if (!this.permissionMeta) return false;
    return this.rootStore.permissionAccessStore.can({
      resource: "page",
      action: "delete",
      ...this.permissionMeta,
    });
  }

  /**
   * @description returns true if the current logged in user can comment on the page/reply to the comments
   */
  get canCurrentUserCommentOnPage() {
    if (!this.permissionMeta) return false;
    return this.rootStore.permissionAccessStore.can({
      resource: "page",
      action: "edit",
      ...this.permissionMeta,
    });
  }

  /**
   * @description returns true if the current logged in user can favorite the page
   */
  get canCurrentUserFavoritePage() {
    if (!this.permissionMeta) return false;
    return this.rootStore.permissionAccessStore.can({
      resource: "page",
      action: "edit",
      ...this.permissionMeta,
    });
  }

  /**
   * @description returns true if the current logged in user can move the page
   */
  get canCurrentUserMovePage() {
    if (!this.permissionMeta) return false;
    return this.rootStore.permissionAccessStore.can({
      resource: "page",
      action: "edit",
      ...this.permissionMeta,
    });
  }

  /**
   * @description returns true if the current logged in user can publish the page
   */
  get canCurrentUserPublishPage() {
    if (this.isCurrentUserOwner) return true;
    if (!this.permissionMeta) return false;
    return this.rootStore.permissionAccessStore.can({
      resource: "page",
      action: "share",
      ...this.permissionMeta,
    });
  }

  /**
   * @description returns true if the page can be edited
   */
  get isContentEditable() {
    if (!this.workspaceSlug) return false;
    const isNestedPagesEnabled = this.rootStore.projectPages.isNestedPagesEnabled(this.workspaceSlug);
    if (!isNestedPagesEnabled && !!this.parent_id) return false;

    const isArchived = !!this.archived_at;
    const isLocked = this.is_locked;

    // Can't edit if archived or locked
    if (isArchived || isLocked) return false;

    // Owner can always edit (if not archived/locked)
    if (this.isCurrentUserOwner) return true;

    // Fallback to RBAC
    if (!this.permissionMeta) return false;
    return this.rootStore.permissionAccessStore.can({
      resource: "page",
      action: "edit",
      ...this.permissionMeta,
    });
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
          if (page?.id) {
            const pageInstance = this.rootStore.projectPages.getPageById(page.id);
            if (pageInstance) {
              pageInstance.mutateProperties(page);
            } else {
              set(this.rootStore.projectPages.data, [page.id], new ProjectPage(this.rootStore, page));
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
