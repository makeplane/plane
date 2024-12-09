import { RootStore } from "@/plane-web/store/root.store";
import { IIssuesTimeLineStore, IssuesTimeLineStore } from "@/store/timeline/issues-timeline.store";
import { IModulesTimeLineStore, ModulesTimeLineStore } from "@/store/timeline/modules-timeline.store";
import { IProjectsTimeLineStore, ProjectsTimeLineStore } from "./project-timeline.store";

export interface ITimelineStore {
  issuesTimeLineStore: IIssuesTimeLineStore;
  modulesTimeLineStore: IModulesTimeLineStore;
  projectTimeLineStore: IProjectsTimeLineStore;
}

export class TimeLineStore implements ITimelineStore {
  issuesTimeLineStore: IIssuesTimeLineStore;
  modulesTimeLineStore: IModulesTimeLineStore;
  projectTimeLineStore: IProjectsTimeLineStore;

  constructor(rootStore: RootStore) {
    this.issuesTimeLineStore = new IssuesTimeLineStore(rootStore);
    this.modulesTimeLineStore = new ModulesTimeLineStore(rootStore);
    this.projectTimeLineStore = new ProjectsTimeLineStore(rootStore);
  }
}
