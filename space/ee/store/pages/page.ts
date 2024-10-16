import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import { TLogoProps } from "@plane/types";
// services
import { PageService } from "@/plane-web/services/page.service";
// plane web types
import { TPageResponse } from "@/plane-web/types";
// store
import { CoreRootStore } from "@/store/root.store";
// types
import { IIssue } from "@/types/issue";

export type TLoader = "submitting" | "submitted" | "saved";

export interface IPage extends TPageResponse {
  // observables
  issueEmbedError: boolean;
  issueEmbedData: IIssue[] | undefined;
  // computed
  asJSON: TPageResponse | undefined;
  areIssueEmbedsLoaded: boolean;
  // helpers
  getIssueEmbedDetails: (issueID: string) => IIssue | undefined;
  // actions
  fetchPageIssueEmbeds: (anchor: string) => Promise<IIssue[]>;
}

export class Page implements IPage {
  // observables
  issueEmbedError: boolean = false;
  issueEmbedData: IIssue[] | undefined = undefined;
  // page properties
  created_at: Date | undefined;
  description_html: string | undefined;
  id: string | undefined;
  logo_props: TLogoProps | undefined;
  name: string | undefined;
  updated_at: Date | undefined;
  // services
  pageService: PageService;

  constructor(
    private rootStore: CoreRootStore,
    page: TPageResponse
  ) {
    this.created_at = page.created_at || undefined;
    this.description_html = page.description_html || undefined;
    this.id = page.id || undefined;
    this.logo_props = page.logo_props || undefined;
    this.name = page.name || undefined;
    this.updated_at = page.updated_at || undefined;

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
      // computed
      asJSON: computed,
      areIssueEmbedsLoaded: computed,
      // actions
      fetchPageIssueEmbeds: action,
    });

    this.pageService = new PageService();
  }

  get asJSON() {
    return {
      created_at: this.created_at,
      description_html: this.description_html,
      id: this.id,
      logo_props: this.logo_props,
      name: this.name,
      updated_at: this.updated_at,
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
      const response = await this.pageService.fetchPageIssueEmbeds(anchor);
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
}
