import set from "lodash/set";
import unset from "lodash/unset";
import { makeObservable, observable, runInAction, action } from "mobx";
import { computedFn } from "mobx-utils";
// plane web services
import { PublishPageService } from "@/plane-web/services/page";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";
// plane web types
import { TPagePublishSettings } from "@/plane-web/types";

export interface IPublishPageStore {
  // observables
  data: Record<string, TPagePublishSettings>; // pageID => TPagePublishSettings
  // helpers
  getPagePublishSettings: (pageID: string) => TPagePublishSettings | undefined;
  // generic context-aware methods
  fetchPagePublishSettings: (pageID: string) => Promise<TPagePublishSettings>;
  publishPage: (pageID: string, data: Partial<TPagePublishSettings>) => Promise<TPagePublishSettings>;
  updatePagePublishSettings: (pageID: string, data: Partial<TPagePublishSettings>) => Promise<TPagePublishSettings>;
  unpublishPage: (pageID: string) => Promise<void>;
  // project level actions
  publishProjectPage: (
    projectID: string,
    pageID: string,
    data: Partial<TPagePublishSettings>,
    shouldSync?: boolean
  ) => Promise<TPagePublishSettings>;
  fetchProjectPagePublishSettings: (projectID: string, pageID: string) => Promise<TPagePublishSettings>;
  updateProjectPagePublishSettings: (
    projectID: string,
    pageID: string,
    data: Partial<TPagePublishSettings>
  ) => Promise<TPagePublishSettings>;
  unpublishProjectPage: (projectID: string, pageID: string, shouldSync?: boolean) => Promise<void>;
  // workspace level actions
  publishWorkspacePage: (pageID: string, data: Partial<TPagePublishSettings>) => Promise<TPagePublishSettings>;
  fetchWorkspacePagePublishSettings: (pageID: string) => Promise<TPagePublishSettings>;
  updateWorkspacePagePublishSettings: (
    pageID: string,
    data: Partial<TPagePublishSettings>
  ) => Promise<TPagePublishSettings>;
  unpublishWorkspacePage: (pageID: string) => Promise<void>;
}

export class PublishPageStore implements IPublishPageStore {
  // observables
  data: Record<string, TPagePublishSettings> = {}; // pageID => TPagePublishSettings
  // services
  publishPageService: PublishPageService;

  constructor(private rootStore: RootStore) {
    makeObservable(this, {
      // observables
      data: observable,
      // generic context-aware methods
      fetchPagePublishSettings: action,
      publishPage: action,
      updatePagePublishSettings: action,
      unpublishPage: action,
      // project level actions
      publishProjectPage: action,
      fetchProjectPagePublishSettings: action,
      updateProjectPagePublishSettings: action,
      unpublishProjectPage: action,
      // workspace level actions
      publishWorkspacePage: action,
      fetchWorkspacePagePublishSettings: action,
      updateWorkspacePagePublishSettings: action,
      unpublishWorkspacePage: action,
    });
    // services
    this.publishPageService = new PublishPageService();
  }

  /**
   * @description get page publish settings
   * @param {string} pageID
   */
  getPagePublishSettings = computedFn(
    (pageID: string): TPagePublishSettings | undefined => this.data?.[pageID] ?? undefined
  );

  /**
   * Helper method to determine the page context based on current router state
   */
  private getPageContext = (pageID: string) => {
    const { workspaceSlug, projectId, teamspaceId } = this.rootStore.router;

    // Check if page exists in project pages store
    if (projectId && this.rootStore.projectPages.data?.[pageID]) {
      return { type: "project" as const, projectId };
    }

    // Check if page exists in workspace pages store
    if (this.rootStore.workspacePages.data?.[pageID]) {
      return { type: "workspace" as const };
    }

    // Check if page exists in teamspace pages store
    if (teamspaceId && this.rootStore.teamspaceRoot?.teamspacePage?.pageMap?.[teamspaceId]?.[pageID]) {
      return { type: "teamspace" as const, teamspaceId };
    }

    // Fallback: if we can't determine from stores, use router context
    if (projectId) return { type: "project" as const, projectId };
    if (teamspaceId) return { type: "teamspace" as const, teamspaceId };
    return { type: "workspace" as const };
  };

  /**
   * @description context-aware fetch page publish settings
   * @param {string} pageID
   */
  fetchPagePublishSettings = async (pageID: string) => {
    const context = this.getPageContext(pageID);

    switch (context.type) {
      case "project":
        return await this.fetchProjectPagePublishSettings(context.projectId, pageID);
      case "workspace":
        return await this.fetchWorkspacePagePublishSettings(pageID);
      case "teamspace":
        // TODO: Implement teamspace publish functionality when available
        throw new Error("Teamspace page publishing is not yet implemented");
      default:
        throw new Error("Could not determine page context for publishing");
    }
  };

  /**
   * @description context-aware publish page
   * @param {string} pageID
   * @param {Partial<TPagePublishSettings>} data
   */
  publishPage = async (pageID: string, data: Partial<TPagePublishSettings>) => {
    const context = this.getPageContext(pageID);

    switch (context.type) {
      case "project":
        return await this.publishProjectPage(context.projectId, pageID, data);
      case "workspace":
        return await this.publishWorkspacePage(pageID, data);
      case "teamspace":
        // TODO: Implement teamspace publish functionality when available
        throw new Error("Teamspace page publishing is not yet implemented");
      default:
        throw new Error("Could not determine page context for publishing");
    }
  };

