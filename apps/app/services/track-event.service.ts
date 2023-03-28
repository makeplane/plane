// services
import APIService from "services/api.service";
// types
import type { IWorkspace } from "types";

// TODO: as we add more events, we can refactor this to be divided into different classes
class TrackEventServices extends APIService {
  constructor() {
    super("/");
  }

  async trackCreateWorkspaceEvent(data: IWorkspace): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "CREATE_WORKSPACE",
        extra: {
          ...data,
        },
      },
    });
  }

  async trackUpdateWorkspaceEvent(data: IWorkspace): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "UPDATE_WORKSPACE",
        extra: {
          ...data,
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

  async trackCreateProjectEvent(data: any): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "CREATE_PROJECT",
        extra: {
          ...data,
        },
      },
    });
  }

  async trackUpdateProjectEvent(data: any): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "UPDATE_PROJECT",
        extra: {
          ...data,
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

  async trackIssueCreateEvent(data: any): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "ISSUE_CREATE",
        extra: {
          ...data,
        },
      },
    });
  }

  async trackIssueUpdateEvent(data: any): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "ISSUE_UPDATE",
        extra: {
          ...data,
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

  async trackStateCreateEvent(data: any): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "STATE_CREATE",
        extra: {
          ...data,
        },
      },
    });
  }

  async trackStateUpdateEvent(data: any): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "STATE_UPDATE",
        extra: {
          ...data,
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

  async trackCycleCreateEvent(data: any): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "CYCLE_CREATE",
        extra: {
          ...data,
        },
      },
    });
  }

  async trackCycleUpdateEvent(data: any): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "CYCLE_UPDATE",
        extra: {
          ...data,
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

  async trackModuleCreateEvent(data: any): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "MODULE_CREATE",
        extra: {
          ...data,
        },
      },
    });
  }

  async trackModuleUpdateEvent(data: any): Promise<any> {
    return this.request({
      url: "/api/track-event",
      method: "POST",
      data: {
        eventName: "MODULE_UPDATE",
        extra: {
          ...data,
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
