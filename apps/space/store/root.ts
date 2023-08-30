// mobx lite
import { enableStaticRendering } from "mobx-react-lite";
// store imports
import UserStore from "./user";
import ThemeStore from "./theme";
import IssueStore, { IIssueStore } from "./issue";
import ProjectStore, { IProjectStore } from "./project";
import IssueDetailStore, { IIssueDetailStore } from "./issue_details";
// types
import { IThemeStore } from "../types";

enableStaticRendering(typeof window === "undefined");

export class RootStore {
  user: UserStore;
  theme: IThemeStore;
  issue: IIssueStore;
  issueDetails: IIssueDetailStore;
  project: IProjectStore;

  constructor() {
    this.user = new UserStore(this);
    this.theme = new ThemeStore(this);
    this.issue = new IssueStore(this);
    this.project = new ProjectStore(this);
    this.issueDetails = new IssueDetailStore(this);
  }
}
