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
import { Input } from "@plane/ui";
// components
import { getResearchErrorKey } from "@/components/research/common/error-messages";
// hooks
import { useResearch } from "@/hooks/store/use-research";

type Props = {
  workspaceSlug: string;
};

/** Read-only audit trail viewer (P0-AUD-05). */
export const ResearchAuditEventTable = observer(function ResearchAuditEventTable({ workspaceSlug }: Props) {
  const { t } = useTranslation();
  const research = useResearch();
  const [action, setAction] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const events = research.getAuditEvents(workspaceSlug);

  const load = useCallback(async () => {
    const params: Record<string, string> = {};
    if (action) params.action = action;
    if (resourceType) params.resource_type = resourceType;
    if (from) params.from = from;
    if (to) params.to = to;
    try {
      await research.fetchAuditEvents(workspaceSlug, params);
      setErrorKey(null);
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    }
  }, [action, from, research, resourceType, to, workspaceSlug]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug]);

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden p-5">
      {errorKey && (
        <div className="rounded-md border border-danger-strong/40 bg-danger-subtle px-3 py-2 text-12 text-danger-primary">
          {t(errorKey)}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <Input
          className="!w-52"
          placeholder={t("research.audit.action_placeholder")}
          value={action}
          onChange={(event) => setAction(event.target.value)}
        />
        <Input
          className="!w-52"
          placeholder={t("research.audit.resource_placeholder")}
          value={resourceType}
          onChange={(event) => setResourceType(event.target.value)}
        />
        <Input type="date" className="!w-40" value={from} onChange={(event) => setFrom(event.target.value)} />
        <Input type="date" className="!w-40" value={to} onChange={(event) => setTo(event.target.value)} />
        <Button variant="secondary" size="sm" onClick={() => void load()}>
          {t("research.common.refresh")}
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-12">
          <thead>
            <tr className="border-b border-subtle text-left text-tertiary">
              <th className="font-normal py-2">{t("research.audit.columns.time")}</th>
              <th className="font-normal py-2">{t("research.audit.columns.actor")}</th>
              <th className="font-normal py-2">{t("research.audit.columns.action")}</th>
              <th className="font-normal py-2">{t("research.audit.columns.resource")}</th>
              <th className="font-normal py-2">{t("research.audit.columns.metadata")}</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-b border-subtle/60 align-top">
                <td className="py-2 text-tertiary">{new Date(event.created_at).toLocaleString()}</td>
                <td className="py-2 text-secondary">
                  {event.actor_detail?.display_name ?? event.actor_detail?.email ?? "-"}
                </td>
                <td className="py-2 text-secondary">{event.action}</td>
                <td className="py-2 text-tertiary">
                  {event.resource_type}
                  {event.org_unit_detail?.name ? ` · ${event.org_unit_detail.name}` : ""}
                </td>
                <td className="max-w-[22rem] truncate py-2 text-tertiary">{JSON.stringify(event.metadata)}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={5} className="py-3 text-center text-tertiary">
                  {t("research.audit.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});
