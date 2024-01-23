// types
import { RootStore } from "store/root.store";
import { IInboxStore, InboxStore } from "./inbox.store";
import { IInboxIssuesStore, InboxIssuesStore } from "./inbox_issue.store";
import { IInboxFiltersStore, InboxFiltersStore } from "./inbox_filter.store";

export interface IInboxRootStore {
  rootStore: RootStore;
  inbox: IInboxStore;
  inboxIssues: IInboxIssuesStore;
  inboxFilters: IInboxFiltersStore;
}

export class InboxRootStore implements IInboxRootStore {
  rootStore: RootStore;
  inbox: IInboxStore;
  inboxIssues: IInboxIssuesStore;
  inboxFilters: IInboxFiltersStore;

  constructor(_rootStore: RootStore) {
    this.rootStore = _rootStore;
    this.inbox = new InboxStore(_rootStore);
    this.inboxIssues = new InboxIssuesStore(_rootStore);
    this.inboxFilters = new InboxFiltersStore(_rootStore);
  }
}
