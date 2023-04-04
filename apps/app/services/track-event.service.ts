// services
import APIService from "services/api.service";

const trackEvent =
  process.env.NEXT_PUBLIC_TRACK_EVENTS === "true" || process.env.NEXT_PUBLIC_TRACK_EVENTS === "1";

// types
import type {
  ICycle,
  IGptResponse,
  IIssue,
  IModule,
  IPage,
  IPageBlock,
  IProject,
  IState,
  IView,
  IWorkspace,
} from "types";

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

type PagesEventType = "PAGE_CREATE" | "PAGE_UPDATE" | "PAGE_DELETE";

type ViewEventType = "VIEW_CREATE" | "VIEW_UPDATE" | "VIEW_DELETE";

type PageBlocksEventType =
  | "PAGE_BLOCK_CREATE"
  | "PAGE_BLOCK_UPDATE"
  | "PAGE_BLOCK_DELETE"
  | "PAGE_BLOCK_CONVERTED_TO_ISSUE";

type GptEventType = "ASK_GPT" | "USE_GPT_RESPONSE_IN_ISSUE" | "USE_GPT_RESPONSE_IN_PAGE_BLOCK";

class TrackEventServices extends APIService {
  constructor() {
    super("/");
  }

  async trackWorkspaceEvent(data: IWorkspace | any, eventName: WorkspaceEventType): Promise<any> {
    let payload: any;
    if (
      eventName !== "DELETE_WORKSPACE" &&
      eventName !== "WORKSPACE_USER_INVITE" &&
      eventName !== "WORKSPACE_USER_INVITE_ACCEPT" &&
      eventName !== "WORKSPACE_USER_BULK_INVITE_ACCEPT"
    )
      payload = {
        workspaceId: data.id,
        workspaceSlug: data.slug,
        workspaceName: data.name,
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

  async trackProjectEvent(
    data: Partial<IProject> | any,
    eventName: ProjectEventType
  ): Promise<any> {
    let payload: any;
    if (eventName !== "DELETE_PROJECT")
      payload = {
        workspaceId: data?.workspace_detail?.id,
        workspaceName: data?.workspace_detail?.name,
        workspaceSlug: data?.workspace_detail?.slug,
        projectId: data?.id,
        projectName: data?.name,
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
        workspaceId: data?.workspace_detail?.id,
        workspaceName: data?.workspace_detail?.name,
        workspaceSlug: data?.workspace_detail?.slug,
        projectId: data?.project_detail?.id,
        projectName: data?.project_detail?.name,
        projectIdentifier: data?.project_detail?.identifier,
        issueId: data?.id,
        issueTitle: data?.name,
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
        eventName,
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
        workspaceId: data?.workspace_detail?.id,
        workspaceName: data?.workspace_detail?.name,
        workspaceSlug: data?.workspace_detail?.slug,
        projectId: data?.project_detail?.id,
        projectName: data.project_detail?.name,
        projectIdentifier: data?.project_detail?.identifier,
        moduleId: data.id,
        moduleName: data.name,
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

  async trackPageEvent(data: Partial<IPage> | any, eventName: PagesEventType): Promise<any> {
    let payload: any;
    if (eventName !== "PAGE_DELETE")
      payload = {
        workspaceId: data?.workspace_detail?.id,
        workspaceName: data?.workspace_detail?.name,
        workspaceSlug: data?.workspace_detail?.slug,
        projectId: data?.project_detail?.id,
        projectName: data?.project_detail?.name,
        projectIdentifier: data?.project_detail?.identifier,
        pageId: data.id,
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

  async trackPageBlockEvent(
    data: Partial<IPageBlock> | IIssue,
    eventName: PageBlocksEventType
  ): Promise<any> {
    let payload: any;
    if (eventName !== "PAGE_BLOCK_DELETE" && eventName !== "PAGE_BLOCK_CONVERTED_TO_ISSUE")
      payload = {
        workspaceId: data?.workspace_detail?.id,
        workspaceName: data?.workspace_detail?.name,
        workspaceSlug: data?.workspace_detail?.slug,
        projectId: data?.project_detail?.id,
        projectName: data?.project_detail?.name,
        projectIdentifier: data?.project_detail?.identifier,
        pageId: (data as IPageBlock)?.page,
        pageBlockId: data.id,
      };
    else if (eventName === "PAGE_BLOCK_CONVERTED_TO_ISSUE") {
      payload = {
        workspaceId: data?.workspace_detail?.id,
        workspaceName: data?.workspace_detail?.name,
        workspaceSlug: data?.workspace_detail?.slug,
        projectId: data?.project_detail?.id,
        projectName: data?.project_detail?.name,
        projectIdentifier: data?.project_detail?.identifier,
        issueId: data?.id,
      };
    } else payload = data;

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

  async trackAskGptEvent(data: IGptResponse, eventName: GptEventType): Promise<any> {
    const payload = {
      workspaceId: data?.workspace_detail?.id,
      workspaceName: data?.workspace_detail?.name,
      workspaceSlug: data?.workspace_detail?.slug,
      projectId: data?.project_detail?.id,
      projectIdentifier: data?.project_detail?.identifier,
      projectName: data?.project_detail?.name,
      count: data?.count,
    };
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

  async trackUseGPTResponseEvent(data: IIssue | IPageBlock, eventName: GptEventType): Promise<any> {
    if (!trackEvent) return;

    let payload: any;

    if (eventName === "USE_GPT_RESPONSE_IN_ISSUE") {
      payload = {
        workspaceId: data?.workspace_detail?.id,
        workspaceName: data?.workspace_detail?.name,
        workspaceSlug: data?.workspace_detail?.slug,
        projectId: data?.project_detail?.id,
        projectIdentifier: data?.project_detail?.identifier,
        projectName: data?.project_detail?.name,
        issueId: data.id,
      };
    } else if (eventName === "USE_GPT_RESPONSE_IN_PAGE_BLOCK") {
      payload = {
        workspaceId: data?.workspace_detail?.id,
        workspaceName: data?.workspace_detail?.name,
        workspaceSlug: data?.workspace_detail?.slug,
        projectId: data?.project_detail?.id,
        projectIdentifier: data?.project_detail?.identifier,
        projectName: data?.project_detail?.name,
        pageId: (data as IPageBlock)?.page,
        pageBlockId: data.id,
      };
    }

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

  async trackViewEvent(data: IView, eventName: ViewEventType): Promise<any> {
    let payload: any;
    if (eventName === "VIEW_DELETE") payload = data;
    else
      payload = {
        labels: Boolean(data.query_data.labels),
        assignees: Boolean(data.query_data.assignees),
        priority: Boolean(data.query_data.priority),
        state: Boolean(data.query_data.state),
        created_by: Boolean(data.query_data.created_by),
      };

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
}

const trackEventServices = new TrackEventServices();

export default trackEventServices;
