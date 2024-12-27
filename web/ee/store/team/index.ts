// root store
import { RootStore } from "../root.store";
// team stores
import { ITeamPageStore, TeamPageStore } from "./pages/team-page.store";
import { ITeamCycleStore, TeamCycleStore } from "./team-cycle.store";
import { ITeamFilterStore, TeamFilterStore } from "./team-filter.store";
import { ITeamUpdatesStore, TeamUpdatesStore } from "./team-updates.store";
import { ITeamViewStore, TeamViewStore } from "./team-view.store";
import { ITeamStore, TeamStore } from "./team.store";

export interface ITeamRootStore {
  team: ITeamStore;
  teamFilter: ITeamFilterStore;
  teamUpdates: ITeamUpdatesStore;
  teamCycle: ITeamCycleStore;
  teamView: ITeamViewStore;
  teamPage: ITeamPageStore;
}

export class TeamRootStore implements ITeamRootStore {
  team: ITeamStore;
  teamFilter: ITeamFilterStore;
  teamUpdates: ITeamUpdatesStore;
  teamCycle: ITeamCycleStore;
  teamView: ITeamViewStore;
  teamPage: ITeamPageStore;

  constructor(root: RootStore) {
    this.team = new TeamStore(root);
    this.teamFilter = new TeamFilterStore(root);
    this.teamUpdates = new TeamUpdatesStore(root);
    this.teamCycle = new TeamCycleStore(root);
    this.teamView = new TeamViewStore(root);
    this.teamPage = new TeamPageStore(root);
  }
}
