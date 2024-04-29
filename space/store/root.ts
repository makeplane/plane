// mobx lite
import { enableStaticRendering } from "mobx-react-lite";
// store imports
import { InstanceStore } from "./instance.store";
import IssueStore, { IIssueStore } from "./issue";
import IssueDetailStore, { IIssueDetailStore } from "./issue_details";
import { IIssuesFilterStore, IssuesFilterStore } from "./issues/issue-filters.store";
import { IMentionsStore, MentionsStore } from "./mentions.store";
import ProfileStore from "./profile";
import ProjectStore, { IProjectStore } from "./project";
import UserStore from "./user";

enableStaticRendering(typeof window === "undefined");

export class RootStore {
  instanceStore: InstanceStore;
  user: UserStore;
  profile: ProfileStore;
  issue: IIssueStore;
  issueDetails: IIssueDetailStore;
  project: IProjectStore;
  mentionsStore: IMentionsStore;
  issuesFilter: IIssuesFilterStore;

  constructor() {
    this.instanceStore = new InstanceStore(this);
    this.user = new UserStore(this);
    this.profile = new ProfileStore(this);
    this.issue = new IssueStore(this);
    this.project = new ProjectStore(this);
    this.issueDetails = new IssueDetailStore(this);
    this.mentionsStore = new MentionsStore(this);
    this.issuesFilter = new IssuesFilterStore(this);
  }
}
