// types
import { TLogoProps } from "@plane/types";

// Issue Type
export type TIssueType = {
  id: string | undefined;
  name: string | undefined;
  description: string | undefined;
  logo_props: TLogoProps | undefined;
  is_active: boolean | undefined;
  is_default: boolean | undefined;
  issue_exists: boolean | undefined;
  level: number | undefined;
  project_ids: string[] | undefined;
  workspace: string | undefined;
  created_at: Date | undefined;
  created_by: string | undefined;
  updated_at: Date | undefined;
  updated_by: string | undefined;
};
