import { action, computed, makeObservable, observable } from "mobx";
import posthog from "posthog-js";
// stores
import { RootStore } from "./root.store";
import {
  EventProps,
  GROUP_WORKSPACE,
  IssueEventProps,
  WORKSPACE_CREATED,
  getCycleEventPayload,
  getIssueEventPayload,
  getModuleEventPayload,
  getProjectEventPayload,
  getProjectStateEventPayload,
  getWorkspaceEventPayload,
} from "constants/event-tracker";

export interface IEventTrackerStore {
  // properties
  trackElement: string;
  // computed
  getRequiredProperties: any;
  // actions
  resetSession: () => void;
  setTrackElement: (element: string) => void;
  captureEvent: (eventName: string, payload: any) => void;
  createWorkspaceMetricGroup: (userEmail: string, workspaceId: string) => void;
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
      resetSession: action,
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

  /**
   * @description: Reset the session.
   */
  resetSession = () => {
    posthog?.reset();
  };

  /**
   * @description: Creates the workspace metric group.
   * @param {string} userEmail
   * @param {string} workspaceId
   */
  createWorkspaceMetricGroup = (userEmail: string, workspaceId: string) => {
    posthog?.identify(userEmail);
    posthog?.group(GROUP_WORKSPACE, workspaceId, {
      date: new Date().toDateString(),
      workspace_id: workspaceId,
    });
  };

  /**
   * @description: Captures the event.
   * @param {string} eventName
   * @param {any} payload
   */
  captureEvent = (eventName: string, payload: any) => {
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
    if (eventName === WORKSPACE_CREATED && payload.state == "SUCCESS") {
      this.createWorkspaceMetricGroup(payload.user_email, payload.id);
    }
    const eventPayload: any = getWorkspaceEventPayload({
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
    const { eventName, payload } = props;
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
    const { eventName, payload } = props;
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
    const { eventName, payload } = props;
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
    const { eventName, payload } = props;
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
    const { eventName, payload } = props;
    let eventPayload: any = {
      ...getProjectStateEventPayload(props),
      ...this.getRequiredProperties,
      element: payload.element ?? this.trackElement,
    };
    posthog?.capture(eventName, eventPayload);
  };
}
