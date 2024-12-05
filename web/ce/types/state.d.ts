export interface IStateTransition {
  transition_state_id: string;
  actors: string[];
}

export interface IStateWorkFlow {
  [transitionId: string]: IStateTransition;
}
