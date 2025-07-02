export type TCycleUpdateStatus =
  | "ON_TRACK"
  | "OFF_TRACK"
  | "AT_RISK"
  | "STARTED"
  | "ENDED"
  | "SCOPE_INCREASED"
  | "SCOPE_DECREASED";

export type TCycleUpdates = {
  cycle: string;
  description: string;
  status: TCycleUpdateStatus;
  parent: string;
  completed_issues: number;
  total_issues: number;
  total_estimate_points: number;
  completed_estimate_points: number;
  delete_at: string;
  created_at: string;
  updated_at: string;
  workspace_id: string;
  project_id: string;
  update_id: string;
  reactions: TCycleUpdateReaction[];
};

export type TCycleUpdateReaction = {
  actor: string;
  updateId: string;
  reaction: string;
  reactionId: string;
};
