// root store
import { RootStore } from "@/plane-web/store/root.store";
// templates stores
import { IWorkItemTemplateStore, WorkItemTemplateStore } from "./work-item.store";
import { IProjectTemplateStore, ProjectTemplateStore } from "./project.store";

export interface ITemplatesRootStore {
  workItemTemplates: IWorkItemTemplateStore;
  projectTemplates: IProjectTemplateStore;
}

export class TemplatesRootStore implements ITemplatesRootStore {
  workItemTemplates: IWorkItemTemplateStore;
  projectTemplates: IProjectTemplateStore;

  constructor(root: RootStore) {
    this.workItemTemplates = new WorkItemTemplateStore(root);
    this.projectTemplates = new ProjectTemplateStore(root);
  }
}
