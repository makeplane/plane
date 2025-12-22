import { EViewAccess } from "@plane/types";

export const VIEW_ACCESS_SPECIFIERS = [
  { key: EViewAccess.PUBLIC, i18n_label: "common.access.public" as const },
  { key: EViewAccess.PRIVATE, i18n_label: "common.access.private" as const },
];

export const VIEW_SORTING_KEY_OPTIONS = [
  { key: "name", i18n_label: "project_view.sort_by.name" as const },
  { key: "created_at", i18n_label: "project_view.sort_by.created_at" as const },
  { key: "updated_at", i18n_label: "project_view.sort_by.updated_at" as const },
];

export const VIEW_SORT_BY_OPTIONS = [
  { key: "asc", i18n_label: "common.order_by.asc" as const },
  { key: "desc", i18n_label: "common.order_by.desc" as const },
];
