import { TLogoProps } from "@plane/types";

export type TTeam = {
  id: string;
  name: string;
  description_json: object | undefined;
  description_html: string | undefined;
  description_stripped: string | undefined;
  description_binary: string | undefined;
  logo_props: TLogoProps;
  lead_id: string | undefined;
  member_ids: string[] | undefined;
  project_ids: string[] | undefined;
  workspace: string;
  // timestamps
  created_at: string;
  updated_at: string;
  // user
  created_by: string;
  updated_by: string;
};

export type TTeamMember = {
  id: string;
  team_space: string;
  member: string;
  workspace: string;
  sort_order: number;
  // timestamps
  created_at: string;
  updated_at: string;
  // user
  created_by: string;
  updated_by: string;
};

export type TTeamEntities = {
  linked_entities: {
    projects: number;
    issues: number;
    cycles: number;
    pages: number;
    views: number;
    total: number;
  };
  team_entities: {
    pages: number;
    views: number;
    total: number;
  };
};

export type TTeamScope = "teams" | "projects";

export type TCreateUpdateTeamModal = {
  isOpen: boolean;
  teamId: string | undefined;
};
