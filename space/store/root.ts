// mobx lite
import { enableStaticRendering } from "mobx-react-lite";
// store imports
import UserStore from "./user";
import IssueStore, { IIssueStore } from "./issue";
import ProjectStore, { IProjectStore } from "./project";
import IssueDetailStore, { IIssueDetailStore } from "./issue_details";
import { IMentionsStore, MentionsStore } from "./mentions.store";
import { IIssuesFilterStore, IssuesFilterStore } from "./issues/issue-filters.store";

enableStaticRendering(typeof window === "undefined");

export class RootStore {
  user: UserStore;
  issue: IIssueStore;
  issueDetails: IIssueDetailStore;
  project: IProjectStore;
  mentionsStore: IMentionsStore;
  issuesFilter: IIssuesFilterStore;

  constructor() {
    this.user = new UserStore(this);
    this.issue = new IssueStore(this);
    this.project = new ProjectStore(this);
    this.issueDetails = new IssueDetailStore(this);
    this.mentionsStore = new MentionsStore(this);
    this.issuesFilter = new IssuesFilterStore(this);
  }
}
