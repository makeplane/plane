// types
import { TCreateUpdateTeamModal, TCreateUpdateTeamViewModal } from "@plane/types";
// utils
import { ETeamScope } from "@plane/utils";

export const DEFAULT_CREATE_UPDATE_TEAM_MODAL_DATA: TCreateUpdateTeamModal = {
  isOpen: false,
  teamId: undefined,
};

export const DEFAULT_CREATE_UPDATE_TEAM_VIEW_MODAL_DATA: TCreateUpdateTeamViewModal = {
  isOpen: false,
  teamId: undefined,
};

export const TEAM_SCOPE_MAP: Record<ETeamScope, { key: ETeamScope; label: string }> = {
  [ETeamScope.YOUR_TEAMS]: { key: ETeamScope.YOUR_TEAMS, label: "Your teams" },
  [ETeamScope.ALL_TEAMS]: { key: ETeamScope.ALL_TEAMS, label: "All teams" },
};
