import { IIssueRootStore } from "@/store/issue/root.store";
import { ITeamViewIssuesFilter } from "./filter.store";

export type ITeamViewIssues = object;

export class TeamViewIssues {
  // filter store
  teamViewFilterStore: ITeamViewIssuesFilter;

  constructor(_rootStore: IIssueRootStore, teamViewFilterStore: ITeamViewIssuesFilter) {
    this.teamViewFilterStore = teamViewFilterStore;
  }
}
