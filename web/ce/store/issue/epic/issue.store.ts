import { IIssueRootStore } from "@/store/issue/root.store";
import { IProjectEpicsFilter } from "./filter.store";

export type IProjectEpics = object;

export class ProjectEpics {
  // filter store
  issueFilterStore: IProjectEpicsFilter;

  constructor(_rootStore: IIssueRootStore, issueFilterStore: IProjectEpicsFilter) {
    this.issueFilterStore = issueFilterStore;
  }
}
