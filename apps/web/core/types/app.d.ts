// types
import type { IWorkspaceDefaultSearchResult, IWorkspaceSearchResult } from "@plane/types";

export interface IAppSearchResults {
  results: {
    workspace: IWorkspaceSearchResult[];
    page: IWorkspaceDefaultSearchResult[];
  };
}
