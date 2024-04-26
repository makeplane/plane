import { action, computed, makeObservable, observable } from "mobx";
import posthog from "posthog-js";
// stores
import { RootStore } from "./root.store";
// helpers
import { getUserRole } from "helpers/user.helper";
// constants
import {
  EventProps,
  IssueEventProps,
  getCycleEventPayload,
  getIssueEventPayload,
  getModuleEventPayload,
  getProjectEventPayload,
  getProjectStateEventPayload,
  getWorkspaceEventPayload,
  getPageEventPayload,
  getIssuesListOpenedPayload,
  getIssuesFilterEventPayload,
  getIssuesDisplayFilterPayload,
  LP_UPDATED,
  ISSUES_LIST_OPENED,
  GROUP_WORKSPACE,
  WORKSPACE_CREATED,
  LABEL_REMOVED_G,
  LABEL_ADDED_G,
} from "@/constants/event-tracker";
import { IIssueLabelTree } from "@plane/types";

export interface IEventTrackerStore {
  // properties
  trackElement: string | undefined;
  // computed
  getRequiredProperties: any;
  getTrackElement: string | undefined;
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
  captureIssuesListOpenedEvent: (payload: any) => void;
  captureIssuesFilterEvent: (props: EventProps) => void;
  captureIssuesDisplayFilterEvent: (props: EventProps) => void;
  captureLabelDragNDropEvent: (
    childLabelParent: string | null | undefined,
    parentLabel: string | null | undefined,
    childLabel: string | null | undefined,
    projectLabelsTree: IIssueLabelTree[] | undefined
  ) => void;
}

