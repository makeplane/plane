import { action, computed, makeObservable, observable } from "mobx";
import posthog from "posthog-js";
// stores
import {
  EventProps,
  IssueEventProps,
  IssuesListOpenedEventProps,
  ISSUES_LIST_OPENED,
  GROUP_WORKSPACE,
  WORKSPACE_CREATED,
} from "@/constants/event-tracker";
// helpers
import {
  getCycleEventPayload,
  getIssueEventPayload,
  getModuleEventPayload,
  getProjectEventPayload,
  getProjectStateEventPayload,
  getWorkspaceEventPayload,
  getPageEventPayload,
  getIssuesListOpenedPayload,
} from "@/helpers/event-tracker.helper";
import { RootStore } from "./root.store";

export interface IEventTrackerStore {
  // properties
  trackElement: string | undefined;
  // computed
  requiredProperties: any;
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
  captureIssuesListOpenedEvent: (props: IssuesListOpenedEventProps) => void;
}

export class EventTrackerStore implements IEventTrackerStore {
  trackElement: string | undefined = undefined;
  rootStore;
  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // properties
      trackElement: observable,
      // computed
      requiredProperties: computed,
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
  get requiredProperties() {
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
      ...this.requiredProperties,
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
      ...this.requiredProperties,
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
      ...this.requiredProperties,
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
      ...this.requiredProperties,
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
      ...this.requiredProperties,
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
      ...this.requiredProperties,
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
      ...this.requiredProperties,
      ...payload,
      element: payload.element ?? this.trackElement,
    });
    posthog?.capture(eventName, eventPayload);
    this.setTrackElement(undefined);
  };

  /**
   * @description: Captures the event whenever the issues list is opened.
   * @param {string} path
   * @param {any} filters
   */
  captureIssuesListOpenedEvent = (props: IssuesListOpenedEventProps) => {
    const { element, elementId, filters } = props;
    const eventPayload = getIssuesListOpenedPayload({
      filters: filters,
      ...this.requiredProperties,
    });

    posthog?.capture(ISSUES_LIST_OPENED, {
      ...eventPayload,
      element: element,
      elementId: elementId,
    });
    this.setTrackElement(undefined);
  };
}
