import { observable, action, computed, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "./root";
import { IProject, IIssueLabels, IProjectMember, IStateResponse, IState } from "types";
// services
import { ProjectServices } from "services/project.service";
import { ProjectIssuesServices } from "services/issues.service";
import { ProjectStateServices } from "services/state.service";

export interface IProjectStore {
  loader: boolean;
  error: any | null;

  projectLeaveModal: boolean;
  projectLeaveDetails: IProject | any;

  projectId: string | null;
  projects: {
    [key: string]: { [key: string]: IProject }; // workspace_id: project_id: projects
  } | null;
  states: {
    [key: string]: IStateResponse; // project_id: states
  } | null;
  labels: {
    [key: string]: IIssueLabels[]; // project_id: labels
  } | null;
  members: {
    [key: string]: IProjectMember[]; // project_id: members
  } | null;

  // computed
  projectStatesByGroups: IStateResponse | null;
  projectStates: IState[] | null;
  projectLabels: IIssueLabels[] | null;
  projectMembers: IProjectMember[] | null;
  workspaceProjects: { [key: string]: IProject } | null;

  // actions
  projectStateById: (stateId: string) => IState | null;
  projectLabelById: (labelId: string) => IIssueLabels | null;
  projectMemberById: (memberId: string) => IProjectMember | null;

  setProject: (projectSlug: string) => void;

  getWorkspaceProjects: (workspaceSlug: string, is_favorite?: "all" | boolean) => Promise<void>;
  getProjectStates: (workspaceSlug: string, projectSlug: string) => Promise<void>;
  getProjectLabels: (workspaceSlug: string, projectSlug: string) => Promise<void>;
  getProjectMembers: (workspaceSlug: string, projectSlug: string) => Promise<void>;

  handleProjectLeaveModal: (project: IProject | null) => void;

  leaveProject: (workspaceSlug: string, projectSlug: string, user: any) => Promise<void>;
}

class ProjectStore implements IProjectStore {
  loader: boolean = false;
  error: any | null = null;

  projectLeaveModal: boolean = false;
  projectLeaveDetails: IProject | null = null;

  projectId: string | null = null;
  projects: {
    [key: string]: { [key: string]: IProject }; // workspace_id: project_id: projects
  } | null = null;
  states: {
    [key: string]: IStateResponse; // project_id: states
  } | null = null;
  labels: {
    [key: string]: IIssueLabels[]; // project_id: labels
  } | null = null;
  members: {
    [key: string]: IProjectMember[]; // project_id: members
  } | null = null;

  // root store
  rootStore;
  // service
  projectService;
  issueService;
  stateService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable,
      error: observable,

      projectId: observable.ref,
      projects: observable.ref,
      states: observable.ref,
      labels: observable.ref,
      members: observable.ref,

      projectLeaveModal: observable,
      projectLeaveDetails: observable.ref,

      // computed
      workspaceProjects: computed,
      projectStatesByGroups: computed,
      projectStates: computed,
      projectLabels: computed,
      projectMembers: computed,

      // action
      setProject: action,

      projectStateById: action,
      projectLabelById: action,
      projectMemberById: action,

      getWorkspaceProjects: action,
      getProjectStates: action,
      getProjectLabels: action,
      getProjectMembers: action,

      handleProjectLeaveModal: action,
      leaveProject: action,
    });

    this.rootStore = _rootStore;
    this.projectService = new ProjectServices();
    this.issueService = new ProjectIssuesServices();
    this.stateService = new ProjectStateServices();
  }

  // computed
  get workspaceProjects() {
    if (!this.rootStore.workspace.workspaceId) return null;
    return this.projects?.[this.rootStore.workspace.workspaceId] || null;
  }
  get projectStatesByGroups() {
    if (!this.projectId) return null;
    return this.states?.[this.projectId] || null;
  }
  get projectStates() {
    if (!this.projectId) return null;
    const stateByGroups: IStateResponse | null = this.projectStatesByGroups;
    if (!stateByGroups) return null;
    const _states: IState[] = [];
    Object.keys(stateByGroups).forEach((_stateGroup: string) => {
      stateByGroups[_stateGroup].map((state) => {
        _states.push(state);
      });
    });
    return _states && _states.length > 0 ? _states : null;
  }
  get projectLabels() {
    if (!this.projectId) return null;
    return this.labels?.[this.projectId] || null;
  }
  get projectMembers() {
    if (!this.projectId) return null;
    return this.members?.[this.projectId] || null;
  }

  // actions
  projectStateById = (stateId: string) => {
    if (!this.projectId) return null;
    const states = this.projectStates;
    if (!states) return null;
    const stateInfo: IState | null = states.find((state) => state.id === stateId) || null;
    return stateInfo;
  };
  projectLabelById = (labelId: string) => {
    if (!this.projectId) return null;
    const labels = this.projectLabels;
    if (!labels) return null;
    const labelInfo: IIssueLabels | null = labels.find((label) => label.id === labelId) || null;
    return labelInfo;
  };
  projectMemberById = (memberId: string) => {
    if (!this.projectId) return null;
    const members = this.projectMembers;
    if (!members) return null;
    const memberInfo: IProjectMember | null = members.find((member) => member.id === memberId) || null;
    return memberInfo;
  };

  setProject = (projectSlug: string) => {
    this.projectId = projectSlug ?? null;
  };

  getWorkspaceProjects = async (workspaceSlug: string, is_favorite: "all" | boolean = "all") => {
    try {
      this.loader = true;
      this.error = null;

      const params: { is_favorite: "all" | boolean } = { is_favorite: is_favorite };
      const projectsResponse = await this.projectService.getProjects(workspaceSlug, params);

      let _projects: { [key: string]: IProject } = {};
      projectsResponse.map((project) => {
        _projects = { ..._projects, [project.id]: project };
      });

      runInAction(() => {
        this.projects = {
          ...this.projects,
          [workspaceSlug]: _projects,
        };
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      console.error(error);
      this.loader = false;
      this.error = error;
    }
  };
  getProjectStates = async (workspaceSlug: string, projectSlug: string) => {
    try {
      this.loader = true;
      this.error = null;

      const stateResponse = await this.stateService.getStates(workspaceSlug, projectSlug);
      const _states = {
        ...this.states,
        [projectSlug]: stateResponse,
      };

      runInAction(() => {
        this.states = _states;
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      console.error(error);
      this.loader = false;
      this.error = error;
    }
  };
  getProjectLabels = async (workspaceSlug: string, projectSlug: string) => {
    try {
      this.loader = true;
      this.error = null;

      const labelResponse = await this.issueService.getIssueLabels(workspaceSlug, projectSlug);
      const _labels = {
        ...this.labels,
        [projectSlug]: labelResponse,
      };

      runInAction(() => {
        this.labels = _labels;
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      console.error(error);
      this.loader = false;
      this.error = error;
    }
  };
  getProjectMembers = async (workspaceSlug: string, projectSlug: string) => {
    try {
      this.loader = true;
      this.error = null;

      const membersResponse = await this.projectService.projectMembers(workspaceSlug, projectSlug);
      const _members = {
        ...this.members,
        [projectSlug]: membersResponse,
      };

      runInAction(() => {
        this.members = _members;
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      console.error(error);
      this.loader = false;
      this.error = error;
    }
  };

  handleProjectLeaveModal = (project: IProject | null = null) => {
    if (project && project?.id) {
      this.projectLeaveModal = !this.projectLeaveModal;
      this.projectLeaveDetails = project;
    } else {
      this.projectLeaveModal = !this.projectLeaveModal;
      this.projectLeaveDetails = null;
    }
  };

  leaveProject = async (workspaceSlug: string, projectSlug: string, user: any) => {
    try {
      this.loader = true;
      this.error = null;

      const response = await this.projectService.leaveProject(workspaceSlug, projectSlug, user);

      runInAction(() => {
        this.loader = false;
        this.error = null;
      });

      return response;
    } catch (error) {
      this.loader = false;
      this.error = error;
      return error;
    }
  };
}

export default ProjectStore;
