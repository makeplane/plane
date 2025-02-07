import { EViewAccess } from "@plane/constants";
import { TLogoProps } from "./common";
import {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
} from "./view-props";

export interface IProjectView {
  id: string;
  access: EViewAccess;
  created_at: Date;
  updated_at: Date;
  is_favorite: boolean;
  created_by: string;
  updated_by: string;
  name: string;
  description: string;
  filters: IIssueFilterOptions;
  display_filters: IIssueDisplayFilterOptions;
  display_properties: IIssueDisplayProperties;
  query: IIssueFilterOptions;
  query_data: IIssueFilterOptions;
  project: string;
  workspace: string;
  logo_props: TLogoProps | undefined;
  is_locked: boolean;
  anchor?: string;
  owned_by: string;
}

export type TPublishViewSettings = {
  is_comments_enabled: boolean;
  is_reactions_enabled: boolean;
  is_votes_enabled: boolean;
};

export type TPublishViewDetails = TPublishViewSettings & {
  id: string;
  anchor: string;
};

export type TViewFiltersSortKey = "name" | "created_at" | "updated_at";

export type TViewFiltersSortBy = "asc" | "desc";

export type TViewFilterProps = {
  created_at?: string[] | null;
  owned_by?: string[] | null;
  favorites?: boolean;
  view_type?: EViewAccess[];
};

export type TViewFilters = {
  searchQuery: string;
  sortKey: TViewFiltersSortKey;
  sortBy: TViewFiltersSortBy;
  filters?: TViewFilterProps;
};
