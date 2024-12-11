import { IIssueRootStore } from "@/store/issue/root.store";
import { ITeamIssuesFilter } from "./filter.store";

export type ITeamIssues = object;

export class TeamIssues {
  // filter store
  teamIssueFilterStore: ITeamIssuesFilter;

  constructor(_rootStore: IIssueRootStore, teamIssueFilterStore: ITeamIssuesFilter) {
    this.teamIssueFilterStore = teamIssueFilterStore;
  }
}
