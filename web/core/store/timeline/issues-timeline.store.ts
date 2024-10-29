import { autorun } from "mobx";
// Plane-web
import { BaseTimeLineStore, IBaseTimelineStore } from "@/plane-web/store/timeline/base-timeline.store";
// Store
import { CoreRootStore } from "@/store/root.store";

export interface IIssuesTimeLineStore extends IBaseTimelineStore {
  isDependencyEnabled: boolean;
}

export class IssuesTimeLineStore extends BaseTimeLineStore implements IIssuesTimeLineStore {
  isDependencyEnabled = true;

  constructor(_rootStore: CoreRootStore) {
    super(_rootStore);

    autorun((reaction) => {
      reaction.trace();
      const getIssueById = this.rootStore.issue.issues.getIssueById;
      this.updateBlocks(getIssueById);
    });
  }
}
