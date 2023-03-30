// services
import APIService from "services/api.service";
// types
import type { ICycle, IIssue, IModule, IProject, IState, IWorkspace } from "types";

type WorkspaceEventType =
  | "CREATE_WORKSPACE"
  | "UPDATE_WORKSPACE"
  | "DELETE_WORKSPACE"
  | "WORKSPACE_USER_INVITE"
  | "WORKSPACE_USER_INVITE_ACCEPT"
  | "WORKSPACE_USER_BULK_INVITE_ACCEPT";

type ProjectEventType = "CREATE_PROJECT" | "UPDATE_PROJECT" | "DELETE_PROJECT";

type IssueEventType = "ISSUE_CREATE" | "ISSUE_UPDATE" | "ISSUE_DELETE";

type CycleEventType = "CYCLE_CREATE" | "CYCLE_UPDATE" | "CYCLE_DELETE";

type StateEventType = "STATE_CREATE" | "STATE_UPDATE" | "STATE_DELETE";

type ModuleEventType = "MODULE_CREATE" | "MODULE_UPDATE" | "MODULE_DELETE";

// TODO: as we add more events, we can refactor this to be divided into different classes
class TrackEventServices extends APIService {
  constructor() {
    super("/");
  }

  async trackWorkspaceEvent(data: IWorkspace | any, eventName: WorkspaceEventType): Promise<any> {
    let payload: any;
    if (eventName !== "DELETE_WORKSPACE")
      payload = {
        workspaceId: data.id,
        workspaceSlug: data.slug,
        workspaceName: data.name,
      };
    else payload = data;

    console.log("trackWorkspaceEvent", eventName, payload);

    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName,
        extra: {
          ...payload,
        },
      },
    });
  }

  async trackProjectEvent(data: IProject | any, eventName: ProjectEventType): Promise<any> {
    let payload: any;
    if (eventName !== "DELETE_PROJECT")
      payload = {
        workspaceId: data.workspace_detail.id,
        workspaceName: data.workspace_detail.name,
        workspaceSlug: data.workspace_detail.slug,
        projectId: data.id,
        projectName: data.name,
      };
    else payload = data;

    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName,
        extra: {
          ...payload,
        },
      },
    });
  }

  async trackUserOnboardingCompleteEvent(data: any): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "USER_ONBOARDING_COMPLETE",
        extra: {
          ...data,
        },
      },
    });
  }

  async trackIssueEvent(data: IIssue | any, eventName: IssueEventType): Promise<any> {
    let payload: any;
    if (eventName !== "ISSUE_DELETE")
      payload = {
        workspaceId: data.workspace_detail.id,
        workspaceName: data.workspace_detail.name,
        workspaceSlug: data.workspace_detail.slug,
        projectId: data.project_detail.id,
        projectName: data.project_detail.name,
        projectIdentifier: data.project_detail.identifier,
        issueId: data.id,
        issueTitle: data.name,
      };
    else payload = data;

    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName,
        extra: {
          ...payload,
        },
      },
    });
  }

  async trackIssueBulkDeleteEvent(data: any): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "ISSUE_BULK_DELETE",
        extra: {
          ...data,
        },
      },
    });
  }

  async trackStateEvent(data: IState | any, eventName: StateEventType): Promise<any> {
    let payload: any;
    if (eventName !== "STATE_DELETE")
      payload = {
        workspaceId: data?.workspace_detail?.id,
        workspaceName: data?.workspace_detail?.name,
        workspaceSlug: data?.workspace_detail?.slug,
        projectId: data?.project_detail?.id,
        projectName: data?.project_detail?.name,
        projectIdentifier: data?.project_detail?.identifier,
        stateId: data.id,
        stateName: data.name,
      };
    else payload = data;

    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName,
        extra: {
          ...payload,
        },
      },
    });
  }

  async trackCycleEvent(data: ICycle | any, eventName: CycleEventType): Promise<any> {
    let payload: any;
    if (eventName !== "CYCLE_DELETE")
      payload = {
        workspaceId: data?.workspace_detail?.id,
        workspaceName: data?.workspace_detail?.name,
        workspaceSlug: data?.workspace_detail?.slug,
        projectId: data?.project_detail?.id,
        projectName: data?.project_detail?.name,
        projectIdentifier: data?.project_detail?.identifier,
        cycleId: data.id,
        cycleName: data.name,
      };
    else payload = data;

    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "CYCLE_CREATE",
        extra: {
          ...payload,
        },
      },
    });
  }

  async trackModuleEvent(data: IModule | any, eventName: ModuleEventType): Promise<any> {
    let payload: any;
    if (eventName !== "MODULE_DELETE")
      payload = {
        workspaceId: data?.workspace_detail.id,
        workspaceName: data?.workspace_detail.name,
        workspaceSlug: data?.workspace_detail.slug,
        projectId: data?.project_detail?.id,
        projectName: data.project_detail?.name,
        moduleId: data.id,
        moduleName: data.name,
      };
    else payload = data;

    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "MODULE_CREATE",
        extra: {
          ...payload,
        },
      },
    });
  }
}

const trackEventServices = new TrackEventServices();

export default trackEventServices;
