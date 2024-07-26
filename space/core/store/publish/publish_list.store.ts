import set from "lodash/set";
import { makeObservable, observable, runInAction, action } from "mobx";
// types
import { TProjectPublishSettings } from "@plane/types";
// services
import PublishService from "@/services/publish.service";
// store
import { PublishStore } from "@/store/publish/publish.store";
import { CoreRootStore } from "@/store/root.store";

export interface IPublishListStore {
  // observables
  publishMap: Record<string, PublishStore>; // anchor => PublishStore
  // actions
  fetchPublishSettings: (pageId: string) => Promise<TProjectPublishSettings>;
}

export class PublishListStore implements IPublishListStore {
  // observables
  publishMap: Record<string, PublishStore> = {}; // anchor => PublishStore
  // service
  publishService;

  constructor(private rootStore: CoreRootStore) {
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
    const response = await this.publishService.fetchPublishSettings(anchor);
    runInAction(() => {
      if (response.anchor) {
        set(this.publishMap, [response.anchor], new PublishStore(this.rootStore, response));
      }
    });
    return response;
  };
}
