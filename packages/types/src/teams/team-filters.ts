export type TTeamOrderByOptions =
  | "name"
  | "-name"
  | "created_at"
  | "-created_at";

export type TTeamDisplayFilters = {
  order_by?: TTeamOrderByOptions;
};

export type TTeamFilters = {};

export type TTeamStoredFilters = {
  display_filters?: TTeamDisplayFilters;
  filters?: TTeamFilters;
};
