// root store
import { RootStore } from "@/plane-web/store/root.store";
// templates stores
import { ITemplateHelperStore, TemplateHelperStore } from "./helper.store";
import { IPageTemplateStore, PageTemplateStore } from "./page.store";
import { IProjectTemplateStore, ProjectTemplateStore } from "./project.store";
import { IWorkItemTemplateStore, WorkItemTemplateStore } from "./work-item.store";

export interface ITemplatesRootStore {
  projectTemplates: IProjectTemplateStore;
  workItemTemplates: IWorkItemTemplateStore;
  pageTemplates: IPageTemplateStore;
  templateHelper: ITemplateHelperStore;
}

export class TemplatesRootStore implements ITemplatesRootStore {
  projectTemplates: IProjectTemplateStore;
  workItemTemplates: IWorkItemTemplateStore;
  pageTemplates: IPageTemplateStore;
  templateHelper: ITemplateHelperStore;

  constructor(root: RootStore) {
    this.projectTemplates = new ProjectTemplateStore(root);
    this.workItemTemplates = new WorkItemTemplateStore(root);
    this.pageTemplates = new PageTemplateStore(root);
    this.templateHelper = new TemplateHelperStore(root);
  }
}
