import { TViewFiltersSortBy, TViewFiltersSortKey } from "@plane/types";

export enum EViewAccess {
  PRIVATE,
  PUBLIC,
}

export const VIEW_SORTING_KEY_OPTIONS: {
  key: TViewFiltersSortKey;
  label: string;
}[] = [
  { key: "name", label: "Name" },
  { key: "created_at", label: "Date created" },
  { key: "updated_at", label: "Date modified" },
];

export const VIEW_SORT_BY_OPTIONS: {
  key: TViewFiltersSortBy;
  label: string;
}[] = [
  { key: "asc", label: "Ascending" },
  { key: "desc", label: "Descending" },
];
