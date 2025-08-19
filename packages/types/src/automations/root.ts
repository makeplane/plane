// local imports
import { TAutomationNodeEdge } from "./edge";
import { TAutomationNode } from "./node";

export enum EAutomationScope {
  WORK_ITEM = "work-item",
}

export enum EAutomationStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  DISABLED = "disabled",
}

export enum EAutomationRunStatus {
  PENDING = "pending",
  RUNNING = "running",
  SUCCESS = "success",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export type TAutomation = {
  average_run_time: number;
  created_at: Date;
  created_by: string;
  description: string | null;
  id: string;
  is_enabled: boolean;
  last_run_at: Date | null;
  last_run_status: EAutomationRunStatus | null;
  name: string;
  project: string;
  run_count: number;
  scope: EAutomationScope;
  status: EAutomationStatus;
  total_failed_count: number;
  total_success_count: number;
  updated_at: Date;
  updated_by: string;
  workspace: string;
};

export type TAutomationDetails = TAutomation & {
  nodes: TAutomationNode[];
  edges: TAutomationNodeEdge[];
};
