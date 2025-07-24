import { makeObservable } from "mobx";
import { TIssueServiceType } from "@plane/types";
import {
  IssueDetail as IssueDetailCore,
  IIssueDetail as IIssueDetailCore,
} from "@/store/issue/issue-details/root.store";
import { IIssueRootStore } from "@/store/issue/root.store";

export type IIssueDetail = IIssueDetailCore;

export class IssueDetail extends IssueDetailCore {
  constructor(rootStore: IIssueRootStore, serviceType: TIssueServiceType) {
    super(rootStore, serviceType);
    makeObservable(this, {
      // observables
    });
  }
}
