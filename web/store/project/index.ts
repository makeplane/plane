import { RootStore } from "@/store/root.store";
import { IProjectPublishStore, ProjectPublishStore } from "./project-publish.store";
import { IProjectStore, ProjectStore } from "./project.store";
import { IProjectFilterStore, ProjectFilterStore } from "./project_filter.store";

export interface IProjectRootStore {
  project: IProjectStore;
  projectFilter: IProjectFilterStore;
  publish: IProjectPublishStore;
}

export class ProjectRootStore {
  project: IProjectStore;
  projectFilter: IProjectFilterStore;
  publish: IProjectPublishStore;

  constructor(_root: RootStore) {
    this.project = new ProjectStore(_root);
    this.projectFilter = new ProjectFilterStore(_root);
    this.publish = new ProjectPublishStore(this);
  }
}
