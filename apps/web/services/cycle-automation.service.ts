/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Cycle automation rules of a project, and the manual "move all <states> to <state>" of a cycle.
 */

import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

export type TCycleAutomationTrigger = "cycle_started" | "cycle_completed";

export type TCycleAutomationRule = {
  id: string;
  project_id: string;
  trigger: TCycleAutomationTrigger;
  from_state_ids: string[];
  to_state_id: string | null;
  is_enabled: boolean;
  enabled_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type TCycleAutomationRulePayload = Partial<
  Pick<TCycleAutomationRule, "trigger" | "from_state_ids" | "to_state_id" | "is_enabled" | "sort_order">
>;

export type TBulkUpdateResult = { updated: string[]; unchanged: string[] };

export class CycleAutomationService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  private rulesUrl(workspaceSlug: string, projectId: string) {
    return `/api/workspaces/${workspaceSlug}/projects/${projectId}/cycle-automation-rules/`;
  }

  async listRules(workspaceSlug: string, projectId: string): Promise<TCycleAutomationRule[]> {
    return this.get(this.rulesUrl(workspaceSlug, projectId))
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createRule(
    workspaceSlug: string,
    projectId: string,
    data: TCycleAutomationRulePayload
  ): Promise<TCycleAutomationRule> {
    return this.post(this.rulesUrl(workspaceSlug, projectId), data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateRule(
    workspaceSlug: string,
    projectId: string,
    ruleId: string,
    data: TCycleAutomationRulePayload
  ): Promise<TCycleAutomationRule> {
    return this.patch(`${this.rulesUrl(workspaceSlug, projectId)}${ruleId}/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteRule(workspaceSlug: string, projectId: string, ruleId: string): Promise<void> {
    return this.delete(`${this.rulesUrl(workspaceSlug, projectId)}${ruleId}/`)
      .then(() => undefined)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /** How many work items of the cycle are in `fromStateIds` (no change). */
  async countInStates(workspaceSlug: string, projectId: string, cycleId: string, fromStateIds: string[]) {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/bulk-move-state/`, {
      from_state_ids: fromStateIds,
      dry_run: true,
    })
      .then((res) => (res?.data?.count ?? 0) as number)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /** Moves every work item of the cycle in `fromStateIds` to `toStateId` in one batch. */
  async moveStates(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    fromStateIds: string[],
    toStateId: string
  ): Promise<TBulkUpdateResult> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/bulk-move-state/`, {
      from_state_ids: fromStateIds,
      to_state_id: toStateId,
    })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
