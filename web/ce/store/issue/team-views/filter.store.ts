import { IIssueRootStore } from "@/store/issue/root.store";

export type ITeamViewIssuesFilter = object;

export class TeamViewIssuesFilter {
  // root store
  rootIssueStore: IIssueRootStore;

  constructor(_rootStore: IIssueRootStore) {
    this.rootIssueStore = _rootStore;
  }
}
