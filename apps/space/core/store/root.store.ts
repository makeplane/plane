import { enableStaticRendering } from "mobx-react";
// store imports
import type { IInstanceStore } from "@/store/instance.store";
import { InstanceStore } from "@/store/instance.store";
import type { IIssueDetailStore } from "@/store/issue-detail.store";
import { IssueDetailStore } from "@/store/issue-detail.store";
import type { IIssueStore } from "@/store/issue.store";
import { IssueStore } from "@/store/issue.store";
import type { IUserStore } from "@/store/user.store";
import { UserStore } from "@/store/user.store";
import type { ICycleStore } from "./cycle.store";
import { CycleStore } from "./cycle.store";
import type { IIssueFilterStore } from "./issue-filters.store";
import { IssueFilterStore } from "./issue-filters.store";
import type { IIssueLabelStore } from "./label.store";
import { LabelStore } from "./label.store";
import type { IIssueMemberStore } from "./members.store";
import { MemberStore } from "./members.store";
import type { IIssueModuleStore } from "./module.store";
import { ModuleStore } from "./module.store";
import type { IPublishListStore } from "./publish/publish_list.store";
import { PublishListStore } from "./publish/publish_list.store";
import type { IStateStore } from "./state.store";
import { StateStore } from "./state.store";

enableStaticRendering(typeof window === "undefined");

export class CoreRootStore {
  instance: IInstanceStore;
  user: IUserStore;
  issue: IIssueStore;
  issueDetail: IIssueDetailStore;
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
    this.state = new StateStore(this);
    this.label = new LabelStore(this);
    this.module = new ModuleStore(this);
    this.member = new MemberStore(this);
    this.cycle = new CycleStore(this);
    this.issueFilter = new IssueFilterStore(this);
    this.publishList = new PublishListStore(this);
  }
}
