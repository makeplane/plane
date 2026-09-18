/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { ORG_ROLES } from "@plane/constants";
import type { TOrgRole } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TOrgUnit } from "@plane/types";
import { AlertModalCore, Input } from "@plane/ui";
// components
import { getResearchErrorKey } from "@/components/research/common/error-messages";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useResearch } from "@/hooks/store/use-research";

type Props = {
  workspaceSlug: string;
  unit: TOrgUnit;
};

const ROLE_LABEL_KEYS: Record<TOrgRole, string> = {
  OWNER: "research.roles.owner",
  PI: "research.roles.pi",
  ADVISOR: "research.roles.advisor",
  REVIEWER: "research.roles.reviewer",
  UNIT_ADMIN: "research.roles.unit_admin",
};

/**
 * Member table for a node: roles, primary belonging, effective window and the
 * principal investigator set (P0-ORG-03 ~ P0-ORG-07, P0-UI-04).
 */
export const ResearchOrgMemberTable = observer(function ResearchOrgMemberTable({ workspaceSlug, unit }: Props) {
  const { t } = useTranslation();
  const research = useResearch();
  const memberStore = useMember();
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<string>("PI");
  const [piEmail, setPiEmail] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingChange, setPendingChange] = useState<
    | { kind: "remove"; memberId: string; memberName: string }
    | { kind: "role"; memberId: string; memberName: string; role: TOrgRole }
    | { kind: "primary"; memberId: string; memberName: string; isPrimary: boolean }
    | { kind: "pi"; targetId: string; targetName: string }
    | null
  >(null);

  const members = useMemo(() => research.orgUnitMembers[unit.id] ?? [], [research.orgUnitMembers, unit.id]);
  const workspaceMembers = memberStore.workspace
    .getWorkspaceMemberIds(workspaceSlug)
    .map((userId) => memberStore.getUserDetails(userId))
    .filter((member) => Boolean(member));
  const normalizedNewMember = newMemberEmail.trim().toLowerCase();
  const resolvedNewMember = normalizedNewMember
    ? workspaceMembers.find(
        (member) =>
          member?.id.toLowerCase() === normalizedNewMember || member?.email?.toLowerCase() === normalizedNewMember
      )
    : undefined;
  const newMemberResolutionStatus = !normalizedNewMember
    ? null
    : resolvedNewMember
      ? t("research.org.resolved_member", { member: resolvedNewMember.display_name || resolvedNewMember.email })
      : t("research.org.workspace_member_not_found");
  const normalizedPiEmail = piEmail.trim().toLowerCase();
  const resolvedPiMember = normalizedPiEmail
    ? members.find(
        (member) =>
          member.user.toLowerCase() === normalizedPiEmail ||
          member.member_detail?.email?.toLowerCase() === normalizedPiEmail
      )
    : undefined;
  const piResolutionStatus = !normalizedPiEmail
    ? null
    : resolvedPiMember
      ? t("research.org.resolved_member", {
          member:
            resolvedPiMember.member_detail?.display_name ??
            resolvedPiMember.member_detail?.email ??
            resolvedPiMember.user,
        })
      : t("research.org.member_not_in_unit");

  useEffect(() => {
    void research.fetchOrgUnitMembers(workspaceSlug, unit.id).catch((error) => setErrorKey(getResearchErrorKey(error)));
    void memberStore.workspace.fetchWorkspaceMembers(workspaceSlug).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, unit.id]);

  const handleAdd = useCallback(async () => {
    if (!resolvedNewMember || busy) return;
    setBusy(true);
    try {
      await research.addOrgUnitMember(workspaceSlug, unit.id, {
        user: resolvedNewMember.id,
        org_role: newMemberRole,
      });
      setNewMemberEmail("");
      setErrorKey(null);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("research.feedback.member_added.title"),
        message: t("research.feedback.member_added.message"),
      });
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    } finally {
      setBusy(false);
    }
  }, [busy, newMemberRole, research, resolvedNewMember, t, unit.id, workspaceSlug]);

  const applyPendingChange = useCallback(async () => {
    if (!pendingChange || busy) return;
    setBusy(true);
    try {
      if (pendingChange.kind === "remove") {
        await research.removeOrgUnitMember(workspaceSlug, unit.id, pendingChange.memberId);
      } else if (pendingChange.kind === "role") {
        await research.updateOrgUnitMember(workspaceSlug, unit.id, pendingChange.memberId, {
          org_role: pendingChange.role,
        });
      } else if (pendingChange.kind === "primary") {
        await research.updateOrgUnitMember(workspaceSlug, unit.id, pendingChange.memberId, {
          is_primary: pendingChange.isPrimary,
        });
      } else {
        await research.transferPi(workspaceSlug, unit.id, [pendingChange.targetId]);
        setPiEmail("");
      }
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t(`research.feedback.org_${pendingChange.kind}_updated.title`),
        message: t(`research.feedback.org_${pendingChange.kind}_updated.message`),
      });
      setPendingChange(null);
      setErrorKey(null);
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    } finally {
      setBusy(false);
    }
  }, [busy, pendingChange, research, t, unit.id, workspaceSlug]);

  const handleRoleChange = useCallback((memberId: string, memberName: string, role: string) => {
    setPendingChange({ kind: "role", memberId, memberName, role: role as TOrgRole });
  }, []);

  const handleRemove = useCallback((memberId: string, memberName: string) => {
    setPendingChange({ kind: "remove", memberId, memberName });
  }, []);

  const handleSetPrimary = useCallback((memberId: string, memberName: string, isPrimary: boolean) => {
    setPendingChange({ kind: "primary", memberId, memberName, isPrimary });
  }, []);

  const handleTransferPi = useCallback(() => {
    if (!resolvedPiMember) return;
    setPendingChange({
      kind: "pi",
      targetId: resolvedPiMember.user,
      targetName:
        resolvedPiMember.member_detail?.display_name ?? resolvedPiMember.member_detail?.email ?? resolvedPiMember.user,
    });
  }, [resolvedPiMember]);

  const pendingTitle = pendingChange ? t(`research.org.confirm.${pendingChange.kind}.title`) : "";
  const pendingContent = pendingChange
    ? t(`research.org.confirm.${pendingChange.kind}.description`, {
        member: "memberName" in pendingChange ? pendingChange.memberName : pendingChange.targetName,
        role: pendingChange.kind === "role" ? t(ROLE_LABEL_KEYS[pendingChange.role]) : "",
        unit: unit.name,
        state:
          pendingChange.kind === "primary"
            ? t(pendingChange.isPrimary ? "research.common.yes" : "research.common.no")
            : "",
        current:
          pendingChange.kind === "pi"
            ? members
                .filter((member) => member.org_role === "PI")
                .map((member) => member.member_detail?.display_name ?? member.member_detail?.email ?? member.user)
                .join("、") || t("research.org.no_current_pi")
            : "",
      })
    : "";

  return (
    <div className="flex flex-col gap-3">
      {errorKey && (
        <div className="rounded-md border border-danger-strong/40 bg-danger-subtle px-3 py-2 text-12 text-danger-primary">
          {t(errorKey)}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <Input
          className="!w-64"
          placeholder={t("research.org.member_email_placeholder")}
          value={newMemberEmail}
          onChange={(event) => setNewMemberEmail(event.target.value)}
          list={`research-member-options-${unit.id}`}
        />
        <datalist id={`research-member-options-${unit.id}`}>
          {workspaceMembers.map((member) => (
            <option key={member?.id} value={member?.email ?? member?.id}>
              {member?.display_name}
            </option>
          ))}
        </datalist>
        <select
          className="rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13 text-primary"
          value={newMemberRole}
          onChange={(event) => setNewMemberRole(event.target.value)}
        >
          {ORG_ROLES.map((role) => (
            <option key={role} value={role}>
              {t(ROLE_LABEL_KEYS[role])}
            </option>
          ))}
        </select>
        <Button
          variant="primary"
          size="sm"
          loading={busy && !pendingChange}
          disabled={busy || !resolvedNewMember}
          onClick={() => void handleAdd()}
        >
          {t("research.org.add_member")}
        </Button>
      </div>
      {newMemberResolutionStatus && (
        <p className={`text-11 ${resolvedNewMember ? "text-success-primary" : "text-danger-primary"}`} role="status">
          {newMemberResolutionStatus}
        </p>
      )}

      <table className="w-full text-12">
        <thead>
          <tr className="border-b border-subtle text-left text-tertiary">
            <th className="font-normal py-2">{t("research.org.columns.member")}</th>
            <th className="font-normal py-2">{t("research.org.columns.role")}</th>
            <th className="font-normal py-2">{t("research.org.columns.primary")}</th>
            <th className="font-normal py-2">{t("research.org.columns.effective_to")}</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const memberName = member.member_detail?.display_name ?? member.member_detail?.email ?? member.user;
            return (
              <tr key={member.id} className="border-b border-subtle/60">
                <td className="py-2 text-secondary">{memberName}</td>
                <td className="py-2">
                  <select
                    className="rounded border border-subtle bg-surface-1 px-1.5 py-1 text-12 text-primary"
                    value={member.org_role}
                    disabled={busy}
                    onChange={(event) => handleRoleChange(member.id, memberName, event.target.value)}
                  >
                    {ORG_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {t(ROLE_LABEL_KEYS[role])}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2">
                  <input
                    type="checkbox"
                    checked={member.is_primary}
                    aria-label={t("research.org.primary_for", { member: memberName })}
                    disabled={busy}
                    onChange={(event) => handleSetPrimary(member.id, memberName, event.target.checked)}
                  />
                </td>
                <td className="py-2 text-tertiary">{member.effective_to ?? t("research.common.unlimited")}</td>
                <td className="py-2 text-right">
                  <Button variant="ghost" size="sm" disabled={busy} onClick={() => handleRemove(member.id, memberName)}>
                    {t("research.common.remove")}
                  </Button>
                </td>
              </tr>
            );
          })}
          {members.length === 0 && (
            <tr>
              <td colSpan={5} className="py-3 text-center text-tertiary">
                {t("research.org.no_members")}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="rounded-md border border-subtle bg-surface-2 p-3">
        <h4 className="text-12 font-medium text-primary">{t("research.org.pi_transfer")}</h4>
        <p className="mt-1 text-11 text-tertiary">{t("research.org.pi_transfer_hint")}</p>
        <div className="mt-2 flex items-center gap-2">
          <Input
            className="!w-64"
            placeholder={t("research.org.member_email_placeholder")}
            value={piEmail}
            onChange={(event) => setPiEmail(event.target.value)}
            list={`research-member-options-${unit.id}`}
          />
          <Button variant="secondary" size="sm" disabled={busy || !resolvedPiMember} onClick={handleTransferPi}>
            {t("research.org.pi_transfer_action")}
          </Button>
        </div>
        {piResolutionStatus && (
          <p
            className={`mt-2 text-11 ${resolvedPiMember ? "text-success-primary" : "text-danger-primary"}`}
            role="status"
          >
            {piResolutionStatus}
          </p>
        )}
      </div>

      <AlertModalCore
        isOpen={Boolean(pendingChange)}
        handleClose={() => {
          if (!busy) setPendingChange(null);
        }}
        handleSubmit={() => void applyPendingChange()}
        isSubmitting={busy}
        title={pendingTitle}
        content={pendingContent}
        primaryButtonText={{ default: t("research.common.confirm"), loading: t("research.common.loading") }}
        secondaryButtonText={t("research.common.cancel")}
        variant={pendingChange?.kind === "remove" || pendingChange?.kind === "pi" ? "danger" : "primary"}
      />
    </div>
  );
});
