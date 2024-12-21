// root store
import { RootStore } from "../root.store";
// team stores
import { ITeamCycleStore, TeamCycleStore } from "./team-cycle.store";
import { ITeamFilterStore, TeamFilterStore } from "./team-filter.store";
import { ITeamViewStore, TeamViewStore } from "./team-view.store";
import { ITeamStore, TeamStore } from "./team.store";

export interface ITeamRootStore {
  team: ITeamStore;
  teamFilter: ITeamFilterStore;
  teamCycle: ITeamCycleStore;
  teamView: ITeamViewStore;
}

export class TeamRootStore implements ITeamRootStore {
  team: ITeamStore;
  teamFilter: ITeamFilterStore;
  teamCycle: ITeamCycleStore;
  teamView: ITeamViewStore;

  constructor(root: RootStore) {
    this.teamFilter = new TeamFilterStore(root);
    this.team = new TeamStore(root);
    this.teamCycle = new TeamCycleStore(root);
    this.teamView = new TeamViewStore(root);
  }
}
