// services
import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

// types
export type TChangeType = "normal" | "standard";

export type TChangeState =
  | "new"
  | "assess"
  | "authorize"
  | "scheduled"
  | "implement"
  | "review"
  | "closed"
  | "cancelled";

export type TChangePriority = "1_critical" | "2_high" | "3_moderate" | "4_low";
export type TChangeRisk = "1_critical" | "2_high" | "3_moderate" | "4_low";
export type TChangeImpact = "1_high" | "2_medium" | "3_low";
export type TChangeCategory = "hardware" | "software" | "network" | "security" | "database" | "application" | "other";
export type TApprovalLevel = "peer_review" | "cab";
export type TApprovalStatus = "pending" | "approved" | "rejected";
export type TTaskType = "implementation" | "testing" | "review" | "other";
export type TTaskState = "pending" | "in_progress" | "closed_complete" | "closed_incomplete" | "closed_skipped";
export type TCloseCode = "successful" | "successful_with_issues" | "unsuccessful" | "skipped";

export interface IChangeRequest {
  id: string;
  sequence_number: number;
  number: string;
  type: TChangeType;
  state: TChangeState;
  priority: TChangePriority;
  risk: TChangeRisk;
  impact: TChangeImpact;
  category: TChangeCategory;
  short_description: string;
  description_html: string;
  service: string | null;
  configuration_item: string | null;
  conflict_status: string;
  conflict_last_run: string | null;
  requested_by: string | null;
  requested_by_display: string | null;
  assignment_group: string | null;
  assignment_group_display: string | null;
  justification: string | null;
  implementation_plan: string | null;
  risk_and_impact_analysis: string | null;
  backout_plan: string | null;
  test_plan: string | null;
  planned_start_date: string | null;
  planned_end_date: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  cab_required: boolean;
  cab_date: string | null;
  cab_delegate: string | null;
  cab_recommendation: string | null;
  close_code: TCloseCode | null;
  close_notes: string | null;
  on_hold: boolean;
  on_hold_reason: string | null;
  project_id: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface IAssignmentGroupMember {
  id: string;
  assignment_group: string;
  member: string;
  member_email: string;
  member_name: string;
  created_at: string;
  updated_at: string;
}

export interface IAssignmentGroup {
  id: string;
  workspace: string;
  name: string;
  description: string;
  is_active: boolean;
  members: IAssignmentGroupMember[];
  created_at: string;
  updated_at: string;
}

export interface IChangeApproval {
  id: string;
  change_request_id: string;
  approver: string;
  approver_display: string | null;
  approval_level: TApprovalLevel;
  status: TApprovalStatus;
  comments: string | null;
  decided_at: string | null;
  created_at: string;
}

export interface IChangeTask {
  id: string;
  change_request_id: string;
  short_description: string;
  task_type: TTaskType;
  state: TTaskState;
  assignment_group: string | null;
  assignment_group_display: string | null;
  description: string | null;
  due_date: string | null;
  order: number;
  closed_at: string | null;
  created_at: string;
}

export interface IChangeActivity {
  id: string;
  change_request_id: string;
  actor: string | null;
  actor_display: string | null;
  verb: string;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  comment: string | null;
  created_at: string;
}

export interface IChangeOverview {
  todays_new_count: number;
  critical_open_count: number;
  overdue_count: number;
  todays_high_risk_count: number;
  on_hold_count: number;
  awaiting_approval_count: number;
  open_grouped_by_risk: Record<string, number>;
}

export interface IChangeFilters {
  type?: TChangeType;
  state?: TChangeState;
  priority?: TChangePriority;
  risk?: TChangeRisk;
  requested_by?: string;
  date_from?: string;
  date_to?: string;
  view?: "open" | "closed";
}

export class ChangeManagementService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * The change number format is CHG-WINJIT-#00001.
   * The '#' must be percent-encoded in URL path segments so it is not
   * interpreted as a fragment identifier.
   */
  private encNum(n: string): string {
    return encodeURIComponent(n);
  }

