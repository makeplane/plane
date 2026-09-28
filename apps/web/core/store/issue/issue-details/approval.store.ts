/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, makeObservable, observable, runInAction } from "mobx";
// plane package imports
import type {
  IIssueWorkflowActionsResponse,
  IIssueWorkflowPendingApproval,
  IWorkflowApprovalDecisionResult,
  IWorkflowApprovalDetail,
  TWorkflowApprovalDecisionType,
} from "@plane/types";
// services
import { IssueWorkflowService } from "@/services/issue";
// types
import type { IIssueDetail } from "./root.store";

export interface IIssueApprovalStoreActions {
  /**
   * §17.3 — read the item's allowed actions and, when one is pending, its
   * full approval (approver snapshot + §7.10 decision history).
   */
  fetchApprovalState: (
    workspaceSlug: string,
    projectId: string,
    issueId: string
  ) => Promise<IIssueWorkflowPendingApproval | undefined>;
  /**
   * §11.2 / §11.3 — record a decision. The item's state move, the approval
   * status change and the audit row are one server transaction, so nothing is
   * flipped locally: the caller gets the result and the store re-reads the
   * item, its actions and the approval from the server afterwards.
   */
  decideApproval: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    approvalId: string,
    decision: TWorkflowApprovalDecisionType,
    comment: string,
    idempotencyKey: string
  ) => Promise<IWorkflowApprovalDecisionResult>;
}

export interface IIssueApprovalStore extends IIssueApprovalStoreActions {
  // observables
  /** Keyed by issue id. */
  actionsMap: Record<string, IIssueWorkflowActionsResponse | undefined>;
  /**
   * Keyed by issue id. The most recent approval the UI has read — including a
   * resolved one, so a decision stays visible in activity after it lands.
   */
  approvalMap: Record<string, IWorkflowApprovalDetail | undefined>;
  loadingMap: Record<string, boolean>;
  /** Keyed by approval id. */
  decidingMap: Record<string, TWorkflowApprovalDecisionType | undefined>;
  // helpers
  getActionsByIssueId: (issueId: string | null | undefined) => IIssueWorkflowActionsResponse | undefined;
  getPendingApprovalByIssueId: (issueId: string | null | undefined) => IIssueWorkflowPendingApproval | undefined;
  getApprovalByIssueId: (issueId: string | null | undefined) => IWorkflowApprovalDetail | undefined;
  isLoading: (issueId: string | null | undefined) => boolean;
  isDeciding: (approvalId: string | null | undefined) => boolean;
}

export class IssueApprovalStore implements IIssueApprovalStore {
  // observables
  actionsMap: Record<string, IIssueWorkflowActionsResponse | undefined> = {};
  approvalMap: Record<string, IWorkflowApprovalDetail | undefined> = {};
  loadingMap: Record<string, boolean> = {};
  decidingMap: Record<string, TWorkflowApprovalDecisionType | undefined> = {};
  // root store
  rootIssueDetailStore: IIssueDetail;
  // services
  private issueWorkflowService: IssueWorkflowService;

  constructor(rootStore: IIssueDetail) {
    makeObservable(this, {
      // observables
      actionsMap: observable,
      approvalMap: observable,
      loadingMap: observable,
      decidingMap: observable,
      // actions
      fetchApprovalState: action,
      decideApproval: action,
    });
    this.rootIssueDetailStore = rootStore;
    this.issueWorkflowService = new IssueWorkflowService();
  }

  // helpers
  getActionsByIssueId = (issueId: string | null | undefined) => (issueId ? this.actionsMap[issueId] : undefined);

  getPendingApprovalByIssueId = (issueId: string | null | undefined) =>
    issueId ? (this.actionsMap[issueId]?.approval ?? undefined) : undefined;

  getApprovalByIssueId = (issueId: string | null | undefined) => (issueId ? this.approvalMap[issueId] : undefined);

  isLoading = (issueId: string | null | undefined) => Boolean(issueId && this.loadingMap[issueId]);

  isDeciding = (approvalId: string | null | undefined) => Boolean(approvalId && this.decidingMap[approvalId]);

  // actions
  fetchApprovalState = async (workspaceSlug: string, projectId: string, issueId: string) => {
    runInAction(() => {
      this.loadingMap[issueId] = true;
    });
    try {
      const actions = await this.issueWorkflowService.getIssueWorkflowActions(workspaceSlug, projectId, issueId);
      runInAction(() => {
        this.actionsMap[issueId] = actions;
      });

      const pendingApproval = actions.approval;
      if (!pendingApproval) {
        // No pending approval is authoritative. Drop a cached *pending* one so
        // the badge cannot outlive the approval; a resolved one is kept so the
        // decision it recorded stays in the activity surface.
        runInAction(() => {
          if (this.approvalMap[issueId]?.status === "pending") delete this.approvalMap[issueId];
        });
        return undefined;
      }

      const approval = await this.issueWorkflowService.getIssueApproval(
        workspaceSlug,
        projectId,
        issueId,
        pendingApproval.id
      );
      runInAction(() => {
        this.approvalMap[issueId] = approval;
      });
      return pendingApproval;
    } finally {
      runInAction(() => {
        this.loadingMap[issueId] = false;
      });
    }
  };

  decideApproval = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    approvalId: string,
    decision: TWorkflowApprovalDecisionType,
    comment: string,
    idempotencyKey: string
  ) => {
    runInAction(() => {
      this.decidingMap[approvalId] = decision;
    });
    try {
      const result = await this.issueWorkflowService.decideApproval(workspaceSlug, projectId, issueId, approvalId, {
        decision,
        comment,
        idempotencyKey,
      });

      // §11.2/§11.3 — the state move is part of the same transaction, so the
      // item, its actions and the approval are all re-read rather than
      // patched locally. A chained approval opens inside that transaction, so
      // the re-read of the actions endpoint picks the next one up for the badge.
      await this.rootIssueDetailStore.issue.fetchIssue(workspaceSlug, projectId, issueId);
      await this.fetchApprovalState(workspaceSlug, projectId, issueId);
      try {
        // Re-read the decided approval by id: it is the record §21 renders in
        // activity, and it still answers that endpoint once resolved even
        // though the actions payload only ever surfaces the pending one.
        const approval = await this.issueWorkflowService.getIssueApproval(
          workspaceSlug,
          projectId,
          issueId,
          approvalId
        );
        runInAction(() => {
          this.approvalMap[issueId] = approval;
        });
      } catch {
        // The decision stands; a resolved approval may simply be unreachable
        // from the actions payload any more (§17.3 only surfaces the pending
        // one). Keep whatever the re-read above produced.
      }
      this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
      return result;
    } catch (error) {
      // §11.4 — a losing concurrent decision answers 409. Nothing is flipped
      // locally; the re-read makes the UI show what the server actually holds.
      await this.fetchApprovalState(workspaceSlug, projectId, issueId).catch(() => undefined);
      throw error;
    } finally {
      runInAction(() => {
        delete this.decidingMap[approvalId];
      });
    }
  };
}
