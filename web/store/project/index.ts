import { ProjectsStore } from "./projects.store";
import { ProjectPublishStore } from "./project-publish.store";
import { RootStore } from "store/root.store";

export class ProjectRootStore {
  projects: ProjectsStore;
  publish: ProjectPublishStore;

  constructor(_root: RootStore) {
    this.projects = new ProjectsStore(_root);
    this.publish = new ProjectPublishStore(this);
  }
}
