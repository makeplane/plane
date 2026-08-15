/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Link, useOutletContext, useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { testhubService } from "@plane/services";
import { Button } from "@plane/ui";
import { TesthubUnbound } from "../components/unbound";
import type { TTesthubOutletContext } from "../layout";

async function pollJobUntilSettled(workspaceSlug: string, projectId: string, jobId: string, attemptsLeft = 60) {
  if (attemptsLeft <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const latest = await testhubService.getJob(workspaceSlug, projectId, jobId);
  if (latest.status === "succeeded" || latest.status === "failed") return;
  await pollJobUntilSettled(workspaceSlug, projectId, jobId, attemptsLeft - 1);
}

function OverviewPage() {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const { catalog, loading, reload } = useOutletContext<TTesthubOutletContext>();
  const [busy, setBusy] = useState(false);
  const base = `/${workspaceSlug}/projects/${projectId}/testhub`;

  if (loading) return <p className="text-13 text-secondary">…</p>;
  if (!catalog?.repo) return <TesthubUnbound href={`${base}/bind`} />;

  const counts = catalog.snapshot?.payload?.counts;
  const git = catalog.snapshot?.payload?.git;
  const cards = [
    { key: "ddl", value: counts?.ddl_tables ?? 0, label: t("testhub.counts.ddl") },
    { key: "sql", value: counts?.sql_files ?? 0, label: t("testhub.counts.sql") },
    { key: "api", value: counts?.api_objects ?? 0, label: t("testhub.counts.api_objects") },
    { key: "words", value: counts?.action_words ?? 0, label: t("testhub.counts.action_words") },
    { key: "apps", value: counts?.apps ?? 0, label: t("testhub.counts.apps") },
    { key: "features", value: counts?.features ?? 0, label: t("testhub.counts.features") },
    { key: "pytest", value: counts?.pytest_nodes ?? 0, label: t("testhub.counts.pytest") },
    { key: "data", value: counts?.data_files ?? 0, label: t("testhub.counts.data") },
  ];

  const sync = async () => {
    if (!workspaceSlug || !projectId) return;
    setBusy(true);
    try {
      const job = await testhubService.sync(workspaceSlug, projectId);
      await pollJobUntilSettled(workspaceSlug, projectId, job.id);
      await reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1 text-13">
          <p className="text-primary">
            {catalog.repo.branch} · {catalog.repo.workdir}
          </p>
          <p className="text-secondary">
            {t("testhub.overview.head")}: {git?.sha || catalog.repo.last_sync_sha || "—"}
          </p>
          <p className="text-tertiary">
            {t("testhub.overview.status")}: {catalog.repo.last_sync_status || "—"}
          </p>
          {catalog.repo.last_sync_error ? (
            <p className="text-13 text-danger-primary">{catalog.repo.last_sync_error}</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Link to={`${base}/bind`}>
            <Button variant="neutral-primary" size="sm">
              {t("testhub.nav.bind")}
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={sync} loading={busy} disabled={busy}>
            {busy ? t("testhub.overview.syncing") : t("testhub.overview.sync")}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((card) => (
          <div key={card.key} className="rounded-md bg-layer-1 p-3">
            <p className="text-12 text-tertiary">{card.label}</p>
            <p className="text-20 font-semibold text-primary">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default observer(OverviewPage);
