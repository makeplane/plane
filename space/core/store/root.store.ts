import { enableStaticRendering } from "mobx-react";
// store imports
import { IInstanceStore, InstanceStore } from "@/store/instance.store";
import { IssueDetailStore, IIssueDetailStore } from "@/store/issue-detail.store";
import { IssueStore, IIssueStore } from "@/store/issue.store";
import { IUserStore, UserStore } from "@/store/user.store";
import { CycleStore, ICycleStore } from "./cycle.store";
import { IssueFilterStore, IIssueFilterStore } from "./issue-filters.store";
import { IIssueLabelStore, LabelStore } from "./label.store";
import { IIssueMemberStore, MemberStore } from "./members.store";
import { IMentionsStore, MentionsStore } from "./mentions.store";
import { IIssueModuleStore, ModuleStore } from "./module.store";
import { IPublishListStore, PublishListStore } from "./publish/publish_list.store";
import { IStateStore, StateStore } from "./state.store";

enableStaticRendering(typeof window === "undefined");

export class CoreRootStore {
  instance: IInstanceStore;
  user: IUserStore;
  issue: IIssueStore;
  issueDetail: IIssueDetailStore;
  mentionStore: IMentionsStore;
  state: IStateStore;
  label: IIssueLabelStore;
  module: IIssueModuleStore;
  member: IIssueMemberStore;
  cycle: ICycleStore;
  issueFilter: IIssueFilterStore;
  publishList: IPublishListStore;

  constructor() {
    this.instance = new InstanceStore(this);
    this.user = new UserStore(this);
    this.issue = new IssueStore(this);
    this.issueDetail = new IssueDetailStore(this);
    this.mentionStore = new MentionsStore(this);
    this.state = new StateStore(this);
    this.label = new LabelStore(this);
    this.module = new ModuleStore(this);
    this.member = new MemberStore(this);
    this.cycle = new CycleStore(this);
    this.issueFilter = new IssueFilterStore(this);
    this.publishList = new PublishListStore(this);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hydrate = (data: any) => {
    if (!data) return;
    this.instance.hydrate(data?.instance || undefined);
    this.user.hydrate(data?.user || undefined);
  };

  reset() {
    localStorage.setItem("theme", "system");
    this.instance = new InstanceStore(this);
    this.user = new UserStore(this);
    this.issue = new IssueStore(this);
    this.issueDetail = new IssueDetailStore(this);
    this.mentionStore = new MentionsStore(this);
    this.state = new StateStore(this);
    this.label = new LabelStore(this);
    this.module = new ModuleStore(this);
    this.member = new MemberStore(this);
    this.cycle = new CycleStore(this);
    this.issueFilter = new IssueFilterStore(this);
    this.publishList = new PublishListStore(this);
  }
}
