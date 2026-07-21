export type TLooperPhaseKey =
  | "research"
  | "role_decisions"
  | "technical_spec"
  | "implementation"
  | "pull_request"
  | "qa"
  | "complete";

export type TLooperRole = "product" | "design" | "engineering" | "qa";

export type TLooperMember = {
  id: string;
  display_name: string;
  avatar: string | null;
};

export type TLooperSummary = {
  visibility: "hidden" | "visible";
  protocol: "strict_v1" | null;
  read_only: boolean;
  permissions: {
    can_view: boolean;
    can_dispatch: boolean;
    can_stop: boolean;
    can_release: boolean;
  };
  dispatch?: {
    id: string;
    revision: number;
    state_version: number;
    role_policy_revision: number;
    state: string;
    health: string;
    requested_mode: "auto" | "worker";
    active_role: "planner" | "worker";
    owner: TLooperMember | null;
    node: {
      id: string;
      name: string;
      live_status: "online" | "offline" | "stale" | "unavailable";
      last_ack_at: string | null;
    };
    created_at: string;
    updated_at: string;
  };
  current_phase?: TLooperPhaseKey;
  waiting_role?: TLooperRole | null;
  current_question?: string | null;
  phases?: Array<{ key: TLooperPhaseKey; status: "completed" | "current" | "pending" | "skipped" }>;
  roles?: Array<{
    role: TLooperRole;
    member: TLooperMember | null;
    open_count: number;
    answered_count: number;
    total_count: number;
    status: "waiting" | "completed" | "pending";
    current_question: string | null;
  }>;
  artifacts?: Array<{
    id: string;
    type: string;
    title: string;
    url: string;
    source_revision_id: string;
  }>;
  recent_events?: Array<{
    id: string;
    version: number;
    type: string;
    phase: TLooperPhaseKey;
    role: TLooperRole | null;
    actor: TLooperMember | null;
    occurred_at: string;
  }>;
  snapshot_version?: number;
  available_actions?: string[];
};
