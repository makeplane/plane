import { IIssueRootStore } from "@/store/issue/root.store";

export type ITeamIssuesFilter = object;

export class TeamIssuesFilter {
  // root store
  rootIssueStore: IIssueRootStore;

  constructor(_rootStore: IIssueRootStore) {
    this.rootIssueStore = _rootStore;
  }
}
