export enum EWorklogLoader {
  WORKSPACE_INIT_LOADER = "workspace-init-loader", // initial load for workspace worklogs
  WORKSPACE_MUTATION_LOADER = "workspace-mutation-loader", // when we refresh the current item
  WORKSPACE_PAGINATION_LOADER = "workspace-pagination-loader", // when we move to next or previous page
  ISSUE_INIT_LOADER = "issue-init-loader", // initial load for issue worklogs used for activity
  ISSUE_MUTATION_LOADER = "issue-mutation-loader", // when we update the current item
}

export enum EWorklogQueryParamType {
  INIT = "init", // fetching for the first time
  CURRENT = "current", // fetching current page
  PREV = "prev", // fetching previous page
  NEXT = "next", // fetching next page
}

export enum EWorklogDownloadLoader {
  INIT_LOADER = "init-loader", // initial load
  MUTATION_LOADER = "mutation-loader", // when we refresh the current list status
  PAGINATION_LOADER = "pagination-loader", // when we move to next or previous page
}

export enum EWorklogDownloadQueryParamType {
  INIT = "init", // fetching for the first time
  CURRENT = "current", // fetching current page
  PREV = "prev", // fetching previous page
  NEXT = "next", // fetching next page
}
