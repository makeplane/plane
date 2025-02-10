import { EViewAccess } from "@plane/constants";
import {
  IWorkspaceViewProps,
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
} from "./view-props";

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
  filters: IIssueIIFilterOptions;
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

export type TStaticViewTypes =
  | "all-issues"
  | "assigned"
  | "created"
  | "subscribed";
