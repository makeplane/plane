import { autorun } from "mobx";
// Store
import { RootStore } from "@/plane-web/store/root.store";
import { BaseTimeLineStore, IBaseTimelineStore } from "ce/store/timeline/base-timeline.store";

export interface IProjectsTimeLineStore extends IBaseTimelineStore {
  isDependencyEnabled: boolean;
}

export class ProjectsTimeLineStore extends BaseTimeLineStore implements IProjectsTimeLineStore {
  constructor(_rootStore: RootStore) {
    super(_rootStore);

    autorun((reaction) => {
      reaction.trace();
      const getProjectById = this.rootStore.projectRoot.project.getProjectById;
      this.updateBlocks(getProjectById);
    });
  }
}
