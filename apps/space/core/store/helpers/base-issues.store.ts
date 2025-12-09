import { concat, get, set, uniq, update } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { ALL_ISSUES } from "@plane/constants";
import { SitesIssueService } from "@plane/services";
import type {
  TIssueGroupByOptions,
  TGroupedIssues,
  TSubGroupedIssues,
  TLoader,
  IssuePaginationOptions,
  TIssues,
  TIssuePaginationData,
  TGroupedIssueCount,
  TPaginationData,
} from "@plane/types";
// types
import type { IIssue, TIssuesResponse } from "@/types/issue";
import type { CoreRootStore } from "../root.store";
// constants
// helpers

export type TIssueDisplayFilterOptions = Exclude<TIssueGroupByOptions, null | "team_project"> | "target_date";

export enum EIssueGroupedAction {
  ADD = "ADD",
  DELETE = "DELETE",
  REORDER = "REORDER",
}

export interface IBaseIssuesStore {
  // observable
  loader: Record<string, TLoader>;
  // actions
  addIssue(issues: IIssue[], shouldReplace?: boolean): void;
  // helper methods
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues | undefined; // object to store Issue Ids based on group or subgroup
  groupedIssueCount: TGroupedIssueCount; // map of groupId/subgroup and issue count of that particular group/subgroup
  issuePaginationData: TIssuePaginationData; // map of groupId/subgroup and pagination Data of that particular group/subgroup

  // helper methods
  getIssueIds: (groupId?: string, subGroupId?: string) => string[] | undefined;
  getPaginationData(groupId: string | undefined, subGroupId: string | undefined): TPaginationData | undefined;
  getIssueLoader(groupId?: string, subGroupId?: string): TLoader;
  getGroupIssueCount: (
    groupId: string | undefined,
    subGroupId: string | undefined,
    isSubGroupCumulative: boolean
  ) => number | undefined;
}

export const ISSUE_FILTER_DEFAULT_DATA: Record<TIssueDisplayFilterOptions, keyof IIssue> = {
  project: "project_id",
  cycle: "cycle_id",
  module: "module_ids",
  state: "state_id",
  "state_detail.group": "state_group" as keyof IIssue, // state_detail.group is only being used for state_group display,
  priority: "priority",
  labels: "label_ids",
  created_by: "created_by",
  assignees: "assignee_ids",
  target_date: "target_date",
};

export abstract class BaseIssuesStore implements IBaseIssuesStore {
  loader: Record<string, TLoader> = {};
  groupedIssueIds: TIssues | undefined = undefined;
  issuePaginationData: TIssuePaginationData = {};
  groupedIssueCount: TGroupedIssueCount = {};
  //
  paginationOptions: IssuePaginationOptions | undefined = undefined;

  issueService;
  // root store
  rootIssueStore;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observable
      loader: observable,
      groupedIssueIds: observable,
      issuePaginationData: observable,
      groupedIssueCount: observable,

      paginationOptions: observable,
      // action
      storePreviousPaginationValues: action.bound,