  async getChanges(workspaceSlug: string, filters?: IChangeFilters): Promise<IChangeRequest[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const query = params.toString();
    return this.get(`/api/workspaces/${workspaceSlug}/changes/${query ? `?${query}` : ""}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getChangeByNumber(workspaceSlug: string, number: string): Promise<IChangeRequest> {
    return this.get(`/api/workspaces/${workspaceSlug}/changes/${this.encNum(number)}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createChange(workspaceSlug: string, data: Partial<IChangeRequest>): Promise<IChangeRequest> {
    return this.post(`/api/workspaces/${workspaceSlug}/changes/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateChange(
    workspaceSlug: string,
    number: string,
    data: Partial<IChangeRequest>
  ): Promise<IChangeRequest> {
    return this.patch(`/api/workspaces/${workspaceSlug}/changes/${this.encNum(number)}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteChange(workspaceSlug: string, number: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/changes/${this.encNum(number)}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async transitionState(
    workspaceSlug: string,
    number: string,
    newState: TChangeState
  ): Promise<IChangeRequest> {
    return this.post(`/api/workspaces/${workspaceSlug}/changes/${this.encNum(number)}/transition/`, { state: newState })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async approveChange(workspaceSlug: string, number: string, comments?: string): Promise<IChangeApproval> {
    return this.post(`/api/workspaces/${workspaceSlug}/changes/${this.encNum(number)}/approve/`, { comments: comments || "" })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async rejectChange(workspaceSlug: string, number: string, comments?: string): Promise<IChangeApproval> {
    return this.post(`/api/workspaces/${workspaceSlug}/changes/${this.encNum(number)}/reject/`, { comments: comments || "" })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getApprovals(workspaceSlug: string, number: string): Promise<IChangeApproval[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/changes/${this.encNum(number)}/approvals/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getTasks(workspaceSlug: string, number: string): Promise<IChangeTask[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/changes/${this.encNum(number)}/tasks/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateTask(
    workspaceSlug: string,
    number: string,
    taskId: string,
    data: Partial<IChangeTask>
  ): Promise<IChangeTask> {
    return this.patch(`/api/workspaces/${workspaceSlug}/changes/${this.encNum(number)}/tasks/${taskId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createTask(
    workspaceSlug: string,
    number: string,
    data: Partial<IChangeTask>
  ): Promise<IChangeTask> {
    return this.post(`/api/workspaces/${workspaceSlug}/changes/${this.encNum(number)}/tasks/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        // Safety: if server returns HTML (e.g. 404 page), don't dump it into UI
        const errData = error?.response?.data;
        if (typeof errData === "string" && errData.includes("<")) {
          throw { error: "Unable to create task. Please try again." };
        }
        throw errData || { error: "Unable to create task. Please try again." };
      });
  }

  async deleteTask(
    workspaceSlug: string,
    number: string,
    taskId: string
  ): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/changes/${this.encNum(number)}/tasks/${taskId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        const errData = error?.response?.data;
        if (typeof errData === "string" && errData.includes("<")) {
          throw { error: "Unable to delete task. Please try again." };
        }
        throw errData || { error: "Unable to delete task. Please try again." };
      });
  }

  async getActivity(workspaceSlug: string, number: string): Promise<IChangeActivity[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/changes/${this.encNum(number)}/activity/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addComment(workspaceSlug: string, number: string, comment: string): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/changes/${this.encNum(number)}/comment/`, { comment })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // ------------------------------------------------------------------
  // Assignment Groups
  // ------------------------------------------------------------------
  async getAssignmentGroups(workspaceSlug: string): Promise<IAssignmentGroup[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/assignment-groups/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createAssignmentGroup(workspaceSlug: string, data: Partial<IAssignmentGroup>): Promise<IAssignmentGroup> {
    return this.post(`/api/workspaces/${workspaceSlug}/assignment-groups/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateAssignmentGroup(workspaceSlug: string, groupId: string, data: Partial<IAssignmentGroup>): Promise<IAssignmentGroup> {
    return this.patch(`/api/workspaces/${workspaceSlug}/assignment-groups/${groupId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteAssignmentGroup(workspaceSlug: string, groupId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/assignment-groups/${groupId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addGroupMember(workspaceSlug: string, groupId: string, memberId: string): Promise<IAssignmentGroupMember> {
    return this.post(`/api/workspaces/${workspaceSlug}/assignment-groups/${groupId}/members/`, { member: memberId })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeGroupMember(workspaceSlug: string, groupId: string, membershipId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/assignment-groups/${groupId}/members/${membershipId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getOverview(workspaceSlug: string): Promise<IChangeOverview> {
    return this.get(`/api/workspaces/${workspaceSlug}/changes/overview/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
