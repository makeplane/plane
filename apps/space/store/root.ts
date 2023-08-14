// mobx lite
import { enableStaticRendering } from "mobx-react-lite";
// store imports
import UserStore from "./user";
import ThemeStore from "./theme";
import IssueStore from "./issue";
import ProjectStore from "./project";
// types
import { IIssueStore, IProjectStore, IThemeStore, IUserStore } from "./types";

enableStaticRendering(typeof window === "undefined");

export class RootStore {
  user: IUserStore;
  theme: IThemeStore;
  issue: IIssueStore;
  project: IProjectStore;

  constructor() {
    this.user = new UserStore(this);
    this.theme = new ThemeStore(this);
    this.issue = new IssueStore(this);
    this.project = new ProjectStore(this);
  }
}
