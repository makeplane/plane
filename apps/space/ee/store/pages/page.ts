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

import { set, uniqBy } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { SitesPagePublishService } from "@plane/services";
import type {
  IStateLite,
  TEditorEmbedItem,
  TEditorEmbedsResponse,
  TEditorEmbedType,
  TEditorMentionItem,
  TEditorMentionsResponse,
  TEditorMentionType,
  TLogoProps,
  TPublicPageResponse,
} from "@plane/types";
// store
import type { CoreRootStore } from "@/store/root.store";
// types
import type { IIssue } from "@/types/issue";

export type TIssueEmbed = IIssue & {
  state_detail?: IStateLite;
};

export type TPageEmbedsAndMentionsInfo = {
  embeds?: Record<Partial<TEditorEmbedType>, TEditorEmbedsResponse | undefined>;
  mentions?: Record<Partial<TEditorMentionType>, TEditorMentionsResponse | undefined>;
};

export interface IPage extends TPublicPageResponse {
  // observables
  embedsAndMentionsInfo: TPageEmbedsAndMentionsInfo;
  hasLoadedEmbedsAndMentions: boolean;
  // additional properties for subpages
  archived_at: string | null | undefined;
  deleted_at: Date | undefined;
  anchor: string | null | undefined;
  is_locked: boolean;
  parent_id: string | null | undefined;
  // computed
  asJSON: TPublicPageResponse | undefined;
  // actions
  fetchEmbedsAndMentions: (anchor: string) => Promise<void>;
  getMentionDetails: (mentionType: TEditorMentionType, entityId: string) => TEditorMentionItem | undefined;
  getEmbedDetails: (embedType: TEditorEmbedType, entityId: string) => TEditorEmbedItem | undefined;
  mutateProperties: (data: Partial<TPublicPageResponse>, shouldUpdateName?: boolean) => void;
}

export class Page implements IPage {
  // observables
  embedsAndMentionsInfo: TPageEmbedsAndMentionsInfo;
  hasLoadedEmbedsAndMentions: boolean;
  // page properties
  created_at: Date | undefined;
  description_json: object | undefined;
  id: string | undefined;
  logo_props: TLogoProps | undefined;
  name: string | undefined;
  updated_at: Date | undefined;
  // additional properties for subpages
  archived_at: string | null | undefined = null;
  deleted_at: Date | undefined = undefined;
  anchor: string | null | undefined = null;
  is_locked: boolean = false;
  parent_id: string | null | undefined = null;
  // services
  pageService: SitesPagePublishService;

  constructor(
    private rootStore: CoreRootStore,
    page: TPublicPageResponse
  ) {
    this.embedsAndMentionsInfo = {};
    this.hasLoadedEmbedsAndMentions = false;
    this.created_at = page.created_at || undefined;
    this.description_json = page.description_json || undefined;
    this.id = page.id || undefined;
    this.logo_props = page.logo_props || undefined;
    this.name = page.name || undefined;
    this.updated_at = page.updated_at || undefined;
    // Initialize additional properties if they exist in the response
    this.archived_at = page.archived_at || null;
    this.deleted_at = page.deleted_at || undefined;
    this.anchor = page.anchor || null;
    this.parent_id = page.parent_id || null;

    makeObservable(this, {
      // observables
      embedsAndMentionsInfo: observable,
      hasLoadedEmbedsAndMentions: observable.ref,
      // page properties
      created_at: observable,
      description_json: observable,
      id: observable.ref,
      logo_props: observable,
      name: observable.ref,
      updated_at: observable,
      // additional properties for subpages
      archived_at: observable,
      deleted_at: observable,
      anchor: observable,
      parent_id: observable,
      // computed
      asJSON: computed,
      // actions
      fetchEmbedsAndMentions: action,
      mutateProperties: action,
    });

    this.pageService = new SitesPagePublishService();
  }

  get asJSON() {
    return {
      created_at: this.created_at,
      description_json: this.description_json,
      id: this.id,
      logo_props: this.logo_props,
      name: this.name,
      updated_at: this.updated_at,
      archived_at: this.archived_at,
      deleted_at: this.deleted_at,
      anchor: this.anchor,
      parent_id: this.parent_id,
    };
  }

  getEmbedDetails: IPage["getEmbedDetails"] = computedFn((embedType, entityId) =>
    this.embedsAndMentionsInfo?.embeds?.[embedType]?.find((embed) => embed.id === entityId)
  );

  getMentionDetails: IPage["getMentionDetails"] = computedFn((mentionType, entityId) =>
    this.embedsAndMentionsInfo?.mentions?.[mentionType]?.find((mention) => mention.id === entityId)
  );

  /**
   * @description fetch page embed and mentions
   */
  fetchEmbedsAndMentions: IPage["fetchEmbedsAndMentions"] = async (anchor) => {
    try {
      const workItemEmbeds = await this.pageService.listEmbeds(anchor, "issue");
      const workItemMentions = await this.pageService.listMentions(anchor, "issue_mention");

      const existingWorkItemEmbeds = this.embedsAndMentionsInfo?.embeds?.issue || [];
      const uniqueWorkItemEmbeds = uniqBy([...existingWorkItemEmbeds, ...workItemEmbeds], "id");

      const existingWorkItemMentions = this.embedsAndMentionsInfo?.mentions?.issue_mention || [];
      const uniqueWorkItemMentions = uniqBy([...existingWorkItemMentions, ...workItemMentions], "id");

      runInAction(() => {
        set(this.embedsAndMentionsInfo, "embeds.issue", uniqueWorkItemEmbeds);
        set(this.embedsAndMentionsInfo, "mentions.issue_mention", uniqueWorkItemMentions);
      });
    } catch (error) {
      console.error("Failed to fetch embeds and mentions", error);
      throw error;
    } finally {
      runInAction(() => {
        this.hasLoadedEmbedsAndMentions = true;
      });
    }
  };

  /**
   * @description Update page properties
   * @param {Partial<TPublicPageResponse>} data Page data to update
   * @param {boolean} shouldUpdateName Whether to update name (defaults to true)
   */
  mutateProperties = (data: Partial<TPublicPageResponse>, shouldUpdateName: boolean = true) => {
    runInAction(() => {
      // Update basic properties
      if (data.created_at !== undefined) this.created_at = data.created_at;
      if (data.description_json !== undefined) this.description_json = data.description_json;
      if (data.id !== undefined) this.id = data.id;
      if (data.logo_props !== undefined) this.logo_props = data.logo_props;
      if (shouldUpdateName && data.name !== undefined) this.name = data.name;
      if (data.updated_at !== undefined) this.updated_at = data.updated_at;
      // Update subpage related properties
      if (data.archived_at !== undefined) this.archived_at = data.archived_at;
      if (data.deleted_at !== undefined) this.deleted_at = data.deleted_at;
      if (data.anchor !== undefined) this.anchor = data.anchor;
      if (data.parent_id !== undefined) this.parent_id = data.parent_id;
    });
  };
}
