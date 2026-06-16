import { action, makeObservable, observable, runInAction } from "mobx";
// services
import type {
  IChangeRequest,
  IChangeApproval,
  IChangeTask,
  IChangeActivity,
  IChangeOverview,
  IChangeFilters,
  TChangeState,
  IAssignmentGroup,
  IAssignmentGroupMember,
} from "@/services/change-management.service";
import { ChangeManagementService } from "@/services/change-management.service";

export interface IChangeManagementStore {
  // observables
  changeMap: Record<string, IChangeRequest>;
  changeIds: string[];
  loader: boolean;
  error: string | null;
  overviewData: IChangeOverview | null;
  currentApprovals: IChangeApproval[];
  currentTasks: IChangeTask[];
  currentActivity: IChangeActivity[];

  // actions
  fetchChanges: (workspaceSlug: string, filters?: IChangeFilters) => Promise<void>;
  fetchChangeByNumber: (workspaceSlug: string, number: string) => Promise<IChangeRequest>;
  createChange: (workspaceSlug: string, data: Partial<IChangeRequest>) => Promise<IChangeRequest>;
  updateChange: (workspaceSlug: string, number: string, data: Partial<IChangeRequest>) => Promise<IChangeRequest>;
  deleteChange: (workspaceSlug: string, number: string) => Promise<void>;
  transitionState: (workspaceSlug: string, number: string, newState: TChangeState) => Promise<IChangeRequest>;
  approveChange: (workspaceSlug: string, number: string, comments?: string) => Promise<void>;
  rejectChange: (workspaceSlug: string, number: string, comments?: string) => Promise<void>;
  fetchApprovals: (workspaceSlug: string, number: string) => Promise<void>;
  fetchTasks: (workspaceSlug: string, number: string) => Promise<void>;
  updateTask: (workspaceSlug: string, number: string, taskId: string, data: Partial<IChangeTask>) => Promise<void>;
  createTask: (workspaceSlug: string, number: string, data: Partial<IChangeTask>) => Promise<IChangeTask>;
  deleteTask: (workspaceSlug: string, number: string, taskId: string) => Promise<void>;
  fetchActivity: (workspaceSlug: string, number: string) => Promise<void>;
  addComment: (workspaceSlug: string, number: string, comment: string) => Promise<void>;
  // Assignment Group State
  assignmentGroups: IAssignmentGroup[];
  fetchAssignmentGroups: (workspaceSlug: string) => Promise<void>;
  createAssignmentGroup: (workspaceSlug: string, data: Partial<IAssignmentGroup>) => Promise<IAssignmentGroup>;
  updateAssignmentGroup: (workspaceSlug: string, groupId: string, data: Partial<IAssignmentGroup>) => Promise<void>;
  deleteAssignmentGroup: (workspaceSlug: string, groupId: string) => Promise<void>;
  addGroupMember: (workspaceSlug: string, groupId: string, memberId: string) => Promise<void>;
  removeGroupMember: (workspaceSlug: string, groupId: string, membershipId: string) => Promise<void>;
}

export class ChangeManagementStore implements IChangeManagementStore {
  changeMap: Record<string, IChangeRequest> = {};
  changeIds: string[] = [];
  loader = false;
  error: string | null = null;
  overviewData: IChangeOverview | null = null;
  currentApprovals: IChangeApproval[] = [];
  currentTasks: IChangeTask[] = [];
  currentActivity: IChangeActivity[] = [];
  assignmentGroups: IAssignmentGroup[] = [];

  // service
  changeManagementService: ChangeManagementService;

  constructor() {
    makeObservable(this, {
      changeMap: observable,
      changeIds: observable,
      loader: observable,
      error: observable,
      overviewData: observable,
      currentApprovals: observable,
      currentTasks: observable,
      currentActivity: observable,
      assignmentGroups: observable,
      fetchChanges: action,
      fetchChangeByNumber: action,
      createChange: action,
      updateChange: action,
      deleteChange: action,
      transitionState: action,
      approveChange: action,
      rejectChange: action,
      fetchApprovals: action,
      fetchTasks: action,
      updateTask: action,
      createTask: action,
      deleteTask: action,
      fetchActivity: action,
      addComment: action,
      fetchOverview: action,
      fetchAssignmentGroups: action,
      createAssignmentGroup: action,
      updateAssignmentGroup: action,
      deleteAssignmentGroup: action,
      addGroupMember: action,
      removeGroupMember: action,
    });

    this.changeManagementService = new ChangeManagementService();
  }

