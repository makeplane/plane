// local imports
import { TAutomationNode } from "./node";
import { EAutomationScope, TAutomation } from "./root";

export type TAutomationActivityKeys = Pick<TAutomation, "name" | "description" | "scope">;
export type TAutomationNodeActivityKeys = Pick<TAutomationNode, "name" | "config" | "handler_name" | "is_enabled">;

export type TAutomationActivityField =
  | "automation"
  | `automation.${keyof TAutomationActivityKeys}`
  | "automation.node"
  | `automation.node.${keyof TAutomationNodeActivityKeys}`
  | "automation.run_history";

export type TAutomationActivityVerb = "created" | "updated" | "deleted";

export type TAutomationActivity = {
  actor: string;
  automation: string;
  automation_version: string | null;
  automation_node: string | null;
  automation_edge: string | null;
  automation_run: string | null;
  automation_scope: EAutomationScope;
  created_at: string | null;
  created_by: string | null;
  epoch: number;
  field: TAutomationActivityField | null;
  id: string;
  new_identifier: string | null;
  new_value: string | null;
  node_execution: string | null;
  old_identifier: string | null;
  old_value: string | null;
  project: string;
  updated_at: string | null;
  updated_by: string | null;
  verb: TAutomationActivityVerb;
  workspace: string;
};

export type TAutomationActivityType = "all" | "activity" | "run_history";

export type TAutomationActivityFilters = {
  show_fails?: boolean;
  type?: TAutomationActivityType;
};
