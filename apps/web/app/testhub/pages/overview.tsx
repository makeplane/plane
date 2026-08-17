/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Link, useOutletContext, useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { TesthubPageBody, TesthubPageLoader } from "../components/page-shell";
import { TesthubUnbound } from "../components/unbound";
import type { TTesthubOutletContext } from "../layout";

function OverviewPage() {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const { catalog, loading } = useOutletContext<TTesthubOutletContext>();
  const base = `/${workspaceSlug}/projects/${projectId}/testhub`;

  if (loading) return <TesthubPageLoader />;
  if (!catalog?.repo) return <TesthubUnbound href={`${base}/bind`} />;

  const counts = catalog.snapshot?.payload?.counts;
  const git = catalog.snapshot?.payload?.git;
  const cards = [
    { key: "ddl", value: counts?.ddl_tables ?? 0, label: t("testhub.counts.ddl"), href: `${base}/knowledge` },
    { key: "sql", value: counts?.sql_files ?? 0, label: t("testhub.counts.sql"), href: `${base}/knowledge` },
    {
      key: "api",
      value: counts?.api_objects ?? 0,
      label: t("testhub.counts.api_objects"),
      href: `${base}/components?tab=apis`,
    },
    {
      key: "words",
      value: counts?.action_words ?? 0,
      label: t("testhub.counts.action_words"),
      href: `${base}/components?tab=words`,
    },
    { key: "apps", value: counts?.apps ?? 0, label: t("testhub.counts.apps"), href: `${base}/tools` },
    { key: "features", value: counts?.features ?? 0, label: t("testhub.counts.features"), href: `${base}/tests` },
    { key: "pytest", value: counts?.pytest_nodes ?? 0, label: t("testhub.counts.pytest"), href: `${base}/tests` },
    { key: "data", value: counts?.data_files ?? 0, label: t("testhub.counts.data"), href: `${base}/knowledge` },
  ];

  return (
    <TesthubPageBody>
      <div className="space-y-4">
        <div className="space-y-1 text-13">
          <p className="text-primary">
            {(catalog.repo.name ? `${catalog.repo.name} · ` : "") + catalog.repo.branch} · {catalog.repo.workdir}
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
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {cards.map((card) => (
            <Link key={card.key} to={card.href} className="rounded-md bg-layer-1 p-3 hover:bg-layer-1-hover">
              <p className="text-12 text-tertiary">{card.label}</p>
              <p className="text-20 font-semibold text-primary">{card.value}</p>
            </Link>
          ))}
        </div>
      </div>
    </TesthubPageBody>
  );
}

export default observer(OverviewPage);
