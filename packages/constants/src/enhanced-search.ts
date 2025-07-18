import { TLogoProps } from "@plane/types";

export enum ESearchFilterKeys {
  ALL = "all",
  PROJECT = "project",
  WORK_ITEM = "work_item",
  CYCLE = "cycle",
  MODULE = "module",
  VIEW = "work_item_view",
  PAGE = "page",
  EPIC = "epic",
  TEAMSPACE = "teamspace",
}

export type TSearchFilterKeys = `${ESearchFilterKeys}`;

export type TSearchResultItem = {
  entity_type: TSearchFilterKeys;
  id: string;
  name: string;
  project_identifier: string;
  sequence_id: string;
  workspace_slug: string;
};

export type TSearchQueryResponse = {
  [key in ESearchFilterKeys]: TSearchResultItem[];
};

export type TSearchFilter = {
  key: TSearchFilterKeys;
  i18n_label: string;
};

export const SEARCH_FILTERS: TSearchFilter[] = [
  { key: ESearchFilterKeys.ALL, i18n_label: "common.all" },
  { key: ESearchFilterKeys.PROJECT, i18n_label: "common.projects" },
  { key: ESearchFilterKeys.WORK_ITEM, i18n_label: "common.work_items" },
  { key: ESearchFilterKeys.CYCLE, i18n_label: "common.cycles" },
  { key: ESearchFilterKeys.MODULE, i18n_label: "common.modules" },
  { key: ESearchFilterKeys.VIEW, i18n_label: "common.views" },
  { key: ESearchFilterKeys.PAGE, i18n_label: "common.pages" },
  { key: ESearchFilterKeys.EPIC, i18n_label: "common.epics" },
  { key: ESearchFilterKeys.TEAMSPACE, i18n_label: "teamspaces.label" },
];

export interface IWorkspaceDefaultEnhancedSearchResult {
  id: string;
  name: string;
  project_id: string;
  project_identifier: string;
  workspace_slug: string;
  logo_props?: TLogoProps | null;
}
export interface IWorkspaceEnhancedSearchResult {
  id: string;
  name: string;
  slug: string;
}

export interface IWorkspaceIssueEnhancedSearchResult {
  id: string;
  name: string;
  project_identifier: string;
  project_id: string;
  sequence_id: number;
  workspace_slug: string;
  type_id: string;
}

export interface IWorkspacePageEnhancedSearchResult {
  id: string;
  name: string;
  project_ids: string[];
  project_identifiers: string[];
  workspace_slug: string;
}

export interface IWorkspaceProjectEnhancedSearchResult {
  id: string;
  identifier: string;
  name: string;
  workspace_slug: string;
  logo_props: TLogoProps | null;
}

export interface IWorkspaceEnhancedSearchResults {
  results: {
    workspace: IWorkspaceEnhancedSearchResult[];
    project: IWorkspaceProjectEnhancedSearchResult[];
    work_item: IWorkspaceIssueEnhancedSearchResult[];
    cycle: IWorkspaceDefaultEnhancedSearchResult[];
    module: IWorkspaceDefaultEnhancedSearchResult[];
    work_item_view: IWorkspaceDefaultEnhancedSearchResult[];
    page: IWorkspacePageEnhancedSearchResult[];
    epic: IWorkspaceIssueEnhancedSearchResult[];
  };
}
