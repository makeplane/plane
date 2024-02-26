import { TPageFiltersSortKey, TPageFiltersSortBy } from "@plane/types";

export enum EPageAccess {
  PUBLIC = 0,
  PRIVATE = 1,
}

export const pageSorting: { key: TPageFiltersSortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "created_at", label: "Date Created" },
  { key: "updated_at", label: "Last Modified" },
];

export const pageSortingBy: Record<TPageFiltersSortBy, { label: String }> = {
  asc: { label: "Ascending" },
  desc: { label: "Descending" },
};
