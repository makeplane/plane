import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { TIssuePage } from "@plane/types";
import { getPageName } from "@plane/utils";
import { IssuePageService } from "@/plane-web/services/issue/issue-page.service";

export interface IWorkItemPagesInterface {
  // observables
  issuePagesMap: Record<string, string[]>; // issueId -> pagesId[]
  pagesMap: Record<string, TIssuePage>; // pageId -> page
  // computed
  getPageById: (pageId: string) => TIssuePage | undefined;
  getPagesByIssueId: (issueId: string) => string[];
  // actions
  fetchPagesByIssueId: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  updateIssuePages: (workspaceSlug: string, projectId: string, issueId: string, pages: string[]) => Promise<void>;
  deleteIssuePages: (workspaceSlug: string, projectId: string, issueId: string, pageId: string) => Promise<void>;
}

export class WorkItemPagesStore implements IWorkItemPagesInterface {
  // observables
  issuePagesMap: Record<string, string[]> = {};
  pagesMap: Record<string, TIssuePage> = {};
  // services
  issuePageService;

  constructor() {
    makeObservable(this, {
      // observables
      issuePagesMap: observable,
      pagesMap: observable,

      // actions
      fetchPagesByIssueId: action,
      updateIssuePages: action,
      deleteIssuePages: action,
    });
    this.issuePageService = new IssuePageService();
  }

  getPageById = computedFn((pageId: string) => this.pagesMap[pageId]);

  getPagesByIssueId = computedFn((issueId: string) => this.issuePagesMap[issueId] ?? []);

  /**
   * Fetch pages by issue id
   * @param issueId
   */
  fetchPagesByIssueId = async (workspaceSlug: string, projectId: string, issueId: string) => {
    const result = await this.issuePageService.fetchWorkItemPages(workspaceSlug, projectId, issueId);
    runInAction(() => {
      this.issuePagesMap[issueId] = result.map((data) => data.page.id);
      result.forEach((data) => {
        this.pagesMap[data.page.id] = { ...data.page, name: getPageName(data.page.name) };
      });
    });
  };

  /**
   * Update issue pages
   * @param issueId
   * @param pages
   */
  updateIssuePages = async (workspaceSlug: string, projectId: string, issueId: string, pages: string[]) => {
    const initialPages = this.issuePagesMap[issueId];
    try {
      const result = await this.issuePageService.updateWorkItemPage(workspaceSlug, projectId, issueId, pages);
      runInAction(async () => {
        result.forEach((data) => {
          this.pagesMap[data.page.id] = { ...data.page, name: getPageName(data.page.name) };
        });
        this.issuePagesMap[issueId] = result.map((data) => data.page.id) || [];
      });
    } catch (error) {
      console.error(error);
      runInAction(async () => {
        this.issuePagesMap[issueId] = initialPages;
      });
    }
  };

  /**
   * Delete issue pages
   * @param workspaceSlug
   * @param projectId
   * @param issueId
   * @param pageId
   */
  deleteIssuePages = async (workspaceSlug: string, projectId: string, issueId: string, pageId: string) => {
    const initialPages = this.issuePagesMap[issueId];
    try {
      runInAction(async () => {
        this.issuePagesMap[issueId] = this.issuePagesMap[issueId].filter((id) => id !== pageId);
      });
      await this.issuePageService.removeWorkItemPage(workspaceSlug, projectId, issueId, pageId);
    } catch (error) {
      console.error(error);
      runInAction(async () => {
        this.issuePagesMap[issueId] = initialPages;
      });
      throw error;
    }
  };
}
