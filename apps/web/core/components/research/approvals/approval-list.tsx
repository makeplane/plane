/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import {
  APPROVAL_FLOW_STEP_ROLES,
  APPROVAL_REQUEST_STATUS_LABELS,
  APPROVAL_TYPE_LABELS,
  APPROVAL_TYPES,
} from "@plane/constants";
import type { TApprovalRequestStatus, TApprovalType, TOrgRole } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/ui";
// components
import { getResearchErrorKey } from "@/components/research/common/error-messages";
// hooks
import { useResearch } from "@/hooks/store/use-research";

type Props = {
  workspaceSlug: string;
  isAdmin: boolean;
};

const SCOPES = [
  { key: "to_me", labelKey: "research.approvals.to_me" },
  { key: "mine", labelKey: "research.approvals.mine" },
  { key: "completed", labelKey: "research.approvals.completed" },
] as const;

/** Office approvals built on work items (P0-APR-01 ~ P0-APR-07). */
export const ResearchApprovalList = observer(function ResearchApprovalList({ workspaceSlug, isAdmin }: Props) {
  const { t } = useTranslation();
  const research = useResearch();
  const [scope, setScope] = useState<(typeof SCOPES)[number]["key"]>("to_me");
  const [comment, setComment] = useState("");
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [flowName, setFlowName] = useState("");
  const [flowType, setFlowType] = useState<TApprovalType>("TASK");
  const [approverRole, setApproverRole] = useState<TOrgRole>("PI");

  const requests = research.getApprovalRequests(workspaceSlug);
  const flows = research.getApprovalFlows(workspaceSlug);

  const load = useCallback(async () => {
    try {
      await research.fetchApprovalRequests(workspaceSlug, scope);
      setErrorKey(null);
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    }
  }, [research, scope, workspaceSlug]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, scope]);

  useEffect(() => {
    if (isAdmin) void research.fetchApprovalFlows(workspaceSlug).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, isAdmin]);

  const act = useCallback(
    async (requestId: string, action: "approve" | "reject" | "withdraw") => {
      try {
        if (action === "approve") await research.approveApprovalRequest(workspaceSlug, requestId, comment);
        if (action === "reject") await research.rejectApprovalRequest(workspaceSlug, requestId, comment);
        if (action === "withdraw") await research.withdrawApprovalRequest(workspaceSlug, requestId);
        setComment("");
        setActiveRequestId(null);
        setErrorKey(null);
        await load();
      } catch (error) {
        setErrorKey(getResearchErrorKey(error));
      }
    },
    [comment, load, research, workspaceSlug]
  );

  const handleCreateFlow = useCallback(async () => {
    if (!flowName.trim()) return;
    try {
      await research.createApprovalFlow(workspaceSlug, {
        name: flowName.trim(),
        approval_type: flowType,
        steps: [{ order: 1, approver_org_role: approverRole, approver_mode: "ANY", is_required: true }],
      });
      setFlowName("");
      setErrorKey(null);
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    }
  }, [approverRole, flowName, flowType, research, workspaceSlug]);

  return (
    <div className="flex flex-col gap-4 p-5">
      {errorKey && (
        <div className="rounded-md border border-danger-strong/40 bg-danger-subtle px-3 py-2 text-12 text-danger-primary">
          {t(errorKey)}
        </div>
      )}

      <div className="flex gap-2 border-b border-subtle">
        {SCOPES.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`-mb-px border-b-2 px-2 py-1.5 text-12 ${
              scope === item.key
                ? "border-accent-primary text-primary"
                : "border-transparent text-tertiary hover:text-secondary"
            }`}
            onClick={() => setScope(item.key)}
          >
            {t(item.labelKey)}
          </button>
        ))}
      </div>

      <table className="w-full text-12">
        <thead>
          <tr className="border-b border-subtle text-left text-tertiary">
            <th className="font-normal py-2">{t("research.approvals.columns.subject")}</th>
            <th className="font-normal py-2">{t("research.approvals.columns.type")}</th>
            <th className="font-normal py-2">{t("research.approvals.columns.flow")}</th>
            <th className="font-normal py-2">{t("research.approvals.columns.step")}</th>
            <th className="font-normal py-2">{t("research.approvals.columns.status")}</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id} className="border-b border-subtle/60 align-top">
              <td className="py-2 text-secondary">{request.issue_detail?.name ?? request.issue}</td>
              <td className="py-2 text-tertiary">{t(APPROVAL_TYPE_LABELS[request.approval_type])}</td>
              <td className="py-2 text-tertiary">
                {request.flow_name} · v{request.flow_version}
              </td>
              <td className="py-2 text-tertiary">{request.current_step_order}</td>
              <td className="py-2 text-tertiary">
                {t(APPROVAL_REQUEST_STATUS_LABELS[request.status as TApprovalRequestStatus])}
              </td>
              <td className="py-2 text-right">
                {request.can_act && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      className="mr-2"
                      onClick={() => {
                        setActiveRequestId(request.id);
                        void act(request.id, "approve");
                      }}
                    >
                      {t("research.approvals.approve")}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setActiveRequestId(request.id);
                        setComment(t("research.approvals.reject_placeholder"));
                      }}
                    >
                      {t("research.approvals.reject")}
                    </Button>
                  </>
                )}
                {scope === "mine" && request.status === "PENDING" && (
                  <Button variant="ghost" size="sm" onClick={() => void act(request.id, "withdraw")}>
                    {t("research.approvals.withdraw")}
                  </Button>
                )}
              </td>
            </tr>
          ))}
          {requests.length === 0 && (
            <tr>
              <td colSpan={6} className="py-3 text-center text-tertiary">
                {t("research.approvals.empty")}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {activeRequestId && (
        <div className="flex items-center gap-2 rounded-md border border-subtle bg-surface-2 p-3">
          <Input
            className="!w-96"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={t("research.approvals.comment_placeholder")}
          />
          <Button variant="error-fill" size="sm" onClick={() => void act(activeRequestId, "reject")}>
            {t("research.approvals.confirm_reject")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setActiveRequestId(null)}>
            {t("research.common.cancel")}
          </Button>
        </div>
      )}

      {isAdmin && (
        <section className="rounded-lg border border-subtle bg-surface-1 p-4">
          <h3 className="text-13 font-medium text-primary">{t("research.approvals.flows")}</h3>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <Input
              className="!w-56"
              placeholder={t("research.approvals.flow_name_placeholder")}
              value={flowName}
              onChange={(event) => setFlowName(event.target.value)}
            />
            <select
              className="rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13 text-primary"
              value={flowType}
              onChange={(event) => setFlowType(event.target.value as TApprovalType)}
            >
              {APPROVAL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(APPROVAL_TYPE_LABELS[type])}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13 text-primary"
              value={approverRole}
              onChange={(event) => setApproverRole(event.target.value as TOrgRole)}
            >
              {APPROVAL_FLOW_STEP_ROLES.map((role) => (
                <option key={role} value={role}>
                  {t(`research.roles.${role.toLowerCase()}`)}
                </option>
              ))}
            </select>
            <Button variant="primary" size="sm" onClick={() => void handleCreateFlow()}>
              {t("research.approvals.add_flow")}
            </Button>
          </div>
          <ul className="mt-3 flex flex-col gap-1">
            {flows.map((flow) => (
              <li key={flow.id} className="text-12 text-tertiary">
                {flow.name} · {t(APPROVAL_TYPE_LABELS[flow.approval_type])} · v{flow.version} · {flow.steps.length}{" "}
                {t("research.approvals.steps")}
              </li>
            ))}
            {flows.length === 0 && <li className="text-12 text-tertiary">{t("research.approvals.no_flows")}</li>}
          </ul>
        </section>
      )}
    </div>
  );
});
