export type CollaborationError =
  | { type: "auth-failed"; message: string }
  | { type: "network-error"; message: string }
  | { type: "forced-close"; code: number; message: string }
  | { type: "max-retries"; message: string };

/**
 * Single-stage state machine for collaboration lifecycle.
 * Stages represent the sequential progression: initial → connecting → awaiting-sync → synced
 *
 * Invariants:
 * - "awaiting-sync" only occurs when connection is successful and sync is pending
 * - "synced" occurs only after connection success and onSynced callback
 * - "reconnecting" with attempt > 0 when retrying after a connection drop
 * - "disconnected" is terminal (connection failed or forced close)
 */
export type CollabStage =
  | { kind: "initial" }
  | { kind: "connecting" }
  | { kind: "awaiting-sync" }
  | { kind: "synced" }
  | { kind: "reconnecting"; attempt: number }
  | { kind: "disconnected"; error: CollaborationError };

/**
 * Public collaboration state exposed to consumers.
 * Contains the current stage and derived booleans for convenience.
 */
export type CollaborationState = {
  stage: CollabStage;
  isServerSynced: boolean;
  isServerDisconnected: boolean;
};

export type TServerHandler = {
  onStateChange: (state: CollaborationState) => void;
};
