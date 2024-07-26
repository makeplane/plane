import { action, computed, makeObservable, observable } from "mobx";
import posthog from "posthog-js";
// stores
import {
  GROUP_WORKSPACE,
  WORKSPACE_CREATED,
  EventProps,
  IssueEventProps,
  getCycleEventPayload,
  getIssueEventPayload,
  getModuleEventPayload,
  getProjectEventPayload,
  getProjectStateEventPayload,
  getWorkspaceEventPayload,
  getPageEventPayload,
} from "@/constants/event-tracker";
// store
import { CoreRootStore } from "./root.store";

export interface IEventTrackerStore {
  // properties
  trackElement: string | undefined;
  // computed
  getRequiredProperties: any;
  // actions
  resetSession: () => void;
  setTrackElement: (element: string) => void;
  captureEvent: (eventName: string, payload?: any) => void;
  joinWorkspaceMetricGroup: (workspaceId?: string) => void;
  captureWorkspaceEvent: (props: EventProps) => void;
  captureProjectEvent: (props: EventProps) => void;
  captureCycleEvent: (props: EventProps) => void;
  captureModuleEvent: (props: EventProps) => void;
  capturePageEvent: (props: EventProps) => void;
  captureIssueEvent: (props: IssueEventProps) => void;
  captureProjectStateEvent: (props: EventProps) => void;
}

export class EventTrackerStore implements IEventTrackerStore {
  trackElement: string | undefined = undefined;
  rootStore;
  constructor(_rootStore: CoreRootStore) {
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
      workspace_id: currentWorkspaceDetails?.id,
      project_id: currentProjectDetails?.id,
    };
  }

  /**
   * @description: Set the trigger point of event.
   * @param {string} element
   */
  setTrackElement = (element?: string) => {
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
  joinWorkspaceMetricGroup = (workspaceId?: string) => {
    if (!workspaceId) return;
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
  captureEvent = (eventName: string, payload?: any) => {
    posthog?.capture(eventName, {
      ...this.getRequiredProperties,
      ...payload,
      element: payload?.element ?? this.trackElement,
    });
    this.setTrackElement(undefined);
  };

  /**
   * @description: Captures the workspace crud related events.
   * @param {EventProps} props
   */
  captureWorkspaceEvent = (props: EventProps) => {
    const { eventName, payload } = props;
    if (eventName === WORKSPACE_CREATED && payload.state == "SUCCESS") {
      this.joinWorkspaceMetricGroup(payload.id);
    }
    const eventPayload: any = getWorkspaceEventPayload({
      ...payload,
      element: payload.element ?? this.trackElement,
    });
    posthog?.capture(eventName, eventPayload);
    this.setTrackElement(undefined);
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
    this.setTrackElement(undefined);
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
    this.setTrackElement(undefined);
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
    this.setTrackElement(undefined);
  };

  /**
   * @description: Captures the project pages related events.
   * @param {EventProps} props
   */
  capturePageEvent = (props: EventProps) => {
    const { eventName, payload } = props;
    const eventPayload: any = getPageEventPayload({
      ...this.getRequiredProperties,
      ...payload,
      element: payload.element ?? this.trackElement,
    });
    posthog?.capture(eventName, eventPayload);
    this.setTrackElement(undefined);
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
    this.setTrackElement(undefined);
  };

  /**
   * @description: Captures the issue related events.
   * @param {IssueEventProps} props
   */
  captureProjectStateEvent = (props: EventProps) => {
    const { eventName, payload } = props;
    const eventPayload: any = getProjectStateEventPayload({
      ...this.getRequiredProperties,
      ...payload,
      element: payload.element ?? this.trackElement,
    });
    posthog?.capture(eventName, eventPayload);
    this.setTrackElement(undefined);
  };
}
