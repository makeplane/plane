export type TCycleTabOptions = "active" | "all";

export type TCycleLayoutOptions = "list" | "board" | "gantt";

export type TCycleOrderByOptions =
  | "name"
  | "-name"
  | "end_date"
  | "-end_date"
  | "sort_order"
  | "-sort_order";

export type TCycleDisplayFilters = {
  active_tab?: TCycleTabOptions;
  layout?: TCycleLayoutOptions;
  order_by?: TCycleOrderByOptions;
};

export type TCycleFilters = {
  end_date?: string[] | null;
  start_date?: string[] | null;
  status?: string[] | null;
};

export type TCycleStoredFilters = {
  display_filters?: TCycleDisplayFilters;
  filters?: TCycleFilters;
};
