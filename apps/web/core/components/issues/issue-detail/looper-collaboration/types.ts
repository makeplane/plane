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

export type TLooperQuestionOption = {
  id: string;
  label: string;
  impact: string;
};

/** One structured decision Looper needs settled, as published by the Node. */
export type TLooperQuestion = {
  id: string;
  question: string;
  context: string;
  options: TLooperQuestionOption[];
  recommended_option: string;
  recommendation_reason: string;
  design_document_required: boolean;
};

export type TLooperMessageKind = "human_reply" | "looper_reply";

/** `pending` means Plane holds the reply until the Node picks it up. */
export type TLooperMessageDeliveryState = "pending" | "processed" | "delivered" | "failed";

export type TLooperQuestionOutcomeStatus = "decided" | "delegated" | "still_open";

export type TLooperQuestionOutcome = {
  id: string;
  status: TLooperQuestionOutcomeStatus;
  answer: string;
  reason: string;
};

/** Looper's own read of the thread; `resolved` is what closes the role request. */
export type TLooperResolution = {
  resolved?: boolean;
  questions?: TLooperQuestionOutcome[];
};

export type TLooperRoleMessage = {
  id: string;
  kind: TLooperMessageKind;
  body: string;
  delivery_state: TLooperMessageDeliveryState;
  evaluation: TLooperResolution | null;
  actor: TLooperMember | null;
  created_at: string;
};

export type TLooperConversationState = "waiting_human" | "waiting_looper" | "resolved" | "failed";

export type TLooperRoleSummary = {
  role: TLooperRole;
  member: TLooperMember | null;
  open_count: number;
  answered_count: number;
  total_count: number;
  status: "waiting" | "completed" | "pending";
  current_question: string | null;
  questions: TLooperQuestion[];
  messages: TLooperRoleMessage[];
  conversation_state: TLooperConversationState | null;
  remaining_count: number;
  resolution: TLooperResolution;
  open_request_id: string | null;
  can_answer: boolean;
  can_reply: boolean;
  answer_mode: "quick_decision" | "formal_product_spec";
};

export type TLooperRoleMessageResponse = {
  message: TLooperRoleMessage;
  created: boolean;
};

export type TLooperSummary = {
  visibility: "hidden" | "visible";
  protocol: "strict_v1" | null;
  read_only: boolean;
  permissions: {
    can_view: boolean;
    can_dispatch: boolean;
    can_connect?: boolean;
    can_stop: boolean;
    can_release: boolean;
    can_answer?: boolean;
  };
  empty_reason?:
    | "integration_not_active"
    | "strict_protocol_required"
    | "owner_binding_required"
    | "node_role_not_allowed"
    | "work_item_not_open"
    | null;
  target?: {
    binding_id: string;
    owner: TLooperMember;
    node: {
      id: string;
      name: string;
      live_status: "online" | "offline" | "stale" | "unavailable";
    };
    allow_offline_queue: boolean;
  } | null;
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
  roles?: TLooperRoleSummary[];
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

export type TLooperConnectionStatus =
  | "created"
  | "cli_connected"
  | "binding_created"
  | "completed"
  | "expired"
  | "cancelled"
  | "failed"
  /** The member already has an active computer on this project; V1 keeps it at one. */
  | "device_exists";

export type TLooperConnectionCheckKey =
  | "identity_verified"
  | "cli_connected"
  | "key_verified"
  | "node_online"
  | "strict_dispatch"
  | "inbox_verified";

export type TLooperConnectionCheckStatus = "pending" | "passed" | "failed";

export type TLooperConnectionChecks = Partial<Record<TLooperConnectionCheckKey, boolean>>;

export type TLooperConnectionErrorCode =
  | "connection_expired"
  | "active_device_exists"
  | "invalid_connection_code"
  | "invalid_link_request"
  | "not_project_member"
  | "unknown";

export type TLooperConnection = {
  id: string;
  status: TLooperConnectionStatus;
  /** Ready-to-paste CLI command built by the API; empty once the session leaves the code window. */
  command: string;
  expires_at: string;
  owner: TLooperMember | null;
  node: {
    id: string;
    name: string;
    binding_id: string | null;
  } | null;
  checks: TLooperConnectionChecks;
  error_code: TLooperConnectionErrorCode | null;
  error_detail: string | null;
};

export type TLooperConnectionResponse = {
  connection: TLooperConnection;
};

export type TLooperRolePolicy = {
  id: string;
  revision: number;
  product_member_id: string;
  design_member_id: string;
  engineering_member_rule: "dispatch_owner";
  qa_member_id: string;
  updated_at: string;
};

export type TLooperProjectIntegration = {
  id?: string;
  state: "unconfigured" | "active" | "paused" | "read_only";
  strict_epoch: string | null;
  activation_checklist_revision: number;
  paused_reason: string;
  updated_at?: string;
};
