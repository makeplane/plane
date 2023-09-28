// mobx lite
import { enableStaticRendering } from "mobx-react-lite";
// store imports
import UserStore from "./user";
import ThemeStore from "./theme";
import ProjectStore, { IProjectStore } from "./project";
import ProjectPublishStore, { IProjectPublishStore } from "./project-publish";
import IssuesStore from "./issues";
import DraftIssuesStore from "./draft-issue";
import LocaleStore from "./locale";

enableStaticRendering(typeof window === "undefined");

export class RootStore {
  user;
  theme;
  locale;
  project: IProjectStore;
  projectPublish: IProjectPublishStore;
  issues: IssuesStore;
  draftIssuesStore: DraftIssuesStore;

  constructor() {
    this.user = new UserStore(this);
    this.theme = new ThemeStore(this);
    this.locale = new LocaleStore(this);
    this.project = new ProjectStore(this);
    this.projectPublish = new ProjectPublishStore(this);
    this.issues = new IssuesStore(this);
    this.draftIssuesStore = new DraftIssuesStore(this);
  }
}
