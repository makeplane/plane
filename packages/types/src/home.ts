import type { TLogoProps } from "./common";
import type { TIssuePriorities } from "./issues";

export type TRecentActivityFilterKeys = "all item" | "issue" | "page" | "project" | "workspace_page";
export type THomeWidgetKeys = "quick_links" | "recents" | "my_stickies" | "quick_tutorial" | "new_at_plane";

export type THomeWidgetProps = {
  workspaceSlug: string;
};

export type TPageEntityData = {
  id: string;
  name: string;
  logo_props: TLogoProps;
  project_id?: string;
  owned_by: string;
  project_identifier?: string;
};

export type TProjectEntityData = {
  id: string;
  name: string;
  logo_props: TLogoProps;
  project_members: string[];
  identifier: string;
};

export type TIssueEntityData = {
  id: string;
  name: string;
  state: string;
  priority: TIssuePriorities;
  assignees: string[];
  type: string | null;
  sequence_id: number;
  project_id: string;
  project_identifier: string;
  is_epic: boolean;
};

export type TActivityEntityData = {
  id: string;
  entity_name: "page" | "project" | "issue" | "workspace_page";
  entity_identifier: string;
  visited_at: string;
  entity_data: TPageEntityData | TProjectEntityData | TIssueEntityData;
};

export type TLinkEditableFields = {
  title: string;
  url: string;
};

export type TLink = TLinkEditableFields & {
  created_by_id: string;
  id: string;
  metadata: any;
  workspace_slug: string;

  //need
  created_at: Date;
};

export type TLinkMap = {
  [workspace_slug: string]: TLink;
};

export type TLinkIdMap = {
  [workspace_slug: string]: string[];
};

export type TWidgetEntityData = {
  key: THomeWidgetKeys;
  name: string;
  is_enabled: boolean;
  sort_order: number;
};
