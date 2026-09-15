/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { INTEGRATION_SYSTEM_LABELS } from "@plane/constants";
import type { TIntegrationCallLog } from "@plane/constants";
import { useTranslation } from "@plane/i18n";

type Props = {
  logs: TIntegrationCallLog[];
};

/** Read-only call log: metadata only, never a payload copy (P1-INT-08). */
export const ExternalCallLogTable = observer(function ExternalCallLogTable({ logs }: Props) {
  const { t } = useTranslation();
  if (!logs.length) return <p className="text-12 text-tertiary">{t("research.integrations.no_logs")}</p>;
  return (
    <table className="w-full text-12">
      <thead>
        <tr className="border-b border-subtle text-left text-tertiary">
          <th className="font-normal py-2">{t("research.integrations.columns.system")}</th>
          <th className="font-normal py-2">{t("research.integrations.columns.operation")}</th>
          <th className="font-normal py-2">{t("research.integrations.columns.outcome")}</th>
          <th className="font-normal py-2">{t("research.integrations.columns.latency")}</th>
          <th className="font-normal py-2">{t("research.integrations.columns.error")}</th>
          <th className="font-normal py-2">{t("research.integrations.columns.time")}</th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => (
          <tr key={log.id} className="border-b border-subtle/60">
            <td className="py-2 text-tertiary">{t(INTEGRATION_SYSTEM_LABELS[log.system] ?? log.system)}</td>
            <td className="py-2 text-secondary">{log.operation}</td>
            <td className="py-2 text-tertiary">{log.outcome}</td>
            <td className="py-2 text-tertiary">{log.latency_ms ?? "-"}</td>
            <td className="py-2 text-tertiary">{log.error_code || "-"}</td>
            <td className="py-2 text-tertiary">{new Date(log.created_at).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
});
