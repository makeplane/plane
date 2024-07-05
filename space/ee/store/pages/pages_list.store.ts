import set from "lodash/set";
import { action, makeObservable, observable, runInAction } from "mobx";
// plane web services
import { PageService } from "@/plane-web/services/page.service";
// plane web store
import { IPage, Page } from "@/plane-web/store/pages";
import { RootStore } from "@/plane-web/store/root.store";
// plane web types
import { TPageResponse } from "@/plane-web/types";

export interface IPagesListStore {
  // observables
  data: Record<string, IPage>; // anchor => TPageResponse
  // actions
  fetchPageDetails: (anchor: string) => Promise<TPageResponse>;
}

export class PagesListStore implements IPagesListStore {
  // observables
  data: Record<string, IPage> = {}; // anchor => IPage
  // services
  pageService: PageService;

  constructor(public rootStore: RootStore) {
    makeObservable(this, {
      // observables
      data: observable,
      // actions
      fetchPageDetails: action,
    });
    // services
    this.pageService = new PageService();
  }

  /**
   * @description fetch page details
   * @param {string} anchor
   */
  fetchPageDetails = async (anchor: string) => {
    const response = await this.pageService.fetchPageDetails(anchor);
    runInAction(() => {
      set(this.data, [anchor], new Page(this.rootStore, response));
    });
    return response;
  };
}
