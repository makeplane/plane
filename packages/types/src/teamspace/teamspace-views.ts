import { IProjectView } from "../views";

export type TTeamspaceView = IProjectView & {
  project?: string | null;
  team?: string | null;
  is_team_view: boolean;
};

export type TCreateUpdateTeamspaceViewModal = {
  isOpen: boolean;
  teamspaceId: string | undefined;
};
