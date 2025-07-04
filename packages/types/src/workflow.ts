import { TProjectBaseActivity } from "./activity";

export interface IStateTransition {
  transition_state_id: string;
  approvers: string[];
}

export interface IStateWorkFlow {
  [transitionId: string]: IStateTransition;
}

export type TStateTransitionMap = Record<string, IStateTransition>; // transitionId: IStateTransition

export interface IStateWorkFlowResponse {
  allow_issue_creation: boolean;
  transitions: TStateTransitionMap;
}

export type TWorkflowChangeHistoryFields =
  | "is_workflow_enabled"
  | "allow_work_item_creation"
  | "state_transition"
  | "state_transition_approver"
  | "reset";

export type TWorkflowChangeHistoryVerbs = "added" | "removed" | "enabled" | "disabled" | "updated";

export type TWorkflowChangeHistoryKeys = `${TWorkflowChangeHistoryFields}_${TWorkflowChangeHistoryVerbs}`;

export type TWorkflowChangeHistory = TProjectBaseActivity<TWorkflowChangeHistoryFields, TWorkflowChangeHistoryVerbs> & {
  state_id?: string | null;
  transition_state_id?: string | null;
};

export interface IStateTransitionTree {
  transition_state_ids: string[];
  approvers: string[];
}
