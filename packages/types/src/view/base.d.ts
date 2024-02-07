import {
  TViewFilters,
  TViewDisplayFilters,
  TViewDisplayProperties,
} from "./filter";

export type TViewTypes =
  | "WORKSPACE_YOUR_VIEWS"
  | "WORKSPACE_VIEWS"
  | "PROJECT_VIEWS"
  | "PROJECT_YOUR_VIEWS";

declare enum EViewAccess {
  "public" = 0,
  "private" = 1,
  "shared" = 2,
}

export type TViewAccess =
  | EViewAccess.public
  | EViewAccess.private
  | EViewAccess.shared;

export type TView = {
  id: string | undefined;
  workspace: string | undefined;
  project: string | undefined;
  name: string | undefined;
  description: string | undefined;
  query: string | undefined;
  filters: TViewFilters;
  display_filters: TViewDisplayFilters;
  display_properties: TViewDisplayProperties;
  access: TViewAccess | undefined;
  owned_by: string | undefined;
  sort_order: number | undefined;
  is_locked: boolean;
  is_pinned: boolean;
  is_favorite: boolean;
  created_by: string | undefined;
  updated_by: string | undefined;
  created_at: Date | undefined;
  updated_at: Date | undefined;
  // local view variables
  is_local_view: boolean;
  is_create: boolean;
  is_editable: boolean;
};
