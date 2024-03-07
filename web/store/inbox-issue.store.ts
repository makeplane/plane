import { makeObservable, observable } from "mobx";
// types
import { TIssue, TInboxIssue } from "@plane/types";

export class InboxIssueStore {
  id: string | undefined;
  status: number | undefined;
  issue: Partial<TIssue> = {};

  constructor(data: TInboxIssue) {
    makeObservable(this, {
      id: observable.ref,
      status: observable.ref,
      issue: observable,
    });
    this.id = data?.id || undefined;
    this.status = data?.status || undefined;
    this.issue = data?.issue || {};
  }
}
