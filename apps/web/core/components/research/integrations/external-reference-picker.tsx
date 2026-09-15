/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { INTEGRATION_SYSTEM_LABELS, INTEGRATION_SYSTEMS } from "@plane/constants";
import type { TExternalReference } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/ui";
// components
import { ExternalReferenceCard } from "@/components/research/integrations/external-reference-card";
// hooks
import { useResearch } from "@/hooks/store/use-research";

type Props = {
  workspaceSlug: string;
  /** When provided, the picker links the new reference to this target. */
  onRegister?: (referenceId: string) => Promise<void>;
};

/**
 * Search an external system and register the hits as references. When the
 * system is unavailable the picker shows the degraded state instead of failing
 * (P1-INT-06, P1-INT-11).
 */
export const ExternalReferencePicker = observer(function ExternalReferencePicker({ workspaceSlug, onRegister }: Props) {
  const { t } = useTranslation();
  const research = useResearch();
  const [system, setSystem] = useState<string>("RAGPORTAL");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<Record<string, unknown>>>([]);
  const [degraded, setDegraded] = useState<string | null>(null);

  const search = async () => {
    const payload = await research.searchIntegration(workspaceSlug, system, query);
    setResults(payload.items);
    setDegraded(payload.degraded ? (payload.degraded_reason ?? "degraded") : null);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-12 text-primary"
          value={system}
          onChange={(event) => setSystem(event.target.value)}
        >
          {INTEGRATION_SYSTEMS.map((value) => (
            <option key={value} value={value}>
              {t(INTEGRATION_SYSTEM_LABELS[value])}
            </option>
          ))}
        </select>
        <Input
          className="!w-64"
          value={query}
          placeholder={t("research.integrations.search_placeholder")}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button size="sm" variant="secondary" disabled={!query.trim()} onClick={() => void search()}>
          {t("research.integrations.search")}
        </Button>
      </div>
      {degraded && (
        <p className="text-12 text-warning-primary">
          {t("research.integrations.degraded_banner", { reason: degraded })}
        </p>
      )}
      <div className="flex flex-col gap-2">
        {results.map((item) => {
          const reference: TExternalReference = {
            id: String(item.external_id),
            workspace: "",
            system: String(item.source_system ?? system) as TExternalReference["system"],
            external_type: String(item.external_type ?? ""),
            external_id: String(item.external_id),
            external_parent_id: String(item.external_parent_id ?? ""),
            title: String(item.title ?? ""),
            summary: String(item.summary ?? ""),
            source_url: String(item.source_url ?? ""),
            acl_hint: {},
            metadata: {},
            content_hash: "",
            synced_at: null,
            status: "ACTIVE",
            links: [],
            created_at: "",
            updated_at: "",
          };
          return (
            <div key={reference.id} className="flex flex-col gap-1">
              <ExternalReferenceCard reference={reference} />
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  const created = await research.createExternalReference(workspaceSlug, {
                    system: reference.system,
                    external_type: reference.external_type,
                    external_id: reference.external_id,
                    title: reference.title,
                    summary: reference.summary,
                    source_url: reference.source_url,
                    acl_hint: (item.acl_hint as Record<string, unknown>) ?? { public: false },
                    metadata: (item.metadata as Record<string, unknown>) ?? {},
                  });
                  if (onRegister) await onRegister(created.id);
                }}
              >
                {t("research.integrations.reference")}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
});