export class EventTrackerStore implements IEventTrackerStore {
  trackElement: string | undefined = undefined;
  rootStore;
  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // properties
      trackElement: observable,
      // computed
      getRequiredProperties: computed,
      getTrackElement: computed,
      // actions
      resetSession: action,
      setTrackElement: action,
      captureEvent: action,
      captureProjectEvent: action,
      captureCycleEvent: action,
      captureModuleEvent: action,
      capturePageEvent: action,
      captureIssueEvent: action,
      captureProjectStateEvent: action,
      captureIssuesListOpenedEvent: action,
      joinWorkspaceMetricGroup: action,
      captureWorkspaceEvent: action,
    });
    // store
    this.rootStore = _rootStore;
  }

  /**
   * @description: Returns the current track element.
   */
  get getTrackElement() {
    return this.trackElement;
  }

  /**
   * @description: Returns the necessary property for the event tracking
   */
  get getRequiredProperties() {
    const currentWorkspaceRole = this.rootStore.user.membership.currentWorkspaceRole;
    const currentWorkspaceDetails = this.rootStore.workspaceRoot.currentWorkspace;
    const currentProjectDetails = this.rootStore.projectRoot.project.currentProjectDetails;
    return {
      workspace_id: currentWorkspaceDetails?.id,
      project_id: currentProjectDetails?.id,
      user_project_role: currentProjectDetails?.member_role
        ? getUserRole(currentProjectDetails?.member_role as number)
        : undefined,
      user_workspace_role: getUserRole(currentWorkspaceRole as number),
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
    const eventPayload: any = {
      ...getWorkspaceEventPayload(payload),
      ...this.getRequiredProperties,
      element: payload.element ?? this.trackElement,
    };
    posthog?.capture(eventName, eventPayload);
    this.setTrackElement(undefined);
  };

  /**
   * @description: Captures the project related events.
   * @param {EventProps} props
   */
  captureProjectEvent = (props: EventProps) => {
    const { eventName, payload } = props;
    const eventPayload: any = {
      ...getProjectEventPayload(payload),
      ...this.getRequiredProperties,
      element: payload.element ?? this.trackElement,
    };
    posthog?.capture(eventName, eventPayload);
    this.setTrackElement(undefined);
  };

  /**
   * @description: Captures the cycle related events.
   * @param {EventProps} props
   */
  captureCycleEvent = (props: EventProps) => {
    const { eventName, payload } = props;
    const eventPayload: any = {
      ...getCycleEventPayload(payload),
      ...this.getRequiredProperties,
      element: payload.element ?? this.trackElement,
    };
    posthog?.capture(eventName, eventPayload);
    this.setTrackElement(undefined);
  };

  /**
   * @description: Captures the module related events.
   * @param {EventProps} props
   */
  captureModuleEvent = (props: EventProps) => {
    const { eventName, payload } = props;
    const eventPayload: any = {
      ...getModuleEventPayload(payload),
      ...this.getRequiredProperties,
      element: payload.element ?? this.trackElement,
    };
    posthog?.capture(eventName, eventPayload);
    this.setTrackElement(undefined);
  };

  /**
   * @description: Captures the project pages related events.
   * @param {EventProps} props
   */
  capturePageEvent = (props: EventProps) => {
    const { eventName, payload } = props;
    const eventPayload: any = {
      ...getPageEventPayload(payload),
      ...this.getRequiredProperties,
      element: payload.element ?? this.trackElement,
    };
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
    const eventPayload: any = {
      ...getProjectStateEventPayload(payload),
      ...this.getRequiredProperties,
      element: payload.element ?? this.trackElement,
    };

    posthog?.capture(eventName, eventPayload);
    this.setTrackElement(undefined);
  };

  /**
   * @description: Captures the event whenever the issues list is opened.
   * @param {any} payload
   */
  captureIssuesListOpenedEvent = (payload: any) => {
    const eventPayload = {
      ...getIssuesListOpenedPayload(payload),
      ...this.getRequiredProperties,
      type: this.getRequiredProperties.project_id ? "Project" : "Workspace",
    };
    posthog?.capture(ISSUES_LIST_OPENED, eventPayload);
    this.setTrackElement(undefined);
  };

  /**
   * @description: Captures the event whenever the issues filters are changed.
   * @param {IssueEventProps} props
   */
  captureIssuesFilterEvent = (props: EventProps) => {
    const { eventName, payload } = props;
    const eventPayload = {
      ...getIssuesFilterEventPayload(payload),
      ...this.getRequiredProperties,
      type: this.getRequiredProperties.project_id ? "Project" : "Workspace",
    };
    posthog?.capture(eventName, eventPayload);
    this.setTrackElement(undefined);
  };

  /**
   * @description: Captures the event whenever the issues display-filters are changed.
   * @param {IssueEventProps} props
   */
  captureIssuesDisplayFilterEvent = (props: EventProps) => {
    const { eventName, payload } = props;
    const eventPayload = {
      ...getIssuesDisplayFilterPayload(payload),
      ...this.getRequiredProperties,
      type: this.getRequiredProperties.project_id ? "Project" : "Workspace",
      current_display_filter: eventName === LP_UPDATED ? payload?.filters?.displayFilters : undefined,
    };
    posthog?.capture(eventName, eventPayload);
    this.setTrackElement(undefined);
  };

  captureLabelDragNDropEvent = (
    childLabelParent: string | null | undefined,
    parentLabel: string | null | undefined,
    childLabel: string | null | undefined,
    projectLabelsTree: IIssueLabelTree[] | undefined
  ) => {
    if (childLabelParent != parentLabel) {
      // if the child label has a parent, then remove it from the parent and add it to a new parent.
      if (childLabelParent) {
        this.captureEvent(LABEL_REMOVED_G, {
          group_id: childLabelParent,
          child_id: childLabel,
          child_count: (projectLabelsTree?.find((label) => label.id === childLabelParent)?.children?.length ?? 0) - 1,
        });
        parentLabel &&
          this.captureEvent(LABEL_ADDED_G, {
            group_id: parentLabel,
            child_id: childLabel,
            child_count: (projectLabelsTree?.find((label) => label.id === parentLabel)?.children?.length ?? 0) + 1,
          });
      } else {
        // if the child label has no parent, then add it to a new parent.
        this.captureEvent(LABEL_ADDED_G, {
          group_id: parentLabel,
          child_id: childLabel,
          child_count: (projectLabelsTree?.find((label) => label.id === parentLabel)?.children?.length ?? 0) + 1,
        });
      }
    }
  };
}
