// services
import APIService from "services/api.service";
// types
import type { ICycle, IIssue, IModule, IProject, IState, IWorkspace } from "types";

// TODO: as we add more events, we can refactor this to be divided into different classes
class TrackEventServices extends APIService {
  constructor() {
    super("/");
  }

  async trackCreateWorkspaceEvent(data: IWorkspace): Promise<any> {
    const payload = {
      workspaceId: data.id,
      workspaceSlug: data.slug,
      workspaceName: data.name,
    };
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "CREATE_WORKSPACE",
        extra: {
          ...payload,
        },
      },
    });
  }

  async trackUpdateWorkspaceEvent(data: Partial<IWorkspace>): Promise<any> {
    const payload = {
      workspaceId: data.id,
      workspaceSlug: data.slug,
      workspaceName: data.name,
    };
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "UPDATE_WORKSPACE",
        extra: {
          ...payload,
        },
      },
    });
  }

  async trackDeleteWorkspaceEvent(data: any): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "DELETE_WORKSPACE",
        extra: {
          ...data,
        },
      },
    });
  }

  async trackCreateProjectEvent(data: IProject): Promise<any> {
    const payload = {
      workspaceId: data.workspace_detail.id,
      workspaceName: data.workspace_detail.name,
      workspaceSlug: data.workspace_detail.slug,
      projectId: data.id,
      projectName: data.name,
    };
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "CREATE_PROJECT",
        extra: {
          ...payload,
        },
      },
    });
  }

  async trackUpdateProjectEvent(data: Partial<IProject>): Promise<any> {
    const payload = {
      workspaceId: data?.workspace_detail?.id,
      workspaceName: data?.workspace_detail?.name,
      workspaceSlug: data?.workspace_detail?.slug,
      projectId: data.id,
      projectName: data.name,
    };
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "UPDATE_PROJECT",
        extra: {
          ...payload,
        },
      },
    });
  }

  async trackDeleteProjectEvent(data: any): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "DELETE_PROJECT",
        extra: {
          ...data,
        },
      },
    });
  }

  async trackWorkspaceUserInviteEvent(data: any): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "WORKSPACE_USER_INVITE",
        extra: {
          ...data,
        },
      },
    });
  }

  async trackWorkspaceUserJoinEvent(data: any): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "WORKSPACE_USER_INVITE_ACCEPT",
        extra: {
          ...data,
        },
      },
    });
  }

  async trackWorkspaceUserBulkJoinEvent(data: any): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "WORKSPACE_USER_BULK_INVITE_ACCEPT",
        extra: {
          ...data,
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

  async trackIssueCreateEvent(data: IIssue): Promise<any> {
    const payload = {
      workspaceId: data.workspace_detail.id,
      workspaceName: data.workspace_detail.name,
      workspaceSlug: data.workspace_detail.slug,
      projectId: data.project_detail.id,
      projectName: data.project_detail.name,
      projectIdentifier: data.project_detail.identifier,
      issueId: data.id,
      issueTitle: data.name,
    };
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "ISSUE_CREATE",
        extra: {
          ...payload,
        },
      },
    });
  }

  async trackIssueUpdateEvent(data: Partial<IIssue>): Promise<any> {
    const payload = {
      workspaceId: data?.workspace_detail?.id,
      workspaceName: data.workspace_detail?.name,
      workspaceSlug: data?.workspace_detail?.slug,
      projectId: data?.project_detail?.id,
      projectName: data?.project_detail?.name,
      projectIdentifier: data?.project_detail?.identifier,
      issueId: data.id,
      issueTitle: data.name,
    };
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "ISSUE_UPDATE",
        extra: {
          ...payload,
        },
      },
    });
  }

  async trackIssueDeleteEvent(data: any): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "ISSUE_DELETE",
        extra: {
          ...data,
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

  async trackStateCreateEvent(data: IState): Promise<any> {
    const payload = {
      workspaceId: data?.workspace_detail?.id,
      workspaceName: data?.workspace_detail?.name,
      workspaceSlug: data?.workspace_detail?.slug,
      projectId: data?.project_detail?.id,
      projectName: data?.project_detail?.name,
      projectIdentifier: data?.project_detail?.identifier,
      stateId: data.id,
      stateName: data.name,
    };
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "STATE_CREATE",
        extra: {
          ...payload,
        },
      },
    });
  }

  async trackStateUpdateEvent(data: Partial<IState>): Promise<any> {
    const payload = {
      workspaceId: data?.workspace_detail?.id,
      workspaceName: data?.workspace_detail?.name,
      workspaceSlug: data?.workspace_detail?.slug,
      projectId: data?.project_detail?.id,
      projectName: data?.project_detail?.name,
      projectIdentifier: data?.project_detail?.identifier,
      stateId: data.id,
      stateName: data.name,
    };
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "STATE_UPDATE",
        extra: {
          ...payload,
        },
      },
    });
  }

  async trackStateDeleteEvent(data: any): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "STATE_DELETE",
        extra: {
          ...data,
        },
      },
    });
  }

  async trackCycleCreateEvent(data: ICycle): Promise<any> {
    const payload = {
      workspaceId: data?.workspace_detail?.id,
      workspaceName: data?.workspace_detail?.name,
      workspaceSlug: data?.workspace_detail?.slug,
      projectId: data?.project_detail?.id,
      projectName: data?.project_detail?.name,
      projectIdentifier: data?.project_detail?.identifier,
      cycleId: data.id,
      cycleName: data.name,
    };
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

  async trackCycleUpdateEvent(data: Partial<ICycle>): Promise<any> {
    const payload = {
      workspaceId: data?.workspace_detail?.id,
      workspaceName: data?.workspace_detail?.name,
      workspaceSlug: data?.workspace_detail?.slug,
      projectId: data?.project_detail?.id,
      projectName: data?.project_detail?.name,
      projectIdentifier: data?.project_detail?.identifier,
      cycleId: data.id,
      cycleName: data.name,
    };
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "CYCLE_UPDATE",
        extra: {
          ...payload,
        },
      },
    });
  }

  async trackCycleDeleteEvent(data: any): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "CYCLE_DELETE",
        extra: {
          ...data,
        },
      },
    });
  }

  async trackModuleCreateEvent(data: IModule): Promise<any> {
    const payload = {
      workspaceId: data?.workspace_detail.id,
      workspaceName: data?.workspace_detail.name,
      workspaceSlug: data?.workspace_detail.slug,
      projectId: data?.project_detail?.id,
      projectName: data.project_detail?.name,
      moduleId: data.id,
      moduleName: data.name,
    };
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

  async trackModuleUpdateEvent(data: Partial<IModule>): Promise<any> {
    const payload = {
      workspaceId: data?.workspace_detail?.id,
      workspaceName: data?.workspace_detail?.name,
      workspaceSlug: data?.workspace_detail?.slug,
      projectId: data?.project_detail?.id,
      projectName: data.project_detail?.name,
      moduleId: data.id,
      moduleName: data.name,
    };
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "MODULE_UPDATE",
        extra: {
          ...payload,
        },
      },
    });
  }

  async trackModuleDeleteEvent(data: any): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "MODULE_DELETE",
        extra: {
          ...data,
        },
      },
    });
  }
}

const trackEventServices = new TrackEventServices();

export default trackEventServices;