  /**
   * @description context-aware update page publish settings
   * @param {string} pageID
   * @param {Partial<TPagePublishSettings>} data
   */
  updatePagePublishSettings = async (pageID: string, data: Partial<TPagePublishSettings>) => {
    const context = this.getPageContext(pageID);

    switch (context.type) {
      case "project":
        return await this.updateProjectPagePublishSettings(context.projectId, pageID, data);
      case "workspace":
        return await this.updateWorkspacePagePublishSettings(pageID, data);
      case "teamspace":
        // TODO: Implement teamspace publish functionality when available
        throw new Error("Teamspace page publishing is not yet implemented");
      default:
        throw new Error("Could not determine page context for publishing");
    }
  };

  /**
   * @description context-aware unpublish page
   * @param {string} pageID
   */
  unpublishPage = async (pageID: string) => {
    const context = this.getPageContext(pageID);

    switch (context.type) {
      case "project":
        return await this.unpublishProjectPage(context.projectId, pageID);
      case "workspace":
        return await this.unpublishWorkspacePage(pageID);
      case "teamspace":
        // TODO: Implement teamspace publish functionality when available
        throw new Error("Teamspace page publishing is not yet implemented");
      default:
        throw new Error("Could not determine page context for publishing");
    }
  };

  /**
   * @description publish a project level page
   * @param {string} projectID
   * @param {string} pageID
   * @param {TPagePublishSettings} data
   */
  publishProjectPage = async (
    projectID: string,
    pageID: string,
    data: Partial<TPagePublishSettings>,
    shouldSync?: boolean
  ) => {
    const { workspaceSlug } = this.rootStore.router;
    if (!workspaceSlug) throw new Error("workspaceSlug not found");
    const response = await this.publishPageService.publishProjectPage(workspaceSlug, projectID, pageID, data);
    runInAction(() => {
      set(this.data, [pageID], response);
      set(this.rootStore.projectPages.data?.[pageID], ["anchor"], response.anchor);
    });
    return response;
  };

  /**
   * @description fetch project level page publish settings
   * @param {string} projectID
   * @param {string} pageID
   */
  fetchProjectPagePublishSettings = async (projectID: string, pageID: string) => {
    const { workspaceSlug } = this.rootStore.router;
    if (!workspaceSlug) throw new Error("workspaceSlug not found");
    const response = await this.publishPageService.fetchProjectPagePublishSettings(workspaceSlug, projectID, pageID);
    runInAction(() => set(this.data, [pageID], response));
    return response;
  };

  /**
   * @description update project level page publish settings
   * @param {string} projectID
   * @param {string} pageID
   * @param {TPagePublishSettings} data
   */
  updateProjectPagePublishSettings = async (projectID: string, pageID: string, data: Partial<TPagePublishSettings>) => {
    const { workspaceSlug } = this.rootStore.router;
    if (!workspaceSlug) throw new Error("workspaceSlug not found");
    const response = await this.publishPageService.updateProjectPagePublishSettings(
      workspaceSlug,
      projectID,
      pageID,
      data
    );
    runInAction(() => set(this.data, [pageID], response));
    return response;
  };

  /**
   * @description unpublish a project level page
   * @param {string} projectID
   * @param {string} pageID
   */
  unpublishProjectPage = async (projectID: string, pageID: string, shouldSync: boolean = true) => {
    const { workspaceSlug } = this.rootStore.router;
    if (!workspaceSlug) throw new Error("workspaceSlug not found");
    runInAction(() => {
      unset(this.data, [pageID]);
      set(this.rootStore.projectPages.data?.[pageID], ["anchor"], null);
    });
    if (shouldSync) {
      await this.publishPageService.unpublishProjectPage(workspaceSlug, projectID, pageID);
    }
  };

  /**
   * @description publish a workspace level page
   * @param {string} pageID
   * @param {TPagePublishSettings} data
   */
  publishWorkspacePage = async (pageID: string, data: Partial<TPagePublishSettings>, shouldSync?: boolean) => {
    const { workspaceSlug } = this.rootStore.router;
    if (!workspaceSlug) throw new Error("workspaceSlug not found");
    const response = await this.publishPageService.publishWorkspacePage(workspaceSlug, pageID, data);
    runInAction(() => {
      set(this.data, [pageID], response);
      set(this.rootStore.workspacePages.data?.[pageID], ["anchor"], response.anchor);
    });
    return response;
  };

  /**
   * @description fetch workspace level page publish settings
   * @param {string} pageID
   */
  fetchWorkspacePagePublishSettings = async (pageID: string) => {
    const { workspaceSlug } = this.rootStore.router;
    if (!workspaceSlug) throw new Error("workspaceSlug not found");
    const response = await this.publishPageService.fetchWorkspacePagePublishSettings(workspaceSlug, pageID);
    runInAction(() => set(this.data, [pageID], response));
    return response;
  };

  /**
   * @description update workspace level page publish settings
   * @param {string} pageID
   * @param {TPagePublishSettings} data
   */
  updateWorkspacePagePublishSettings = async (pageID: string, data: Partial<TPagePublishSettings>) => {
    const { workspaceSlug } = this.rootStore.router;
    if (!workspaceSlug) throw new Error("workspaceSlug not found");
    const response = await this.publishPageService.updateWorkspacePagePublishSettings(workspaceSlug, pageID, data);
    runInAction(() => set(this.data, [pageID], response));
    return response;
  };

  /**
   * @description unpublish a workspace level page
   * @param {string} pageID
   */
  unpublishWorkspacePage = async (pageID: string) => {
    const { workspaceSlug } = this.rootStore.router;
    if (!workspaceSlug) throw new Error("workspaceSlug not found");
    await this.publishPageService.unpublishWorkspacePage(workspaceSlug, pageID);
    runInAction(() => {
      unset(this.data, [pageID]);
      set(this.rootStore.workspacePages.data?.[pageID], ["anchor"], null);
    });
  };
}
