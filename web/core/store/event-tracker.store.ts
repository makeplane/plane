import { action, computed, makeObservable, observable } from "mobx";
import posthog from "posthog-js";
// store
import {
  EventProps,
  IssueEventProps,
  getIssueEventPayload,
  getProjectStateEventPayload,
  getPageEventPayload,
} from "@plane/constants";
import { CoreRootStore } from "./root.store";

export interface ICoreEventTrackerStore {
  // properties
  trackElement: string | undefined;
  // computed
  getRequiredProperties: any;
  // actions
  resetSession: () => void;
  setTrackElement: (element: string) => void;
  captureEvent: (eventName: string, payload?: any) => void;
  capturePageEvent: (props: EventProps) => void;
  captureIssueEvent: (props: IssueEventProps) => void;
  captureProjectStateEvent: (props: EventProps) => void;
}

export abstract class CoreEventTrackerStore implements ICoreEventTrackerStore {
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
