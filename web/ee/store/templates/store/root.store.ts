// root store
import { RootStore } from "@/plane-web/store/root.store";
// templates stores
import { IWorkItemTemplateStore, WorkItemTemplateStore } from "./work-item.store";

export interface ITemplatesRootStore {
  workItemTemplates: IWorkItemTemplateStore;
}

export class TemplatesRootStore implements ITemplatesRootStore {
  workItemTemplates: IWorkItemTemplateStore;

  constructor(root: RootStore) {
    this.workItemTemplates = new WorkItemTemplateStore(root);
  }
}