      onfetchIssues: action.bound,
      onfetchNexIssues: action.bound,
      clear: action.bound,
      setLoader: action.bound,
    });
    this.rootIssueStore = _rootStore;
    this.issueService = new SitesIssueService();
  }

  getIssueIds = (groupId?: string, subGroupId?: string) => {
    const groupedIssueIds = this.groupedIssueIds;

    if (!groupedIssueIds) return undefined;

    const allIssues = groupedIssueIds[ALL_ISSUES] ?? [];
    if (allIssues && Array.isArray(allIssues)) {
      return allIssues;
    }

    if (groupId && groupedIssueIds?.[groupId] && Array.isArray(groupedIssueIds[groupId])) {
      return groupedIssueIds[groupId] ?? [];
    }

    if (groupId && subGroupId) {
      return (groupedIssueIds as TSubGroupedIssues)[groupId]?.[subGroupId] ?? [];
    }

    return undefined;
  };

  /**
   * @description This method will add issues to the issuesMap
   * @param {IIssue[]} issues
   * @returns {void}
   */
  addIssue = (issues: IIssue[], shouldReplace = false) => {
    if (issues && issues.length <= 0) return;
    runInAction(() => {
      issues.forEach((issue) => {
        if (!this.rootIssueStore.issueDetail.getIssueById(issue.id) || shouldReplace)
          set(this.rootIssueStore.issueDetail.details, issue.id, issue);
      });
    });
  };

  /**
   * Store the pagination data required for next subsequent issue pagination calls
   * @param prevCursor cursor value of previous page
   * @param nextCursor cursor value of next page
   * @param nextPageResults boolean to indicate if the next page results exist i.e, have we reached end of pages
   * @param groupId groupId and subGroupId to add the pagination data for the particular group/subgroup
   * @param subGroupId
   */
  setPaginationData(
    prevCursor: string,
    nextCursor: string,
    nextPageResults: boolean,
    groupId?: string,
    subGroupId?: string
  ) {
    const cursorObject = {
      prevCursor,
      nextCursor,
      nextPageResults,
    };

    set(this.issuePaginationData, [this.getGroupKey(groupId, subGroupId)], cursorObject);
  }

  /**
   * Sets the loader value of the particular groupId/subGroupId, or to ALL_ISSUES if both are undefined
   * @param loaderValue
   * @param groupId
   * @param subGroupId
   */
  setLoader(loaderValue: TLoader, groupId?: string, subGroupId?: string) {
    runInAction(() => {
      set(this.loader, this.getGroupKey(groupId, subGroupId), loaderValue);
    });
  }

  /**
   * gets the Loader value of particular group/subgroup/ALL_ISSUES
   */
  getIssueLoader = (groupId?: string, subGroupId?: string) => get(this.loader, this.getGroupKey(groupId, subGroupId));

  /**
   * gets the pagination data of particular group/subgroup/ALL_ISSUES
   */
  getPaginationData = computedFn(
    (groupId: string | undefined, subGroupId: string | undefined): TPaginationData | undefined =>
      get(this.issuePaginationData, [this.getGroupKey(groupId, subGroupId)])
  );

  /**
   * gets the issue count of particular group/subgroup/ALL_ISSUES
   *
   * if isSubGroupCumulative is true, sum up all the issueCount of the subGroupId, across all the groupIds
   */
  getGroupIssueCount = computedFn(
    (
      groupId: string | undefined,
      subGroupId: string | undefined,
      isSubGroupCumulative: boolean
    ): number | undefined => {
      if (isSubGroupCumulative && subGroupId) {
        const groupIssuesKeys = Object.keys(this.groupedIssueCount);
        let subGroupCumulativeCount = 0;

        for (const groupKey of groupIssuesKeys) {
          if (groupKey.includes(`_${subGroupId}`)) subGroupCumulativeCount += this.groupedIssueCount[groupKey];
        }

        return subGroupCumulativeCount;
      }

      return get(this.groupedIssueCount, [this.getGroupKey(groupId, subGroupId)]);
    }
  );

  /**
   * This Method is called after fetching the first paginated issues
   *
   * This method updates the appropriate issue list based on if groupByKey or subGroupByKey are defined
   * If both groupByKey and subGroupByKey are not defined, then the issue list are added to another group called ALL_ISSUES
   * @param issuesResponse  Paginated Response received from the API
   * @param options Pagination options
   * @param workspaceSlug
   * @param projectId
   * @param id Id can be anything from cycleId, moduleId, viewId or userId based on the store
   */
  onfetchIssues(issuesResponse: TIssuesResponse, options: IssuePaginationOptions) {
    // Process the Issue Response to get the following data from it
    const { issueList, groupedIssues, groupedIssueCount } = this.processIssueResponse(issuesResponse);

    // The Issue list is added to the main Issue Map
    this.addIssue(issueList);

    // Update all the GroupIds to this Store's groupedIssueIds and update Individual group issue counts
    runInAction(() => {
      this.updateGroupedIssueIds(groupedIssues, groupedIssueCount);
      this.loader[this.getGroupKey()] = undefined;
    });

    // store Pagination options for next subsequent calls and data like next cursor etc
    this.storePreviousPaginationValues(issuesResponse, options);
  }

  /**
   * This Method is called on the subsequent pagination calls after the first initial call
   *
   * This method updates the appropriate issue list based on if groupId or subgroupIds are Passed
   * @param issuesResponse Paginated Response received from the API
   * @param groupId
   * @param subGroupId
   */
  onfetchNexIssues(issuesResponse: TIssuesResponse, groupId?: string, subGroupId?: string) {
    // Process the Issue Response to get the following data from it
    const { issueList, groupedIssues, groupedIssueCount } = this.processIssueResponse(issuesResponse);

    // The Issue list is added to the main Issue Map
    this.addIssue(issueList);

    // Update all the GroupIds to this Store's groupedIssueIds and update Individual group issue counts
    runInAction(() => {
      this.updateGroupedIssueIds(groupedIssues, groupedIssueCount, groupId, subGroupId);
      this.loader[this.getGroupKey(groupId, subGroupId)] = undefined;
    });

    // store Pagination data like next cursor etc
    this.storePreviousPaginationValues(issuesResponse, undefined, groupId, subGroupId);
  }

  /**
   * Method called to clear out the current store
   */
  clear(shouldClearPaginationOptions = true) {
    runInAction(() => {
      this.groupedIssueIds = undefined;
      this.issuePaginationData = {};
      this.groupedIssueCount = {};
      if (shouldClearPaginationOptions) {
        this.paginationOptions = undefined;
      }
    });
  }

  /**
   * This method processes the issueResponse to provide data that can be used to update the store
   * @param issueResponse
   * @returns  issueList, list of issue Data
   * @returns groupedIssues, grouped issue Ids
   * @returns groupedIssueCount, object containing issue counts of individual groups
   */
  processIssueResponse(issueResponse: TIssuesResponse): {
    issueList: IIssue[];
    groupedIssues: TIssues;
    groupedIssueCount: TGroupedIssueCount;
  } {
    const issueResult = issueResponse?.results;

    // if undefined return empty objects
    if (!issueResult)
      return {
        issueList: [],
        groupedIssues: {},
        groupedIssueCount: {},
      };

    //if is an array then it's an ungrouped response. return values with groupId as ALL_ISSUES
    if (Array.isArray(issueResult)) {
      return {
        issueList: issueResult,
        groupedIssues: {
          [ALL_ISSUES]: issueResult.map((issue) => issue.id),
        },
        groupedIssueCount: {
          [ALL_ISSUES]: issueResponse.total_count,
        },
      };
    }

    const issueList: IIssue[] = [];
    const groupedIssues: TGroupedIssues | TSubGroupedIssues = {};
    const groupedIssueCount: TGroupedIssueCount = {};

    // update total issue count to ALL_ISSUES
    set(groupedIssueCount, [ALL_ISSUES], issueResponse.total_count);

    // loop through all the groupIds from issue Result
    for (const groupId in issueResult) {
      const groupIssuesObject = issueResult[groupId];
      const groupIssueResult = groupIssuesObject?.results;

      // if groupIssueResult is undefined then continue the loop
      if (!groupIssueResult) continue;

      // set grouped Issue count of the current groupId
      set(groupedIssueCount, [groupId], groupIssuesObject.total_results);

      // if groupIssueResult, the it is not subGrouped
      if (Array.isArray(groupIssueResult)) {
        // add the result to issueList
        issueList.push(...groupIssueResult);
        // set the issue Ids to the groupId path
        set(
          groupedIssues,
          [groupId],
          groupIssueResult.map((issue) => issue.id)
        );
        continue;
      }

      // loop through all the subGroupIds from issue Result
      for (const subGroupId in groupIssueResult) {
        const subGroupIssuesObject = groupIssueResult[subGroupId];
        const subGroupIssueResult = subGroupIssuesObject?.results;

        // if subGroupIssueResult is undefined then continue the loop
        if (!subGroupIssueResult) continue;

        // set sub grouped Issue count of the current groupId
        set(groupedIssueCount, [this.getGroupKey(groupId, subGroupId)], subGroupIssuesObject.total_results);

        if (Array.isArray(subGroupIssueResult)) {
          // add the result to issueList
          issueList.push(...subGroupIssueResult);
          // set the issue Ids to the [groupId, subGroupId] path
          set(
            groupedIssues,
            [groupId, subGroupId],
            subGroupIssueResult.map((issue) => issue.id)
          );

          continue;
        }
      }
    }

    return { issueList, groupedIssues, groupedIssueCount };
  }

  /**
   * This method is used to update the grouped issue Ids to it's respected lists and also to update group Issue Counts
   * @param groupedIssues Object that contains list of issueIds with respect to their groups/subgroups
   * @param groupedIssueCount Object the contains the issue count of each groups
   * @param groupId groupId string
   * @param subGroupId subGroupId string
   * @returns updates the store with the values
   */
  updateGroupedIssueIds(
    groupedIssues: TIssues,
    groupedIssueCount: TGroupedIssueCount,
    groupId?: string,
    subGroupId?: string
  ) {
    // if groupId exists and groupedIssues has ALL_ISSUES as a group,
    // then it's an individual group/subgroup pagination
    if (groupId && groupedIssues[ALL_ISSUES] && Array.isArray(groupedIssues[ALL_ISSUES])) {
      const issueGroup = groupedIssues[ALL_ISSUES];
      const issueGroupCount = groupedIssueCount[ALL_ISSUES];
      const issuesPath = [groupId];
      // issuesPath is the path for the issue List in the Grouped Issue List
      // issuePath is either [groupId] for grouped pagination or [groupId, subGroupId] for subGrouped pagination
      if (subGroupId) issuesPath.push(subGroupId);

      // update the issue Count of the particular group/subGroup
      set(this.groupedIssueCount, [this.getGroupKey(groupId, subGroupId)], issueGroupCount);

      // update the issue list in the issuePath
      this.updateIssueGroup(issueGroup, issuesPath);
      return;
    }

    // if not in the above condition the it's a complete grouped pagination not individual group/subgroup pagination
    // update total issue count as ALL_ISSUES count in `groupedIssueCount` object
    set(this.groupedIssueCount, [ALL_ISSUES], groupedIssueCount[ALL_ISSUES]);

    // loop through the groups of groupedIssues.
    for (const groupId in groupedIssues) {
      const issueGroup = groupedIssues[groupId];
      const issueGroupCount = groupedIssueCount[groupId];

      // update the groupId's issue count
      set(this.groupedIssueCount, [groupId], issueGroupCount);

      // This updates the group issue list in the store, if the issueGroup is a string
      const storeUpdated = this.updateIssueGroup(issueGroup, [groupId]);
      // if issueGroup is indeed a string, continue
      if (storeUpdated) continue;

      // if issueGroup is not a string, loop through the sub group Issues
      for (const subGroupId in issueGroup) {
        const issueSubGroup = (issueGroup as TGroupedIssues)[subGroupId];
        const issueSubGroupCount = groupedIssueCount[this.getGroupKey(groupId, subGroupId)];

        // update the subGroupId's issue count
        set(this.groupedIssueCount, [this.getGroupKey(groupId, subGroupId)], issueSubGroupCount);
        // This updates the subgroup issue list in the store
        this.updateIssueGroup(issueSubGroup, [groupId, subGroupId]);
      }
    }
  }

  /**
   * This Method is used to update the issue Id list at the particular issuePath
   * @param groupedIssueIds could be an issue Id List for grouped issues or an object that contains a issue Id list in case of subGrouped
   * @param issuePath array of string, to identify the path of the issueList to be updated with the above issue Id list
   * @returns a boolean that indicates if the groupedIssueIds is indeed a array Id list, in which case the issue Id list is added to the store at issuePath
   */
  updateIssueGroup(groupedIssueIds: TGroupedIssues | string[], issuePath: string[]): boolean {
    if (!groupedIssueIds) return true;

    // if groupedIssueIds is an array, update the `groupedIssueIds` store at the issuePath
    if (groupedIssueIds && Array.isArray(groupedIssueIds)) {
      update(this, ["groupedIssueIds", ...issuePath], (issueIds: string[] = []) =>
        uniq(concat(issueIds, groupedIssueIds))
      );
      // return true to indicate the store has been updated
      return true;
    }

    // return false to indicate the store has been updated and the groupedIssueIds is likely Object for subGrouped Issues
    return false;
  }

  /**
   * This method is used to update the count of the issues at the path with the increment
   * @param path issuePath, corresponding key is to be incremented
   * @param increment
   */
  updateIssueCount(accumulatedUpdatesForCount: { [key: string]: EIssueGroupedAction }) {
    const updateKeys = Object.keys(accumulatedUpdatesForCount);
    for (const updateKey of updateKeys) {
      const update = accumulatedUpdatesForCount[updateKey];
      if (!update) continue;

      const increment = update === EIssueGroupedAction.ADD ? 1 : -1;
      // get current count at the key
      const issueCount = get(this.groupedIssueCount, updateKey) ?? 0;
      // update the count at the key
      set(this.groupedIssueCount, updateKey, issueCount + increment);
    }
  }

  /**
   * This Method is called to store the pagination options and paginated data from response
   * @param issuesResponse issue list response
   * @param options pagination options to be stored for next page call
   * @param groupId
   * @param subGroupId
   */
  storePreviousPaginationValues = (
    issuesResponse: TIssuesResponse,
    options?: IssuePaginationOptions,
    groupId?: string,
    subGroupId?: string
  ) => {
    if (options) this.paginationOptions = options;

    this.setPaginationData(
      issuesResponse.prev_cursor,
      issuesResponse.next_cursor,
      issuesResponse.next_page_results,
      groupId,
      subGroupId
    );
  };

  /**
   * returns,
   * A compound key, if both groupId & subGroupId are defined
   * groupId, only if groupId is defined
   * ALL_ISSUES, if both groupId & subGroupId are not defined
   * @param groupId
   * @param subGroupId
   * @returns
   */
  getGroupKey = (groupId?: string, subGroupId?: string) => {
    if (groupId && subGroupId && subGroupId !== "null") return `${groupId}_${subGroupId}`;

    if (groupId) return groupId;

    return ALL_ISSUES;
  };
}
