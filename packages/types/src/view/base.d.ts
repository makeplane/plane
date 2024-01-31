import { TFilters, TDisplayFilters, TDisplayProperties } from "./filter";

declare enum EGlobalViewAccess {
  "public" = 0,
  "private" = 1,
  "shared" = 2,
}

export type TViewAccess =
  | EGlobalViewAccess.public
  | EGlobalViewAccess.private
  | EGlobalViewAccess.shared;

export type TView = {
  readonly id: string;
  readonly workspace: string;
  readonly project: string | undefined;
  name: string;
  description: string;
  readonly query: string;
  filters: TFilters;
  display_filters: TDisplayFilters;
  display_properties: TDisplayProperties;
  readonly access: TViewAccess;
  readonly owned_by: string;
  readonly sort_order: number;
  readonly is_locked: boolean;
  readonly is_pinned: boolean;
  readonly is_favorite: boolean;
  readonly created_by: string;
  readonly updated_by: string;
  readonly created_at: Date;
  readonly updated_at: Date;
};
