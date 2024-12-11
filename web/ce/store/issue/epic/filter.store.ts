import { IIssueRootStore } from "@/store/issue/root.store";

export type IProjectEpicsFilter = object;

export class ProjectEpicsFilter {
  // root store
  rootIssueStore: IIssueRootStore;

  constructor(_rootStore: IIssueRootStore) {
    this.rootIssueStore = _rootStore;
  }
}
