import {
  TViewFilters,
  TViewDisplayFilters,
  TViewDisplayProperties,
} from "./filter";

export type TUserView = {
  id: string | undefined;
  workspace: string | undefined;
  user: string | undefined;
  filters: TViewFilters;
  display_filters: TViewDisplayFilters;
  display_properties: TViewDisplayProperties;
  created_by: string | undefined;
  updated_by: string | undefined;
  created_at: Date | undefined;
  updated_at: Date | undefined;
};