  fetchChanges = async (workspaceSlug: string, filters?: IChangeFilters) => {
    try {
      this.loader = true;
      this.error = null;
      const changes = await this.changeManagementService.getChanges(workspaceSlug, filters);
      runInAction(() => {
        const map: Record<string, IChangeRequest> = {};
        const ids: string[] = [];
        changes.forEach((c) => {
          map[c.number] = c;
          ids.push(c.number);
        });
        this.changeMap = map;
        this.changeIds = ids;
        this.loader = false;
      });
    } catch (err) {
      runInAction(() => {
        this.loader = false;
        this.error = "Failed to fetch changes.";
      });
    }
  };

  fetchChangeByNumber = async (workspaceSlug: string, number: string): Promise<IChangeRequest> => {
    try {
      this.loader = true;
      const change = await this.changeManagementService.getChangeByNumber(workspaceSlug, number);
      runInAction(() => {
        this.changeMap[change.number] = change;
        if (!this.changeIds.includes(change.number)) {
          this.changeIds.push(change.number);
        }
        this.loader = false;
      });
      return change;
    } catch (err) {
      runInAction(() => {
        this.loader = false;
      });
      throw err;
    }
  };

  createChange = async (workspaceSlug: string, data: Partial<IChangeRequest>): Promise<IChangeRequest> => {
    try {
      const change = await this.changeManagementService.createChange(workspaceSlug, data);
      runInAction(() => {
        this.changeMap[change.number] = change;
        this.changeIds.unshift(change.number);
      });
      return change;
    } catch (err) {
      throw err;
    }
  };

  updateChange = async (
    workspaceSlug: string,
    number: string,
    data: Partial<IChangeRequest>
  ): Promise<IChangeRequest> => {
    try {
      const change = await this.changeManagementService.updateChange(workspaceSlug, number, data);
      runInAction(() => {
        this.changeMap[change.number] = change;
      });
      return change;
    } catch (err) {
      throw err;
    }
  };

  deleteChange = async (workspaceSlug: string, number: string): Promise<void> => {
    try {
      await this.changeManagementService.deleteChange(workspaceSlug, number);
      runInAction(() => {
        if (this.changeMap[number]) {
          this.changeMap[number].state = "cancelled";
        }
      });
    } catch (err) {
      throw err;
    }
  };

  transitionState = async (
    workspaceSlug: string,
    number: string,
    newState: TChangeState
  ): Promise<IChangeRequest> => {
    try {
      const change = await this.changeManagementService.transitionState(workspaceSlug, number, newState);
      runInAction(() => {
        this.changeMap[change.number] = change;
      });
      return change;
    } catch (err) {
      throw err;
    }
  };

  approveChange = async (workspaceSlug: string, number: string, comments?: string): Promise<void> => {
    try {
      await this.changeManagementService.approveChange(workspaceSlug, number, comments);
      // Refresh approvals AND the change itself (state may have auto-progressed)
      await Promise.all([
        this.fetchApprovals(workspaceSlug, number),
        this.fetchChangeByNumber(workspaceSlug, number),
      ]);
    } catch (err) {
      throw err;
    }
  };

  rejectChange = async (workspaceSlug: string, number: string, comments?: string): Promise<void> => {
    try {
      await this.changeManagementService.rejectChange(workspaceSlug, number, comments);
      // Refresh approvals and the change itself (state may have changed)
      await Promise.all([this.fetchApprovals(workspaceSlug, number), this.fetchChangeByNumber(workspaceSlug, number)]);
    } catch (err) {
      throw err;
    }
  };

  fetchApprovals = async (workspaceSlug: string, number: string): Promise<void> => {
    try {
      const approvals = await this.changeManagementService.getApprovals(workspaceSlug, number);
      runInAction(() => {
        this.currentApprovals = approvals;
      });
    } catch (err) {
      runInAction(() => {
        this.currentApprovals = [];
      });
    }
  };

