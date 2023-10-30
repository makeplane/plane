import { action, computed, observable, makeObservable, runInAction } from "mobx";
import { RootStore } from "../root";
// types
import { IIssueLabels, IProject, IWorkspace, IWorkspaceMember } from "types";
// services
import { WorkspaceService } from "services/workspace.service";
import { ProjectService } from "services/project";
import { IssueService, IssueLabelService } from "services/issue";

export interface IWorkspaceStore {
  // states
  loader: boolean;
  error: any | null;

  // observables
  workspaceSlug: string | null;
  workspaces: IWorkspace[];
  labels: { [workspaceSlug: string]: IIssueLabels[] }; // workspaceSlug: labels[]
  members: { [workspaceSlug: string]: IWorkspaceMember[] }; // workspaceSlug: members[]

  // actions
  setWorkspaceSlug: (workspaceSlug: string) => void;
  getWorkspaceBySlug: (workspaceSlug: string) => IWorkspace | null;
  getWorkspaceLabelById: (workspaceSlug: string, labelId: string) => IIssueLabels | null;
  fetchWorkspaces: () => Promise<void>;
  fetchWorkspaceLabels: (workspaceSlug: string) => Promise<void>;
  fetchWorkspaceMembers: (workspaceSlug: string) => Promise<void>;

  // workspace write operations
  createWorkspace: (data: Partial<IWorkspace>) => Promise<IWorkspace>;
  updateWorkspace: (workspaceSlug: string, data: Partial<IWorkspace>) => Promise<IWorkspace>;
  deleteWorkspace: (workspaceSlug: string) => Promise<void>;

  // members write operations
  updateMember: (workspaceSlug: string, memberId: string, data: Partial<IWorkspaceMember>) => Promise<void>;
  removeMember: (workspaceSlug: string, memberId: string) => Promise<void>;

  // computed
  currentWorkspace: IWorkspace | null;
  workspaceLabels: IIssueLabels[] | null;
  workspaceMembers: IWorkspaceMember[] | null;
}

export class WorkspaceStore implements IWorkspaceStore {
  // states
  loader: boolean = false;
  error: any | null = null;

  // observables
  workspaceSlug: string | null = null;
  workspaces: IWorkspace[] = [];
  projects: { [workspaceSlug: string]: IProject[] } = {}; // workspace_id: project[]
  labels: { [workspaceSlug: string]: IIssueLabels[] } = {};
  members: { [workspaceSlug: string]: IWorkspaceMember[] } = {};

  // services
  workspaceService;
  projectService;
  issueService;
  issueLabelService;
  // root store
  rootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // states
      loader: observable.ref,
      error: observable.ref,

      // observables
      workspaceSlug: observable.ref,
      workspaces: observable.ref,
      labels: observable.ref,
      members: observable.ref,

      // actions
      setWorkspaceSlug: action,
      getWorkspaceBySlug: action,
      getWorkspaceLabelById: action,
      fetchWorkspaces: action,
      fetchWorkspaceLabels: action,
      fetchWorkspaceMembers: action,

      // workspace write operations
      createWorkspace: action,
      updateWorkspace: action,
      deleteWorkspace: action,

      // members write operations
      updateMember: action,
      removeMember: action,

