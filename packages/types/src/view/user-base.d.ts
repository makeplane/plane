import {
  TViewFilters,
  TViewDisplayFilters,
  TViewDisplayProperties,
} from "./filter";

export type TUserView = {
  id: string | undefined;
  workspace: string | undefined;
  project: string | undefined;
  module: string | undefined;
  cycle: string | undefined;
  filters: TViewFilters | undefined;
  display_filters: TViewDisplayFilters | undefined;
  display_properties: TViewDisplayProperties | undefined;
  user: string | undefined;
  created_by: string | undefined;
  updated_by: string | undefined;
  created_at: Date | undefined;
  updated_at: Date | undefined;
};
