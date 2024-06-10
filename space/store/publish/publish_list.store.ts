import set from "lodash/set";
import { makeObservable, observable, runInAction, action } from "mobx";
// types
import { TPublishSettings } from "@plane/types";
// services
import PublishService from "@/services/publish.service";
// store
import { PublishStore } from "@/store/publish/publish.store";
// store
import { RootStore } from "../root.store";

export interface IPublishListStore {
  // observables
  publishMap: Record<string, PublishStore>; // anchor => PublishStore
  // actions
  fetchPublishSettings: (pageId: string) => Promise<TPublishSettings>;
}

export class PublishListStore implements IPublishListStore {
  // observables
  publishMap: Record<string, PublishStore> = {}; // anchor => PublishStore
  // service
  publishService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observables
      publishMap: observable,
      // actions
      fetchPublishSettings: action,
    });
    // services
    this.publishService = new PublishService();
  }

  /**
   * @description fetch publish settings
   * @param {string} anchor
   */
  fetchPublishSettings = async (anchor: string) => {
    try {
      const response = await this.publishService.fetchPublishSettings(anchor);
      runInAction(() => {
        if (response.anchor && response.view_props) {
          this.store.issueFilter.updateLayoutOptions(response?.view_props);
          set(this.publishMap, [response.anchor], new PublishStore(this.store, response));
        }
      });

      return response;
    } catch (error) {
      throw error;
    }
  };
}
