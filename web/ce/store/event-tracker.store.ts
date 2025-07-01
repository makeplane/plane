import { RootStore } from "@/plane-web/store/root.store";
import { CoreEventTrackerStore, ICoreEventTrackerStore } from "@/store/event-tracker.store";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IEventTrackerStore extends ICoreEventTrackerStore {}

export class EventTrackerStore extends CoreEventTrackerStore implements IEventTrackerStore {
  constructor(_rootStore: RootStore) {
    super(_rootStore);
  }
}
