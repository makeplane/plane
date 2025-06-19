import { TLogoProps } from "../common";
import { EPageAccess } from "../enums";
import { TPageExtended } from "./extended";

export type TPage = {
  access: EPageAccess | undefined;
  archived_at: string | null | undefined;
  color: string | undefined;
  created_at: Date | undefined;
  created_by: string | undefined;
  description_html: string | undefined;
  is_description_empty: boolean;
  id: string | undefined;
  is_favorite: boolean;
  is_locked: boolean;
  label_ids: string[] | undefined;
  name: string | undefined;
  owned_by: string | undefined;
  parent_id: string | null | undefined;
  project_ids?: string[] | undefined;
  updated_at: Date | undefined;
  updated_by: string | undefined;
  workspace: string | undefined;
  logo_props: TLogoProps | undefined;
  deleted_at: Date | undefined;
  moved_to_page: string | null;
  moved_to_project: string | null;
} & TPageExtended;

export type TSubPageDetails = Pick<
  TPage,
  "id" | "name" | "access" | "logo_props" | "is_locked" | "archived_at" | "parent_id"
>;

// page filters
export type TPageNavigationTabs = "public" | "private" | "archived" | "shared";

export type TPageFiltersSortKey = "name" | "created_at" | "updated_at" | "opened_at";

export type TPageFiltersSortBy = "asc" | "desc";

export type TPageFilterProps = {
  created_at?: string[] | null;
  created_by?: string[] | null;
  favorites?: boolean;
  labels?: string[] | null;
};

export type TPageFilters = {
  searchQuery: string;
  sortKey: TPageFiltersSortKey;
  sortBy: TPageFiltersSortBy;
  filters?: TPageFilterProps;
};

export type TPageEmbedType = "mention" | "issue";

export type TPageVersion = {
  created_at: string;
  created_by: string;
  deleted_at: string | null;
  description_binary?: string | null;
  description_html?: string | null;
  description_json?: object;
  id: string;
  last_saved_at: string;
  owned_by: string;
  parent_id: string | null | undefined;
  page: string;
  updated_at: string;
  updated_by: string;
  workspace: string;
  sub_pages_data: Partial<TPage>[];
};

export type TDocumentPayload = {
  description_binary: string;
  description_html: string;
  description: object;
  name?: string;
};

export type TWebhookConnectionQueryParams = {
  documentType: "project_page" | "teamspace_page" | "workspace_page";
  projectId?: string;
  teamspaceId?: string;
  workspaceSlug: string;
};

export type TPublicPageResponse = Pick<
  TPage,
  | "created_at"
  | "description_html"
  | "id"
  | "logo_props"
  | "name"
  | "updated_at"
  | "archived_at"
  | "deleted_at"
  | "anchor"
  | "parent_id"
>;

export type TPageDragPayload = {
  id: string;
  parentId: string | null;
};

export type TIssuePage = Pick<TPage, "name" | "logo_props"> & {
  id: string;
  is_global: boolean;
  description_stripped: string;
  created_by?: string;
  updated_at?: string;
};
