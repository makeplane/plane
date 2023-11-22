import { action, makeAutoObservable, makeObservable, observable } from "mobx";
import posthog from "posthog-js";

export interface ITrackEventStore {
  trackElement: string;
  setTrackElement: (element: string) => void;
  postHogEventTracker: (
    eventName: string,
    payload: object | [] | null
    // group: { isGrouping: boolean; groupType: string; gorupId: string } | null
  ) => void;
}

export class TrackEventStore implements ITrackEventStore {
  trackElement: string = "";

  constructor() {
    makeObservable(this, {
      trackElement: observable,
      setTrackElement: action,
      postHogEventTracker: action,
    });
  }

  setTrackElement = (element: string) => {
    this.trackElement = element;
  };

  postHogEventTracker = (
    eventName: string,
    payload: object | [] | null
    // group: { isGrouping: boolean; groupType: string; gorupId: string } | null
  ) => {
    try {
      console.log("POSTHOG_EVENT: ", eventName);
      // if (group!.isGrouping === true) {
      //     posthog?.group(group!.groupType, group!.gorupId, {
      //       name: "PostHog",
      //       subscription: "subscription",
      //       date_joined: "2020-01-23T00:00:00.000Z",
      //     });
      //   console.log("END OF GROUPING");
      //   posthog?.capture(eventName, {
      //     ...payload,
      //     element: this.trackElement ?? "",
      //   });
      // } else {
      posthog?.capture(eventName, {
        ...payload,
        element: this.trackElement ?? "",
      });
      // }
      console.log(payload);
    } catch (error) {
      console.log(error);
    }
    this.setTrackElement("");
  };
}
