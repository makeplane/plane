import set from "lodash/set";
import { makeObservable, observable, runInAction, action } from "mobx";
// types
import { TProjectPublishSettings } from "@plane/types";
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
  fetchPublishSettings: (pageId: string) => Promise<TProjectPublishSettings>;
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
          this.store.issueFilter.updateLayoutOptions({
            list: !!response.view_props.list,
            kanban: !!response.view_props.kanban,
            calendar: !!response.view_props.calendar,
            gantt: !!response.view_props.gantt,
            spreadsheet: !!response.view_props.spreadsheet,
          });
          set(this.publishMap, [response.anchor], new PublishStore(this.store, response));
        }
      });

      return response;
    } catch (error) {
      throw error;
    }
  };
}
