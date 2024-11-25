// store
import { CoreRootStore } from "@/store/root.store";
import { ITimelineStore, TimeLineStore } from "./timeline";

export class RootStore extends CoreRootStore {
  timelineStore: ITimelineStore;

  constructor() {
    super();

    //@ts-expect-error type-mismatch
    this.timelineStore = new TimeLineStore(this);
  }
}
