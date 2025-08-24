export type TInitiativeOrderByOptions = "-updated_at" | "-created_at" | "sort_order";

export type TInitiativeGroupByOptions = "lead" | "created_by" | undefined;

export type TInitiativeDisplayFilters = {
  group_by?: TInitiativeGroupByOptions;
  order_by?: TInitiativeOrderByOptions;
};

export type TInitiativeFilters = {
  lead?: string[] | null;
  start_date?: string[] | null;
  target_date?: string[] | null;
};

export type TInitiativeStoredFilters = {
  display_filters?: TInitiativeDisplayFilters;
  filters?: TInitiativeFilters;
};
