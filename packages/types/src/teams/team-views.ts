import { IProjectView } from "../views";

export type TTeamView = IProjectView & {
  project?: string | null;
  team?: string | null;
  is_team_view: boolean;
};

export type TCreateUpdateTeamViewModal = {
  isOpen: boolean;
  teamId: string | undefined;
};
