import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { SitesPagePublishService } from "@plane/services";
import { IStateLite, TLogoProps, TPublicPageResponse } from "@plane/types";
// store
import { CoreRootStore } from "@/store/root.store";
// types
import { IIssue } from "@/types/issue";

export type TIssueEmbed = IIssue & {
  state_detail?: IStateLite;
};

export interface IPage extends TPublicPageResponse {
  // observables
  issueEmbedError: boolean;
  issueEmbedData: TIssueEmbed[] | undefined;
  // additional properties for subpages
  archived_at: string | null | undefined;
  deleted_at: Date | undefined;
  anchor: string | null | undefined;
  is_locked: boolean;
  parent_id: string | null | undefined;
  // computed
  asJSON: TPublicPageResponse | undefined;
  areIssueEmbedsLoaded: boolean;
  // helpers
  getIssueEmbedDetails: (issueID: string) => TIssueEmbed | undefined;
  // actions
  fetchPageIssueEmbeds: (anchor: string) => Promise<TIssueEmbed[]>;
  mutateProperties: (data: Partial<TPublicPageResponse>, shouldUpdateName?: boolean) => void;
}

export class Page implements IPage {
  // observables
  issueEmbedError: boolean = false;
  issueEmbedData: TIssueEmbed[] | undefined = undefined;
  // page properties
  created_at: Date | undefined;
  description_html: string | undefined;
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
    this.created_at = page.created_at || undefined;
    this.description_html = page.description_html || undefined;
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
      issueEmbedError: observable.ref,
      issueEmbedData: observable,
      // page properties
      created_at: observable,
      description_html: observable.ref,
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
      areIssueEmbedsLoaded: computed,
      // actions
      fetchPageIssueEmbeds: action,
      mutateProperties: action,
    });

    this.pageService = new SitesPagePublishService();
  }

  get asJSON() {
    return {
      created_at: this.created_at,
      description_html: this.description_html,
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

  get areIssueEmbedsLoaded() {
    return !!this.issueEmbedData;
  }

  /**
   * @description get issue embed details
   * @param {string} issueID
   */
  getIssueEmbedDetails = computedFn((issueID: string) => this.issueEmbedData?.find((i) => i.id === issueID));

  /**
   * @description fetch page issue embeds
   * @param {string} anchor
   */
  fetchPageIssueEmbeds = async (anchor: string) => {
    runInAction(() => {
      this.issueEmbedError = false;
    });

    try {
      const response = await this.pageService.listIssueEmbeds(anchor);
      runInAction(() => {
        this.issueEmbedData = response;
      });
      return response;
    } catch (error) {
      runInAction(() => {
        this.issueEmbedError = true;
      });
      throw error;
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
      if (data.description_html !== undefined) this.description_html = data.description_html;
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