  fetchTasks = async (workspaceSlug: string, number: string): Promise<void> => {
    try {
      const tasks = await this.changeManagementService.getTasks(workspaceSlug, number);
      runInAction(() => {
        this.currentTasks = tasks;
      });
    } catch (err) {
      runInAction(() => {
        this.currentTasks = [];
      });
    }
  };

  updateTask = async (
    workspaceSlug: string,
    number: string,
    taskId: string,
    data: Partial<IChangeTask>
  ): Promise<void> => {
    try {
      await this.changeManagementService.updateTask(workspaceSlug, number, taskId, data);
      await this.fetchTasks(workspaceSlug, number);
    } catch (err) {
      throw err;
    }
  };

  createTask = async (
    workspaceSlug: string,
    number: string,
    data: Partial<IChangeTask>
  ): Promise<IChangeTask> => {
    try {
      const task = await this.changeManagementService.createTask(workspaceSlug, number, data);
      await this.fetchTasks(workspaceSlug, number);
      return task;
    } catch (err) {
      throw err;
    }
  };

  deleteTask = async (
    workspaceSlug: string,
    number: string,
    taskId: string
  ): Promise<void> => {
    try {
      await this.changeManagementService.deleteTask(workspaceSlug, number, taskId);
      await this.fetchTasks(workspaceSlug, number);
    } catch (err) {
      throw err;
    }
  };

  fetchActivity = async (workspaceSlug: string, number: string): Promise<void> => {
    try {
      const activity = await this.changeManagementService.getActivity(workspaceSlug, number);
      runInAction(() => {
        this.currentActivity = activity;
      });
    } catch (err) {
      runInAction(() => {
        this.currentActivity = [];
      });
    }
  };

  addComment = async (workspaceSlug: string, number: string, comment: string): Promise<void> => {
    try {
      await this.changeManagementService.addComment(workspaceSlug, number, comment);
      await this.fetchActivity(workspaceSlug, number);
    } catch (err) {
      throw err;
    }
  };

  fetchOverview = async (workspaceSlug: string): Promise<void> => {
    try {
      this.loader = true;
      const data = await this.changeManagementService.getOverview(workspaceSlug);
      runInAction(() => {
        this.overviewData = data;
        this.loader = false;
      });
    } catch (err) {
      runInAction(() => {
        this.loader = false;
      });
    }
  };

  // ------------------------------------------------------------------
  // Assignment Groups
  // ------------------------------------------------------------------
  fetchAssignmentGroups = async (workspaceSlug: string): Promise<void> => {
    try {
      const data = await this.changeManagementService.getAssignmentGroups(workspaceSlug);
      runInAction(() => {
        this.assignmentGroups = data;
      });
    } catch (err) {
      throw err;
    }
  };

  createAssignmentGroup = async (workspaceSlug: string, data: Partial<IAssignmentGroup>): Promise<IAssignmentGroup> => {
    try {
      const res = await this.changeManagementService.createAssignmentGroup(workspaceSlug, data);
      await this.fetchAssignmentGroups(workspaceSlug);
      return res;
    } catch (err) {
      throw err;
    }
  };

  updateAssignmentGroup = async (workspaceSlug: string, groupId: string, data: Partial<IAssignmentGroup>): Promise<void> => {
    try {
      await this.changeManagementService.updateAssignmentGroup(workspaceSlug, groupId, data);
      await this.fetchAssignmentGroups(workspaceSlug);
    } catch (err) {
      throw err;
    }
  };

  deleteAssignmentGroup = async (workspaceSlug: string, groupId: string): Promise<void> => {
    try {
      await this.changeManagementService.deleteAssignmentGroup(workspaceSlug, groupId);
      await this.fetchAssignmentGroups(workspaceSlug);
    } catch (err) {
      throw err;
    }
  };

  addGroupMember = async (workspaceSlug: string, groupId: string, memberId: string): Promise<void> => {
    try {
      await this.changeManagementService.addGroupMember(workspaceSlug, groupId, memberId);
      await this.fetchAssignmentGroups(workspaceSlug);
    } catch (err) {
      throw err;
    }
  };

  removeGroupMember = async (workspaceSlug: string, groupId: string, membershipId: string): Promise<void> => {
    try {
      await this.changeManagementService.removeGroupMember(workspaceSlug, groupId, membershipId);
      await this.fetchAssignmentGroups(workspaceSlug);
    } catch (err) {
      throw err;
    }
  };
}
