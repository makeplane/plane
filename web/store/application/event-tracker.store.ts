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
  captureIssueEvent: (props: IssueEventProps) => void;
}

type IssueEventProps = {
  eventName: string;
  payload: any;
  updates?: any;
  group?: EventGroupProps;
  path?: string;
};

type EventProps = {
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

  captureIssueEvent = (props: IssueEventProps) => {
    const { eventName, payload, updates, group } = props;
    if (group) {
      this.postHogGroup(group);
    }
    let eventPayload: any = {
      ...this.getRequiredPayload,
      issue_id: payload.id,
      estimate_point: payload.estimate_point,
      link_count: payload.link_count,
      target_date: payload.target_date,
      is_draft: payload.is_draft,
      label_ids: payload.label_ids,
      assignee_ids: payload.assignee_ids,
      created_at: payload.created_at,
      updated_at: payload.updated_at,
      sequence_id: payload.sequence_id,
      module_ids: payload.module_ids,
      sub_issues_count: payload.sub_issues_count,
      parent_id: payload.parent_id,
      project_id: payload.project_id,
      priority: payload.priority,
      state_id: payload.state_id,
      state_group: this.rootStore.state.getStateById(payload.state_id)?.group ?? "",
      start_date: payload.start_date,
      attachment_count: payload.attachment_count,
      cycle_id: payload.cycle_id,
      module_id: payload.module_id,
      archived_at: payload.archived_at,
      state: payload.state,
      element: payload.element ?? this.trackElement,
      view_id:
        props.path?.includes("workspace-views") || props.path?.includes("views") ? props.path.split("/").pop() : "",
    };

    if (eventName === "Issue updated") {
      eventPayload = {
        ...eventPayload,
        ...updates,
        updated_from: props.path?.includes("workspace-views")
          ? "All views"
          : props.path?.includes("cycles")
          ? "Cycle"
          : props.path?.includes("modules")
          ? "Module"
          : props.path?.includes("views")
          ? "Project view"
          : props.path?.includes("inbox")
          ? "Inbox"
          : props.path?.includes("draft")
          ? "Draft"
          : "Project",
      };
    }

    posthog?.capture(eventName, eventPayload);
  };
}