      // computed
      currentWorkspace: computed,
      workspaceLabels: computed,
      workspaceMembers: computed,
    });

    this.rootStore = _rootStore;
    this.workspaceService = new WorkspaceService();
    this.projectService = new ProjectService();
    this.issueService = new IssueService();
    this.issueLabelService = new IssueLabelService();
  }

  /**
   * computed value of current workspace based on workspace id saved in the store
   */
  get currentWorkspace() {
    if (!this.workspaceSlug) return null;

    return this.workspaces?.find((workspace) => workspace.slug === this.workspaceSlug) || null;
  }

  /**
   * computed value of workspace labels using the workspace slug from the store
   */
  get workspaceLabels() {
    if (!this.workspaceSlug) return [];
    const _labels = this.labels?.[this.workspaceSlug];
    return _labels && Object.keys(_labels).length > 0 ? _labels : [];
  }

  /**
   * computed value of workspace members using the workspace slug from the store
   */
  get workspaceMembers() {
    if (!this.workspaceSlug) return [];
    const _members = this.members?.[this.workspaceSlug];
    return _members && Object.keys(_members).length > 0 ? _members : [];
  }

  /**
   * set workspace slug in the store
   * @param workspaceSlug
   * @returns
   */
  setWorkspaceSlug = (workspaceSlug: string) => (this.workspaceSlug = workspaceSlug);

  /**
   * fetch workspace info from the array of workspaces in the store.
   * @param workspaceSlug
   */
  getWorkspaceBySlug = (workspaceSlug: string) => this.workspaces.find((w) => w.slug == workspaceSlug) || null;

  /**
   * get workspace label information from the workspace labels
   * @param labelId
   * @returns
   */
  getWorkspaceLabelById = (workspaceSlug: string, labelId: string) =>
    this.labels?.[workspaceSlug].find((label) => label.id === labelId) || null;

  /**
   * fetch user workspaces from API
   */
  fetchWorkspaces = async () => {
    try {
      this.loader = true;
      this.error = null;

      const workspaceResponse = await this.workspaceService.userWorkspaces();

      runInAction(() => {
        this.workspaces = workspaceResponse;
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      console.log("Failed to fetch user workspaces in workspace store", error);
      this.loader = false;
      this.error = error;
      this.workspaces = [];
    }
  };

  /**
   * fetch workspace labels using workspace slug
   * @param workspaceSlug
   */
  fetchWorkspaceLabels = async (workspaceSlug: string) => {
    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
      });

      const labelsResponse = await this.issueLabelService.getWorkspaceIssueLabels(workspaceSlug);

      runInAction(() => {
        this.labels = {
          ...this.labels,
          [workspaceSlug]: labelsResponse,
        };
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });
    }
  };

  /**
   * fetch workspace members using workspace slug
   * @param workspaceSlug
   */
  fetchWorkspaceMembers = async (workspaceSlug: string) => {
    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
      });

      const membersResponse = await this.workspaceService.workspaceMembers(workspaceSlug);

      runInAction(() => {
        this.members = {
          ...this.members,
          [workspaceSlug]: membersResponse,
        };
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });
    }
  };

  /**
   * create workspace using the workspace data
   * @param data
   */
  createWorkspace = async (data: Partial<IWorkspace>) => {
    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
      });

      const user = this.rootStore.user.currentUser ?? undefined;

      const response = await this.workspaceService.createWorkspace(data, user);

      runInAction(() => {
        this.loader = false;
        this.error = null;
        this.workspaces = [...this.workspaces, response];
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
    }
  };

  /**
   * update workspace using the workspace slug and new workspace data
   * @param workspaceSlug
   * @param data
   */
  updateWorkspace = async (workspaceSlug: string, data: Partial<IWorkspace>) => {
    const newWorkspaces = this.workspaces?.map((w) => (w.slug === workspaceSlug ? { ...w, ...data } : w));

    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
      });

      const user = this.rootStore.user.currentUser ?? undefined;

      const response = await this.workspaceService.updateWorkspace(workspaceSlug, data, user);

      runInAction(() => {
        this.loader = false;
        this.error = null;
        this.workspaces = newWorkspaces;
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
    }
  };

  /**
   * delete workspace using the workspace slug
   * @param workspaceSlug
   */
  deleteWorkspace = async (workspaceSlug: string) => {
    const newWorkspaces = this.workspaces?.filter((w) => w.slug !== workspaceSlug);

    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
      });

      const user = this.rootStore.user.currentUser ?? undefined;

      await this.workspaceService.deleteWorkspace(workspaceSlug, user);

      runInAction(() => {
        this.loader = false;
        this.error = null;
        this.workspaces = newWorkspaces;
      });
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
    }
  };

  /**
   * update workspace member using workspace slug and member id and data
   * @param workspaceSlug
   * @param memberId
   * @param data
   */
  updateMember = async (workspaceSlug: string, memberId: string, data: Partial<IWorkspaceMember>) => {
    const members = this.members?.[workspaceSlug];
    members?.map((m) => (m.id === memberId ? { ...m, ...data } : m));

    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
      });

      await this.workspaceService.updateWorkspaceMember(workspaceSlug, memberId, data);

      runInAction(() => {
        this.loader = false;
        this.error = null;
        this.members = {
          ...this.members,
          [workspaceSlug]: members,
        };
      });
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
    }
  };

  /**
   * remove workspace member using workspace slug and member id
   * @param workspaceSlug
   * @param memberId
   */
  removeMember = async (workspaceSlug: string, memberId: string) => {
    const members = this.members?.[workspaceSlug];
    members?.filter((m) => m.id !== memberId);

    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
      });

      await this.workspaceService.deleteWorkspaceMember(workspaceSlug, memberId);

      runInAction(() => {
        this.loader = false;
        this.error = null;
        this.members = {
          ...this.members,
          [workspaceSlug]: members,
        };
      });
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
    }
  };
}
