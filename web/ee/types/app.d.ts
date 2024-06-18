// types
import { IWorkspaceDefaultSearchResult, IWorkspaceSearchResult } from "@plane/types";

export interface IAppSearchResults {
  results: {
    workspace: IWorkspaceSearchResult[];
    page: IWorkspaceDefaultSearchResult[];
  };
}
