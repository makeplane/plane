import {
  TViewFilters,
  TViewDisplayFilters,
  TViewDisplayProperties,
} from "./filter";

export type TViewTypes =
  | "WORKSPACE_YOUR_VIEWS"
  | "WORKSPACE_VIEWS"
  | "WORKSPACE_PROJECT_VIEWS"
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
  filters: TViewFilters | undefined;
  display_filters: TViewDisplayFilters | undefined;
  display_properties: TViewDisplayProperties | undefined;
  access: TViewAccess | undefined;
  owned_by: string | undefined;
  sort_order: number | undefined;
  is_locked: boolean | undefined;
  is_pinned: boolean | undefined;
  is_favorite: boolean | undefined;
  created_by: string | undefined;
  updated_by: string | undefined;
  created_at: Date | undefined;
  updated_at: Date | undefined;
};
