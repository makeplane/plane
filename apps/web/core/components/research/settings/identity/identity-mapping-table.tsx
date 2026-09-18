/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TIdentityMapping } from "@plane/types";
import { Input } from "@plane/ui";
// components
import { getResearchErrorKey } from "@/components/research/common/error-messages";
// services
import { ResearchPlatformService } from "@/services/research/platform.service";

const platformService = new ResearchPlatformService();

type Props = {
  workspaceSlug: string;
};

/**
 * Identity mapping administration: bind, list and unbind AI4MS SSO subjects
 * (P0-ID-05).
 */
export const ResearchIdentityMappingTable = observer(function ResearchIdentityMappingTable({ workspaceSlug }: Props) {
  const { t } = useTranslation();
  const [mappings, setMappings] = useState<TIdentityMapping[]>([]);
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await platformService.getIdentityMappings(workspaceSlug);
      setMappings(response.results);
      setErrorKey(null);
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    }
  }, [workspaceSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = useCallback(async () => {
    if (!email.trim() || !subject.trim()) return;
    try {
      await platformService.createIdentityMapping(workspaceSlug, {
        user: email.trim(),
        subject: subject.trim(),
        employee_id: employeeId.trim() || undefined,
      });
      setEmail("");
      setSubject("");
      setEmployeeId("");
      await load();
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    }
  }, [email, employeeId, load, subject, workspaceSlug]);

  const handleDelete = useCallback(
    async (mappingId: string) => {
      try {
        await platformService.deleteIdentityMapping(workspaceSlug, mappingId);
        await load();
      } catch (error) {
        setErrorKey(getResearchErrorKey(error));
      }
    },
    [load, workspaceSlug]
  );

  return (
    <div className="flex flex-col gap-3 p-5">
      {errorKey && (
        <div className="rounded-md border border-danger-strong/40 bg-danger-subtle px-3 py-2 text-12 text-danger-primary">
          {t(errorKey)}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <Input
          className="!w-56"
          placeholder={t("research.identity.user_placeholder")}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          className="!w-64"
          placeholder={t("research.identity.subject_placeholder")}
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
        />
        <Input
          className="!w-40"
          placeholder={t("research.identity.employee_id_placeholder")}
          value={employeeId}
          onChange={(event) => setEmployeeId(event.target.value)}
        />
        <Button variant="primary" size="sm" onClick={() => void handleCreate()}>
          {t("research.identity.bind")}
        </Button>
      </div>

      <table className="w-full text-12">
        <thead>
          <tr className="border-b border-subtle text-left text-tertiary">
            <th className="font-normal py-2">{t("research.identity.columns.user")}</th>
            <th className="font-normal py-2">{t("research.identity.columns.provider")}</th>
            <th className="font-normal py-2">{t("research.identity.columns.subject")}</th>
            <th className="font-normal py-2">{t("research.identity.columns.employee_id")}</th>
            <th className="font-normal py-2">{t("research.identity.columns.last_login")}</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {mappings.map((mapping) => (
            <tr key={mapping.id} className="border-b border-subtle/60">
              <td className="py-2 text-secondary">
                {mapping.user_detail?.display_name ?? mapping.user_detail?.email ?? mapping.user}
              </td>
              <td className="py-2 text-secondary">{mapping.provider}</td>
              <td className="py-2 text-tertiary">{mapping.subject}</td>
              <td className="py-2 text-tertiary">{mapping.employee_id ?? "-"}</td>
              <td className="py-2 text-tertiary">{mapping.last_login_at ?? "-"}</td>
              <td className="py-2 text-right">
                <Button variant="ghost" size="sm" onClick={() => void handleDelete(mapping.id)}>
                  {t("research.identity.unbind")}
                </Button>
              </td>
            </tr>
          ))}
          {mappings.length === 0 && (
            <tr>
              <td colSpan={6} className="py-3 text-center text-tertiary">
                {t("research.identity.empty")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
});
