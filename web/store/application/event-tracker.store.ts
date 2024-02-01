import { action, computed, makeObservable, observable, runInAction } from "mobx";
import posthog from "posthog-js";
// stores
import { RootStore } from "../root.store";

export interface IEventTrackerStore {
  trackElement: string;
  getRequiredPayload: any;
  setTrackElement: (element: string) => void;
  postHogEventTracker: (
    eventName: string,
    payload: object | [] | null,
    group?: { isGrouping: boolean | null; groupType: string | null; groupId: string | null } | null
  ) => void;
  captureProjectEvent: (props: EventProps) => void;
  captureCycleEvent: (props: EventProps) => void;
  captureModuleEvent: (props: EventProps) => void;
}

export type EventProps = {
  eventName: string;
  payload: any;
  group?: EventGroupProps;
};
type EventGroupProps = {
  isGrouping?: boolean;
  groupType?: string;
  groupId?: string;
};

export class EventTrackerStore implements IEventTrackerStore {
  trackElement: string = "";
  rootStore;
  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      trackElement: observable,
      getRequiredPayload: computed,
      setTrackElement: action,
      postHogEventTracker: action,
      captureProjectEvent: action,
      captureCycleEvent: action,
    });
    this.rootStore = _rootStore;
  }

  get getRequiredPayload() {
    const currentWorkspaceDetails = this.rootStore.workspaceRoot.currentWorkspace;
    const currentProjectDetails = this.rootStore.projectRoot.project.currentProjectDetails;
    return {
      workspace_id: currentWorkspaceDetails?.id ?? "",
      project_id: currentProjectDetails?.id ?? "",
    };
  }

  setTrackElement = (element: string) => {
    runInAction(() => {
      this.trackElement = element;
    });
    console.log("element", this.trackElement, element);
  };

  postHogGroup = (group: EventGroupProps) => {
    if (group && group!.isGrouping === true) {
      posthog?.group(group!.groupType!, group!.groupId!, {
        date: new Date(),
        workspace_id: group!.groupId,
      });
    }
  };

  postHogEventTracker = (eventName: string, payload: object | [] | null) => {
    try {
      posthog?.capture(eventName, {
        ...payload,
        element: this.trackElement ?? "",
      });
    } catch (error) {
      throw error;
    }
  };

  captureProjectEvent = (props: EventProps) => {
    const { eventName, payload, group } = props;
    if (group) {
      this.postHogGroup(group);
    }
    const eventPayload: any = {
      ...this.getRequiredPayload,
      project_id: payload.id,
      identifier: payload.identifier,
      created_at: payload.created_at,
      updated_at: payload.updated_at,
      state: payload.state,
      element: payload.element ?? this.trackElement,
    };
    posthog?.capture(eventName, eventPayload);
    this.setTrackElement("");
  };

  captureCycleEvent = (props: EventProps) => {
    const { eventName, payload, group } = props;
    if (group) {
      this.postHogGroup(group);
    }
    const eventPayload: any = {
      ...this.getRequiredPayload,
      cycle_id: payload.id,
      created_at: payload.created_at,
      updated_at: payload.updated_at,
      start_date: payload.start_date,
      target_date: payload.target_date,
      cycle_status: payload.status,
      state: payload.state,
      element: payload.element ?? this.trackElement,
    };
    posthog?.capture(eventName, eventPayload);
    this.setTrackElement("");
  };

  captureModuleEvent = (props: EventProps) => {
    const { eventName, payload, group } = props;
    if (group) {
      this.postHogGroup(group);
    }
    const eventPayload: any = {
      ...this.getRequiredPayload,
      module_id: payload.id,
      created_at: payload.created_at,
      updated_at: payload.updated_at,
      start_date: payload.start_date,
      target_date: payload.target_date,
      module_status: payload.status,
      state: payload.state,
      element: payload.element ?? this.trackElement,
    };
    posthog?.capture(eventName, eventPayload);
    this.setTrackElement("");
  };
}
