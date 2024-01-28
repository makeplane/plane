// types
import { RootStore } from "store/root.store";
import { IInbox, Inbox } from "./inbox.store";
import { IInboxIssue, InboxIssue } from "./inbox_issue.store";
import { IInboxFilter, InboxFilter } from "./inbox_filter.store";

export interface IInboxRootStore {
  rootStore: RootStore;
  inbox: IInbox;
  inboxIssue: IInboxIssue;
  inboxFilter: IInboxFilter;
}

export class InboxRootStore implements IInboxRootStore {
  rootStore: RootStore;
  inbox: IInbox;
  inboxIssue: IInboxIssue;
  inboxFilter: IInboxFilter;

  constructor(_rootStore: RootStore) {
    this.rootStore = _rootStore;
    this.inbox = new Inbox(_rootStore);
    this.inboxIssue = new InboxIssue(_rootStore);
    this.inboxFilter = new InboxFilter(_rootStore);
  }
}
