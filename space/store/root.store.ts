// mobx lite
import { enableStaticRendering } from "mobx-react-lite";
// store imports
import { IInstanceStore, InstanceStore } from "@/store/instance.store";
import { IProjectStore, ProjectStore } from "@/store/project";
import { IUserStore, UserStore } from "@/store/user";
import { IProfileStore, ProfileStore } from "@/store/user/profile.store";

import IssueStore, { IIssueStore } from "./issue";
import IssueDetailStore, { IIssueDetailStore } from "./issue_details";
import { IIssuesFilterStore, IssuesFilterStore } from "./issues/issue-filters.store";
import { IMentionsStore, MentionsStore } from "./mentions.store";

enableStaticRendering(typeof window === "undefined");

export class RootStore {
  instance: IInstanceStore;
  user: IUserStore;
  profile: IProfileStore;
  project: IProjectStore;

  issue: IIssueStore;
  issueDetails: IIssueDetailStore;
  mentionsStore: IMentionsStore;
  issuesFilter: IIssuesFilterStore;

  constructor() {
    this.instance = new InstanceStore(this);
    this.user = new UserStore(this);
    this.profile = new ProfileStore(this);
    this.project = new ProjectStore(this);

    this.issue = new IssueStore(this);
    this.issueDetails = new IssueDetailStore(this);
    this.mentionsStore = new MentionsStore(this);
    this.issuesFilter = new IssuesFilterStore(this);
  }

  resetOnSignOut = () => {
    localStorage.setItem("theme", "system");

    this.instance = new InstanceStore(this);
    this.user = new UserStore(this);
    this.profile = new ProfileStore(this);
    this.project = new ProjectStore(this);

    this.issue = new IssueStore(this);
    this.issueDetails = new IssueDetailStore(this);
    this.mentionsStore = new MentionsStore(this);
    this.issuesFilter = new IssuesFilterStore(this);
  };
}
