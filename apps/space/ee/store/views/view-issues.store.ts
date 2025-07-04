import { action, makeObservable, runInAction } from "mobx";
// types
import { SitesViewPublishService } from "@plane/services";
import { IssuePaginationOptions, TLoader } from "@plane/types";
// store
import { BaseIssuesStore, IBaseIssuesStore } from "@/store/helpers/base-issues.store";
import { RootStore } from "../root.store";

export interface IViewIssueStore extends IBaseIssuesStore {
  // actions
  fetchPublicIssues: (
    anchor: string,
    loadType: TLoader,
    options: IssuePaginationOptions,
    isExistingPaginationOptions?: boolean
  ) => Promise<void>;
  fetchNextPublicIssues: (anchor: string, groupId?: string, subGroupId?: string) => Promise<void>;
  fetchPublicIssuesWithExistingPagination: (anchor: string, loadType?: TLoader) => Promise<void>;
}

export class ViewIssueStore extends BaseIssuesStore implements IViewIssueStore {
  // root store
  rootStore: RootStore;
  // services
  viewPublishService: SitesViewPublishService;

  constructor(_rootStore: RootStore) {
    super(_rootStore);
    makeObservable(this, {
      // actions
      fetchPublicIssues: action,
      fetchNextPublicIssues: action,
      fetchPublicIssuesWithExistingPagination: action,
    });

    this.rootStore = _rootStore;
    this.viewPublishService = new SitesViewPublishService();
  }

  /**
   * @description fetch issues, states and labels
   * @param {string} anchor
   * @param params
   */
  fetchPublicIssues = async (
    anchor: string,
    loadType: TLoader = "init-loader",
    options: IssuePaginationOptions,
    isExistingPaginationOptions: boolean = false
  ) => {
    try {
      // set loader and clear store
      runInAction(() => {
        this.setLoader(loadType);
      });
      this.clear(!isExistingPaginationOptions);

      const params = this.rootStore.viewIssuesFilter.getFilterParams(options, undefined, undefined, undefined);

      const response = await this.viewPublishService.listIssues(anchor, params);

      // after fetching issues, call the base method to process the response further
      this.onfetchIssues(response, options);
    } catch (error) {
      this.setLoader(undefined);
      throw error;
    }
  };

  fetchNextPublicIssues = async (anchor: string, groupId?: string, subGroupId?: string) => {
    const cursorObject = this.getPaginationData(groupId, subGroupId);
    // if there are no pagination options and the next page results do not exist the return
    if (!this.paginationOptions || (cursorObject && !cursorObject?.nextPageResults)) return;
    try {
      // set Loader
      this.setLoader("pagination", groupId, subGroupId);

      // get params from stored pagination options
      const params = this.rootStore.viewIssuesFilter.getFilterParams(
        this.paginationOptions,
        cursorObject?.nextCursor,
        groupId,
        subGroupId
      );
      // call the fetch issues API with the params for next page in issues
      const response = await this.viewPublishService.listIssues(anchor, params);

      // after the next page of issues are fetched, call the base method to process the response
      this.onfetchNexIssues(response, groupId, subGroupId);
    } catch (error) {
      // set Loader as undefined if errored out
      this.setLoader(undefined, groupId, subGroupId);
      throw error;
    }
  };

  /**
   * This Method exists to fetch the first page of the issues with the existing stored pagination
   * This is useful for refetching when filters, groupBy, orderBy etc changes
   * @param workspaceSlug
   * @param projectId
   * @param loadType
   * @returns
   */
  fetchPublicIssuesWithExistingPagination = async (anchor: string, loadType: TLoader = "mutation") => {
    if (!this.paginationOptions) return;
    return await this.fetchPublicIssues(anchor, loadType, this.paginationOptions, true);
  };
}
