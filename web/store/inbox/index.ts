import { makeAutoObservable } from "mobx";
// types
import { RootStore } from "store/root.store";
import { IInboxIssuesStore, InboxIssuesStore } from "./inbox_issue.store";
import { IInboxFiltersStore, InboxFiltersStore } from "./inbox_filter.store";
import { IInboxStore, InboxStore } from "./inbox.store";

export interface IInboxRootStore {
  // sub-stores
  inbox: IInboxStore;
  inboxFilters: IInboxFiltersStore;
  inboxIssues: IInboxIssuesStore;
}

export class InboxRootStore implements IInboxRootStore {
  // root store
  rootStore: RootStore;
  // sub-stores
  inbox: IInboxStore;
  inboxFilters: IInboxFiltersStore;
  inboxIssues: IInboxIssuesStore;

  constructor(_rootStore: RootStore) {
    makeAutoObservable(this, {});

    // root store
    this.rootStore = _rootStore;
    // sub-stores
    this.inbox = new InboxStore(_rootStore);
    this.inboxFilters = new InboxFiltersStore(_rootStore);
    this.inboxIssues = new InboxIssuesStore(_rootStore);
  }
}
