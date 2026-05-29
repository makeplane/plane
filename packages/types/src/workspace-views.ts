import type {
  IWorkspaceViewProps,
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  TWorkItemFilterExpression,
} from "./view-props";
import type { EViewAccess } from "./views";

export interface IWorkspaceView {
  id: string;
  access: EViewAccess;
  created_at: Date;
  updated_at: Date;
  is_favorite: boolean;
  created_by: string;
  updated_by: string;
  name: string;
  description: string;
  rich_filters: TWorkItemFilterExpression;
  display_filters: IIssueDisplayFilterOptions;
  display_properties: IIssueDisplayProperties;
  query: any;
  query_data: IWorkspaceViewProps;
  project: string;
  workspace: string;
  is_locked: boolean;
  owned_by: string;
  workspace_detail?: {
    id: string;
    name: string;
    slug: string;
  };
}

export const STATIC_VIEW_TYPES = ["all-issues", "assigned", "created", "subscribed"];

export type TStaticViewTypes = (typeof STATIC_VIEW_TYPES)[number];
