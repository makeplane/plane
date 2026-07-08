/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set } from "lodash-es";
import { makeObservable, observable, runInAction, action } from "mobx";
// plane imports
import { SitesProjectPublishService, SitesViewPublishService } from "@plane/services";
import type { TProjectPublishSettings } from "@plane/types";
// store
import { PublishStore } from "@/store/publish/publish.store";
import type { RootStore } from "@/store/root.store";

export interface IPublishListStore {
  // observables
  publishMap: Record<string, PublishStore>; // anchor => PublishStore
  // actions
  fetchPublishSettings: (pageId: string) => Promise<TProjectPublishSettings>;
  fetchViewPublishSettings: (anchor: string) => Promise<TProjectPublishSettings>;
}

export class PublishListStore implements IPublishListStore {
  // observables
  publishMap: Record<string, PublishStore> = {}; // anchor => PublishStore
  // service
  publishService;
  viewPublishService;

  constructor(private rootStore: RootStore) {
    makeObservable(this, {
      // observables
      publishMap: observable,
      // actions
      fetchPublishSettings: action,
      fetchViewPublishSettings: action,
    });
    // services
    this.publishService = new SitesProjectPublishService();
    this.viewPublishService = new SitesViewPublishService();
  }

  /**
   * @description fetch publish settings
   * @param {string} anchor
   */
  fetchPublishSettings = async (anchor: string) => {
    const response = await this.publishService.retrieveSettingsByAnchor(anchor);
    runInAction(() => {
      if (response.anchor) {
        set(this.publishMap, [response.anchor], new PublishStore(this.rootStore, response));
      }
    });
    return response;
  };

  /**
   * @description fetch publish settings of a published view
   * @param {string} anchor
   */
  fetchViewPublishSettings = async (anchor: string) => {
    const response = await this.viewPublishService.retrieveSettingsByAnchor(anchor);
    runInAction(() => {
      if (response.anchor) {
        set(this.publishMap, [response.anchor], new PublishStore(this.rootStore, response));
      }
    });
    return response;
  };
}
