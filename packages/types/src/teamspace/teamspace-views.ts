import { IProjectView } from "../views";

export type TTeamspaceView = IProjectView & {
  project?: string | null;
  team?: string | null;
};

export type TCreateUpdateTeamspaceViewModal = {
  isOpen: boolean;
  teamspaceId: string | undefined;
};
