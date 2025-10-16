import { autorun } from "mobx";
// Plane-web
import type { RootStore } from "@/plane-web/store/root.store";
import type { IBaseTimelineStore } from "@/plane-web/store/timeline/base-timeline.store";
import { BaseTimeLineStore } from "@/plane-web/store/timeline/base-timeline.store";

export interface IIssuesTimeLineStore extends IBaseTimelineStore {
  isDependencyEnabled: boolean;
}

export class IssuesTimeLineStore extends BaseTimeLineStore implements IIssuesTimeLineStore {
  constructor(_rootStore: RootStore) {
    super(_rootStore);

    autorun(() => {
      const getIssueById = this.rootStore.issue.issues.getIssueById;
      this.updateBlocks(getIssueById);
    });
  }
}
