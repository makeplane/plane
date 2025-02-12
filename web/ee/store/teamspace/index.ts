// root store
import { RootStore } from "../root.store";
// teamspace stores
import { ITeamspacePageStore, TeamspacePageStore } from "./pages/teamspace-page.store";
import { ITeamspaceAnalyticsStore, TeamspaceAnalyticsStore } from "./teamspace-analytics.store";
import { ITeamspaceCycleStore, TeamspaceCycleStore } from "./teamspace-cycle.store";
import { ITeamspaceFilterStore, TeamspaceFilterStore } from "./teamspace-filter.store";
import { ITeamspaceUpdatesStore, TeamspaceUpdatesStore } from "./teamspace-updates.store";
import { ITeamspaceViewStore, TeamspaceViewStore } from "./teamspace-view.store";
import { ITeamspaceStore, TeamspaceStore } from "./teamspace.store";

export interface ITeamspaceRootStore {
  teamspaces: ITeamspaceStore;
  teamspaceFilter: ITeamspaceFilterStore;
  teamspaceUpdates: ITeamspaceUpdatesStore;
  teamspaceAnalytics: ITeamspaceAnalyticsStore;
  teamspaceCycle: ITeamspaceCycleStore;
  teamspaceView: ITeamspaceViewStore;
  teamspacePage: ITeamspacePageStore;
}

export class TeamspaceRootStore implements ITeamspaceRootStore {
  teamspaces: ITeamspaceStore;
  teamspaceFilter: ITeamspaceFilterStore;
  teamspaceUpdates: ITeamspaceUpdatesStore;
  teamspaceAnalytics: ITeamspaceAnalyticsStore;
  teamspaceCycle: ITeamspaceCycleStore;
  teamspaceView: ITeamspaceViewStore;
  teamspacePage: ITeamspacePageStore;

  constructor(root: RootStore) {
    this.teamspaces = new TeamspaceStore(root);
    this.teamspaceFilter = new TeamspaceFilterStore(root);
    this.teamspaceUpdates = new TeamspaceUpdatesStore(root);
    this.teamspaceAnalytics = new TeamspaceAnalyticsStore(root);
    this.teamspaceCycle = new TeamspaceCycleStore(root);
    this.teamspaceView = new TeamspaceViewStore(root);
    this.teamspacePage = new TeamspacePageStore(root);
  }
}
