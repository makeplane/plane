import { enableStaticRendering } from "mobx-react-lite";
// store imports
import { IInstanceStore, InstanceStore } from "@/store/instance.store";
import { IssueDetailStore, IIssueDetailStore } from "@/store/issue-detail.store";
import { IssueStore, IIssueStore } from "@/store/issue.store";
import { IProjectStore, ProjectStore } from "@/store/project.store";
import { IUserStore, UserStore } from "@/store/user.store";
import { IssueFilterStore, IIssueFilterStore } from "./issue-filters.store";
import { IMentionsStore, MentionsStore } from "./mentions.store";

enableStaticRendering(typeof window === "undefined");

export class RootStore {
  instance: IInstanceStore;
  user: IUserStore;
  project: IProjectStore;
  issue: IIssueStore;
  issueDetail: IIssueDetailStore;
  mentionStore: IMentionsStore;
  issueFilter: IIssueFilterStore;

  constructor() {
    this.instance = new InstanceStore(this);
    this.user = new UserStore(this);
    this.project = new ProjectStore(this);
    this.issue = new IssueStore(this);
    this.issueDetail = new IssueDetailStore(this);
    this.mentionStore = new MentionsStore(this);
    this.issueFilter = new IssueFilterStore(this);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hydrate = (data: any) => {
    if (!data) return;
    this.instance.hydrate(data?.instance || undefined);
    this.user.hydrate(data?.user || undefined);
  };

  reset = () => {
    localStorage.setItem("theme", "system");
    this.instance = new InstanceStore(this);
    this.user = new UserStore(this);
    this.project = new ProjectStore(this);
    this.issue = new IssueStore(this);
    this.issueDetail = new IssueDetailStore(this);
    this.mentionStore = new MentionsStore(this);
    this.issueFilter = new IssueFilterStore(this);
  };
}
