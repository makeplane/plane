import { EViewAccess } from "@plane/types";

export const VIEW_ACCESS_SPECIFIERS: {
  key: EViewAccess;
  i18n_label: string;
}[] = [
  { key: EViewAccess.PUBLIC, i18n_label: "common.access.public" },
  { key: EViewAccess.PRIVATE, i18n_label: "common.access.private" },
];

export const VIEW_SORTING_KEY_OPTIONS = [
  { key: "name", i18n_label: "project_view.sort_by.name" },
  { key: "created_at", i18n_label: "project_view.sort_by.created_at" },
  { key: "updated_at", i18n_label: "project_view.sort_by.updated_at" },
];

export const VIEW_SORT_BY_OPTIONS = [
  { key: "asc", i18n_label: "common.order_by.asc" },
  { key: "desc", i18n_label: "common.order_by.desc" },
];
