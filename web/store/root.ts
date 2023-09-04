// mobx lite
import { enableStaticRendering } from "mobx-react-lite";
// store imports
import UserStore from "./user";
import ThemeStore from "./theme";
import IssuesStore from "./issues";
import ProjectPublishStore, { IProjectPublishStore } from "./project-publish";
import KanbanStore from "./kanban";

enableStaticRendering(typeof window === "undefined");

export class RootStore {
  user;
  theme;
  projectPublish: IProjectPublishStore;
  issues: IssuesStore;
  kanban: KanbanStore;

  constructor() {
    this.user = new UserStore(this);
    this.theme = new ThemeStore(this);
    this.projectPublish = new ProjectPublishStore(this);
    this.issues = new IssuesStore(this);
    this.kanban = new KanbanStore(this);
  }
}
