import { CoreRootStore } from "@/store/root.store";
//
import { IIssuesTimeLineStore, IssuesTimeLineStore } from "./issues-timeline.store";
import { IModulesTimeLineStore, ModulesTimeLineStore } from "./modules-timeline.store";

export interface ITimelineStore {
  issuesTimeLineStore: IIssuesTimeLineStore;
  modulesTimeLineStore: IModulesTimeLineStore;
}

export class TimeLineStore implements ITimelineStore {
  issuesTimeLineStore: IIssuesTimeLineStore;
  modulesTimeLineStore: IModulesTimeLineStore;

  constructor(rootStore: CoreRootStore) {
    this.issuesTimeLineStore = new IssuesTimeLineStore(rootStore);
    this.modulesTimeLineStore = new ModulesTimeLineStore(rootStore);
  }
}
