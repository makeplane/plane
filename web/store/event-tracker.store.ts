import { action, computed, makeObservable, observable } from "mobx";
import posthog from "posthog-js";
// stores
import { RootStore } from "./root.store";
import {
  EventGroupProps,
  EventProps,
  IssueEventProps,
  getCycleEventPayload,
  getIssueEventPayload,
  getModuleEventPayload,
  getProjectEventPayload,
  getProjectStateEventPayload,
} from "constants/event-tracker";

export interface IEventTrackerStore {
  // properties
  trackElement: string;
  // computed
  getRequiredProperties: any;
  // actions
  setTrackElement: (element: string) => void;
  captureEvent: (eventName: string, payload: object | [] | null, group?: EventGroupProps) => void;
  captureWorkspaceEvent: (props: EventProps) => void;
  captureProjectEvent: (props: EventProps) => void;
  captureCycleEvent: (props: EventProps) => void;
  captureModuleEvent: (props: EventProps) => void;
  captureIssueEvent: (props: IssueEventProps) => void;
  captureProjectStateEvent: (props: EventProps) => void;
}

export class EventTrackerStore implements IEventTrackerStore {
  trackElement: string = "";
  rootStore;
  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // properties
      trackElement: observable,
      // computed
      getRequiredProperties: computed,
      // actions
      setTrackElement: action,
      captureEvent: action,
      captureProjectEvent: action,
      captureCycleEvent: action,
    });
    // store
    this.rootStore = _rootStore;
  }

  /**
   * @description: Returns the necessary property for the event tracking
   */
  get getRequiredProperties() {
    const currentWorkspaceDetails = this.rootStore.workspaceRoot.currentWorkspace;
    const currentProjectDetails = this.rootStore.projectRoot.project.currentProjectDetails;
    return {
      workspace_id: currentWorkspaceDetails?.id ?? "",
      project_id: currentProjectDetails?.id ?? "",
    };
  }

  /**
   * @description: Set the trigger point of event.
   * @param {string} element
   */
  setTrackElement = (element: string) => {
    this.trackElement = element;
  };

  postHogGroup = (group: EventGroupProps) => {
    if (group && group!.isGrouping === true) {
      posthog?.group(group!.groupType!, group!.groupId!, {
        date: new Date(),
        workspace_id: group!.groupId,
      });
    }
  };

  captureEvent = (eventName: string, payload: object | [] | null) => {
    posthog?.capture(eventName, {
      ...payload,
      ...this.getRequiredProperties,
      element: this.trackElement ?? "",
    });
  };

  /**
   * @description: Captures the workspace crud related events.
   * @param {EventProps} props
   */
  captureWorkspaceEvent = (props: EventProps) => {
    const { eventName, payload } = props;
    const eventPayload: any = getProjectEventPayload({
      ...payload,
      element: payload.element ?? this.trackElement,
    });
    posthog?.capture(eventName, eventPayload);
    this.setTrackElement("");
  };

  /**
   * @description: Captures the project related events.
   * @param {EventProps} props
   */
  captureProjectEvent = (props: EventProps) => {
    const { eventName, payload, group } = props;
    if (group) {
      this.postHogGroup(group);
    }
    const eventPayload: any = getProjectEventPayload({
      ...this.getRequiredProperties,
      ...payload,
      element: payload.element ?? this.trackElement,
    });
    posthog?.capture(eventName, eventPayload);
    this.setTrackElement("");
  };

  /**
   * @description: Captures the cycle related events.
   * @param {EventProps} props
   */
  captureCycleEvent = (props: EventProps) => {
    const { eventName, payload, group } = props;
    if (group) {
      this.postHogGroup(group);
    }
    const eventPayload: any = getCycleEventPayload({
      ...this.getRequiredProperties,
      ...payload,
      element: payload.element ?? this.trackElement,
    });
    posthog?.capture(eventName, eventPayload);
    this.setTrackElement("");
  };

  /**
   * @description: Captures the module related events.
   * @param {EventProps} props
   */
  captureModuleEvent = (props: EventProps) => {
    const { eventName, payload, group } = props;
    if (group) {
      this.postHogGroup(group);
    }
    const eventPayload: any = getModuleEventPayload({
      ...this.getRequiredProperties,
      ...payload,
      element: payload.element ?? this.trackElement,
    });
    posthog?.capture(eventName, eventPayload);
    this.setTrackElement("");
  };

  /**
   * @description: Captures the issue related events.
   * @param {IssueEventProps} props
   */
  captureIssueEvent = (props: IssueEventProps) => {
    const { eventName, payload, group } = props;
    if (group) {
      this.postHogGroup(group);
    }
    const eventPayload: any = {
      ...getIssueEventPayload(props),
      ...this.getRequiredProperties,
      state_group: this.rootStore.state.getStateById(payload.state_id)?.group ?? "",
      element: payload.element ?? this.trackElement,
    };
    posthog?.capture(eventName, eventPayload);
  };

  /**
   * @description: Captures the issue related events.
   * @param {IssueEventProps} props
   */
  captureProjectStateEvent = (props: EventProps) => {
    const { eventName, payload, group } = props;
    if (group) {
      this.postHogGroup(group);
    }
    let eventPayload: any = {
      ...getProjectStateEventPayload(props),
      ...this.getRequiredProperties,
      element: payload.element ?? this.trackElement,
    };
    posthog?.capture(eventName, eventPayload);
  };
}
