// store
import { CoreRootStore } from "@/store/root.store";
import { ITimelineStore, TimeLineStore } from "./timeline";

export class RootStore extends CoreRootStore {
  timelineStore: ITimelineStore;

  constructor() {
    super();

    this.timelineStore = new TimeLineStore(this);
  }
}
