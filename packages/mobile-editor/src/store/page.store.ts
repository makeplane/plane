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

import { set, unset } from "lodash-es";
import { makeObservable, observable, runInAction, action, computed } from "mobx";
import { computedFn } from "mobx-utils";
// constants
import { CallbackHandlerStrings } from "@/constants/callback-handler-strings";
// helpers
import { callNative } from "@/helpers";
// store
import { BasePageStore } from "@/store/base-page.store";
import type { IBasePageStore } from "@/store/base-page.store";
// local types
import type { TPage } from "@/types";

type TBasePage = IBasePageStore;

type TFetchParams = {
  workspaceSlug: string;
  projectId: string | undefined;
  pageId: string;
};

export interface IPageStore {
  subPages: Record<string, TBasePage>; // pageId => Page
  //actions
  fetchPages: (pageId: string) => Promise<void>;
  fetchPageDetails: (params: TFetchParams) => Promise<void>;

  // computed
  subPageIds: string[];

  getSubPageById: (pageId: string) => TBasePage | undefined;
  removeSubPageById: (pageId: string) => void;
}

export class PageStore implements IPageStore {
  // observables
  currentUserId: string | undefined;
  subPages: Record<string, IBasePageStore> = {};

  constructor() {
    makeObservable(this, {
      //observables
      subPages: observable,
      //computed
      subPageIds: computed,
      //actions
      fetchPages: action,
      fetchPageDetails: action,
    });
  }

  /**
   * @description Returns the ids of the stored sub pages
   */
  get subPageIds() {
    if (!this.subPages) return [];
    return Object.keys(this.subPages);
  }

  /**
   * @description Returns the sub page by id
   */
  getSubPageById = computedFn((id: string) => this.subPages?.[id] || undefined);

  /**
   * @description Removes the sub page by id
   */
  removeSubPageById = (pageId: string) => {
    runInAction(() => unset(this.subPages, [pageId]));
  };

  /**
   * @description Fetches the sub pages for the given page id
   */
  fetchPages = async (pageId: string) => {
    const response = await callNative<string>(CallbackHandlerStrings.getPages, pageId);
    if (!response) return;
    const pages = this._parsePages(response);
    runInAction(() => {
      this.subPages = pages;
    });
  };

  /**
   * @description Fetches the page details for the given page id
   */
  fetchPageDetails = async (params: TFetchParams) => {
    const { workspaceSlug, projectId, pageId } = params;
    try {
      if (this.getSubPageById(pageId)) return;
      const response = await callNative<string>(
        CallbackHandlerStrings.getPageDetails,
        JSON.stringify({
          workspaceSlug: workspaceSlug,
          projectId: projectId,
          pageId: pageId,
        })
      );
      if (!response) return;
      const pageDetails = JSON.parse(response) as TPage;
      runInAction(() => {
        set(this.subPages, [pageId], new BasePageStore(pageDetails));
      });
    } catch (error) {
      console.error("Error fetching page details", error);
    }
  };

  /**
   * @description Parses the sub pages
   * @param subPagesResponse - The encoded sub pages response as a string
   * @returns @type {Record<string, IBasePageStore>}
   */
  _parsePages = (pagesResponse: string) => {
    const parsedPages = JSON.parse(pagesResponse) as Record<string, TPage>;
    const pages: Record<string, IBasePageStore> = {};
    Object.values(parsedPages).forEach((page) => {
      const pageInstance = new BasePageStore(page);
      if (pageInstance.id) set(pages, [pageInstance.id], pageInstance);
    });
    return pages;
  };
}
