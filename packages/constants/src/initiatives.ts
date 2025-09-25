import { TInitiativeDisplayFilters } from "@plane/types";

export enum EInitiativeNavigationItem {
  OVERVIEW = "overview",
  SCOPE = "scope",
}

export const INITIATIVE_DEFAULT_DISPLAY_FILTERS: TInitiativeDisplayFilters = {
  group_by: "lead",
  order_by: "-created_at",
};
