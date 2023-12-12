import { IProjectsStore, ProjectsStore } from "./projects.store";
import { IProjectPublishStore, ProjectPublishStore } from "./project-publish.store";
import { RootStore } from "store/root.store";

export interface IProjectRootStore {
  projects: IProjectsStore;
  publish: IProjectPublishStore;
}

export class ProjectRootStore {
  projects: IProjectsStore;
  publish: IProjectPublishStore;

  constructor(_root: RootStore) {
    this.projects = new ProjectsStore(_root);
    this.publish = new ProjectPublishStore(this);
  }
}
