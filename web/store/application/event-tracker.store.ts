import { action, makeObservable, observable } from "mobx";
import posthog from "posthog-js";
// stores
import { RootStore } from "../root.store";

export interface IEventTrackerStore {
  trackElement: string;
  setTrackElement: (element: string) => void;
  postHogEventTracker: (
    eventName: string,
    payload: object | [] | null,
    group?: { isGrouping: boolean | null; groupType: string | null; groupId: string | null } | null
  ) => void;
}

export class EventTrackerStore implements IEventTrackerStore {
  trackElement: string = "";
  rootStore;
  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      trackElement: observable,
      setTrackElement: action.bound,
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
    group?: { isGrouping: boolean | null; groupType: string | null; groupId: string | null } | null
  ) => {
    try {
      const currentWorkspaceDetails = this.rootStore.workspaceRoot.workspaces.currentWorkspace;
      const currentProjectDetails = this.rootStore.projectRoot.project.currentProjectDetails;
      let extras: any = {
        workspace_name: currentWorkspaceDetails?.name ?? "",
        workspace_id: currentWorkspaceDetails?.id ?? "",
        workspace_slug: currentWorkspaceDetails?.slug ?? "",
        project_name: currentProjectDetails?.name ?? "",
        project_id: currentProjectDetails?.id ?? "",
        project_identifier: currentProjectDetails?.identifier ?? "",
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
        posthog?.group(group!.groupType!, group!.groupId!, {
          date: new Date(),
          workspace_id: group!.groupId,
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
    } catch (error) {
      throw error;
    }
    this.setTrackElement("");
  };
}
