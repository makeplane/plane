export enum EViewAccess {
  PRIVATE,
  PUBLIC,
}

export const VIEW_ACCESS_SPECIFIERS: {
  key: EViewAccess;
  label: string;
}[] = [
  { key: EViewAccess.PUBLIC, label: "project_view.access.public" },
  { key: EViewAccess.PRIVATE, label: "project_view.access.private" },
];

export const VIEW_SORTING_KEY_OPTIONS = [
  { key: "name", label: "project_view.sort_by.name" },
  { key: "created_at", label: "project_view.sort_by.created_at" },
  { key: "updated_at", label: "project_view.sort_by.updated_at" },
];

export const VIEW_SORT_BY_OPTIONS = [
  { key: "asc", label: "common.order_by.asc" },
  { key: "desc", label: "common.order_by.desc" },
];
