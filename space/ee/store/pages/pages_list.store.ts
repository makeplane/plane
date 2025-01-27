import set from "lodash/set";
import { action, makeObservable, observable, runInAction } from "mobx";
// plane imports
import { SitesPagePublishService } from "@plane/services";
import { TPublicPageResponse } from "@plane/types";
// plane web store
import { IPage, Page } from "@/plane-web/store/pages";
import { RootStore } from "@/plane-web/store/root.store";

export interface IPagesListStore {
  // observables
  data: Record<string, IPage>; // anchor => TPublicPageResponse
  // actions
  fetchPageDetails: (anchor: string) => Promise<TPublicPageResponse>;
}

export class PagesListStore implements IPagesListStore {
  // observables
  data: Record<string, IPage> = {}; // anchor => IPage
  // services
  pageService: SitesPagePublishService;

  constructor(public rootStore: RootStore) {
    makeObservable(this, {
      // observables
      data: observable,
      // actions
      fetchPageDetails: action,
    });
    // services
    this.pageService = new SitesPagePublishService();
  }

  /**
   * @description fetch page details
   * @param {string} anchor
   */
  fetchPageDetails = async (anchor: string) => {
    const response = await this.pageService.retrieve(anchor);
    runInAction(() => {
      set(this.data, [anchor], new Page(this.rootStore, response));
    });
    return response;
  };
}
