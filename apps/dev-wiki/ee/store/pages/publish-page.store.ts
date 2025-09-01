import set from "lodash/set";
import unset from "lodash/unset";
import { makeObservable, observable, runInAction, action } from "mobx";
import { computedFn } from "mobx-utils";
// plane web services
import { PublishPageService } from "@/plane-web/services/page/publish-page.service";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";
// plane web types
import { TPagePublishSettings } from "@/plane-web/types/pages";

export interface IPublishPageStore {
  // observables
  data: Record<string, TPagePublishSettings>; // pageID => TPagePublishSettings
  // helpers
  getPagePublishSettings: (pageID: string) => TPagePublishSettings | undefined;
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
      // project level actions
      updateProjectPagePublishSettings: action,
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
