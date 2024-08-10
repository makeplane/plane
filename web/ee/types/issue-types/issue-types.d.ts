// types
import { TLogoProps } from "@plane/types";

// Issue Property Option
export type TIssueType = {
  id: string | undefined;
  name: string | undefined;
  description: string | undefined;
  logo_props: TLogoProps | undefined;
  sort_order: number | undefined;
  is_active: boolean | undefined;
  is_default: boolean | undefined;
  issue_exists: boolean | undefined;
  weight: number | undefined;
  project: string | undefined;
  workspace: string | undefined;
  created_at: Date | undefined;
  created_by: string | undefined;
  updated_at: Date | undefined;
  updated_by: string | undefined;
};
