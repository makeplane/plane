// local types
import { TLogoProps } from "../common";

export type TDashboardLevel = "workspace";

export type TDashboard = {
  created_at: Date | undefined;
  created_by: string | undefined;
  id: string | undefined;
  is_favorite: boolean | undefined;
  logo_props: TLogoProps | undefined;
  name: string | undefined;
  owned_by: string | undefined;
  project_ids: string[] | undefined;
  updated_at: Date | undefined;
  updated_by: string | undefined;
  workspace: string | undefined;
};
