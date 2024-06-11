import { Globe2, Lock, LucideIcon } from "lucide-react";
// types
import { TPageFiltersSortKey, TPageFiltersSortBy } from "@plane/types";

export enum EPageAccess {
  PUBLIC = 0,
  PRIVATE = 1,
}

export const PAGE_ACCESS_SPECIFIERS: {
  key: EPageAccess;
  label: string;
  icon: LucideIcon;
}[] = [
  { key: EPageAccess.PUBLIC, label: "Public", icon: Globe2 },
  { key: EPageAccess.PRIVATE, label: "Private", icon: Lock },
];

export const PAGE_SORTING_KEY_OPTIONS: {
  key: TPageFiltersSortKey;
  label: string;
}[] = [
  { key: "name", label: "Name" },
  { key: "created_at", label: "Date created" },
  { key: "updated_at", label: "Date modified" },
];

export const PAGE_SORT_BY_OPTIONS: {
  key: TPageFiltersSortBy;
  label: string;
}[] = [
  { key: "asc", label: "Ascending" },
  { key: "desc", label: "Descending" },
];

export type TCreatePageModal = {
  isOpen: boolean;
  pageAccess?: EPageAccess;
}

export const DEFAULT_CREATE_PAGE_MODAL_DATA: TCreatePageModal = {
  isOpen: false,
  pageAccess: EPageAccess.PUBLIC,
};
