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
  fetchPageDetails: (anchor: string, shouldFetchSubPages?: boolean) => Promise<TPublicPageResponse>;
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
   * Helper method to log all store items
   * @private
   */
  private logStoreItems = () => {
    console.log("Current pages in store:", Object.keys(this.data).length);
    console.log("Store keys:", Object.keys(this.data));
    console.log("Complete store data:", this.data);
  };

  /**
   * @description fetch page details
   * @param {string} anchor
   * @param {boolean} shouldFetchSubPages - Whether to fetch subpages
   */
  fetchPageDetails = async (anchor: string, shouldFetchSubPages: boolean = true) => {
    // If pageId is provided, fetch that specific page, otherwise fetch the main page for the anchor
    const response = await this.pageService.retrieve(anchor);

    // Create or update the page in the store
    const pageInstance = this.data[anchor];

    runInAction(() => {
      if (pageInstance) {
        // If page already exists, update its properties
        // This assumes you have a mutateProperties method in your Page class
        // You might need to implement it similar to the Web project
        if (typeof pageInstance.mutateProperties === "function") {
          pageInstance.mutateProperties(response, false);
        } else {
          // If mutateProperties doesn't exist, replace the entire object
          set(this.data, [anchor], new Page(this.rootStore, response));
        }
      } else {
        // Create a new page instance
        set(this.data, [anchor], new Page(this.rootStore, response));
      }

      // Log store items after updating main page
      this.logStoreItems();
    });

    // Fetch subpages if requested and if the page has an ID
    if (shouldFetchSubPages) {
      try {
        const subPages = await this.pageService.fetchSubPages(anchor);

        // Store each subpage in the data store
        runInAction(() => {
          subPages.forEach((subPage) => {
            if (subPage.id) {
              const subPageInstance = this.data[subPage.id];

              if (subPageInstance && typeof subPageInstance.mutateProperties === "function") {
                subPageInstance.mutateProperties(subPage, false);
              } else {
                set(this.data, [subPage.id], new Page(this.rootStore, subPage));
              }
            }
          });

          // Log store items after updating subpages
          this.logStoreItems();
        });
      } catch (error) {
        console.error("Failed to fetch subpages:", error);
      }
    }

    return response;
  };
}
