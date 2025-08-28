export type TTeamspaceOrderByOptions = "name" | "-name" | "created_at" | "-created_at";

export type TTeamspaceDisplayFilters = {
  order_by?: TTeamspaceOrderByOptions;
};

export type TTeamspaceFilters = object;

export type TTeamspaceStoredFilters = {
  display_filters?: TTeamspaceDisplayFilters;
  filters?: TTeamspaceFilters;
};
