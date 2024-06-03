import { TLogoProps } from "./common";
import { EPageAccess } from "./enums";

export type TPage = {
  access: EPageAccess | undefined;
  archived_at: string | null | undefined;
  color: string | undefined;
  created_at: Date | undefined;
  created_by: string | undefined;
  description_html: string | undefined;
  id: string | undefined;
  is_favorite: boolean;
  is_locked: boolean;
  labels: string[] | undefined;
  name: string | undefined;
  owned_by: string | undefined;
  project: string | undefined;
  updated_at: Date | undefined;
  updated_by: string | undefined;
  workspace: string | undefined;
  logo_props: TLogoProps | undefined;
};

// page filters
export type TPageNavigationTabs = "public" | "private" | "archived";

export type TPageFiltersSortKey =
  | "name"
  | "created_at"
  | "updated_at"
  | "opened_at";

export type TPageFiltersSortBy = "asc" | "desc";

export type TPageFilterProps = {
  created_at?: string[] | null;
  created_by?: string[] | null;
  favorites?: boolean;
  labels?: string[] | null;
};

export type TPageFilters = {
  searchQuery: string;
  sortKey: TPageFiltersSortKey;
  sortBy: TPageFiltersSortBy;
  filters?: TPageFilterProps;
};
