import { action, makeObservable, observable } from "mobx";
import posthog from "posthog-js";
import { RootStore } from "./root";

export interface ITrackEventStore {
  trackElement: string;
  setTrackElement: (element: string) => void;
  postHogEventTracker: (
    eventName: string,
    payload: object | [] | null,
    group?: { isGrouping: boolean | null; groupType: string | null; gorupId: string | null } | null
  ) => void;
}

export class TrackEventStore implements ITrackEventStore {
  trackElement: string = "";
  rootStore;
  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      trackElement: observable,
      setTrackElement: action,
      postHogEventTracker: action,
    });
    this.rootStore = _rootStore;
  }

  setTrackElement = (element: string) => {
    this.trackElement = element;
  };

  postHogEventTracker = (
    eventName: string,
    payload: object | [] | null,
    group?: { isGrouping: boolean | null; groupType: string | null; gorupId: string | null } | null
  ) => {
    try {
      console.log("POSTHOG_EVENT: ", eventName);
      let extras: any = {
        workspace_name: this.rootStore.workspace.currentWorkspace?.name ?? "",
        workspace_id: this.rootStore.workspace.currentWorkspace?.id ?? "",
        workspace_slug: this.rootStore.workspace.currentWorkspace?.slug ?? "",
        project_name: this.rootStore.project.currentProjectDetails?.name ?? "",
        project_id: this.rootStore.project.currentProjectDetails?.id ?? "",
        project_identifier: this.rootStore.project.currentProjectDetails?.identifier ?? "",
      };
      if (["PROJECT_CREATED", "PROJECT_UPDATED"].includes(eventName)) {
        const project_details: any = payload as object;
        extras = {
          ...extras,
          project_name: project_details?.name ?? "",
          project_id: project_details?.id ?? "",
          project_identifier: project_details?.identifier ?? "",
        };
      }

      if (group && group!.isGrouping === true) {
        posthog?.group(group!.groupType!, group!.gorupId!, {
          date: new Date(),
          workspace_id: group!.gorupId,
        });
        posthog?.capture(eventName, {
          ...payload,
          extras: extras,
          element: this.trackElement ?? "",
        });
      } else {
        posthog?.capture(eventName, {
          ...payload,
          extras: extras,
          element: this.trackElement ?? "",
        });
      }
      console.log(payload);
    } catch (error) {
      console.log(error);
    }
    this.setTrackElement("");
  };
}
