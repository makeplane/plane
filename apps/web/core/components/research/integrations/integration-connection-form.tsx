/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { INTEGRATION_SYSTEM_LABELS, INTEGRATION_SYSTEMS } from "@plane/constants";
import type { TIntegrationConnection } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/ui";
// components
import { getResearchErrorKey } from "@/components/research/common/error-messages";

type Props = {
  connections: TIntegrationConnection[];
  onSave: (items: Array<Record<string, unknown>>) => Promise<void>;
};

/** Connection editor: secrets are write-only and never echoed back (P1-INT-01/02). */
export const IntegrationConnectionForm = observer(function IntegrationConnectionForm({ connections, onSave }: Props) {
  const { t } = useTranslation();
  const [system, setSystem] = useState<string>("RAGPORTAL");
  const [displayName, setDisplayName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [credentialRef, setCredentialRef] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const existing = connections.find((connection) => connection.system === system);

  return (
    <div className="flex flex-col gap-2 rounded border border-subtle p-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-12 text-primary"
          value={system}
          onChange={(event) => {
            setSystem(event.target.value);
            const next = connections.find((connection) => connection.system === event.target.value);
            setDisplayName(next?.display_name ?? "");
            setBaseUrl(next?.base_url ?? "");
            setCredentialRef("");
            setEnabled(Boolean(next?.is_enabled));
          }}
        >
          {INTEGRATION_SYSTEMS.map((value) => (
            <option key={value} value={value}>
              {t(INTEGRATION_SYSTEM_LABELS[value])}
            </option>
          ))}
        </select>
        <Input
          className="!w-40"
          value={displayName}
          placeholder={t("research.integrations.display_name")}
          onChange={(event) => setDisplayName(event.target.value)}
        />
        <Input
          className="!w-64"
          value={baseUrl}
          placeholder="https://system.example.com"
          onChange={(event) => setBaseUrl(event.target.value)}
        />
        <Input
          className="!w-56"
          value={credentialRef}
          placeholder={t("research.integrations.credential_ref")}
          onChange={(event) => setCredentialRef(event.target.value)}
        />
        <label className="flex items-center gap-1 text-12 text-secondary">
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
          {t("research.integrations.enabled")}
        </label>
        <Button
          size="sm"
          variant="primary"
          disabled={!baseUrl.trim()}
          onClick={async () => {
            try {
              await onSave([
                {
                  system,
                  display_name: displayName || system,
                  base_url: baseUrl.trim(),
                  credential_ref: credentialRef,
                  is_enabled: enabled,
                },
              ]);
              setCredentialRef("");
              setErrorKey(null);
            } catch (error) {
              setErrorKey(getResearchErrorKey(error));
            }
          }}
        >
          {t("research.common.save")}
        </Button>
      </div>
      {errorKey && <p className="text-12 text-danger-primary">{t(errorKey)}</p>}
      <p className="text-11 text-tertiary">
        {existing?.has_credential
          ? t("research.integrations.credential_configured")
          : t("research.integrations.credential_hint")}
      </p>
    </div>
  );
});
