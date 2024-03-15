// types
import { TPageFiltersSortKey, TPageFiltersSortBy } from "@plane/types";

export enum EPageAccess {
  PUBLIC = 0,
  PRIVATE = 1,
}

export const PAGE_SORTING_KEY_OPTIONS: {
  key: TPageFiltersSortKey;
  label: string;
}[] = [
  { key: "name", label: "Name" },
  { key: "created_at", label: "Date created" },
  { key: "updated_at", label: "Date modified" },
  { key: "opened_at", label: "Last opened" },
];

export const PAGE_SORT_BY_OPTIONS: {
  key: TPageFiltersSortBy;
  label: string;
}[] = [
  { key: "asc", label: "Ascending" },
  { key: "desc", label: "Descending" },
];
