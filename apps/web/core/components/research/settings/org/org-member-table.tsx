/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { ORG_ROLES } from "@plane/constants";
import type { TOrgRole } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TOrgUnit } from "@plane/types";
import { Input } from "@plane/ui";
// components
import { getResearchErrorKey } from "@/components/research/common/error-messages";
// hooks
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
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<string>("PI");
  const [piEmail, setPiEmail] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const members = research.orgUnitMembers[unit.id] ?? [];

  useEffect(() => {
    void research.fetchOrgUnitMembers(workspaceSlug, unit.id).catch((error) => setErrorKey(getResearchErrorKey(error)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, unit.id]);

  const handleAdd = useCallback(async () => {
    if (!newMemberEmail.trim()) return;
    try {
      await research.addOrgUnitMember(workspaceSlug, unit.id, {
        user: newMemberEmail.trim(),
        org_role: newMemberRole,
      });
      setNewMemberEmail("");
      setErrorKey(null);
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    }
  }, [newMemberEmail, newMemberRole, research, unit.id, workspaceSlug]);

  const handleRoleChange = useCallback(
    async (memberId: string, role: string) => {
      try {
        await research.updateOrgUnitMember(workspaceSlug, unit.id, memberId, { org_role: role as TOrgRole });
        setErrorKey(null);
      } catch (error) {
        setErrorKey(getResearchErrorKey(error));
      }
    },
    [research, unit.id, workspaceSlug]
  );

  const handleRemove = useCallback(
    async (memberId: string) => {
      try {
        await research.removeOrgUnitMember(workspaceSlug, unit.id, memberId);
        setErrorKey(null);
      } catch (error) {
        setErrorKey(getResearchErrorKey(error));
      }
    },
    [research, unit.id, workspaceSlug]
  );

  const handleSetPrimary = useCallback(
    async (memberId: string, isPrimary: boolean) => {
      try {
        await research.updateOrgUnitMember(workspaceSlug, unit.id, memberId, { is_primary: isPrimary });
        setErrorKey(null);
      } catch (error) {
        setErrorKey(getResearchErrorKey(error));
      }
    },
    [research, unit.id, workspaceSlug]
  );

  /**
   * Transferring the principal investigator role only changes organisation
   * roles - historical reports and approvals keep their authors (P0-ORG-05).
   */
  const handleTransferPi = useCallback(async () => {
    const target = piEmail.trim();
    if (!target) return;
    try {
      // read the live member list at call time so the callback stays stable
      const currentMembers = research.orgUnitMembers[unit.id] ?? [];
      const current = currentMembers.filter((member) => member.org_role === "PI").map((member) => member.user);
      const resolved = currentMembers.find(
        (member) => member.member_detail?.email?.toLowerCase() === target.toLowerCase()
      );
      const nextIds = resolved ? Array.from(new Set([...current, resolved.user])) : current;
      await research.transferPi(workspaceSlug, unit.id, nextIds);
      setPiEmail("");
      setErrorKey(null);
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    }
  }, [piEmail, research, unit.id, workspaceSlug]);

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
        />
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
        <Button variant="primary" size="sm" onClick={() => void handleAdd()}>
          {t("research.org.add_member")}
        </Button>
      </div>

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
          {members.map((member) => (
            <tr key={member.id} className="border-b border-subtle/60">
              <td className="py-2 text-secondary">
                {member.member_detail?.display_name ?? member.member_detail?.email ?? member.user}
              </td>
              <td className="py-2">
                <select
                  className="rounded border border-subtle bg-surface-1 px-1.5 py-1 text-12 text-primary"
                  value={member.org_role}
                  onChange={(event) => void handleRoleChange(member.id, event.target.value)}
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
                  onChange={(event) => void handleSetPrimary(member.id, event.target.checked)}
                />
              </td>
              <td className="py-2 text-tertiary">{member.effective_to ?? t("research.common.unlimited")}</td>
              <td className="py-2 text-right">
                <Button variant="ghost" size="sm" onClick={() => void handleRemove(member.id)}>
                  {t("research.common.remove")}
                </Button>
              </td>
            </tr>
          ))}
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
          />
          <Button variant="secondary" size="sm" onClick={() => void handleTransferPi()}>
            {t("research.org.pi_transfer_action")}
          </Button>
        </div>
      </div>
    </div>
  );
});
