// services
import APIService from "services/api.service";

const trackEvent =
  process.env.NEXT_PUBLIC_TRACK_EVENTS === "true" || process.env.NEXT_PUBLIC_TRACK_EVENTS === "1";

// types
import type {
  ICurrentUserResponse,
  ICycle,
  IEstimate,
  IGptResponse,
  IIssue,
  IIssueComment,
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

type ProjectEventType =
  | "CREATE_PROJECT"
  | "UPDATE_PROJECT"
  | "DELETE_PROJECT"
  | "PROJECT_MEMBER_INVITE";

type IssueEventType = "ISSUE_CREATE" | "ISSUE_UPDATE" | "ISSUE_DELETE";

type CycleEventType = "CYCLE_CREATE" | "CYCLE_UPDATE" | "CYCLE_DELETE";

type StateEventType = "STATE_CREATE" | "STATE_UPDATE" | "STATE_DELETE";

type ModuleEventType = "MODULE_CREATE" | "MODULE_UPDATE" | "MODULE_DELETE";

type PagesEventType = "PAGE_CREATE" | "PAGE_UPDATE" | "PAGE_DELETE";

type ViewEventType = "VIEW_CREATE" | "VIEW_UPDATE" | "VIEW_DELETE";

type IssueCommentEventType =
  | "ISSUE_COMMENT_CREATE"
  | "ISSUE_COMMENT_UPDATE"
  | "ISSUE_COMMENT_DELETE";

export type MiscellaneousEventType =
  | "TOGGLE_CYCLE_ON"
  | "TOGGLE_CYCLE_OFF"
  | "TOGGLE_MODULE_ON"
  | "TOGGLE_MODULE_OFF"
  | "TOGGLE_VIEW_ON"
  | "TOGGLE_VIEW_OFF"
  | "TOGGLE_PAGES_ON"
  | "TOGGLE_PAGES_OFF"
  | "TOGGLE_STATE_ON"
  | "TOGGLE_STATE_OFF";

type IntegrationEventType = "ADD_WORKSPACE_INTEGRATION" | "REMOVE_WORKSPACE_INTEGRATION";

type GitHubSyncEventType = "GITHUB_REPO_SYNC";

type PageBlocksEventType =
  | "PAGE_BLOCK_CREATE"
  | "PAGE_BLOCK_UPDATE"
  | "PAGE_BLOCK_DELETE"
  | "PAGE_BLOCK_CONVERTED_TO_ISSUE";

type IssueLabelEventType = "ISSUE_LABEL_CREATE" | "ISSUE_LABEL_UPDATE" | "ISSUE_LABEL_DELETE";

type GptEventType = "ASK_GPT" | "USE_GPT_RESPONSE_IN_ISSUE" | "USE_GPT_RESPONSE_IN_PAGE_BLOCK";

type IssueEstimateEventType = "ESTIMATE_CREATE" | "ESTIMATE_UPDATE" | "ESTIMATE_DELETE";

type ImporterEventType =
  | "GITHUB_IMPORTER_CREATE"
  | "GITHUB_IMPORTER_DELETE"
  | "JIRA_IMPORTER_CREATE"
  | "JIRA_IMPORTER_DELETE";

type AnalyticsEventType =
  | "WORKSPACE_SCOPE_AND_DEMAND_ANALYTICS"
  | "WORKSPACE_CUSTOM_ANALYTICS"
  | "WORKSPACE_ANALYTICS_EXPORT"
  | "PROJECT_SCOPE_AND_DEMAND_ANALYTICS"
  | "PROJECT_CUSTOM_ANALYTICS"
  | "PROJECT_ANALYTICS_EXPORT"
  | "CYCLE_SCOPE_AND_DEMAND_ANALYTICS"
  | "CYCLE_CUSTOM_ANALYTICS"
  | "CYCLE_ANALYTICS_EXPORT"
  | "MODULE_SCOPE_AND_DEMAND_ANALYTICS"
  | "MODULE_CUSTOM_ANALYTICS"
  | "MODULE_ANALYTICS_EXPORT";

class TrackEventServices extends APIService {
  constructor() {
    super("/");
  }

  async trackWorkspaceEvent(
    data: IWorkspace | any,
    eventName: WorkspaceEventType,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
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
        user: user,
      },
    });
  }

  async trackProjectEvent(
    data: Partial<IProject> | any,
    eventName: ProjectEventType,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    let payload: any;
    if (eventName !== "DELETE_PROJECT" && eventName !== "PROJECT_MEMBER_INVITE")
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
        user: user,
      },
    });
  }

  async trackUserOnboardingCompleteEvent(
    data: any,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "USER_ONBOARDING_COMPLETE",
        extra: {
          ...data,
        },
        user: user,
      },
    });
  }

  async trackIssueEvent(
    data: IIssue | any,
    eventName: IssueEventType,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
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
        user: user,
      },
    });
  }

  async trackIssueMarkedAsDoneEvent(
    data: any,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    if (!trackEvent) return;
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "ISSUES_MARKED_AS_DONE",
        extra: {
          ...data,
        },
        user: user,
      },
    });
  }

  async trackIssuePartialPropertyUpdateEvent(
    data: any,
    propertyName:
      | "ISSUE_PROPERTY_UPDATE_PRIORITY"
      | "ISSUE_PROPERTY_UPDATE_STATE"
      | "ISSUE_PROPERTY_UPDATE_ASSIGNEE"
      | "ISSUE_PROPERTY_UPDATE_DUE_DATE"
      | "ISSUE_PROPERTY_UPDATE_ESTIMATE",
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    if (!trackEvent) return;
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: propertyName,
        extra: {
          ...data,
        },
        user: user,
      },
    });
  }

  async trackIssueCommentEvent(
    data: Partial<IIssueComment> | any,
    eventName: IssueCommentEventType,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    let payload: any;
    if (eventName !== "ISSUE_COMMENT_DELETE")
      payload = {
        workspaceId: data?.workspace_detail?.id,
        workspaceName: data?.workspace_detail?.name,
        workspaceSlug: data?.workspace_detail?.slug,
        projectId: data?.project_detail?.id,
        projectName: data?.project_detail?.name,
        projectIdentifier: data?.project_detail?.identifier,
        issueId: data?.issue,
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
        user: user,
      },
    });
  }

  async trackIssueMovedToCycleOrModuleEvent(
    data: any,
    eventName:
      | "ISSUE_MOVED_TO_CYCLE"
      | "ISSUE_MOVED_TO_MODULE"
      | "ISSUE_MOVED_TO_CYCLE_IN_BULK"
      | "ISSUE_MOVED_TO_MODULE_IN_BULK",
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName,
        extra: {
          ...data,
        },
        user: user,
      },
    });
  }

  async trackIssueBulkDeleteEvent(data: any, user: ICurrentUserResponse | undefined): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "ISSUE_BULK_DELETE",
        extra: {
          ...data,
        },
        user: user,
      },
    });
  }

  async trackIssueLabelEvent(
    data: any,
    eventName: IssueLabelEventType,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName,
        extra: {
          ...data,
        },
        user: user,
      },
    });
  }

  async trackStateEvent(
    data: IState | any,
    eventName: StateEventType,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
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
        user: user,
      },
    });
  }

  async trackCycleEvent(
    data: ICycle | any,
    eventName: CycleEventType,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
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
        user: user,
      },
    });
  }

  async trackModuleEvent(
    data: IModule | any,
    eventName: ModuleEventType,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
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
        user: user,
      },
    });
  }

  async trackPageEvent(
    data: Partial<IPage> | any,
    eventName: PagesEventType,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
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
        user: user,
      },
    });
  }

  async trackPageBlockEvent(
    data: Partial<IPageBlock> | IIssue,
    eventName: PageBlocksEventType,
    user: ICurrentUserResponse | undefined
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
        user: user,
      },
    });
  }

  async trackAskGptEvent(
    data: IGptResponse,
    eventName: GptEventType,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
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
        user: user,
      },
    });
  }

  async trackUseGPTResponseEvent(
    data: IIssue | IPageBlock,
    eventName: GptEventType,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
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
        user: user,
      },
    });
  }

  async trackViewEvent(
    data: IView,
    eventName: ViewEventType,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
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
        user: user,
      },
    });
  }

  async trackMiscellaneousEvent(
    data: any,
    eventName: MiscellaneousEventType,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName,
        extra: {
          ...data,
        },
        user: user,
      },
    });
  }

  async trackAppIntegrationEvent(
    data: any,
    eventName: IntegrationEventType,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName,
        extra: {
          ...data,
        },
        user: user,
      },
    });
  }

  async trackGitHubSyncEvent(
    data: any,
    eventName: GitHubSyncEventType,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName,
        extra: {
          ...data,
        },
        user: user,
      },
    });
  }

  async trackIssueEstimateEvent(
    data: { estimate: IEstimate },
    eventName: IssueEstimateEventType,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    let payload: any;
    if (eventName === "ESTIMATE_DELETE") payload = data;
    else
      payload = {
        workspaceId: data?.estimate?.workspace_detail?.id,
        workspaceName: data?.estimate?.workspace_detail?.name,
        workspaceSlug: data?.estimate?.workspace_detail?.slug,
        projectId: data?.estimate?.project_detail?.id,
        projectName: data?.estimate?.project_detail?.name,
        projectIdentifier: data?.estimate?.project_detail?.identifier,
        estimateId: data.estimate?.id,
      };

    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName,
        extra: {
          ...payload,
        },
        user: user,
      },
    });
  }

  async trackImporterEvent(
    data: any,
    eventName: ImporterEventType,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    let payload: any;
    if (eventName === "GITHUB_IMPORTER_DELETE" || eventName === "JIRA_IMPORTER_DELETE")
      payload = data;
    else
      payload = {
        workspaceId: data?.workspace_detail?.id,
        workspaceName: data?.workspace_detail?.name,
        workspaceSlug: data?.workspace_detail?.slug,
        projectId: data?.project_detail?.id,
        projectName: data?.project_detail?.name,
        projectIdentifier: data?.project_detail?.identifier,
      };

    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName,
        extra: {
          ...payload,
        },
        user: user,
      },
    });
  }

  async trackAnalyticsEvent(
    data: any,
    eventName: AnalyticsEventType,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    const payload = { ...data };

    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName,
        extra: payload,
        user: user,
      },
    });
  }
}

const trackEventServices = new TrackEventServices();

export default trackEventServices;
