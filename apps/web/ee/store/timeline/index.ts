import { RootStore } from "@/plane-web/store/root.store";
import { IBaseTimelineStore } from "@/plane-web/store/timeline/base-timeline.store";
import { IIssuesTimeLineStore, IssuesTimeLineStore } from "@/store/timeline/issues-timeline.store";
import { IModulesTimeLineStore, ModulesTimeLineStore } from "@/store/timeline/modules-timeline.store";
import { GroupedTimeLineStore } from "./grouped-timeline.store";
import { IProjectsTimeLineStore, ProjectsTimeLineStore } from "./project-timeline.store";

export interface ITimelineStore {
  issuesTimeLineStore: IIssuesTimeLineStore;
  modulesTimeLineStore: IModulesTimeLineStore;
  projectTimeLineStore: IProjectsTimeLineStore;
  groupedTimeLineStore: IBaseTimelineStore;
}

export class TimeLineStore implements ITimelineStore {
  issuesTimeLineStore: IIssuesTimeLineStore;
  modulesTimeLineStore: IModulesTimeLineStore;
  projectTimeLineStore: IProjectsTimeLineStore;
  groupedTimeLineStore: IBaseTimelineStore;

  constructor(rootStore: RootStore) {
    this.issuesTimeLineStore = new IssuesTimeLineStore(rootStore);
    this.modulesTimeLineStore = new ModulesTimeLineStore(rootStore);
    this.projectTimeLineStore = new ProjectsTimeLineStore(rootStore);
    this.groupedTimeLineStore = new GroupedTimeLineStore(rootStore);
  }
}
