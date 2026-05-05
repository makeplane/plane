export interface IWorkflowTransitionData {
  transition_state: string;
  approvers: string[]; // user UUIDs
}

export interface IWorkflowStateData {
  allow_issue_creation: boolean;
  transitions: Record<string, IWorkflowTransitionData>; // keyed by transition UUID
}

export interface IProjectWorkflowStore {
  isLive: boolean;
  states: Record<string, IWorkflowStateData>; // keyed by state UUID
}

export interface IWorkflowBlockerModal {
  isOpen: boolean;
  allowedReviewers: string[]; // user UUIDs
  fromState: string;
  toState: string;
}

export interface IProjectWorkflow {
  id: string;
  project: string;
  is_live: boolean;
}

export interface IWorkflowActivity {
  id: string;
  field: string;
  old_value: string | null;
  new_value: string | null;
  actor: string | null;
  actor_detail: { id: string; display_name: string } | null;
  created_at: string;
}
